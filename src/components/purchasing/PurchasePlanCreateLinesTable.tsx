import { Fragment, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Plus, Trash2 } from 'lucide-react';
import FormField from '../ui/FormField';
import CurrencyInput from '../ui/CurrencyInput';
import QtyStepper from '../ui/QtyStepper';
import SupplierAutocomplete from '../ui/SupplierAutocomplete';
import MaterialAutocomplete from '../ui/MaterialAutocomplete';
import type { MaterialApiDto } from '../../services/materialsService';
import type { SupplierApiDto } from '../../services/suppliersService';
import type { SupplierMaterialRiskApiDto } from '../../types/api/purchasingApi';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  MAX_BUDGET_UNIT_PRICE,
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
  suppliers: SupplierApiDto[];
  linesLocked: boolean;
  totals: Totals;
  risksByLineKey: Map<string, SupplierMaterialRiskApiDto[]>;
  onAddLine: (type?: PurchasePlanLineType) => void;
  onUpdateLine: (key: string, patch: Partial<DraftLine>) => void;
  onRemoveLine: (key: string) => void;
  onToggleExpand: (key: string) => void;
}

export default function PurchasePlanCreateLinesTable({
  lines,
  expanded,
  materials,
  suppliers,
  linesLocked,
  totals,
  risksByLineKey,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onToggleExpand,
}: PurchasePlanCreateLinesTableProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'material' | 'service_expense'>('all');

  const totalCount = lines.length;
  const materialCount = lines.filter(l => (l.lineType || 'material') === 'material').length;
  const serviceExpenseCount = lines.filter(l => l.lineType === 'service' || l.lineType === 'expense').length;

  const visibleLines = useMemo(() => {
    if (activeTab === 'material') {
      return lines.filter(l => (l.lineType || 'material') === 'material');
    }
    if (activeTab === 'service_expense') {
      return lines.filter(l => l.lineType === 'service' || l.lineType === 'expense');
    }
    return lines;
  }, [lines, activeTab]);

  return (
    <section className="pur-create-plan__section" aria-label="Dòng hàng nhập tay">
      <div className="pur-create-plan__section-head">
        <div>
          <h3 className="pur-create-plan__section-title">Dòng hàng & Dự toán</h3>
          <p className="pur-create-plan__section-hint">
            Vật tư kho cần mã danh mục; Dịch vụ ngoài & Chi phí dự án cho phép nhập tự do.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={linesLocked}
          onClick={() => onAddLine(activeTab === 'service_expense' ? 'service' : 'material')}
        >
          <Plus size={14} aria-hidden />
          {activeTab === 'service_expense' ? 'Thêm dịch vụ / chi phí' : 'Thêm dòng'}
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap my-3">
        <div
          className="inline-flex items-center gap-1 p-1 bg-[var(--md-surface-variant)]/30 rounded-lg border border-[var(--md-outline-variant02)] text-xs"
          role="tablist"
          aria-label="Bộ lọc loại dòng hàng"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`px-3 py-1.5 rounded-md font-medium transition-all inline-flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[var(--md-surface)] text-[var(--md-primary)] shadow-sm font-semibold border border-[var(--md-outline-variant02)]'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface)]/50'
            }`}
            onClick={() => setActiveTab('all')}
          >
            <span>Tất cả</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--md-surface-variant)] text-[var(--md-on-surface-variant)] font-semibold">
              {totalCount}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'material'}
            className={`px-3 py-1.5 rounded-md font-medium transition-all inline-flex items-center gap-1.5 ${
              activeTab === 'material'
                ? 'bg-[var(--md-surface)] text-blue-700 dark:text-blue-400 shadow-sm font-semibold border border-blue-200 dark:border-blue-800'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface)]/50'
            }`}
            onClick={() => setActiveTab('material')}
          >
            <span>📦 Vật tư kho</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
              {materialCount}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'service_expense'}
            className={`px-3 py-1.5 rounded-md font-medium transition-all inline-flex items-center gap-1.5 ${
              activeTab === 'service_expense'
                ? 'bg-[var(--md-surface)] text-amber-700 dark:text-amber-400 shadow-sm font-semibold border border-amber-200 dark:border-amber-800'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface)]/50'
            }`}
            onClick={() => setActiveTab('service_expense')}
          >
            <span>💼 Dịch vụ & Chi phí</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
              {serviceExpenseCount}
            </span>
          </button>
        </div>
      </div>

      <div className="pur-create-plan__table-shell">
        <table className="form-table import-items-table pur-create-plan__table">
          <thead>
            <tr>
              <th className="table-header-cell text-center">#</th>
              <th className="table-header-cell text-left">Tên vật tư / Dịch vụ *</th>
              <th className="table-header-cell text-center">ĐVT *</th>
              <th className="table-header-cell text-center">SL *</th>
              <th className="table-header-cell text-right">Đơn giá dự toán</th>
              <th className="table-header-cell text-right">Thành tiền dự toán</th>
              <th className="table-header-cell text-center" aria-label="Chi tiết" />
              <th className="table-header-cell text-center" aria-label="Xóa" />
            </tr>
          </thead>
          <tbody>
            {visibleLines.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-cell text-center py-8 text-[var(--md-on-surface-variant)]">
                  {activeTab === 'service_expense'
                    ? 'Chưa có dòng dịch vụ hoặc chi phí ngoài nào trong KHMH.'
                    : activeTab === 'material'
                      ? 'Chưa có dòng vật tư kho nào trong KHMH.'
                      : 'Chưa có dòng hàng nào.'}
                </td>
              </tr>
            ) : (
              visibleLines.map((line) => {
                const lineIndex = lines.findIndex(l => l.key === line.key) + 1;
                const openDetail = Boolean(expanded[line.key]);
                const isMaterial = (line.lineType || 'material') === 'material';
                const amount = lineAmount(line.quantity, line.budgetUnitPrice, isMaterial ? line.kgPerUnit : undefined);
                const unitLocked = isMaterial && Boolean(line.materialCode.trim());
                return (
                  <Fragment key={line.key}>
                    <tr className="table-row">
                      <td className="table-cell text-center tabular-nums text-[var(--md-on-surface-variant)]">
                        {lineIndex}
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-1.5 py-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${
                                line.lineType === 'service'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                  : line.lineType === 'expense'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                              }`}
                            >
                              {line.lineType === 'service' ? 'Dịch vụ' : line.lineType === 'expense' ? 'Chi phí ngoài' : 'Vật tư'}
                            </span>
                            <select
                              className="text-[11px] bg-transparent text-[var(--md-on-surface-variant)] border-0 underline hover:text-[var(--md-on-surface)] cursor-pointer pr-1"
                              value={line.lineType || 'material'}
                              disabled={linesLocked}
                              title="Đổi phân loại dòng"
                              onChange={e => {
                                const nextType = e.target.value as PurchasePlanLineType;
                                onUpdateLine(line.key, {
                                  lineType: nextType,
                                  ...(nextType !== 'material' ? { kgPerUnit: '', materialCode: '' } : {}),
                                });
                              }}
                            >
                              <option value="material">Đổi → Vật tư</option>
                              <option value="service">Đổi → Dịch vụ</option>
                              <option value="expense">Đổi → Chi phí ngoài</option>
                            </select>
                          </div>

                          {isMaterial ? (
                            <MaterialAutocomplete
                              compact
                              displayLabel="name"
                              value={line.materialCode}
                              fallbackLabel={line.productName}
                              materials={materials}
                              disabled={linesLocked}
                              placeholder="Chọn tên vật tư…"
                              onChange={code => {
                                if (!code.trim()) {
                                  onUpdateLine(line.key, { materialCode: '', productName: '', unit: '' });
                                  return;
                                }
                                const mat = materials.find(m => m.materialCode === code);
                                onUpdateLine(line.key, {
                                  materialCode: code,
                                  productName: mat?.materialName ?? line.productName,
                                  unit: mat?.unit ?? line.unit,
                                });
                              }}
                            />
                          ) : (
                            <input
                              className="form-input form-input-sm w-full"
                              value={line.productName}
                              disabled={linesLocked}
                              placeholder={
                                line.lineType === 'service'
                                  ? 'Nhập tên dịch vụ / thầu phụ…'
                                  : 'Nhập tên chi phí ngoài dự án…'
                              }
                              onChange={e => onUpdateLine(line.key, { productName: e.target.value })}
                            />
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <input
                          className="form-input form-input-sm text-center"
                          value={line.unit}
                          disabled={linesLocked || unitLocked}
                          readOnly={unitLocked}
                          onChange={e => onUpdateLine(line.key, { unit: e.target.value })}
                          placeholder={!isMaterial ? 'Gói' : 'Kg'}
                          aria-label={`ĐVT dòng ${lineIndex}`}
                        />
                      </td>
                      <td className="table-cell text-center">
                        <QtyStepper
                          value={line.quantity}
                          min={0}
                          className={linesLocked ? 'opacity-60 pointer-events-none' : ''}
                          onChange={qty => onUpdateLine(line.key, { quantity: qty })}
                          ariaLabel={`Số lượng dòng ${lineIndex}`}
                        />
                      </td>
                      <td className="table-cell text-right">
                        <CurrencyInput
                          className="form-input form-input-sm text-right input-no-spinner"
                          value={line.budgetUnitPrice}
                          min={0}
                          max={MAX_BUDGET_UNIT_PRICE}
                          onChange={(_raw, numeric) => {
                            if (linesLocked) return;
                            onUpdateLine(line.key, {
                              budgetUnitPrice: numeric > 0 ? String(numeric) : '',
                            });
                          }}
                          placeholder="0"
                        />
                      </td>
                      <td className="table-cell text-right tabular-nums font-semibold">
                        <div className="import-cell-placeholder import-cell-placeholder--end pr-2">
                          {amount > 0 ? formatCurrency(amount) : '—'}
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <button
                          type="button"
                          className={`pur-create-plan__expand${openDetail ? ' is-open' : ''}`}
                          disabled={linesLocked}
                          aria-expanded={openDetail}
                          aria-label={openDetail ? 'Thu gọn chi tiết' : 'Mở chi tiết'}
                          onClick={() => onToggleExpand(line.key)}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </td>
                      <td className="table-cell text-center">
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          disabled={linesLocked}
                          aria-label={`Xóa dòng ${lineIndex}`}
                          title="Xóa dòng"
                          onClick={() => onRemoveLine(line.key)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                    {openDetail ? (
                      <tr className="pur-create-plan__detail-row">
                        <td colSpan={8} className="table-cell">
                          <div className="pur-create-plan__detail">
                            <div className="pur-create-plan__detail-grid">
                              <FormField label="Phân loại dòng" className="pur-create-plan__ff">
                                <select
                                  className="form-input form-input-sm"
                                  value={line.lineType || 'material'}
                                  disabled={linesLocked}
                                  onChange={e => {
                                    const nextType = e.target.value as PurchasePlanLineType;
                                    onUpdateLine(line.key, {
                                      lineType: nextType,
                                      ...(nextType !== 'material' ? { kgPerUnit: '', materialCode: '' } : {}),
                                    });
                                  }}
                                >
                                  <option value="material">📦 Vật tư kho</option>
                                  <option value="service">💼 Dịch vụ ngoài / Thầu phụ</option>
                                  <option value="expense">🏛️ Chi phí ngoài / Quản lý</option>
                                </select>
                              </FormField>
                              <FormField label="Hệ" className="pur-create-plan__ff">
                                <input className="form-input form-input-sm" value={line.systemName} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { systemName: e.target.value })} />
                              </FormField>
                              <FormField label="Danh mục" className="pur-create-plan__ff">
                                <input className="form-input form-input-sm" value={line.category} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { category: e.target.value })} />
                              </FormField>
                              <FormField label="Quy cách" className="pur-create-plan__ff">
                                <input className="form-input form-input-sm" value={line.spec} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { spec: e.target.value })} />
                              </FormField>
                              <FormField label="KG/ĐVT" className="pur-create-plan__ff">
                                <input
                                  className="form-input form-input-sm pur-create-plan__input--num"
                                  inputMode="decimal"
                                  value={!isMaterial ? '-' : line.kgPerUnit}
                                  disabled={linesLocked || !isMaterial}
                                  onChange={e => onUpdateLine(line.key, { kgPerUnit: e.target.value })}
                                  placeholder={!isMaterial ? 'Không áp dụng' : ''}
                                />
                              </FormField>
                              <FormField label="Tình trạng" className="pur-create-plan__ff">
                                <input className="form-input form-input-sm" value={line.purchaseStatus} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { purchaseStatus: e.target.value })} placeholder="chưa mua" />
                              </FormField>
                              <FormField label="Ghi chú dòng" className="pur-create-plan__ff">
                                <input className="form-input form-input-sm" value={line.lineNote} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { lineNote: e.target.value })} />
                              </FormField>
                              <FormField label="Ngày cần hàng" className="pur-create-plan__ff">
                                <input type="date" className="form-input form-input-sm" value={line.requiredDate} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { requiredDate: e.target.value })} />
                              </FormField>
                              <FormField label="Ngày giao dự kiến" className="pur-create-plan__ff">
                                <input type="date" className="form-input form-input-sm" value={line.expectedDeliveryDate} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { expectedDeliveryDate: e.target.value })} />
                              </FormField>
                              <FormField label="Ngày nhận thực tế" className="pur-create-plan__ff">
                                <input type="date" className="form-input form-input-sm" value={line.actualReceiptDate} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { actualReceiptDate: e.target.value })} />
                              </FormField>
                            </div>

                            <div className="pur-create-plan__price-row pur-create-plan__price-row--3" role="group" aria-label="So sánh giá và chọn nhà cung cấp">
                              <div className="pur-create-plan__price-box pur-create-plan__price-box--proposal">
                                <header className="pur-create-plan__price-head">
                                  <span className="pur-create-plan__price-step" aria-hidden>1</span>
                                  <div className="pur-create-plan__price-head-text">
                                    <p className="pur-create-plan__price-title">Đề xuất mua</p>
                                    <p className="pur-create-plan__price-hint">Giá / NCC đề xuất từ Excel</p>
                                  </div>
                                </header>
                                <div className="pur-create-plan__price-fields">
                                  <FormField label="Đơn giá đề xuất" className="pur-create-plan__ff">
                                    <CurrencyInput className="form-input form-input-sm text-right input-no-spinner" value={line.proposalUnitPrice} onChange={(_raw, numeric) => { if (!linesLocked) onUpdateLine(line.key, { proposalUnitPrice: numeric > 0 ? String(numeric) : '' }); }} />
                                  </FormField>
                                  <FormField label="NCC đề xuất" className="pur-create-plan__ff">
                                    <SupplierAutocomplete compact disabled={linesLocked} value={line.proposalSupplierName} suppliers={suppliers} onChange={v => onUpdateLine(line.key, { proposalSupplierName: v })} placeholder="Chọn NCC…" />
                                  </FormField>
                                </div>
                              </div>
                              <div className="pur-create-plan__price-box pur-create-plan__price-box--purchase">
                                <header className="pur-create-plan__price-head">
                                  <span className="pur-create-plan__price-step" aria-hidden>2</span>
                                  <div className="pur-create-plan__price-head-text">
                                    <p className="pur-create-plan__price-title">Giá mua thực tế</p>
                                    <p className="pur-create-plan__price-hint">Sau khi đặt / nhận báo giá</p>
                                  </div>
                                </header>
                                <div className="pur-create-plan__price-fields">
                                  <FormField label="Đơn giá mua" className="pur-create-plan__ff">
                                    <CurrencyInput className="form-input form-input-sm text-right input-no-spinner" value={line.purchaseUnitPrice} onChange={(_raw, numeric) => { if (!linesLocked) onUpdateLine(line.key, { purchaseUnitPrice: numeric > 0 ? String(numeric) : '' }); }} />
                                  </FormField>
                                  <FormField label="NCC mua hàng" className="pur-create-plan__ff">
                                    <SupplierAutocomplete compact disabled={linesLocked} value={line.purchaseSupplierName} suppliers={suppliers} onChange={v => onUpdateLine(line.key, { purchaseSupplierName: v })} placeholder="Chọn NCC…" />
                                  </FormField>
                                </div>
                              </div>
                              <div className="pur-create-plan__price-box pur-create-plan__price-box--select">
                                <header className="pur-create-plan__price-head">
                                  <span className="pur-create-plan__price-step" aria-hidden>3</span>
                                  <div className="pur-create-plan__price-head-text">
                                    <p className="pur-create-plan__price-title">NCC được chọn</p>
                                    <p className="pur-create-plan__price-hint">Kết quả chốt cho dòng này</p>
                                  </div>
                                </header>
                                <div className="pur-create-plan__price-fields">
                                  <FormField label="Giá chọn" className="pur-create-plan__ff">
                                    <CurrencyInput className="form-input form-input-sm text-right input-no-spinner" value={line.selectedUnitPrice} onChange={(_raw, numeric) => { if (!linesLocked) onUpdateLine(line.key, { selectedUnitPrice: numeric > 0 ? String(numeric) : '' }); }} />
                                  </FormField>
                                  <FormField label="NCC chọn" className="pur-create-plan__ff">
                                    <SupplierAutocomplete compact disabled={linesLocked} value={line.selectedSupplierName} suppliers={suppliers} onChange={v => onUpdateLine(line.key, { selectedSupplierName: v })} placeholder="Chọn NCC…" />
                                  </FormField>
                                  <FormField label="Lý do chọn" className="pur-create-plan__ff pur-create-plan__ff--span">
                                    <input className="form-input form-input-sm" value={line.selectionReason} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { selectionReason: e.target.value })} placeholder="Ví dụ: giá thấp nhất, tồn kho…" />
                                  </FormField>
                                </div>
                              </div>
                            </div>

                            {line.quotes.length > 0 ? (
                              <div className="pur-create-plan__quotes">
                                <p className="pur-create-plan__price-title">Báo giá ({line.quotes.length})</p>
                                <div className="pur-create-plan__quotes-grid">
                                  {line.quotes.map(q => (
                                    <div key={q.key} className="pur-create-plan__quote-card">
                                      <span>#{q.sortOrder}</span>
                                      <strong>{q.supplierName || '—'}</strong>
                                      <span className="tabular-nums">{q.unitPrice ? formatCurrency(Number(q.unitPrice)) : '—'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {(risksByLineKey.get(line.key) ?? []).length > 0 ? (
                              <div className="pur-create-plan__risk-list" role="status">
                                {(risksByLineKey.get(line.key) ?? []).map(risk => (
                                  <div
                                    key={`${risk.materialCode}|${risk.supplierId ?? ''}|${risk.supplierName ?? ''}`}
                                    className="pur-create-plan__risk-banner"
                                  >
                                    <AlertTriangle size={16} aria-hidden />
                                    <div>
                                      <strong>
                                        Cảnh báo NCC {risk.supplierName || '—'} / {risk.materialCode}
                                      </strong>
                                      {risk.reasons.map(reason => (
                                        <p key={reason}>{reason}</p>
                                      ))}
                                      <p>Chỉ cảnh báo mềm - vẫn lưu / duyệt bình thường.</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
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
                {totals.budget > 0 ? `${formatCurrency(totals.budget)} đ` : '—'}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {(totals.proposal > 0 || totals.purchase > 0) && (
        <div className="pur-create-plan__subtotals">
          {totals.proposal > 0 ? (
            <span>Đề xuất: <strong>{formatCurrency(totals.proposal)} đ</strong></span>
          ) : null}
          {totals.purchase > 0 ? (
            <span>Mua hàng: <strong>{formatCurrency(totals.purchase)} đ</strong></span>
          ) : null}
        </div>
      )}
    </section>
  );
}
