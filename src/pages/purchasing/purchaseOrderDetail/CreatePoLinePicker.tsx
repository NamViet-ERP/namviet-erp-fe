import { Link } from 'react-router-dom';
import EmptyState from '../../../components/ui/EmptyState';
import SelectField from '../../../components/ui/SelectField';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import type { PurchasePlanLineApiDto } from '../../../types/api/purchasingApi';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import { unitPriceOf } from './poDetailHelpers';

const WARRANTY_ANCHOR_OPTIONS = [
  { value: 'delivery', label: 'Giao hàng' },
  { value: 'acceptance', label: 'Nghiệm thu' },
] as const;

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
  const serviceLineCount = supplierLines.filter(
    l => l.lineType === 'service' || l.lineType === 'expense',
  ).length;

  return (
    <section className="pur-detail__card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="purchasing-section-title mb-0">
            Mặt hàng & Dịch vụ {supplierName ? `- ${supplierName}` : ''}
          </h2>
          {supplierLines.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-[var(--md-surface-variant)] text-[var(--md-on-surface-variant)] font-medium">
                {supplierLines.length} dòng
              </span>
              {serviceLineCount > 0 && (
                <span className="pur-item-badge pur-item-badge--service">
                  {serviceLineCount} dịch vụ
                </span>
              )}
            </div>
          )}
        </div>
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
                const badgeMod =
                  line.lineType === 'service'
                    ? 'pur-item-badge--service'
                    : line.lineType === 'expense'
                      ? 'pur-item-badge--expense'
                      : 'pur-item-badge--material';
                const badgeLabel =
                  line.lineType === 'service'
                    ? 'Dịch vụ'
                    : line.lineType === 'expense'
                      ? 'Chi phí'
                      : 'Vật tư';
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
                    <td>
                      <div className="flex flex-col gap-1 py-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`pur-item-badge ${badgeMod}`}>
                            {badgeLabel}
                          </span>
                          <span className="font-medium text-[var(--md-on-surface)]">{line.productName}</span>
                        </div>
                        {line.materialCode && (
                          <span className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] font-mono">
                            Mã: {line.materialCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{line.spec || '-'}</td>
                    <td>{line.unit || '-'}</td>
                    <td className="pur-erp__td-num">
                      <div>{line.remainingOrderableQty}</div>
                      {line.pos && line.pos.length > 0 ? (
                        <div
                          className="text-xs opacity-75"
                          title={`Đã lên đơn: ${line.pos.map(p => `${p.poCode} (${p.orderedQty})`).join(', ')}`}
                        >
                          <span className="text-[length:var(--fs-micro)]">Đã có: </span>
                          {line.pos.map((p, idx) => (
                            <span key={p.poCode}>
                              {idx > 0 ? ', ' : ''}
                              <Link
                                to={`/purchasing/orders/${encodeURIComponent(p.poCode)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="pur-pay-plan__po-link text-[length:var(--fs-micro)]"
                                onClick={e => e.stopPropagation()}
                              >
                                {p.poCode}
                              </Link>
                              <span className="text-[length:var(--fs-micro)]"> ({p.orderedQty})</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
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
                      {formatCurrencyFull(unitPriceOf(line))}
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
                      <SelectField
                        variant="form"
                        className="m-0 [&_.form-field__error--reserved]:hidden"
                        selectClassName="form-input form-input-sm pur-create-po-lines__select-anchor"
                        disabled={!checked}
                        value={warrantyAnchorByLine[line.id] ?? 'delivery'}
                        onChange={val => onWarrantyAnchorChange(prev => ({
                          ...prev,
                          [line.id]: val,
                        }))}
                        options={WARRANTY_ANCHOR_OPTIONS}
                        aria-label={`Mốc bảo hành ${line.productName}`}
                      />
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
