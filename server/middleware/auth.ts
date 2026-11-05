import type { NextFunction, Request, Response } from 'express';
import type { Database } from '../db.js';
import { findUserById, type User } from '../lib/users.js';
import { isMember } from '../lib/households.js';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function loadUser(db: Database) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const id = req.session?.userId;
    if (id !== undefined) {
      req.user = findUserById(db, id);
    }
    next();
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Please sign in' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admins only' });
    return;
  }
  next();
}

export function requireMember(db: Database, param = 'householdId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const householdId = Number(req.params[param]);
    if (!Number.isInteger(householdId) || !req.user || !isMember(db, householdId, req.user.id)) {
      res.status(404).json({ error: 'Household not found' });
      return;
    }
    next();
  };
}
