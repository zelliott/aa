import { useState, type FormEvent } from 'react';
import type { Item, ItemInput } from '../api';

const CATEGORIES = [
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
];

export function ItemForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Item;
  onSubmit: (input: ItemInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const expires = String(form.get('expires_on') ?? '');
    try {
      await onSubmit({
        name: String(form.get('name')),
        quantity: Number(form.get('quantity')),
        unit: String(form.get('unit') ?? ''),
        category: String(form.get('category')),
        expires_on: expires || null,
        notes: String(form.get('notes') ?? ''),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form className="card item-form" onSubmit={submit}>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <label className="grow">
          Name
          <input name="name" defaultValue={initial?.name} required maxLength={120} />
        </label>
        <label>
          Qty
          <input name="quantity" type="number" min="0" step="any" defaultValue={initial?.quantity ?? 1} />
        </label>
        <label>
          Unit
          <input name="unit" defaultValue={initial?.unit} placeholder="g, cans…" maxLength={20} />
        </label>
      </div>
      <div className="row">
        <label>
          Category
          <select name="category" defaultValue={initial?.category ?? 'other'}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Expires
          <input name="expires_on" type="date" defaultValue={initial?.expires_on ?? ''} />
        </label>
      </div>
      <label>
        Notes
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes}
          placeholder="Supports **bold** and [links](https://example.com)"
        />
      </label>
      <div className="actions">
        <button type="submit">Save</button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
