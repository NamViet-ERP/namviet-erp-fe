import { X, User } from 'lucide-react';
import Badge from './Badge';
import type { ColumnDef, DetailModalData } from '../../types';
import type { ReactNode } from 'react';

/**
 * MD3 Detail Dialog — full-size sheet with info header + items table
 */

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: DetailModalData | null;
  columns?: ColumnDef[];
  badgeField?: string;
  children?: ReactNode;
}

export default function DetailModal({ isOpen, onClose, title, data, columns, badgeField = 'status', children }: DetailModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--md-scrim)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Dialog */}
      <div
        className="animate-scale-in"
        style={{
          position: 'relative',
          background: 'var(--md-surface-container)',
          borderRadius: '28px',
          boxShadow: 'var(--md-shadow-4)',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--md-on-surface)',
              }}
            >
              {title}
            </h3>
            {data[badgeField] != null && <Badge status={String(data[badgeField])} />}
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '9999px',
              border: 'none',
              background: 'transparent',
              color: 'var(--md-on-surface-variant)',
              cursor: 'pointer',
              transition: 'background 200ms var(--md-easing)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--tint-primary-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '16px 0 0' }} />

        {/* Info panel */}
        <div
          style={{
            padding: '16px 24px',
            background: 'var(--md-surface-container-low)',
            borderBottom: '1px solid var(--md-outline-variant)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            {data.voucherCode && (
              <div>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--md-on-surface-variant)', marginBottom: '2px' }}>
                  Mã chứng từ
                </p>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.9375rem', fontWeight: 700, color: 'var(--md-primary)' }}>
                  {data.voucherCode}
                </p>
              </div>
            )}
            {data.createdBy && (
              <div>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--md-on-surface-variant)', marginBottom: '4px' }}>
                  Người lập phiếu
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--md-primary-container)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={12} style={{ color: 'var(--md-on-primary-container)' }} />
                  </div>
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.875rem', color: 'var(--md-on-surface)' }}>
                    {data.createdBy}
                  </span>
                </div>
              </div>
            )}
            {data.date && (
              <div>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--md-on-surface-variant)', marginBottom: '2px' }}>
                  Ngày chứng từ
                </p>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.875rem', color: 'var(--md-on-surface)' }}>{data.date}</p>
              </div>
            )}
            {data.warehouseName && (
              <div>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--md-on-surface-variant)', marginBottom: '2px' }}>
                  Kho hàng
                </p>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.875rem', color: 'var(--md-on-surface)' }}>{data.warehouseName}</p>
              </div>
            )}
            {data.note && (
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--md-on-surface-variant)', marginBottom: '2px' }}>
                  Ghi chú
                </p>
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.875rem', color: 'var(--md-on-surface-variant)' }}>{data.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {children ? children : (
            data.items && data.items.length > 0 ? (
              <div style={{ overflowX: 'auto' }} className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {(columns || [
                        { key: 'name', label: 'Tên hàng' },
                        { key: 'sku', label: 'Mã SKU' },
                        { key: 'unit', label: 'Đơn vị' },
                        { key: 'qty', label: 'Số lượng', align: 'right' as const },
                      ]).map(col => (
                        <th key={col.key} className={`table-header-cell ${col.align === 'right' ? 'text-right' : ''}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, i) => (
                      <tr key={i} className="table-row">
                        {(columns || [
                          { key: 'name' },
                          { key: 'sku' },
                          { key: 'unit' },
                          { key: 'qty', align: 'right' as const },
                        ]).map(col => (
                          <td
                            key={col.key}
                            className={`table-cell ${col.align === 'right' ? 'text-right' : ''}`}
                            style={{ fontWeight: col.align === 'right' ? 500 : 400 }}
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
              <p
                style={{
                  textAlign: 'center',
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '0.875rem',
                  color: 'var(--md-on-surface-variant)',
                  padding: '32px',
                }}
              >
                Không có mặt hàng nào
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
