import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { 
  recordAttendance, 
  getProjectAttendance, 
  logProgress, 
  getProjectCommandCentre,
  scheduleInstallation 
} from '../controllers/installation.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Configure disk storage for real media uploads (videos & photos up to 250MB)
const uploadsDir = path.join(process.cwd(), 'uploads', 'media');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('video') ? '.mp4' : '.jpg');
    const safeName = `media-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 } // 250MB allows videos up to 5 minutes or more
});

// Multipart media upload endpoint for Installation videos & photos
router.post('/upload-media', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  const publicUrl = `/uploads/media/${req.file.filename}`;
  res.json({
    success: true,
    url: publicUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Installation Scheduling & Crew Assignment (Step 4 of EPC Lifecycle)
router.post('/schedule', authenticateToken, scheduleInstallation);

// Field team attendance
router.post('/attendance', authenticateToken, recordAttendance);
router.get('/attendance/:projectId', authenticateToken, getProjectAttendance);

// Field milestone logging
router.post('/progress', authenticateToken, logProgress);

// Project Manager Master Consolidated Command Centre
router.get('/command-centre/:projectId', authenticateToken, getProjectCommandCentre);

export default router;
