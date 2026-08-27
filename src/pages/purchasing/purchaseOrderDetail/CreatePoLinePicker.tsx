import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { PurchasePlanLineApiDto } from '../../../types/api/purchasingApi';
import { unitPriceOf } from './poDetailHelpers';

type Props = {
  planCode: string;
  planLoading: boolean;
  supplierName: string;
  supplierLines: PurchasePlanLineApiDto[];
  visibleSupplierLines: PurchasePlanLineApiDto[];
  productSearch: string;
  onProductSearchChange: (value: string) => void;
  selectedLineIds: number[];
  qtyByLine: Record<number, string>;
  onQtyChange: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  warrantyMonthsByLine: Record<number, string>;
  onWarrantyMonthsChange: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  warrantyAnchorByLine: Record<number, string>;
  onWarrantyAnchorChange: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleLine: (id: number, checked: boolean) => void;
  onToggleSelectAllVisible: (checked: boolean) => void;
};

export function CreatePoLinePicker({
  planCode,
  planLoading,
  supplierName,
  supplierLines,
  visibleSupplierLines,
  productSearch,
  onProductSearchChange,
  selectedLineIds,
  qtyByLine,
  onQtyChange,
  warrantyMonthsByLine,
  onWarrantyMonthsChange,
  warrantyAnchorByLine,
  onWarrantyAnchorChange,
  allVisibleSelected,
  someVisibleSelected,
  onToggleLine,
  onToggleSelectAllVisible,
}: Props) {
  return (
    <section className="pur-detail__card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="purchasing-section-title mb-0">
          Mặt hàng {supplierName ? `- ${supplierName}` : ''}
        </h2>
        {supplierLines.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="form-input max-w-xs"
              value={productSearch}
              onChange={e => onProductSearchChange(e.target.value)}
              placeholder="Tìm tên hàng…"
              aria-label="Tìm tên hàng"
            />
          </div>
        ) : null}
      </div>
      {!planCode ? (
        <EmptyState message="Chọn mã KHMH để xem mặt hàng." />
      ) : planLoading ? (
        <table className="pur-erp__table"><tbody><TableSkeletonRows rows={5} colSpan={4} /></tbody></table>
      ) : !supplierName ? (
        <EmptyState message="Chọn nhà cung cấp còn SL đặt được trên kế hoạch này." />
      ) : supplierLines.length === 0 ? (
        <EmptyState message="NCC này không còn SL đặt trên KHMH (đã tạo PO hết hoặc không gắn dòng)." />
      ) : visibleSupplierLines.length === 0 ? (
        <EmptyState message="Không có mặt hàng khớp tìm kiếm." />
      ) : (
        <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
          <table className="pur-erp__table pur-create-po-lines">
            <thead>
              <tr>
                <th className="pur-erp__th-check">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={el => {
                      if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }}
                    onChange={e => onToggleSelectAllVisible(e.target.checked)}
                    aria-label="Chọn tất cả mặt hàng"
                  />
                </th>
                <th>Hệ</th>
                <th>Danh mục</th>
                <th>Tên hàng</th>
                <th>Quy cách</th>
                <th>ĐVT</th>
                <th className="pur-erp__th-num">Còn lại</th>
                <th className="pur-erp__th-num pur-create-po-lines__col-qty">SL đặt</th>
                <th className="pur-erp__th-num pur-create-po-lines__col-price">Đơn giá</th>
                <th
                  className="pur-erp__th-num pur-create-po-lines__col-warranty"
                  title="Số tháng bảo hành"
                >
                  Tháng BH
                </th>
                <th
                  className="pur-create-po-lines__col-anchor"
                  title="Thời điểm bắt đầu tính bảo hành: giao hàng hoặc nghiệm thu"
                >
                  Mốc BH
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleSupplierLines.map(line => {
                const checked = selectedLineIds.includes(line.id);
                return (
                  <tr key={line.id} className={checked ? 'is-selected' : undefined}>
                    <td className="pur-erp__td-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => onToggleLine(line.id, e.target.checked)}
                        aria-label={`Chọn ${line.productName}`}
                      />
                    </td>
                    <td>{line.systemName || '-'}</td>
                    <td>{line.category || '-'}</td>
                    <td>{line.productName}</td>
                    <td>{line.spec || '-'}</td>
                    <td>{line.unit || '-'}</td>
                    <td className="pur-erp__td-num">{line.remainingOrderableQty}</td>
                    <td className="pur-erp__td-num pur-create-po-lines__col-qty">
                      <input
                        className="form-input form-input-sm pur-create-po-lines__input-num"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={line.remainingOrderableQty}
                        step="any"
                        disabled={!checked}
                        value={qtyByLine[line.id] ?? ''}
                        onChange={e => onQtyChange(prev => ({ ...prev, [line.id]: e.target.value }))}
                        aria-label={`Số lượng đặt ${line.productName}`}
                      />
                    </td>
                    <td className="pur-erp__td-num pur-create-po-lines__col-price">
                      {formatCurrency(unitPriceOf(line))} (VNĐ)
                    </td>
                    <td className="pur-erp__td-num pur-create-po-lines__col-warranty">
                      <input
                        className="form-input form-input-sm pur-create-po-lines__input-warranty"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={120}
                        step={1}
                        disabled={!checked}
                        value={warrantyMonthsByLine[line.id] ?? '0'}
                        onChange={e => onWarrantyMonthsChange(prev => ({
                          ...prev,
                          [line.id]: e.target.value,
                        }))}
                        aria-label={`Tháng bảo hành ${line.productName}`}
                      />
                    </td>
                    <td className="pur-create-po-lines__col-anchor">
                      <select
                        className="form-input form-input-sm pur-create-po-lines__select-anchor"
                        disabled={!checked}
                        value={warrantyAnchorByLine[line.id] ?? 'delivery'}
                        onChange={e => onWarrantyAnchorChange(prev => ({
                          ...prev,
                          [line.id]: e.target.value,
                        }))}
                        aria-label={`Mốc bảo hành ${line.productName}`}
                        title="Thời điểm bắt đầu tính bảo hành"
                      >
                        <option value="delivery">Giao hàng</option>
                        <option value="acceptance">Nghiệm thu</option>
                      </select>
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
