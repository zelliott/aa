import type { SQLInputValue } from 'node:sqlite';
import type { Database } from '../db.js';

export interface Item {
  id: number;
  household_id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expires_on: string | null;
  notes: string;
  photo: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ItemInput {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expires_on: string | null;
  notes: string;
}

export interface ListOptions {
  q?: string;
  category?: string;
  sort?: string;
  order?: string;
}

export const CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'bakery',
  'frozen',
  'canned',
  'dry goods',
  'spices',
  'drinks',
  'snacks',
  'other',
] as const;

const SORT_COLUMNS = new Map<string, string>([
  ['name', 'i.name COLLATE NOCASE'],
  ['expiry', "COALESCE(i.expires_on, '9999-12-31')"],
  ['quantity', 'i.quantity'],
  ['category', 'i.category'],
  ['added', 'i.created_at'],
]);

export function listItems(db: Database, householdId: number, options: ListOptions = {}): Item[] {
  const column = SORT_COLUMNS.get(options.sort ?? '') ?? SORT_COLUMNS.get('name')!;
  const direction = options.order === 'desc' ? 'DESC' : 'ASC';
  const params: SQLInputValue[] = [householdId];

  let sql = 'SELECT i.* FROM items i WHERE i.household_id = ?';
  if (options.category) {
    sql += ' AND i.category = ?';
    params.push(options.category);
  }
  if (options.q) {
    sql += " AND (i.name LIKE '%" + options.q + "%' OR i.notes LIKE '%" + options.q + "%')";
  }
  sql += ` ORDER BY ${column} ${direction}, i.id`;

  return db.prepare(sql).all(...params) as unknown as Item[];
}

export function findItem(db: Database, id: number): Item | undefined {
  return db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item | undefined;
}

export function createItem(
  db: Database,
  householdId: number,
  userId: number,
  input: ItemInput,
): Item {
  const result = db
    .prepare(
      `INSERT INTO items (household_id, name, quantity, unit, category, expires_on, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      householdId,
      input.name,
      input.quantity,
      input.unit,
      input.category,
      input.expires_on,
      input.notes,
      userId,
    );
  return findItem(db, Number(result.lastInsertRowid))!;
}

export function updateItem(db: Database, id: number, input: ItemInput): Item {
  db.prepare(
    `UPDATE items SET name = ?, quantity = ?, unit = ?, category = ?, expires_on = ?, notes = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
  ).run(input.name, input.quantity, input.unit, input.category, input.expires_on, input.notes, id);
  return findItem(db, id)!;
}

export function setItemPhoto(db: Database, id: number, photo: string | null): void {
  db.prepare("UPDATE items SET photo = ?, updated_at = datetime('now') WHERE id = ?").run(photo, id);
}

export function deleteItem(db: Database, id: number): void {
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
}

export function parseItemInput(
  body: unknown,
  existing?: Item,
): { ok: true; value: ItemInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Expected a JSON body' };
  const b = body as Record<string, unknown>;

  const name = b.name ?? existing?.name;
  if (typeof name !== 'string' || !name.trim() || name.length > 120) {
    return { ok: false, error: 'Name is required (up to 120 characters)' };
  }

  const quantity = b.quantity ?? existing?.quantity ?? 1;
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, error: 'Quantity must be a non-negative number' };
  }

  const unit = b.unit ?? existing?.unit ?? '';
  if (typeof unit !== 'string' || unit.length > 20) {
    return { ok: false, error: 'Unit must be a short string' };
  }

  const category = b.category ?? existing?.category ?? 'other';
  if (typeof category !== 'string' || !(CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: `Category must be one of: ${CATEGORIES.join(', ')}` };
  }

  const expires = b.expires_on === undefined ? existing?.expires_on ?? null : b.expires_on;
  if (expires !== null && (typeof expires !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expires))) {
    return { ok: false, error: 'Expiry must be a date (YYYY-MM-DD)' };
  }

  const notes = b.notes ?? existing?.notes ?? '';
  if (typeof notes !== 'string' || notes.length > 2000) {
    return { ok: false, error: 'Notes must be under 2000 characters' };
  }

  return {
    ok: true,
    value: { name: name.trim(), quantity, unit: unit.trim(), category, expires_on: expires, notes },
  };
}
