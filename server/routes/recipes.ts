import { Router } from 'express';
import type { Database } from '../db.js';
import { requireMember } from '../middleware/auth.js';
import { parseRecipe } from '../lib/recipe.js';

const MAX_PAGE_BYTES = 2 * 1024 * 1024;

interface RecipeRow {
  id: number;
  household_id: number;
  title: string;
  source_url: string;
  ingredients: string;
  created_at: string;
}

function toRecipe(row: RecipeRow) {
  return { ...row, ingredients: JSON.parse(row.ingredients) as string[] };
}

async function fetchPage(url: URL): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PantryRecipeImporter/1.0', Accept: 'text/html,*/*;q=0.8' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`The page returned ${response.status}`);
  }
  const body = await response.text();
  return body.slice(0, MAX_PAGE_BYTES);
}

export function recipesRouter(db: Database): Router {
  const router = Router({ mergeParams: true });

  router.get('/', requireMember(db), (req, res) => {
    const rows = db
      .prepare('SELECT * FROM recipes WHERE household_id = ? ORDER BY created_at DESC, id DESC')
      .all(Number(req.params.householdId)) as unknown as RecipeRow[];
    res.json({ recipes: rows.map(toRecipe) });
  });

  router.post('/import', requireMember(db), async (req, res) => {
    let url: URL;
    try {
      url = new URL(String(req.body?.url ?? ''));
    } catch {
      res.status(400).json({ error: 'Enter a full link, starting with https://' });
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      res.status(400).json({ error: 'Only web links can be imported' });
      return;
    }

    let html: string;
    try {
      html = await fetchPage(url);
    } catch (err) {
      res.status(502).json({ error: `Could not load that page: ${(err as Error).message}` });
      return;
    }

    const parsed = parseRecipe(html);
    const title = parsed.title || url.hostname;
    const result = db
      .prepare(
        'INSERT INTO recipes (household_id, title, source_url, ingredients, created_by) VALUES (?, ?, ?, ?, ?)',
      )
      .run(
        Number(req.params.householdId),
        title,
        url.toString(),
        JSON.stringify(parsed.ingredients),
        req.user!.id,
      );
    const row = db
      .prepare('SELECT * FROM recipes WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as unknown as RecipeRow;
    res.status(201).json({ recipe: toRecipe(row) });
  });

  router.delete('/:recipeId', requireMember(db), (req, res) => {
    db.prepare('DELETE FROM recipes WHERE id = ? AND household_id = ?').run(
      Number(req.params.recipeId),
      Number(req.params.householdId),
    );
    res.status(204).end();
  });

  return router;
}
