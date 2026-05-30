import { X, User } from 'lucide-react';
import Badge from './Badge';

/**
 * Detail/view modal matching ERP's voucher detail overlay.
 * Shows header info card + items table.
 */
export default function DetailModal({ isOpen, onClose, title, data, columns, badgeField = 'status', children }) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-navy-900">{title}</h3>
            {data[badgeField] && <Badge status={data[badgeField]} />}
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Info card */}
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.voucherCode && (
              <div>
                <span className="text-xs text-gray-400">Mã chứng từ</span>
                <p className="font-semibold text-brand-orange">{data.voucherCode}</p>
              </div>
            )}
            {data.createdBy && (
              <div>
                <span className="text-xs text-gray-400">Người lập phiếu</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <User size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-medium">{data.createdBy}</span>
                </div>
              </div>
            )}
            {data.date && (
              <div>
                <span className="text-xs text-gray-400">Ngày chứng từ</span>
                <p className="font-medium text-sm">{data.date}</p>
              </div>
            )}
            {data.warehouseName && (
              <div>
                <span className="text-xs text-gray-400">Kho hàng</span>
                <p className="font-medium text-sm">{data.warehouseName}</p>
              </div>
            )}
            {data.note && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400">Ghi chú</span>
                <p className="text-sm text-gray-600">{data.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Body: items table or custom children */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children ? children : (
            data.items && data.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {(columns || [
                        { key: 'name', label: 'Tên hàng' },
                        { key: 'sku', label: 'Mã SKU' },
                        { key: 'unit', label: 'Đơn vị' },
                        { key: 'qty', label: 'Số lượng', align: 'right' },
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
                          { key: 'qty', align: 'right' },
                        ]).map(col => (
                          <td key={col.key}
                            className={`table-cell ${col.align === 'right' ? 'text-right font-medium' : ''}`}>
                            {col.render ? col.render(item) : (item[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">Không có mặt hàng nào</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
