import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';

// Secure storage directory OUTSIDE public web root
const SECURE_DOCS_DIR = path.resolve(process.cwd(), 'storage', 'secure_documents');

function ensureSecureDir() {
  if (!fs.existsSync(SECURE_DOCS_DIR)) {
    fs.mkdirSync(SECURE_DOCS_DIR, { recursive: true });
  }
}

// Helper to save base64 image securely to disk
function saveBase64File(base64Data: string, prefix: string): { fileName: string; filePath: string } {
  ensureSecureDir();
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let buffer: Buffer;
  let ext = 'jpg';

  if (matches && matches.length === 3) {
    buffer = Buffer.from(matches[2], 'base64');
    if (matches[1].includes('png')) ext = 'png';
    else if (matches[1].includes('webp')) ext = 'webp';
    else if (matches[1].includes('pdf')) ext = 'pdf';
  } else {
    buffer = Buffer.from(base64Data, 'base64');
  }

  const safeFileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const fullDiskPath = path.join(SECURE_DOCS_DIR, safeFileName);
  fs.writeFileSync(fullDiskPath, buffer);

  return { fileName: safeFileName, filePath: fullDiskPath };
}

// 1. Upload Customer Photo & Identity Proof (Survey Engineer, PM, Super Admin)
export const uploadCustomerDocument = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      customerId = null,
      projectId = null,
      surveyId = null,
      documentType = 'Aadhaar Card',
      idNumber = '',
      customerPhotoBase64 = null,
      docFrontBase64 = null,
      docBackBase64 = null,
      notes = ''
    } = req.body;

    if (!surveyId && !projectId && !customerId) {
      return res.status(400).json({ success: false, error: 'A surveyId, projectId, or customerId is required.' });
    }

    const docId = `DOC-${Date.now().toString().slice(-6)}`;
    let customerPhotoPath = null;
    let docFrontPath = null;
    let docBackPath = null;

    if (customerPhotoBase64) {
      const saved = saveBase64File(customerPhotoBase64, `cust_photo_${docId}`);
      customerPhotoPath = saved.fileName;
    }

    if (docFrontBase64) {
      const saved = saveBase64File(docFrontBase64, `doc_front_${docId}`);
      docFrontPath = saved.fileName;
    }

    if (docBackBase64) {
      const saved = saveBase64File(docBackBase64, `doc_back_${docId}`);
      docBackPath = saved.fileName;
    }

    const uploadedAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO customer_documents 
        (id, customer_id, project_id, survey_id, document_type, id_number, customer_photo_path, doc_front_path, doc_back_path, notes, uploaded_by_id, uploaded_by_name, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docId,
        customerId,
        projectId,
        surveyId,
        documentType,
        idNumber,
        customerPhotoPath,
        docFrontPath,
        docBackPath,
        notes,
        user?.userId || null,
        user?.name || user?.username || 'Survey Engineer',
        uploadedAt
      ]
    );

    res.json({
      success: true,
      document: {
        id: docId,
        customerId,
        projectId,
        surveyId,
        documentType,
        idNumber,
        hasCustomerPhoto: Boolean(customerPhotoPath),
        hasDocFront: Boolean(docFrontPath),
        hasDocBack: Boolean(docBackPath),
        notes,
        uploadedAt,
      }
    });
  } catch (err: any) {
    console.error('Customer document upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Get Document Metadata for a Survey or Project
export const getDocumentBySurveyOrProject = async (req: Request, res: Response) => {
  try {
    const { surveyId, projectId } = req.query;

    let query = 'SELECT id, customer_id, project_id, survey_id, document_type, id_number, (customer_photo_path IS NOT NULL) AS has_customer_photo, (doc_front_path IS NOT NULL) AS has_doc_front, (doc_back_path IS NOT NULL) AS has_doc_back, notes, uploaded_by_name, uploaded_at FROM customer_documents WHERE 1=1';
    const params: any[] = [];

    if (surveyId) {
      query += ' AND survey_id = ?';
      params.push(surveyId);
    }
    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY uploaded_at DESC LIMIT 1';

    const [rows]: any = await pool.query(query, params);
    if (!rows || rows.length === 0) {
      return res.json({ success: true, document: null });
    }

    res.json({ success: true, document: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Securely Stream Raw Document File (Restricted to Project Manager and Super Admin)
export const streamSecureDocumentFile = async (req: Request, res: Response) => {
  try {
    const { id, fileType } = req.params; // fileType: 'photo' | 'front' | 'back'

    const [rows]: any = await pool.query('SELECT * FROM customer_documents WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document record not found' });
    }

    const doc = rows[0];
    let fileName: string | null = null;

    if (fileType === 'photo') fileName = doc.customer_photo_path;
    else if (fileType === 'front') fileName = doc.doc_front_path;
    else if (fileType === 'back') fileName = doc.doc_back_path;

    if (!fileName) {
      return res.status(404).json({ success: false, error: `File for type '${fileType}' not present in this record.` });
    }

    const fullDiskPath = path.join(SECURE_DOCS_DIR, fileName);
    if (!fs.existsSync(fullDiskPath)) {
      return res.status(404).json({ success: false, error: 'File not found on storage server.' });
    }

    // Set appropriate content type
    let contentType = 'image/jpeg';
    if (fileName.endsWith('.png')) contentType = 'image/png';
    else if (fileName.endsWith('.webp')) contentType = 'image/webp';
    else if (fileName.endsWith('.pdf')) contentType = 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    const readStream = fs.createReadStream(fullDiskPath);
    readStream.pipe(res);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
