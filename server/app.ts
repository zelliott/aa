import express, { type NextFunction, type Request, type Response } from 'express';
import session from 'express-session';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { openDatabase, type Database } from './db.js';
import { loadUser, requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { householdsRouter } from './routes/households.js';
import { householdItemsRouter, itemsRouter } from './routes/items.js';
import { itemPhotoRouter, photosRouter } from './routes/photos.js';
import { recipesRouter } from './routes/recipes.js';
import { exportRouter } from './routes/export.js';
import { adminRouter } from './routes/admin.js';

export interface AppOptions {
  databaseFile?: string;
  photoDir?: string;
  webDir?: string;
}

export interface PantryApp {
  app: express.Express;
  db: Database;
}

const defaultWebDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web');

export function createApp(options: AppOptions = {}): PantryApp {
  const databaseFile = options.databaseFile ?? config.databaseFile;
  const photoDir = options.photoDir ?? config.photoDir;
  const webDir = options.webDir ?? defaultWebDir;

  if (databaseFile !== ':memory:') {
    fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
  }
  fs.mkdirSync(photoDir, { recursive: true });
  const db = openDatabase(databaseFile);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));
  app.use(
    session({
      name: 'pantry.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.secureCookies,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );
  app.use(loadUser(db));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter(db));

  const api = express.Router();
  api.use(requireAuth);
  api.use('/me', meRouter(db));
  api.use('/households', householdsRouter(db));
  api.use('/households/:householdId/items', householdItemsRouter(db));
  api.use('/households/:householdId/recipes', recipesRouter(db));
  api.use('/households/:householdId/export.csv', exportRouter(db));
  api.use('/items/:itemId/photo', itemPhotoRouter(db, photoDir));
  api.use('/items', itemsRouter(db));
  api.use('/photos', photosRouter(photoDir));
  api.use('/admin', adminRouter(db));
  app.use('/api', api);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (fs.existsSync(webDir)) {
    app.use(express.static(webDir, { index: false }));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(webDir, 'index.html'));
    });
  }

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    if (res.headersSent) return;
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: status === 500 ? 'Something went wrong' : err.message });
  });

  return { app, db };
}
