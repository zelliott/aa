import { useEffect, useState } from 'react';
import { api, type Item } from '../api';
import { describeExpiry, formatNotes } from '../lib/format';
import { ItemForm } from './ItemForm';

export function ItemDetail({
  itemId,
  onClose,
  onChanged,
}: {
  itemId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [item, setItem] = useState<Item | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditing(false);
    api
      .item(itemId)
      .then((r) => setItem(r.item))
      .catch((err) => setError(err.message));
  }, [itemId]);

  if (error) return <p className="error">{error}</p>;
  if (!item) return <p className="muted">Loading…</p>;

  if (editing) {
    return (
      <ItemForm
        initial={item}
        onCancel={() => setEditing(false)}
        onSubmit={async (input) => {
          const r = await api.updateItem(item.id, input);
          setItem(r.item);
          setEditing(false);
          onChanged();
        }}
      />
    );
  }

  const expiry = describeExpiry(item.expires_on);

  return (
    <div className="card detail">
      <div className="detail-header">
        <h2>{item.name}</h2>
        <button className="icon" onClick={onClose} title="Close">
          ×
        </button>
      </div>
      {item.photo && <img className="photo" src={`/api/photos/${item.photo}`} alt={item.name} />}
      <dl>
        <dt>Quantity</dt>
        <dd>
          {item.quantity} {item.unit}
        </dd>
        <dt>Category</dt>
        <dd>{item.category}</dd>
        <dt>Expiry</dt>
        <dd className={`expiry ${expiry.tone}`}>{expiry.label}</dd>
      </dl>
      {item.notes && (
        <div className="notes" dangerouslySetInnerHTML={{ __html: formatNotes(item.notes) }} />
      )}
      <label className="upload">
        {item.photo ? 'Replace photo' : 'Add photo'}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const r = await api.uploadPhoto(item.id, file);
              setItem({ ...item, photo: r.photo });
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        />
      </label>
      <div className="actions">
        <button onClick={() => setEditing(true)}>Edit</button>
        <button
          className="danger"
          onClick={async () => {
            if (!confirm(`Remove ${item.name}?`)) return;
            await api.deleteItem(item.id);
            onClose();
            onChanged();
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
