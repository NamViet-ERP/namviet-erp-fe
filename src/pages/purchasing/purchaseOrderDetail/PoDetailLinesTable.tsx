import EmptyState from '../../../components/ui/EmptyState';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { PurchaseOrderLineApiDto } from '../../../types/api/purchasingApi';
import type { PoEditLineDraft } from './usePurchaseOrderDetail';

type Props = {
  lines: PurchaseOrderLineApiDto[];
  editing: boolean;
  editLines: Record<number, PoEditLineDraft>;
  onEditLinesChange: (
    updater: (prev: Record<number, PoEditLineDraft>) => Record<number, PoEditLineDraft>,
  ) => void;
};

export function PoDetailLinesTable({
  lines,
  editing,
  editLines,
  onEditLinesChange,
}: Props) {
  return (
    <section className="pur-detail__card" aria-label="Dòng hàng">
      <h2 className="purchasing-section-title">Dòng hàng</h2>
      {lines.length === 0 ? (
        <EmptyState message="Đơn hàng chưa có dòng." />
      ) : (
        <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
          <table className="pur-erp__table pur-detail__lines-table pur-detail__lines-table--po">
            <colgroup>
              <col className="pur-po-col pur-po-col--name" />
              <col className="pur-po-col pur-po-col--spec" />
              <col className="pur-po-col pur-po-col--unit" />
              <col className="pur-po-col pur-po-col--qty" />
              <col className="pur-po-col pur-po-col--price" />
              <col className="pur-po-col pur-po-col--amount" />
              <col className="pur-po-col pur-po-col--date" />
              <col className="pur-po-col pur-po-col--recv" />
              <col className="pur-po-col pur-po-col--warranty" />
              <col className="pur-po-col pur-po-col--anchor" />
              <col className="pur-po-col pur-po-col--note" />
            </colgroup>
            <thead>
              <tr>
                <th className="pur-detail__th pur-detail__th--base">Tên hàng</th>
                <th className="pur-detail__th pur-detail__th--base">Quy cách</th>
                <th className="pur-detail__th pur-detail__th--base">ĐVT</th>
                <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">SL</th>
                <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">Đơn giá</th>
                <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">Thành tiền</th>
                <th className="pur-detail__th pur-detail__th--track">Ngày DK giao</th>
                <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Đã nhận</th>
                <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Tháng BH</th>
                <th className="pur-detail__th pur-detail__th--track">Mốc BH</th>
                <th className="pur-detail__th pur-detail__th--track">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(line => {
                const draft = editLines[line.id];
                const qty = editing ? Number(draft?.qty ?? line.ordered) : line.ordered;
                const price = editing ? Number(draft?.unitPrice ?? line.poPrice) : line.poPrice;
                const amount = Number.isFinite(qty * price) ? qty * price : line.lineAmount;
                return (
                  <tr key={line.id}>
                    <td>{line.name}</td>
                    <td>{line.spec || '—'}</td>
                    <td>{line.unit || '—'}</td>
                    <td className="pur-erp__td-num">
                      {editing ? (
                        <input
                          className="form-input"
                          type="number"
                          min={0}
                          step="any"
                          value={draft?.qty ?? ''}
                          onChange={e => onEditLinesChange(prev => ({
                            ...prev,
                            [line.id]: { ...prev[line.id]!, qty: e.target.value },
                          }))}
                        />
                      ) : line.ordered}
                    </td>
                    <td className="pur-erp__td-num">
                      {editing ? (
                        <input
                          className="form-input"
                          type="number"
                          min={0}
                          step="any"
                          value={draft?.unitPrice ?? ''}
                          onChange={e => onEditLinesChange(prev => ({
                            ...prev,
                            [line.id]: { ...prev[line.id]!, unitPrice: e.target.value },
                          }))}
                        />
                      ) : formatCurrency(line.poPrice)}
                    </td>
                    <td className="pur-erp__td-num">{formatCurrency(amount)}</td>
                    <td>
                      {editing ? (
                        <input
                          className="form-input"
                          type="date"
                          value={draft?.expectedDeliveryDate ?? ''}
                          onChange={e => onEditLinesChange(prev => ({
                            ...prev,
                            [line.id]: {
                              ...prev[line.id]!,
                              expectedDeliveryDate: e.target.value,
                            },
                          }))}
                        />
                      ) : formatDateCell(line.expectedDeliveryDate ?? undefined)}
                    </td>
                    <td className="pur-erp__td-num">{line.received}</td>
                    <td className="pur-erp__td-num">
                      {editing ? (
                        <input
                          className="form-input"
                          type="number"
                          min={0}
                          max={120}
                          value={draft?.warrantyMonths ?? ''}
                          onChange={e => onEditLinesChange(prev => ({
                            ...prev,
                            [line.id]: { ...prev[line.id]!, warrantyMonths: e.target.value },
                          }))}
                        />
                      ) : (line.warrantyMonths ?? 0)}
                    </td>
                    <td>
                      {editing ? (
                        <select
                          className="form-input"
                          value={draft?.warrantyAnchorType ?? 'delivery'}
                          onChange={e => onEditLinesChange(prev => ({
                            ...prev,
                            [line.id]: { ...prev[line.id]!, warrantyAnchorType: e.target.value },
                          }))}
                        >
                          <option value="delivery">Giao hàng</option>
                          <option value="acceptance">Nghiệm thu</option>
                        </select>
                      ) : (
                        line.warrantyAnchorType === 'acceptance' ? 'Nghiệm thu' : 'Giao hàng'
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="form-input"
                          value={draft?.note ?? ''}
                          onChange={e => onEditLinesChange(prev => ({
                            ...prev,
                            [line.id]: { ...prev[line.id]!, note: e.target.value },
                          }))}
                        />
                      ) : (line.note || '—')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
