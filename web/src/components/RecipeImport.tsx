import { useEffect, useState, type FormEvent } from 'react';
import { api, type Item, type Recipe } from '../api';

function have(ingredient: string, pantry: Item[]): boolean {
  const text = ingredient.toLowerCase();
  return pantry.some((item) => item.quantity > 0 && text.includes(item.name.toLowerCase()));
}

export function RecipeImport({ householdId, pantry }: { householdId: number; pantry: Item[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.recipes(householdId).then((r) => setRecipes(r.recipes));
  }, [householdId]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const url = String(new FormData(form).get('url'));
    setBusy(true);
    setError(null);
    try {
      const r = await api.importRecipe(householdId, url);
      setRecipes([r.recipe, ...recipes]);
      form.reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>Recipes</h2>
      <form onSubmit={submit} className="inline">
        <input name="url" type="url" placeholder="Paste a recipe link" required />
        <button type="submit" disabled={busy}>
          {busy ? 'Importing…' : 'Import'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {recipes.map((recipe) => {
        const missing = recipe.ingredients.filter((i) => !have(i, pantry));
        return (
          <details key={recipe.id} className="recipe">
            <summary>
              {recipe.title}{' '}
              <span className="muted">
                {recipe.ingredients.length === 0
                  ? 'no ingredient list'
                  : missing.length === 0
                    ? 'you have everything'
                    : `${missing.length} to buy`}
              </span>
            </summary>
            <ul>
              {recipe.ingredients.map((ingredient, i) => (
                <li key={i} className={have(ingredient, pantry) ? 'have' : undefined}>
                  {ingredient}
                </li>
              ))}
            </ul>
            <a href={recipe.source_url} target="_blank" rel="noreferrer">
              Open original
            </a>
          </details>
        );
      })}
    </div>
  );
}
