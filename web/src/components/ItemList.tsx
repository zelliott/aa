import type { Item } from '../api';
import { describeExpiry } from '../lib/format';

export function ItemList({
  items,
  selectedId,
  onSelect,
}: {
  items: Item[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  if (items.length === 0) {
    return <p className="empty">Nothing here yet. Add the first item to get started.</p>;
  }

  return (
    <table className="item-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Category</th>
          <th>Expiry</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const expiry = describeExpiry(item.expires_on);
          return (
            <tr
              key={item.id}
              className={item.id === selectedId ? 'selected' : undefined}
              onClick={() => onSelect(item.id)}
            >
              <td>{item.name}</td>
              <td>
                {item.quantity} {item.unit}
              </td>
              <td>{item.category}</td>
              <td className={`expiry ${expiry.tone}`}>{expiry.label}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
