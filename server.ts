import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { apiRouter } from './server/routes.js';
import { runProjectLifecycleMigration } from './server/migrations/project-lifecycle-updates.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directories exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'surveys');
const mediaDir = path.join(process.cwd(), 'uploads', 'media');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(['/uploads', '*/uploads'], express.static(path.join(process.cwd(), 'uploads')));
app.use(['/documents', '*/documents'], express.static(path.join(process.cwd(), 'public', 'documents')));
app.use(['/api', '*/api'], apiRouter);

// Vite integration
async function startServer() {
  const distCandidate1 = path.resolve(__dirname, 'dist');
  const distCandidate2 = path.resolve(process.cwd(), 'dist');
  const rootCandidate = process.cwd();

  let distPath = distCandidate1;
  let hasDist = fs.existsSync(path.resolve(distCandidate1, 'index.html'));

  if (!hasDist && fs.existsSync(path.resolve(distCandidate2, 'index.html'))) {
    distPath = distCandidate2;
    hasDist = true;
  } else if (!hasDist && fs.existsSync(path.resolve(rootCandidate, 'assets'))) {
    distPath = rootCandidate;
    hasDist = true;
  }

  // In production (or whenever compiled build exists and not in explicit dev mode), serve compiled static assets
  const hasSrc = fs.existsSync(path.resolve(process.cwd(), 'src', 'App.tsx'));
  const isExplicitDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV === 'true';
  const isProd = (hasDist && !isExplicitDev) || process.env.NODE_ENV === 'production' || !hasSrc;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Serving static production build from ${distPath}`);
    app.use(express.static(distPath));
    app.use('/assets', express.static(path.resolve(distPath, 'assets')));
    app.use('*/assets', express.static(path.resolve(distPath, 'assets')));
    app.get(['/logo.png', '*/logo.png'], (_req, res) => {
      const p = fs.existsSync(path.resolve(distPath, 'logo.png'))
        ? path.resolve(distPath, 'logo.png')
        : path.resolve(process.cwd(), 'public', 'logo.png');
      res.sendFile(p);
    });
    app.get(['/logo.jpg', '*/logo.jpg'], (_req, res) => {
      const p = fs.existsSync(path.resolve(distPath, 'logo.jpg'))
        ? path.resolve(distPath, 'logo.jpg')
        : path.resolve(process.cwd(), 'public', 'logo.jpg');
      res.sendFile(p);
    });
    app.get(['/favicon.ico', '*/favicon.ico'], (_req, res) => {
      const p = fs.existsSync(path.resolve(distPath, 'favicon.ico'))
        ? path.resolve(distPath, 'favicon.ico')
        : (fs.existsSync(path.resolve(distPath, 'logo.png')) ? path.resolve(distPath, 'logo.png') : path.resolve(process.cwd(), 'public', 'logo.png'));
      res.sendFile(p);
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AB Energy Solutions CRM server running at http://0.0.0.0:${PORT}`);
    // Run database schema updates in background on startup
    runProjectLifecycleMigration().catch(err => {
      console.warn('[Startup Migration Notice]:', err.message);
    });
  });
}

startServer();
