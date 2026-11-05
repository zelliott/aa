import type { Database } from '../db.js';

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function findUserById(db: Database, id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function findUserByEmail(db: Database, email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as
    | User
    | undefined;
}

export function createUser(
  db: Database,
  input: { email: string; name: string; passwordHash: string },
): User {
  const result = db
    .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
    .run(input.email.trim().toLowerCase(), input.name.trim(), input.passwordHash);
  return findUserById(db, Number(result.lastInsertRowid))!;
}

export function saveUser(db: Database, user: User): void {
  db.prepare(
    'UPDATE users SET email = ?, name = ?, password_hash = ?, role = ? WHERE id = ?',
  ).run(user.email, user.name, user.password_hash, user.role, user.id);
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
