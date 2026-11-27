import { CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { OpeningStockIndexedItem } from './AdminOpeningStockErrorModal';

interface AdminOpeningStockPreviewTableProps {
  items: OpeningStockIndexedItem[];
}

export default function AdminOpeningStockPreviewTable({ items }: AdminOpeningStockPreviewTableProps) {
  return (
    <div className="border border-[var(--md-outline-variant)] rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="sticky top-0 z-20 bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] font-semibold border-b border-[var(--md-outline-variant)] shadow-sm">
          <tr>
            <th className="py-2 px-2.5 w-12 text-center">STT</th>
            <th className="py-2 px-2.5 w-28 text-center">Trạng thái</th>
            <th className="py-2 px-2.5 w-36">Mã vật tư</th>
            <th className="py-2 px-2.5">Tên vật tư</th>
            <th className="py-2 px-2.5 text-center w-16">ĐVT</th>
            <th className="py-2 px-2.5 text-right w-24">SL tồn</th>
            <th className="py-2 px-2.5 text-right w-28">Đơn giá</th>
            <th className="py-2 px-2.5 text-right w-32">Thành tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--md-outline-variant)] bg-[var(--md-surface)]">
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-xs text-[var(--md-on-surface-variant)]">
                Không có dòng dữ liệu nào phù hợp với bộ lọc hiện tại.
              </td>
            </tr>
          ) : (
            items.map(it => (
              <tr
                key={`${it.materialCode}-${it.originalIndex}`}
                className={`hover:bg-[var(--md-surface-container-lowest)] transition-colors ${
                  !it.isValid ? 'bg-[var(--tint-error-soft)]' : ''
                }`}
              >
                <td className="py-2 px-2.5 text-center text-[var(--md-on-surface-variant)] font-mono">
                  {it.originalIndex}
                </td>
                <td className="py-2 px-2.5 text-center">
                  {it.isValid ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--md-on-success-container)] bg-[var(--md-success-container)] px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} className="shrink-0" />
                      <span>Hợp lệ</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--md-on-error-container)] bg-[var(--md-error-container)] px-2 py-0.5 rounded-full cursor-help"
                      title={it.error || 'Lỗi dữ liệu'}
                    >
                      <XCircle size={12} className="shrink-0" />
                      <span>Lỗi</span>
                    </span>
                  )}
                </td>
                <td className="py-2 px-2.5 font-mono font-medium text-[var(--md-primary)]">
                  {it.materialCode}
                </td>
                <td className="py-2 px-2.5">
                  <span className="font-medium text-[var(--md-on-surface)]" title={it.materialName}>
                    {it.materialName}
                  </span>
                  {it.isValid && it.note && (
                    <p className="text-xs text-[var(--md-warning)] mt-0.5 font-normal">
                      ℹ {it.note}
                    </p>
                  )}
                  {!it.isValid && it.error && (
                    <p className="text-xs text-[var(--md-error)] mt-0.5 font-normal">
                      ⚠ {it.error}
                    </p>
                  )}
                </td>
                <td className="py-2 px-2.5 text-center text-[var(--md-on-surface)]">{it.unit}</td>
                <td className="py-2 px-2.5 text-right font-semibold tabular-nums text-[var(--md-on-surface)]">
                  {it.qty.toLocaleString('vi-VN')}
                </td>
                <td className="py-2 px-2.5 text-right tabular-nums text-[var(--md-on-surface)]">
                  {formatCurrencyFull(it.unitPrice > 0 ? it.unitPrice : 0)}
                </td>
                <td className="py-2 px-2.5 text-right font-medium tabular-nums text-[var(--md-success)]">
                  {formatCurrencyFull(it.totalAmount > 0 ? it.totalAmount : 0)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
