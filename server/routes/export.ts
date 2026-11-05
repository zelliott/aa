import { Router } from 'express';
import type { Database } from '../db.js';
import { requireMember } from '../middleware/auth.js';
import { findHousehold } from '../lib/households.js';
import { listItems } from '../lib/items.js';
import { toCsv } from '../lib/csv.js';

const HEADERS = ['Name', 'Quantity', 'Unit', 'Category', 'Expires', 'Notes', 'Added'];

export function exportRouter(db: Database): Router {
  const router = Router({ mergeParams: true });

  router.get('/', requireMember(db), (req, res) => {
    const householdId = Number(req.params.householdId);
    const household = findHousehold(db, householdId)!;
    const items = listItems(db, householdId, { sort: 'category' });
    const csv = toCsv(
      HEADERS,
      items.map((item) => [
        item.name,
        item.quantity,
        item.unit,
        item.category,
        item.expires_on,
        item.notes,
        item.created_at,
      ]),
    );
    const slug = household.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${slug || 'pantry'}.csv"`);
    res.send(csv);
  });

  return router;
}
