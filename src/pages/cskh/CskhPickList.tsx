import type { ReactNode } from 'react';

interface CskhPickListProps<T extends { id: string }> {
  title: string;
  rows: T[];
  selectedId: string | null;
  onSelect: (row: T) => void;
  renderRow: (row: T) => ReactNode;
}

export default function CskhPickList<T extends { id: string }>({
  title,
  rows,
  selectedId,
  onSelect,
  renderRow,
}: CskhPickListProps<T>) {
  return (
    <ul className="cskh-pick__list" aria-label={title}>
      {rows.map(row => (
        <li key={row.id}>
          <button
            type="button"
            className={`cskh-pick__row${selectedId === row.id ? ' is-active' : ''}`}
            aria-pressed={selectedId === row.id}
            onClick={() => onSelect(row)}
          >
            {renderRow(row)}
          </button>
        </li>
      ))}
    </ul>
  );
}
