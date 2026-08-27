import QtyStepper from '../../../components/ui/QtyStepper';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { PoImportLinePreviewApiDto } from '../../../types/api/poImportApi';
import type { PoLineDraft } from './importCreatePoDrafts';

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
}: ImportCreatePoItemsTableProps) {
  const colCount = canViewPrices ? 10 : 8;
  const selectableLines = poPreviewLines.filter(line => line.available > 0);
  const allSelected = selectableLines.length > 0
    && selectableLines.every(line => poLineDrafts[line.poItemId]?.selected);
  const someSelected = selectableLines.some(line => poLineDrafts[line.poItemId]?.selected)
    && !allSelected;

  return (
    <div className="overflow-x-auto table-scroll">
      <table className="form-table import-items-table import-items-table--po-select import-items-table--po-import text-xs">
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
            <th className="table-header-cell text-center">Đặt</th>
            <th className="table-header-cell text-center import-po-col-unit">ĐVT</th>
            <th className="table-header-cell text-center">Đã nhận</th>
            <th className="table-header-cell text-center">Chờ NK</th>
            <th className="table-header-cell text-center">Còn lại</th>
            {canViewPrices && <th className="table-header-cell text-center">Đơn giá</th>}
            <th className="table-header-cell text-center import-po-col-qty">{qtyColumnLabel}</th>
            {canViewPrices && <th className="table-header-cell text-center import-po-col-amount">Thành tiền</th>}
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
              const disabled = line.available <= 0;
              const qty = Number(draft.qty) || 0;
              const lineTotal = draft.selected && qty > 0 ? qty * line.unitPrice : 0;
              return (
                <tr key={line.poItemId} className={disabled ? 'opacity-60' : 'table-row'}>
                  <td className="table-cell text-center">
                    <input
                      type="checkbox"
                      checked={draft.selected && !disabled}
                      disabled={disabled || isPending}
                      onChange={e => onSetPoLine(line.poItemId, { selected: e.target.checked })}
                      aria-label={`Chọn ${line.name}`}
                    />
                  </td>
                  <td className="table-cell">
                    <div className="import-line-item__name">{line.name}</div>
                    <div className="import-line-item__code">
                      {line.materialCode?.trim() || '-'}
                    </div>
                  </td>
                  <td className="table-cell text-center tabular-nums">{line.ordered}</td>
                  <td className="table-cell text-center import-po-col-unit">
                    {line.unit?.trim() || '-'}
                  </td>
                  <td className="table-cell text-center tabular-nums">{line.received}</td>
                  <td className="table-cell text-center tabular-nums">{line.reservedPending}</td>
                  <td className="table-cell text-center tabular-nums font-semibold">{line.available}</td>
                  {canViewPrices && (
                    <td className="table-cell text-center tabular-nums">{formatCurrencyFull(line.unitPrice)}</td>
                  )}
                  <td className="table-cell text-center import-po-col-qty">
                    {disabled || !draft.selected ? (
                      <div className="import-cell-placeholder import-cell-placeholder--center text-[var(--md-on-surface-variant)]">
                        -
                      </div>
                    ) : (
                      <div className="import-cell-placeholder import-cell-placeholder--center">
                        <QtyStepper
                          value={draft.qty}
                          max={line.available}
                          className="qty-stepper--compact"
                          onChange={qtyVal => onSetPoLine(line.poItemId, { qty: qtyVal })}
                        />
                      </div>
                    )}
                  </td>
                  {canViewPrices && (
                    <td className="table-cell text-center tabular-nums font-semibold text-[var(--md-on-surface)] import-po-col-amount">
                      {lineTotal > 0 ? formatCurrencyFull(lineTotal) : '-'}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
        {canViewPrices && (
          <tfoot>
            <tr className="border-t border-[var(--md-outline-variant)]">
              <td colSpan={9} className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2">
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
