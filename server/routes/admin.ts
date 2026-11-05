import { Router } from 'express';
import type { Database } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { findUserById, saveUser, toPublicUser } from '../lib/users.js';

const ROLES = ['member', 'admin'];

export function adminRouter(db: Database): Router {
  const router = Router();

  router.get('/stats', requireAdmin, (_req, res) => {
    const count = (table: string) =>
      (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
    res.json({
      users: count('users'),
      households: count('households'),
      items: count('items'),
      recipes: count('recipes'),
    });
  });

  router.get('/users', (_req, res) => {
    const users = db
      .prepare(
        `SELECT u.id, u.email, u.name, u.role, u.created_at,
                (SELECT COUNT(*) FROM household_members m WHERE m.user_id = u.id) AS households
         FROM users u ORDER BY u.id`,
      )
      .all();
    res.json({ users });
  });

  router.patch('/users/:userId', requireAdmin, (req, res) => {
    const user = findUserById(db, Number(req.params.userId));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const role = req.body?.role;
    if (!ROLES.includes(role)) {
      res.status(400).json({ error: `Role must be one of: ${ROLES.join(', ')}` });
      return;
    }
    user.role = role;
    saveUser(db, user);
    res.json({ user: toPublicUser(user) });
  });

  return router;
}
