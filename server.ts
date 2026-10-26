import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { apiRouter } from './server/routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'surveys');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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
  const distPath = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))
    ? path.resolve(__dirname, 'dist')
    : path.resolve(process.cwd(), 'dist');
  const distExists = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || distExists;

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
      res.sendFile(path.resolve(distPath, 'logo.png'));
    });
    app.get(['/logo.jpg', '*/logo.jpg'], (_req, res) => {
      res.sendFile(path.resolve(distPath, 'logo.jpg'));
    });
    app.get(['/favicon.ico', '*/favicon.ico'], (_req, res) => {
      res.sendFile(path.resolve(distPath, 'logo.png'));
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AB Energy Solutions CRM server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
