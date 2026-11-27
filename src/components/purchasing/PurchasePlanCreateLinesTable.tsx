import { Fragment } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import CurrencyInput from '../ui/CurrencyInput';
import QtyStepper from '../ui/QtyStepper';
import PurchaseItemAutocomplete from './PurchaseItemAutocomplete';
import PurchasePlanLineDetailRow from './PurchasePlanLineDetailRow';
import type { MaterialApiDto } from '../../services/materialsService';
import type { SupplierApiDto } from '../../services/suppliersService';
import type { ServiceExpenseItemApiDto } from '../../types/api/serviceExpenseItem';
import type { SupplierMaterialRiskApiDto } from '../../types/api/purchasingApi';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import {
  MAX_BUDGET_UNIT_PRICE,
  isUnknownPlanItem,
  lineAmount,
  type DraftLine,
  type PurchasePlanLineType,
} from './createPurchasePlanDraft';

interface Totals {
  budget: number;
  proposal: number;
  purchase: number;
  filled: number;
}

interface PurchasePlanCreateLinesTableProps {
  lines: DraftLine[];
  expanded: Record<string, boolean>;
  materials: MaterialApiDto[];
  serviceItems?: ServiceExpenseItemApiDto[];
  suppliers: SupplierApiDto[];
  linesLocked: boolean;
  totals: Totals;
  risksByLineKey: Map<string, SupplierMaterialRiskApiDto[]>;
  knownMaterialCodes?: Set<string>;
  knownServiceCodes?: Set<string>;
  onAddLine: (type?: PurchasePlanLineType) => void;
  onUpdateLine: (key: string, patch: Partial<DraftLine>) => void;
  onRemoveLine: (key: string) => void;
  onToggleExpand: (key: string) => void;
}

const LINE_TYPE_BADGE: Record<PurchasePlanLineType, { cls: string; label: string }> = {
  material: { cls: 'pur-item-badge pur-item-badge--material', label: 'Vật tư kho' },
  service: { cls: 'pur-item-badge pur-item-badge--service', label: 'Dịch vụ' },
  expense: { cls: 'pur-item-badge pur-item-badge--expense', label: 'Chi phí ngoài' },
};

export default function PurchasePlanCreateLinesTable({
  lines,
  expanded,
  materials,
  serviceItems = [],
  suppliers,
  linesLocked,
  totals,
  risksByLineKey,
  knownMaterialCodes,
  knownServiceCodes,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onToggleExpand,
}: PurchasePlanCreateLinesTableProps) {
  return (
    <section className="pur-create-plan__section" aria-label="Dòng hàng nhập tay">
      <div className="pur-create-plan__section-head">
        <div>
          <h3 className="pur-create-plan__section-title">Dòng hàng & Dự toán</h3>
          <p className="pur-create-plan__section-hint">
            Tìm kiếm theo mã hoặc tên để chọn Vật tư kho, Dịch vụ hoặc Chi phí ngoài từ danh mục chuẩn.
          </p>
        </div>
        <Button type="button" variant="tonal" size="sm" leftIcon={Plus} disabled={linesLocked} onClick={() => onAddLine('material')}>
          Thêm dòng
        </Button>
      </div>

      <div className="pur-create-plan__table-shell my-3">
        <table className="form-table import-items-table pur-create-plan__table">
          <thead>
            <tr>
              <th className="table-header-cell text-center w-12">#</th>
              <th className="table-header-cell text-left">Mặt hàng (Vật tư / Dịch vụ / Chi phí) *</th>
              <th className="table-header-cell text-center w-24">ĐVT *</th>
              <th className="table-header-cell text-center w-28">SL *</th>
              <th className="table-header-cell text-right w-48">Đơn giá dự toán</th>
              <th className="table-header-cell text-right w-44">Thành tiền dự toán</th>
              <th className="table-header-cell text-center w-12" aria-label="Chi tiết" />
              <th className="table-header-cell text-center w-12" aria-label="Xóa" />
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-cell text-center py-8 text-[var(--md-on-surface-variant)]">
                  Chưa có dòng hàng nào. Bấm &ldquo;Thêm dòng&rdquo; để bắt đầu.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => {
                const lineIndex = idx + 1;
                const openDetail = Boolean(expanded[line.key]);
                const resolvedType: PurchasePlanLineType = line.lineType || 'material';
                const isMaterial = resolvedType === 'material';
                const badge = LINE_TYPE_BADGE[resolvedType] ?? LINE_TYPE_BADGE.material;
                const hasUnknownItem = isUnknownPlanItem(line, knownMaterialCodes, knownServiceCodes);
                const amount = lineAmount(line.quantity, line.budgetUnitPrice, isMaterial ? line.kgPerUnit : undefined);
                const unitLocked = Boolean(line.materialCode.trim());

                return (
                  <Fragment key={line.key}>
                    <tr className={`table-row transition-colors${hasUnknownItem ? ' pur-create-plan__row--unknown' : ''}`}>
                      <td className="table-cell text-center tabular-nums text-[var(--md-on-surface-variant)] text-xs">
                        {lineIndex}
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-1.5 py-1">
                          <div className="flex items-center gap-1.5">
                            <span className={badge.cls}>{badge.label}</span>
                            {line.materialCode && (
                              <span className="font-mono text-xs font-semibold text-[var(--md-primary)]">
                                {line.materialCode}
                              </span>
                            )}
                          </div>
                          <PurchaseItemAutocomplete
                            compact
                            value={line.materialCode}
                            fallbackLabel={line.productName}
                            materials={materials}
                            serviceItems={serviceItems}
                            disabled={linesLocked}
                            hasError={hasUnknownItem}
                            errorMessage={
                              hasUnknownItem
                                ? `Mã '${line.materialCode}' chưa có trong danh mục. Vui lòng chọn từ danh mục chuẩn.`
                                : undefined
                            }
                            placeholder="Gõ mã hoặc tên mặt hàng, dịch vụ, chi phí…"
                            onSelect={item => onUpdateLine(line.key, {
                              materialCode: item.code,
                              productName: item.name,
                              unit: item.unit || line.unit,
                              lineType: item.lineType,
                              budgetUnitPrice: line.budgetUnitPrice || (item.referencePrice ? String(item.referencePrice) : ''),
                            })}
                            onClear={() => onUpdateLine(line.key, {
                              materialCode: '',
                              productName: '',
                              unit: '',
                              lineType: 'material',
                            })}
                          />
                        </div>
                      </td>
                      <td className="table-cell text-center"><input className="form-input form-input-sm text-center" value={line.unit} disabled={linesLocked || unitLocked} readOnly={unitLocked} onChange={e => onUpdateLine(line.key, { unit: e.target.value })} placeholder={isMaterial ? 'Kg' : 'Gói'} aria-label={`ĐVT dòng ${lineIndex}`} /></td>
                      <td className="table-cell text-center"><QtyStepper value={line.quantity} min={0} className={linesLocked ? 'opacity-60 pointer-events-none' : ''} onChange={qty => onUpdateLine(line.key, { quantity: qty })} ariaLabel={`Số lượng dòng ${lineIndex}`} /></td>
                      <td className="table-cell text-right"><CurrencyInput compact value={line.budgetUnitPrice} min={0} max={MAX_BUDGET_UNIT_PRICE} onChange={(_raw, numeric) => { if (!linesLocked) onUpdateLine(line.key, { budgetUnitPrice: numeric > 0 ? String(numeric) : '' }); }} placeholder="0" /></td>
                      <td className="table-cell text-right tabular-nums font-semibold"><div className="import-cell-placeholder import-cell-placeholder--end pr-2">{amount > 0 ? formatCurrencyFull(amount) : '—'}</div></td>
                      <td className="table-cell text-center"><button type="button" className={`pur-create-plan__expand${openDetail ? ' is-open' : ''}`} disabled={linesLocked} aria-expanded={openDetail} aria-label={openDetail ? 'Thu gọn chi tiết' : 'Mở chi tiết'} onClick={() => onToggleExpand(line.key)}><ChevronDown size={16} /></button></td>
                      <td className="table-cell text-center"><button type="button" className="icon-btn icon-btn--danger" disabled={linesLocked} aria-label={`Xóa dòng ${lineIndex}`} title="Xóa dòng" onClick={() => onRemoveLine(line.key)}><Trash2 size={15} /></button></td>
                    </tr>
                    {openDetail ? (
                      <PurchasePlanLineDetailRow
                        line={line}
                        suppliers={suppliers}
                        linesLocked={linesLocked}
                        risks={risksByLineKey.get(line.key) ?? []}
                        onUpdateLine={onUpdateLine}
                      />
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="table-cell text-right font-semibold text-[var(--md-on-surface-variant)]">
                {totals.filled} dòng · Tổng dự toán
              </td>
              <td className="table-cell text-right font-bold tabular-nums text-[var(--md-primary)] pr-2">
                {totals.budget > 0 ? formatCurrencyFull(totals.budget) : '—'}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
        <Button type="button" variant="outlined" size="sm" leftIcon={Plus} disabled={linesLocked} onClick={() => onAddLine('material')}>
          Thêm dòng mới
        </Button>

        {(totals.proposal > 0 || totals.purchase > 0) && (
          <div className="pur-create-plan__subtotals">
            {totals.proposal > 0 ? <span>Đề xuất: <strong>{formatCurrencyFull(totals.proposal)}</strong></span> : null}
            {totals.purchase > 0 ? <span>Mua hàng: <strong>{formatCurrencyFull(totals.purchase)}</strong></span> : null}
          </div>
        )}
      </div>
    </section>
  );
}
