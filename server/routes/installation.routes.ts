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

// Configure disk storage for real media uploads (videos & photos up to 500MB)
const getMediaUploadsDir = () => {
  const dir = path.join(process.cwd(), 'uploads', 'media');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getMediaUploadsDir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('video') ? '.mp4' : '.jpg');
    const safeName = `media-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB allows high-res walkthrough videos
});

// Multipart media upload endpoint for Installation videos & photos with error protection
router.post('/upload-media', (req, res) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('[Upload Media Error]:', err);
      return res.status(400).json({ success: false, error: err.message || 'Media file upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video or photo was received' });
    }
    const publicUrl = `/uploads/media/${req.file.filename}`;
    return res.json({
      success: true,
      url: publicUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
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
