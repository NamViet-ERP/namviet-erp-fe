import { useState } from 'react';
import type React from 'react';
import { Check, Pencil, X } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { showToast } from '../../../components/ui/Toast';
import type {
  usePriceBookCategories,
  usePriceBookMatrix,
} from '../../../hooks/usePurchasePriceBook';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type { PriceBookItemApiDto } from '../../../types/api/purchasingApi';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import { trendClass, trendLabel } from './priceBookHelpers';

export function ItemsTable({
  loading,
  rows,
  onOpen,
  isBoss,
  getMarkupPercent,
  onSaveItemMarkup,
}: {
  loading: boolean;
  rows: PriceBookItemApiDto[];
  onOpen: (code: string) => void;
  isBoss: boolean;
  getMarkupPercent: (materialCode?: string | number | null, categoryKey?: string | number | null) => number;
  onSaveItemMarkup?: (materialCode: string, percent: number) => Promise<void> | void;
}) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [tempPercent, setTempPercent] = useState<string>('');
  const [savingCode, setSavingCode] = useState<string | null>(null);

  const handleStartEdit = (code: string, currentPct: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCode(code);
    setTempPercent(String(currentPct));
  };

  const handleSaveMarkup = async (code: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    const val = Number(tempPercent);
    if (!Number.isNaN(val) && onSaveItemMarkup) {
      setSavingCode(code);
      try {
        await onSaveItemMarkup(code, val);
        showToast('success', `Đã lưu Markup (+${Math.max(0, Math.min(100, Math.round(val)))}%) cho mã ${code}`);
        setEditingCode(null);
      } catch (err) {
        showToast('error', getApiErrorMessage(err, 'Không lưu được hệ số Markup.'));
      } finally {
        setSavingCode(null);
      }
      return;
    }
    setEditingCode(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCode(null);
  };
  return (
    <div className="wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell">Hàng hoá</th>
            <th className="table-header-cell">Giá mua mới nhất</th>
            <th className="table-header-cell">Giá dự toán</th>
            <th className="table-header-cell text-right">Giá chào thầu EPC</th>
            <th className="table-header-cell">Chênh lệch (Mua - Dự toán)</th>
            <th className="table-header-cell">NCC gần nhất</th>
            <th className="table-header-cell">Khoảng giá</th>
            <th className="table-header-cell">Số NCC</th>
            <th className="table-header-cell text-center">Xu hướng</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows colSpan={9} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="table-cell"><EmptyState message="Chưa có mặt hàng phù hợp." /></td>
            </tr>
          ) : rows.map(row => (
            <tr
              key={row.materialCode}
              className="table-row wms-inventory-row--interactive"
              onClick={() => onOpen(row.materialCode)}
            >
              <td className="table-cell pur-pricebook-col-goods">
                <div><span className="mat-code-cell__badge">{row.materialCode}</span></div>
                <div>{row.materialName}</div>
                <div className="pur-pricebook-goods__meta">
                  Quy cách: {row.technicalSpec?.trim() || '-'}
                </div>
                <div
                  className="pur-pricebook-goods__spec"
                  title={row.generalTechnicalSpec?.trim() || undefined}
                >
                  Thông số kỹ thuật: {row.generalTechnicalSpec?.trim() || '-'}
                </div>
                <div className="pur-pricebook-goods__meta">
                  Giá trần: {row.ceilingPrice != null ? formatCurrencyFull(row.ceilingPrice) : '-'}
                  {row.overCeiling ? (
                    <span className="pur-pricebook-goods__warn"> Vượt trần</span>
                  ) : null}
                </div>
                <div className="pur-pricebook-goods__meta">
                  Giá dự toán: {row.estimatePrice != null ? formatCurrencyFull(row.estimatePrice) : '-'}
                </div>
              </td>
              <td className={`table-cell text-right tabular-nums ${row.overCeiling ? 'text-[var(--md-error)]' : ''}`}>
                {row.latestPrice != null ? formatCurrencyFull(row.latestPrice) : 'Chưa có lịch sử giá mua trong kỳ đã chọn'}
              </td>
              <td className="table-cell text-right tabular-nums">
                {row.estimatePrice != null ? formatCurrencyFull(row.estimatePrice) : '—'}
              </td>
              <td className="table-cell text-right tabular-nums font-semibold text-amber-700 dark:text-amber-400">
                {(() => {
                  const basePrice = row.latestPrice ?? row.estimatePrice ?? 0;
                  const markupPct = getMarkupPercent(row.materialCode, row.categoryName);
                  const biddingPrice = basePrice > 0 ? Math.round(basePrice * (1 + markupPct / 100)) : null;
                  const isRowSaving = savingCode === row.materialCode;
                  return biddingPrice != null ? (
                    <div>
                      <span>{formatCurrencyFull(biddingPrice)}</span>
                      {isBoss && (
                        editingCode === row.materialCode ? (
                          <div
                            className="inline-flex items-center gap-1 mt-1 justify-end"
                            onClick={e => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              autoFocus
                              disabled={isRowSaving}
                              className="w-14 px-1 py-0.5 text-center text-xs font-bold rounded border border-amber-500 bg-[var(--md-surface)] text-amber-700 dark:text-amber-300"
                              value={tempPercent}
                              onChange={e => setTempPercent(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') void handleSaveMarkup(row.materialCode, e);
                                else if (e.key === 'Escape' && !isRowSaving) setEditingCode(null);
                              }}
                            />
                            <button
                              type="button"
                              disabled={isRowSaving}
                              className="p-1 rounded bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60"
                              onClick={e => void handleSaveMarkup(row.materialCode, e)}
                              title="Lưu"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                              onClick={handleCancelEdit}
                              title="Hủy"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 bg-amber-500/15 hover:bg-amber-500/25 px-1.5 py-0.5 rounded border border-amber-500/30 transition-colors cursor-pointer mt-0.5"
                            onClick={e => handleStartEdit(row.materialCode, markupPct, e)}
                            title="Bấm để chỉnh sửa nhanh % Markup riêng cho mặt hàng này"
                          >
                            <span>(+{markupPct}%)</span>
                            <Pencil size={10} className="opacity-75" />
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    '—'
                  );
                })()}
              </td>
              <td className={`table-cell text-right tabular-nums ${row.estimateDiff != null && row.estimateDiff > 0 ? 'text-[var(--md-error)]' : row.estimateDiff != null ? 'text-[var(--md-success)]' : ''}`}>
                {row.estimateDiff != null
                  ? `${row.estimateDiff > 0 ? '+' : ''}${formatCurrencyFull(row.estimateDiff)}${row.estimateDiffPct != null ? ` (${row.estimateDiffPct > 0 ? '+' : ''}${row.estimateDiffPct}%)` : ''}`
                  : 'Chưa có dự toán'}
              </td>
              <td className="table-cell">{row.latestSupplierName || '—'}</td>
              <td className="table-cell text-right tabular-nums">
                {row.minPrice != null && row.maxPrice != null
                  ? `${formatCurrencyFull(row.minPrice)} - ${formatCurrencyFull(row.maxPrice)}`
                  : '—'}
              </td>
              <td className="table-cell text-right tabular-nums">{row.supplierCount}</td>
              <td className={`table-cell text-center tabular-nums ${trendClass(row.trendPct)}`}>
                {trendLabel(row.trendPct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MatrixTable({
  loading,
  data,
  hasCategory,
}: {
  loading: boolean;
  data: ReturnType<typeof usePriceBookMatrix>['data'];
  hasCategory: boolean;
}) {
  if (!hasCategory) {
    return <EmptyState message="Chọn nhóm hàng để so sánh giá NCC." />;
  }
  const suppliers = data?.rows[0]?.cells ?? [];
  return (
    <div className="wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell">Hàng hoá</th>
            {suppliers.map(s => (
              <th key={s.supplierId} className="table-header-cell">{s.supplierName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows colSpan={Math.max(1, suppliers.length + 1)} />
          ) : !data || data.rows.length === 0 || suppliers.length === 0 ? (
            <tr>
              <td colSpan={Math.max(1, suppliers.length + 1)} className="table-cell">
                <EmptyState message="Nhóm này chưa có giá từ PO, KHMH, RFQ hoặc phiếu nhập kho." />
              </td>
            </tr>
          ) : data.rows.map(row => (
            <tr key={row.materialCode} className="table-row">
              <td className="table-cell">
                <span className="font-mono">{row.materialCode}</span>
                {' '}
                {row.materialName}
              </td>
              {row.cells.map(cell => (
                <td
                  key={cell.supplierId}
                  className={`table-cell text-right tabular-nums ${cell.isMin && cell.unitPrice != null ? 'text-[var(--md-success)] font-semibold' : ''}`}
                >
                  {cell.unitPrice != null
                    ? `${formatCurrencyFull(cell.unitPrice)}${cell.isMin ? ' ★' : ''}`
                    : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GroupsTable({
  loading,
  rows,
  onCompare,
}: {
  loading: boolean;
  rows: NonNullable<ReturnType<typeof usePriceBookCategories>['data']>;
  onCompare: (categoryId: number) => void;
}) {
  const total = rows.reduce((sum, r) => sum + (r.totalSpend ?? 0), 0);
  return (
    <div className="wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell">Nhóm hàng</th>
            <th className="table-header-cell">Số mã hàng</th>
            <th className="table-header-cell">Số NCC đã mua</th>
            <th className="table-header-cell">Số lượt PO</th>
            <th className="table-header-cell">Tổng giá trị đã mua</th>
            <th className="table-header-cell">Tỷ trọng</th>
            <th className="table-header-cell"> </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows colSpan={7} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="table-cell"><EmptyState message="Chưa có dữ liệu nhóm hàng." /></td>
            </tr>
          ) : rows.map(row => (
            <tr key={row.categoryId} className="table-row">
              <td className="table-cell">
                <span className="font-mono">{row.categoryCode}</span>
                {' '}
                {row.categoryName}
              </td>
              <td className="table-cell text-right tabular-nums">{row.itemCount}</td>
              <td className="table-cell text-right tabular-nums">{row.supplierCount}</td>
              <td className="table-cell text-right tabular-nums">{row.poCount}</td>
              <td className="table-cell text-right tabular-nums">{formatCurrencyFull(row.totalSpend)}</td>
              <td className="table-cell">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <div className="flex-1 h-2 rounded-full bg-[var(--md-secondary-container)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--md-secondary)]"
                      style={{ width: `${Math.max(0, Math.min(100, row.sharePct))}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-[length:var(--fs-xs)]">{row.sharePct}%</span>
                </div>
              </td>
              <td className="table-cell">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onCompare(row.categoryId)}>
                  Xem so sánh NCC
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {!loading && rows.length > 0 ? (
          <tfoot>
            <tr className="table-row">
              <td className="table-cell" colSpan={4}>Tổng cộng</td>
              <td className="table-cell text-right tabular-nums font-semibold">{formatCurrencyFull(total)}</td>
              <td className="table-cell" colSpan={2} />
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
