import type { Database } from '../db.js';

export interface Household {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  joined_at: string;
}

export function createHousehold(db: Database, name: string, ownerId: number): Household {
  const result = db
    .prepare('INSERT INTO households (name, owner_id) VALUES (?, ?)')
    .run(name.trim(), ownerId);
  const id = Number(result.lastInsertRowid);
  db.prepare('INSERT INTO household_members (household_id, user_id) VALUES (?, ?)').run(id, ownerId);
  return findHousehold(db, id)!;
}

export function findHousehold(db: Database, id: number): Household | undefined {
  return db.prepare('SELECT * FROM households WHERE id = ?').get(id) as Household | undefined;
}

export function householdsForUser(db: Database, userId: number): Household[] {
  return db
    .prepare(
      `SELECT h.* FROM households h
       JOIN household_members m ON m.household_id = h.id
       WHERE m.user_id = ?
       ORDER BY h.created_at, h.id`,
    )
    .all(userId) as unknown as Household[];
}

export function isMember(db: Database, householdId: number, userId: number): boolean {
  const row = db
    .prepare('SELECT 1 AS ok FROM household_members WHERE household_id = ? AND user_id = ?')
    .get(householdId, userId);
  return row !== undefined;
}

export function listMembers(db: Database, householdId: number): Member[] {
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, m.joined_at FROM household_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.household_id = ?
       ORDER BY m.joined_at, u.id`,
    )
    .all(householdId) as unknown as Member[];
}

export function addMember(db: Database, householdId: number, userId: number): void {
  db.prepare(
    'INSERT OR IGNORE INTO household_members (household_id, user_id) VALUES (?, ?)',
  ).run(householdId, userId);
}

export function removeMember(db: Database, householdId: number, userId: number): void {
  db.prepare('DELETE FROM household_members WHERE household_id = ? AND user_id = ?').run(
    householdId,
    userId,
  );
}
