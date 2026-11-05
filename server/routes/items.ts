import { Router, type Request, type Response } from 'express';
import type { Database } from '../db.js';
import { requireMember } from '../middleware/auth.js';
import { isMember } from '../lib/households.js';
import {
  createItem,
  deleteItem,
  findItem,
  listItems,
  parseItemInput,
  updateItem,
  type Item,
} from '../lib/items.js';

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

export function householdItemsRouter(db: Database): Router {
  const router = Router({ mergeParams: true });

  router.get('/', requireMember(db), (req, res) => {
    const items = listItems(db, Number(req.params.householdId), {
      q: queryString(req.query.q),
      category: queryString(req.query.category),
      sort: queryString(req.query.sort),
      order: queryString(req.query.order),
    });
    res.json({ items });
  });

  router.post('/', requireMember(db), (req, res) => {
    const parsed = parseItemInput(req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const item = createItem(db, Number(req.params.householdId), req.user!.id, parsed.value);
    res.status(201).json({ item });
  });

  return router;
}

export function loadEditableItem(db: Database, req: Request, res: Response): Item | undefined {
  const item = findItem(db, Number(req.params.itemId));
  if (!item || !isMember(db, item.household_id, req.user!.id)) {
    res.status(404).json({ error: 'Item not found' });
    return undefined;
  }
  return item;
}

export function itemsRouter(db: Database): Router {
  const router = Router();

  router.get('/:itemId', (req, res) => {
    const item = findItem(db, Number(req.params.itemId));
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json({ item });
  });

  router.patch('/:itemId', (req, res) => {
    const item = loadEditableItem(db, req, res);
    if (!item) return;
    const parsed = parseItemInput(req.body, item);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    res.json({ item: updateItem(db, item.id, parsed.value) });
  });

  router.delete('/:itemId', (req, res) => {
    const item = loadEditableItem(db, req, res);
    if (!item) return;
    deleteItem(db, item.id);
    res.status(204).end();
  });

  return router;
}
