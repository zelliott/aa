import { useCallback, useEffect, useState } from 'react';
import { api, type Household, type Item, type User } from '../api';
import { ItemForm } from '../components/ItemForm';
import { ItemDetail } from '../components/ItemDetail';
import { ItemList } from '../components/ItemList';
import { HouseholdPanel } from '../components/HouseholdPanel';
import { RecipeImport } from '../components/RecipeImport';

const SORTS = [
  ['name', 'Name'],
  ['expiry', 'Expiry'],
  ['quantity', 'Quantity'],
  ['category', 'Category'],
  ['added', 'Recently added'],
] as const;

export function PantryPage({
  user,
  households,
  onHouseholdsChanged,
  onLogout,
}: {
  user: User;
  households: Household[];
  onHouseholdsChanged: () => void;
  onLogout: () => void;
}) {
  const [householdId, setHouseholdId] = useState(households[0]?.id);
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('expiry');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!householdId) return;
    api
      .items(householdId, { q, sort, order })
      .then((r) => setItems(r.items))
      .catch((err) => setError(err.message));
  }, [householdId, q, sort, order]);

  useEffect(() => {
    const timer = setTimeout(refresh, 200);
    return () => clearTimeout(timer);
  }, [refresh]);

  const household = households.find((h) => h.id === householdId);

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Pantry</h1>
        <select
          value={householdId ?? ''}
          onChange={(e) => {
            setHouseholdId(Number(e.target.value));
            setSelected(null);
          }}
        >
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <span className="spacer" />
        <span className="muted">{user.name}</span>
        <button className="link" onClick={onLogout}>
          Sign out
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {household && (
        <main className="content">
          <section className="items">
            <div className="toolbar">
              <input
                type="search"
                placeholder="Search items and notes"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                className="icon"
                title="Reverse order"
                onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              >
                {order === 'asc' ? '↑' : '↓'}
              </button>
              <button onClick={() => setAdding(true)}>Add item</button>
              <a className="button secondary" href={`/api/households/${household.id}/export.csv`}>
                Export CSV
              </a>
            </div>

            {adding && (
              <ItemForm
                onCancel={() => setAdding(false)}
                onSubmit={async (input) => {
                  await api.createItem(household.id, input);
                  setAdding(false);
                  refresh();
                }}
              />
            )}

            <ItemList items={items} selectedId={selected} onSelect={setSelected} />
          </section>

          <aside className="sidebar">
            {selected !== null ? (
              <ItemDetail
                itemId={selected}
                onClose={() => setSelected(null)}
                onChanged={refresh}
              />
            ) : (
              <>
                <HouseholdPanel
                  household={household}
                  currentUser={user}
                  onCreated={onHouseholdsChanged}
                />
                <RecipeImport householdId={household.id} pantry={items} />
              </>
            )}
          </aside>
        </main>
      )}
    </div>
  );
}
