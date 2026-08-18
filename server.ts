import { execSync } from 'child_process';
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import routes from './server/routes';
import { testRouter } from './server/routes/test';
import { errorHandler } from './server/middlewares/error.middleware';
import { runDatabaseSeed } from './server/services/seed.service.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Run database seeding asynchronously without blocking server listening
  runDatabaseSeed().catch((seedErr) => {
    console.error('Initial seed error:', seedErr);
  });

  // Trust proxy is needed since we're running behind a reverse proxy
  app.set('trust proxy', true);

  // Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for dev/vite injection
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(cookieParser(process.env.SESSION_SECRET || 'dev_session_secret_fallback_1234567890'));
  app.use(cors());

  // Rate Limiting (generous limit for app operations to avoid blocking legitimate UI polling)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5000, 
    message: { error: 'تم تجاوز الحد المسموح به من الطلبات، يرجى المحاولة بعد قليل' },
    validate: { xForwardedForHeader: false, trustProxy: false },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', apiLimiter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- API Routes ---
  app.use('/api', routes);
  app.use('/api', testRouter);

  // API 404 handler - prevents unhandled /api/* routes from falling through to Vite HTML
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `المسار ${req.originalUrl} غير متوفر على الخادم` });
  });

  // Error Handler
  app.use(errorHandler);

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
