import { X, User } from 'lucide-react';
import { createPortal } from 'react-dom';
import Badge from './Badge';
import type { ColumnDef, DetailModalData } from '../../types';
import type { ReactNode } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: DetailModalData | null;
  columns?: ColumnDef[];
  badgeField?: string;
  children?: ReactNode;
}

const defaultColumns: ColumnDef[] = [
  { key: 'name', label: 'Tên hàng' },
  { key: 'sku', label: 'Mã SKU' },
  { key: 'unit', label: 'Đơn vị' },
  { key: 'qty', label: 'Số lượng', align: 'right' },
];

export default function DetailModal({
  isOpen,
  onClose,
  title,
  data,
  columns,
  badgeField = 'status',
  children,
}: DetailModalProps) {
  useBodyScrollLock(isOpen && !!data);
  if (!isOpen || !data) return null;

  const cols = columns ?? defaultColumns;

  return createPortal(
    <div className="md-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="md-detail-title">
      <div className="md-dialog-scrim" onClick={onClose} aria-hidden />
      <div className="md-dialog md-dialog--detail animate-scale-in">
        <div className="md-dialog__header md-dialog__header--compact">
          <div className="md-dialog__title-row">
            <h3 id="md-detail-title" className="md-dialog__title">{title}</h3>
            {data[badgeField] != null && <Badge status={String(data[badgeField])} />}
          </div>
          <button type="button" className="md-dialog__close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="md-dialog__divider" aria-hidden />

        <div className="md-dialog__info-panel">
          <div className="md-detail-grid">
            {data.voucherCode && (
              <div>
                <p className="md-detail-field__label">Mã chứng từ</p>
                <p className="md-detail-field__value md-detail-field__value--primary">{data.voucherCode}</p>
              </div>
            )}
            {data.createdBy && (
              <div>
                <p className="md-detail-field__label">Người lập phiếu</p>
                <div className="md-detail-user">
                  <div className="md-detail-user__avatar">
                    <User size={12} />
                  </div>
                  <span className="md-detail-field__value">{data.createdBy}</span>
                </div>
              </div>
            )}
            {data.date && (
              <div>
                <p className="md-detail-field__label">Ngày chứng từ</p>
                <p className="md-detail-field__value">{data.date}</p>
              </div>
            )}
            {data.warehouseName && (
              <div>
                <p className="md-detail-field__label">Kho hàng</p>
                <p className="md-detail-field__value">{data.warehouseName}</p>
              </div>
            )}
            {data.note && (
              <div className="md-detail-field--wide">
                <p className="md-detail-field__label">Ghi chú</p>
                <p className="md-detail-field__value md-detail-field__value--muted">{data.note}</p>
              </div>
            )}
          </div>
        </div>

        <div className="md-dialog__body">
          {children ?? (
            data.items && data.items.length > 0 ? (
              <div className="overflow-x-auto table-scroll">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {cols.map(col => (
                        <th key={col.key} className={`table-header-cell ${col.align === 'right' ? 'text-right' : ''}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, i) => (
                      <tr key={i} className="table-row">
                        {cols.map(col => (
                          <td
                            key={col.key}
                            className={`table-cell ${col.align === 'right' ? 'text-right font-medium tabular-nums' : ''}`}
                          >
                            {col.render ? col.render(item) : String(item[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="md-dialog-empty">Không có mặt hàng nào</p>
            )
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
