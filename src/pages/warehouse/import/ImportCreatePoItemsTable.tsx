import QtyStepper from '../../../components/ui/QtyStepper';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { PoImportLinePreviewApiDto } from '../../../types/api/poImportApi';
import type { PoLineDraft, PoLineQtyCap } from './importCreatePoDrafts';
import { poLineQtyCap } from './importCreatePoDrafts';

export interface ImportCreatePoItemsTableProps {
  canViewPrices: boolean;
  poLoading: boolean;
  poPreviewLines: PoImportLinePreviewApiDto[];
  poLineDrafts: Record<number, PoLineDraft>;
  isPending: boolean;
  formGrandTotal: number;
  onSetPoLine: (poItemId: number, patch: Partial<PoLineDraft>) => void;
  onToggleSelectAll: (checked: boolean) => void;
  /** Khi thủ kho duyệt: cột SL đổi nhãn thành thực nhận */
  qtyColumnLabel?: string;
  getQtyCap?: PoLineQtyCap;
}

export default function ImportCreatePoItemsTable({
  canViewPrices,
  poLoading,
  poPreviewLines,
  poLineDrafts,
  isPending,
  formGrandTotal,
  onSetPoLine,
  onToggleSelectAll,
  qtyColumnLabel = 'SL dự kiến',
  getQtyCap,
}: ImportCreatePoItemsTableProps) {
  const fromGeneral = Boolean(getQtyCap);
  const showPrices = canViewPrices && !fromGeneral;
  const colCount = (showPrices ? 10 : 8) + (fromGeneral ? 1 : 0);
  const selectableLines = poPreviewLines.filter(line => poLineQtyCap(line, getQtyCap) > 0);
  const allSelected = selectableLines.length > 0
    && selectableLines.every(line => poLineDrafts[line.poItemId]?.selected);
  const someSelected = selectableLines.some(line => poLineDrafts[line.poItemId]?.selected)
    && !allSelected;

  return (
    <div className="overflow-x-auto table-scroll">
      <table
        className={`form-table import-items-table import-items-table--po-select import-items-table--po-import text-xs${
          fromGeneral ? ' import-items-table--po-from-general' : ''
        }`}
      >
        <thead>
          <tr>
            <th className="table-header-cell w-10 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                disabled={selectableLines.length === 0 || isPending}
                ref={el => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={e => onToggleSelectAll(e.target.checked)}
                aria-label="Chọn tất cả mặt hàng"
              />
            </th>
            <th className="table-header-cell text-center">Mặt hàng</th>
            <th className="table-header-cell text-center import-po-col-num">Đặt</th>
            <th className="table-header-cell text-center import-po-col-unit">ĐVT</th>
            <th className="table-header-cell text-center import-po-col-num">Đã nhận</th>
            <th className="table-header-cell text-center import-po-col-pending">Chờ nhập kho</th>
            <th className="table-header-cell text-center import-po-col-num">Còn lại</th>
            {fromGeneral && (
              <th className="table-header-cell text-center import-po-col-central">
                Khả dụng trung tâm
              </th>
            )}
            {showPrices && <th className="table-header-cell text-center import-po-col-price">Đơn giá</th>}
            <th className="table-header-cell text-center import-po-col-qty">{qtyColumnLabel}</th>
            {showPrices && <th className="table-header-cell text-center import-po-col-amount">Thành tiền</th>}
          </tr>
        </thead>
        <tbody>
          {poLoading ? (
            <TableSkeletonRows rows={4} colSpan={colCount} />
          ) : poPreviewLines.length === 0 ? (
            <tr>
              <td colSpan={colCount}>
                <EmptyState message="PO không còn dòng hàng để nhập." />
              </td>
            </tr>
          ) : (
            poPreviewLines.map(line => {
              const draft = poLineDrafts[line.poItemId] ?? { selected: false, qty: '0' };
              const cap = poLineQtyCap(line, getQtyCap);
              const outOfStock = !(Number.isFinite(cap) && cap > 0);
              const qty = Number(draft.qty) || 0;
              const lineTotal = draft.selected && qty > 0 ? qty * line.unitPrice : 0;
              return (
                <tr key={line.poItemId} className={outOfStock ? 'opacity-60' : 'table-row'}>
                  <td className="table-cell text-center">
                    <input
                      type="checkbox"
                      checked={draft.selected && !outOfStock}
                      disabled={outOfStock || isPending}
                      onChange={e => {
                        const checked = e.target.checked;
                        const fallback = Number.isFinite(cap) && cap > 0 ? String(cap) : '1';
                        const nextQty = checked && qty <= 0 ? fallback : draft.qty;
                        onSetPoLine(line.poItemId, { selected: checked, qty: nextQty });
                      }}
                      aria-label={
                        outOfStock && fromGeneral
                          ? `${line.name} - hết tồn kho trung tâm`
                          : `Chọn ${line.name}`
                      }
                    />
                  </td>
                  <td className="table-cell">
                    <div className="import-line-item__name">{line.name}</div>
                    <div className="import-line-item__code">
                      {line.materialCode?.trim() || '-'}
                    </div>
                  </td>
                  <td className="table-cell text-center tabular-nums import-po-col-num">{line.ordered}</td>
                  <td className="table-cell text-center import-po-col-unit">
                    {line.unit?.trim() || '-'}
                  </td>
                  <td className="table-cell text-center tabular-nums import-po-col-num">{line.received}</td>
                  <td className="table-cell text-center tabular-nums import-po-col-pending">{line.reservedPending}</td>
                  <td className="table-cell text-center tabular-nums font-semibold import-po-col-num">{line.available}</td>
                  {fromGeneral && (
                    <td
                      className="table-cell text-center tabular-nums import-po-col-central"
                      title={outOfStock ? 'Hết tồn khả dụng kho trung tâm' : undefined}
                    >
                      {Number.isFinite(cap) ? cap : 0}
                    </td>
                  )}
                  {showPrices && (
                    <td className="table-cell text-center tabular-nums import-po-col-price">{formatCurrencyFull(line.unitPrice)}</td>
                  )}
                  <td className="table-cell text-center import-po-col-qty">
                    {outOfStock || !draft.selected ? (
                      <div className="import-cell-placeholder import-cell-placeholder--center text-[var(--md-on-surface-variant)]">
                        {outOfStock && fromGeneral ? 'Hết hàng' : '-'}
                      </div>
                    ) : (
                      <div className="import-cell-placeholder import-cell-placeholder--center">
                        <QtyStepper
                          value={draft.qty}
                          max={Number.isFinite(cap) ? cap : undefined}
                          className="qty-stepper--compact"
                          onChange={qtyVal => onSetPoLine(line.poItemId, { qty: qtyVal })}
                        />
                      </div>
                    )}
                  </td>
                  {showPrices && (
                    <td className="table-cell text-center tabular-nums font-semibold text-[var(--md-on-surface)] import-po-col-amount">
                      {lineTotal > 0 ? formatCurrencyFull(lineTotal) : '-'}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
        {showPrices && (
          <tfoot>
            <tr className="border-t border-[var(--md-outline-variant)]">
              <td colSpan={fromGeneral ? 10 : 9} className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2">
                Tổng cộng (đã chọn)
              </td>
              <td className="table-cell text-center font-bold tabular-nums text-[var(--md-primary)] py-2">
                {formatCurrencyFull(formGrandTotal)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
