import type { RefObject } from 'react';
import type { ImportItem } from '../../../types';
import { formatCurrencyVnd } from '../../../utils/formatCurrency';
import QtyStepper from '../../../components/ui/QtyStepper';
import { lineNeedsReason, type ReceiveLineDraft } from './importReceiveSettlement';

export interface ImportDetailSettlementTableProps {
  items: ImportItem[];
  totalValue: number;
  lineDrafts: ReceiveLineDraft[];
  totals: { accepted: number; defect: number; shortage: number };
  showSettlement: boolean;
  settlementEditable: boolean;
  displayPrices: boolean;
  reasonErrorLineIds: number[];
  reasonInputRefs: RefObject<Map<number, HTMLInputElement | null>>;
  tableScrollRef: RefObject<HTMLDivElement | null>;
  onPatchLine: (lineId: number, patch: Partial<ReceiveLineDraft>) => void;
}

export default function ImportDetailSettlementTable({
  items,
  totalValue,
  lineDrafts,
  totals,
  showSettlement,
  settlementEditable,
  displayPrices,
  reasonErrorLineIds,
  reasonInputRefs,
  tableScrollRef,
  onPatchLine,
}: ImportDetailSettlementTableProps) {
  const totalPlanned =
    lineDrafts.reduce((s, d) => s + d.planned, 0)
    || items.reduce((s, it) => s + (Number(it.plannedQty) || Number(it.qty) || 0), 0);

  const totalAmount = settlementEditable
    ? lineDrafts.reduce((sum, d, idx) => {
        const price = items[idx]?.unitPrice ?? 0;
        return sum + (Number(d.accepted) || 0) * price;
      }, 0)
    : totalValue;

  return (
    <>
      <div className="overflow-x-auto table-scroll" ref={tableScrollRef}>
        <table
          className={`form-table import-items-table import-items-table--import-detail text-xs${
            showSettlement ? ' import-items-table--import-receive' : ''
          }`}
        >
          <thead>
            <tr>
              <th className="table-header-cell text-center import-line-item-col">Mặt hàng</th>
              {showSettlement ? (
                <>
                  <th className="table-header-cell text-center import-receive-col-qty">SL tạo phiếu</th>
                  <th className="table-header-cell text-center import-receive-col-qty">SL thực tế</th>
                  <th className="table-header-cell text-center import-receive-col-qty">Lỗi</th>
                  <th className="table-header-cell text-center import-receive-col-qty">Thiếu</th>
                </>
              ) : (
                <th className="table-header-cell text-center import-manual-col-qty">SL</th>
              )}
              <th className="table-header-cell text-center import-po-col-unit">ĐVT</th>
              {displayPrices ? (
                <>
                  <th className="table-header-cell text-center import-po-col-amount">Đơn giá</th>
                  <th className="table-header-cell text-center import-po-col-amount">Thành tiền</th>
                </>
              ) : null}
              {showSettlement ? (
                <th className="table-header-cell text-center defect-col-reason">Lý do</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const code = (it.sku || it.productId || '').trim();
              const draft = lineDrafts.find(d => d.lineId === Number(it.lineId));
              const planned = Number(it.plannedQty) > 0 ? Number(it.plannedQty) : Number(it.qty) || 0;
              return (
                <tr key={`${code}-${i}`} className="table-row">
                  <td className="table-cell import-line-item-col">
                    <div className="import-line-item__name">{it.name}</div>
                    <div className="import-line-item__code">{code || '-'}</div>
                  </td>
                  {showSettlement ? (
                    settlementEditable && draft ? (
                      <>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty font-semibold">
                          {draft.planned}
                        </td>
                        <td className="table-cell text-center import-receive-col-qty">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            <QtyStepper
                              value={draft.accepted}
                              min={0}
                              max={draft.planned}
                              className="qty-stepper--compact"
                              ariaLabel={`SL thực tế ${code}`}
                              onChange={qtyVal => onPatchLine(draft.lineId, { accepted: qtyVal })}
                            />
                          </div>
                        </td>
                        <td className="table-cell text-center import-receive-col-qty">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            <QtyStepper
                              value={draft.defect}
                              min={0}
                              max={draft.planned}
                              className="qty-stepper--compact"
                              ariaLabel={`Lỗi ${code}`}
                              onChange={qtyVal => onPatchLine(draft.lineId, { defect: qtyVal })}
                            />
                          </div>
                        </td>
                        <td className="table-cell text-center import-receive-col-qty">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            <QtyStepper
                              value={draft.shortage}
                              min={0}
                              max={draft.planned}
                              className="qty-stepper--compact"
                              ariaLabel={`Thiếu ${code}`}
                              onChange={qtyVal => onPatchLine(draft.lineId, { shortage: qtyVal })}
                            />
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty">{planned}</td>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty">{it.acceptedQty ?? it.qty}</td>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty">{it.defectQty ?? 0}</td>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty">{it.shortageQty ?? 0}</td>
                      </>
                    )
                  ) : (
                    <td className="table-cell text-center tabular-nums import-manual-col-qty font-semibold">
                      {it.qty}
                    </td>
                  )}
                  <td className="table-cell text-center import-po-col-unit">
                    <div className="import-cell-placeholder import-cell-placeholder--center">
                      {it.unit?.trim() || '-'}
                    </div>
                  </td>
                  {displayPrices ? (
                    <>
                      <td className="table-cell text-center tabular-nums import-po-col-amount">
                        {formatCurrencyVnd(it.unitPrice)}
                      </td>
                      <td className="table-cell text-center tabular-nums font-semibold text-[var(--md-primary)] import-po-col-amount">
                        {formatCurrencyVnd((Number(draft?.accepted ?? it.acceptedQty ?? it.qty) || 0) * it.unitPrice)}
                      </td>
                    </>
                  ) : null}
                  {showSettlement ? (
                    settlementEditable && draft ? (
                      <td className="table-cell defect-col-reason">
                        {lineNeedsReason(draft) ? (
                          <input
                            ref={el => {
                              reasonInputRefs.current.set(draft.lineId, el);
                            }}
                            className={`form-input min-h-9${
                              reasonErrorLineIds.includes(draft.lineId) ? ' form-input--error' : ''
                            }`}
                            value={draft.lineReason}
                            onChange={e => onPatchLine(draft.lineId, { lineReason: e.target.value })}
                            placeholder="Lý do"
                            aria-invalid={reasonErrorLineIds.includes(draft.lineId)}
                            aria-label={`Lý do ${code}`}
                            required
                          />
                        ) : (
                          <div className="import-cell-placeholder import-cell-placeholder--center">-</div>
                        )}
                      </td>
                    ) : (
                      <td className="table-cell defect-col-reason whitespace-pre-wrap">
                        {(it.defectLineReason || it.shortageLineReason || '-').toString()}
                      </td>
                    )
                  ) : null}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[var(--md-outline-variant)]">
              <td className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2">
                Tổng cộng ({items.length} dòng)
              </td>
              {showSettlement ? (
                <>
                  <td className="table-cell text-center tabular-nums font-bold py-2 import-receive-col-qty">
                    {totalPlanned}
                  </td>
                  <td className="table-cell text-center tabular-nums font-bold py-2 import-receive-col-qty">
                    {totals.accepted}
                  </td>
                  <td className="table-cell text-center tabular-nums font-bold py-2 import-receive-col-qty">
                    {totals.defect}
                  </td>
                  <td className="table-cell text-center tabular-nums font-bold py-2 import-receive-col-qty">
                    {totals.shortage}
                  </td>
                </>
              ) : (
                <td className="table-cell text-center tabular-nums font-bold py-2 import-manual-col-qty">
                  {items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)}
                </td>
              )}
              <td className="table-cell py-2" />
              {displayPrices ? (
                <>
                  <td className="table-cell py-2" />
                  <td className="table-cell text-center tabular-nums font-bold text-[var(--md-primary)] py-2 import-po-col-amount">
                    {formatCurrencyVnd(totalAmount)}
                  </td>
                </>
              ) : null}
              {showSettlement ? <td className="table-cell py-2" /> : null}
            </tr>
          </tfoot>
        </table>
      </div>

      {settlementEditable ? (
        <p
          className={`mt-2 text-[length:var(--fs-micro)] text-pretty${
            reasonErrorLineIds.length > 0
              ? ' text-[var(--md-error)] font-semibold'
              : ' text-[var(--md-on-surface-variant)]'
          }`}
        >
          SL thực tế + Lỗi + Thiếu = SL tạo phiếu. Có Lỗi/Thiếu thì nhập Lý do trên dòng.
        </p>
      ) : null}
    </>
  );
}
