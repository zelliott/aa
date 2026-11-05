import { Router } from 'express';
import type { Database } from '../db.js';
import { hashPassword, isAcceptablePassword, verifyPassword } from '../lib/passwords.js';
import { EMAIL_PATTERN, findUserByEmail, saveUser, toPublicUser, type User } from '../lib/users.js';
import { householdsForUser } from '../lib/households.js';

export function meRouter(db: Database): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const user = req.user!;
    res.json({ user: toPublicUser(user), households: householdsForUser(db, user.id) });
  });

  router.patch('/', (req, res) => {
    const current = req.user!;
    const updated: User = { ...current, ...req.body, id: current.id };

    if (typeof updated.name !== 'string' || !updated.name.trim() || updated.name.length > 80) {
      res.status(400).json({ error: 'Enter your name' });
      return;
    }
    if (typeof updated.email !== 'string' || !EMAIL_PATTERN.test(updated.email)) {
      res.status(400).json({ error: 'Enter a valid email address' });
      return;
    }
    updated.name = updated.name.trim();
    updated.email = updated.email.trim().toLowerCase();

    const existing = findUserByEmail(db, updated.email);
    if (existing && existing.id !== current.id) {
      res.status(409).json({ error: 'That email is already in use' });
      return;
    }

    saveUser(db, updated);
    res.json({ user: toPublicUser(updated) });
  });

  router.post('/password', (req, res) => {
    const user = req.user!;
    const { current, password } = req.body ?? {};
    if (typeof current !== 'string' || !verifyPassword(current, user.password_hash)) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }
    if (!isAcceptablePassword(password)) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }
    saveUser(db, { ...user, password_hash: hashPassword(password) });
    res.json({ ok: true });
  });

  return router;
}
