import path from 'node:path';
import { randomBytes } from 'node:crypto';

const dataDir = path.resolve(process.env.DATA_DIR ?? 'data');

export const config = {
  port: Number(process.env.PORT ?? 3100),
  dataDir,
  databaseFile: process.env.DATABASE_FILE ?? path.join(dataDir, 'pantry.db'),
  photoDir: process.env.PHOTO_DIR ?? path.join(dataDir, 'photos'),
  sessionSecret: process.env.SESSION_SECRET ?? randomBytes(32).toString('hex'),
  secureCookies: process.env.NODE_ENV === 'production',
  appUrl: process.env.APP_URL ?? 'http://localhost:3100',
};
