import { Router, type Request, type Response } from 'express';
import { createHash } from 'node:crypto';
import type { Database } from '../db.js';
import { config } from '../config.js';
import { hashPassword, isAcceptablePassword, verifyPassword } from '../lib/passwords.js';
import {
  EMAIL_PATTERN,
  createUser,
  findUserByEmail,
  findUserById,
  saveUser,
  toPublicUser,
  type User,
} from '../lib/users.js';
import { createHousehold } from '../lib/households.js';
import { sendMail } from '../lib/mailer.js';

const RESET_TTL_MS = 60 * 60 * 1000;

function startSession(req: Request, user: User): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

function createResetToken(user: User): string {
  return createHash('sha256').update(`${user.id}:${Date.now()}`).digest('hex');
}

function isFormPost(req: Request): boolean {
  return req.is('application/x-www-form-urlencoded') === 'application/x-www-form-urlencoded';
}

export function authRouter(db: Database): Router {
  const router = Router();

  router.post('/register', async (req, res) => {
    const { email, name, password } = req.body ?? {};
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
      res.status(400).json({ error: 'Enter a valid email address' });
      return;
    }
    if (typeof name !== 'string' || !name.trim() || name.length > 80) {
      res.status(400).json({ error: 'Enter your name' });
      return;
    }
    if (!isAcceptablePassword(password)) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }
    if (findUserByEmail(db, email)) {
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }

    const user = createUser(db, { email, name, passwordHash: hashPassword(password) });
    createHousehold(db, `${user.name}'s pantry`, user.id);
    await startSession(req, user);
    res.status(201).json({ user: toPublicUser(user) });
  });

  router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    const next = typeof req.body?.next === 'string' && req.body.next ? req.body.next : '/';
    const user = typeof email === 'string' ? findUserByEmail(db, email) : undefined;

    if (!user || typeof password !== 'string' || !verifyPassword(password, user.password_hash)) {
      if (isFormPost(req)) {
        res.redirect(303, `/login?error=1&next=${encodeURIComponent(next)}`);
      } else {
        res.status(401).json({ error: 'Email or password is incorrect' });
      }
      return;
    }

    await startSession(req, user);
    if (isFormPost(req)) {
      res.redirect(303, next);
    } else {
      res.json({ user: toPublicUser(user) });
    }
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('pantry.sid');
      res.status(204).end();
    });
  });

  router.post('/password-reset', async (req, res) => {
    const email = req.body?.email;
    const user = typeof email === 'string' ? findUserByEmail(db, email) : undefined;
    if (user) {
      const token = createResetToken(user);
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
      db.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').run(
        token,
        user.id,
        Date.now() + RESET_TTL_MS,
      );
      await sendMail({
        to: user.email,
        subject: 'Reset your Pantry password',
        text: `Follow this link to choose a new password:\n${config.appUrl}/reset?token=${token}\n\nThe link expires in one hour.`,
      });
    }
    res.status(202).json({ ok: true });
  });

  router.post('/password-reset/confirm', (req, res) => {
    const { token, password } = req.body ?? {};
    if (typeof token !== 'string' || !isAcceptablePassword(password)) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const row = db
      .prepare('SELECT user_id, expires_at FROM password_resets WHERE token = ?')
      .get(token) as { user_id: number; expires_at: number } | undefined;
    if (!row || row.expires_at < Date.now()) {
      res.status(400).json({ error: 'This reset link is invalid or has expired' });
      return;
    }
    const user = findUserById(db, row.user_id);
    if (!user) {
      res.status(400).json({ error: 'This reset link is invalid or has expired' });
      return;
    }
    user.password_hash = hashPassword(password);
    saveUser(db, user);
    db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
    res.json({ ok: true });
  });

  return router;
}
