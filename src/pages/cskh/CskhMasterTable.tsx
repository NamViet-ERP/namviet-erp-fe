import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { ICON_SIZE } from '../../constants/icons';

interface CskhMasterTableColumn<T> {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface CskhMasterTableProps<T extends { id: string; name: string }> {
  columns: CskhMasterTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}

export default function CskhMasterTable<T extends { id: string; name: string }>({
  columns,
  rows,
  emptyMessage,
  emptyIcon,
  emptyAction,
  onEdit,
  onDelete,
}: CskhMasterTableProps<T>) {
  const colSpan = columns.length + 1;
  return (
    <div className="wms-inventory-table-wrap cskh-desk__table">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`table-header-cell ${col.className ?? ''}`.trim()}>
                {col.label}
              </th>
            ))}
            <th className="table-header-cell hrm-table-col-actions" aria-label="Thao tác" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState icon={emptyIcon} message={emptyMessage} action={emptyAction} />
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr key={row.id} className="table-row">
                {columns.map(col => (
                  <td key={col.key} className={`table-cell ${col.className ?? ''}`.trim()}>
                    {col.render(row)}
                  </td>
                ))}
                <td className="table-cell hrm-table-col-actions">
                  <div className="hrm-table-row-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Sửa"
                      aria-label={`Sửa ${row.name}`}
                      onClick={() => onEdit(row)}
                    >
                      <Pencil size={ICON_SIZE.dense} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      title="Xóa"
                      aria-label={`Xóa ${row.name}`}
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 size={ICON_SIZE.dense} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
