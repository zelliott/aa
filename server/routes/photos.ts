import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Database } from '../db.js';
import { setItemPhoto } from '../lib/items.js';
import { loadEditableItem } from './items.js';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in EXTENSIONS),
});

export function itemPhotoRouter(db: Database, photoDir: string): Router {
  const router = Router({ mergeParams: true });

  router.post('/', upload.single('photo'), async (req, res) => {
    const item = loadEditableItem(db, req, res);
    if (!item) return;
    if (!req.file) {
      res.status(400).json({ error: 'Attach a JPEG, PNG, WebP or GIF image' });
      return;
    }
    const filename = `${randomUUID()}${EXTENSIONS[req.file.mimetype]}`;
    await fs.promises.writeFile(path.join(photoDir, filename), req.file.buffer);
    if (item.photo) {
      await fs.promises.rm(path.join(photoDir, item.photo), { force: true });
    }
    setItemPhoto(db, item.id, filename);
    res.status(201).json({ photo: filename, url: `/api/photos/${filename}` });
  });

  router.delete('/', async (req, res) => {
    const item = loadEditableItem(db, req, res);
    if (!item) return;
    if (item.photo) {
      await fs.promises.rm(path.join(photoDir, item.photo), { force: true });
      setItemPhoto(db, item.id, null);
    }
    res.status(204).end();
  });

  return router;
}

export function photosRouter(photoDir: string): Router {
  const router = Router();

  router.get('/:filename', (req, res) => {
    const file = path.join(photoDir, req.params.filename);
    fs.stat(file, (err, stats) => {
      if (err || !stats.isFile()) {
        res.status(404).json({ error: 'Photo not found' });
        return;
      }
      res.setHeader('Cache-Control', 'private, max-age=86400');
      res.sendFile(file);
    });
  });

  return router;
}
