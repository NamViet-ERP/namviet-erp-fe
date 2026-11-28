import { AlertTriangle, Briefcase, Coins, Package } from 'lucide-react';
import HrmDatePicker from '../hr/HrmDatePicker';
import CurrencyInput from '../ui/CurrencyInput';
import FormField from '../ui/FormField';
import SupplierAutocomplete from '../ui/SupplierAutocomplete';
import type { SupplierApiDto } from '../../services/suppliersService';
import type { SupplierMaterialRiskApiDto } from '../../types/api/purchasingApi';
import { parseCurrencyInput } from '../../utils/currencyInput';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { DraftLine } from './createPurchasePlanDraft';

interface PurchasePlanLineDetailRowProps {
  line: DraftLine;
  suppliers: SupplierApiDto[];
  linesLocked: boolean;
  risks: SupplierMaterialRiskApiDto[];
  onUpdateLine: (key: string, patch: Partial<DraftLine>) => void;
}

const PRICE_STAGES: ReadonlyArray<{
  step: number;
  mod: string;
  title: string;
  hint: string;
  kgLabel?: string;
  kgKey?: 'proposalKgPerUnit' | 'purchaseKgPerUnit';
  priceLabel: string;
  priceKey: 'proposalUnitPrice' | 'purchaseUnitPrice' | 'selectedUnitPrice';
  supplierLabel: string;
  supplierKey: 'proposalSupplierName' | 'purchaseSupplierName' | 'selectedSupplierName';
  withReason?: boolean;
}> = [
  {
    step: 1,
    mod: 'proposal',
    title: 'Đề xuất mua',
    hint: 'Giá / NCC đề xuất từ Excel',
    kgLabel: 'KG/ĐVT đề xuất',
    kgKey: 'proposalKgPerUnit',
    priceLabel: 'Đơn giá đề xuất',
    priceKey: 'proposalUnitPrice',
    supplierLabel: 'NCC đề xuất',
    supplierKey: 'proposalSupplierName',
  },
  {
    step: 2,
    mod: 'purchase',
    title: 'Giá mua thực tế',
    hint: 'Sau khi đặt / nhận báo giá',
    kgLabel: 'KG/ĐVT mua hàng',
    kgKey: 'purchaseKgPerUnit',
    priceLabel: 'Đơn giá mua',
    priceKey: 'purchaseUnitPrice',
    supplierLabel: 'NCC mua hàng',
    supplierKey: 'purchaseSupplierName',
  },
  {
    step: 3,
    mod: 'select',
    title: 'NCC được chọn',
    hint: 'Kết quả chốt cho dòng này',
    priceLabel: 'Giá chọn',
    priceKey: 'selectedUnitPrice',
    supplierLabel: 'NCC chọn',
    supplierKey: 'selectedSupplierName',
    withReason: true,
  },
];

export default function PurchasePlanLineDetailRow({
  line,
  suppliers,
  linesLocked,
  risks,
  onUpdateLine,
}: PurchasePlanLineDetailRowProps) {
  const isMaterial = (line.lineType || 'material') === 'material';
  const LineTypeIcon =
    line.lineType === 'service' ? Briefcase : line.lineType === 'expense' ? Coins : Package;
  const lineTypeLabel =
    line.lineType === 'service'
      ? 'Dịch vụ thi công / Thầu phụ'
      : line.lineType === 'expense'
        ? 'Chi phí ngoài / Quản lý dự án'
        : 'Vật tư kho';

  return (
    <tr className="pur-create-plan__detail-row">
      <td colSpan={8} className="table-cell">
        <div className="pur-create-plan__detail">
          <div className="pur-create-plan__detail-grid">
            <FormField label="Phân loại dòng" className="pur-create-plan__ff">
              <div className="pur-create-plan__line-type-val">
                <LineTypeIcon size={14} aria-hidden />
                <span>{lineTypeLabel}</span>
              </div>
            </FormField>
            <FormField label="Hệ" className="pur-create-plan__ff">
              <input aria-label="Hệ" className="form-input form-input-sm" value={line.systemName} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { systemName: e.target.value })} />
            </FormField>
            <FormField label="Danh mục / Nhóm" className="pur-create-plan__ff">
              <input aria-label="Danh mục / Nhóm" className="form-input form-input-sm" value={line.category} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { category: e.target.value })} />
            </FormField>
            <FormField label="Quy cách" className="pur-create-plan__ff">
              <input aria-label="Quy cách" className="form-input form-input-sm" value={line.spec} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { spec: e.target.value })} />
            </FormField>
            <FormField label="Diễn giải" className="pur-create-plan__ff">
              <input aria-label="Diễn giải" className="form-input form-input-sm" value={line.description} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { description: e.target.value })} placeholder="Diễn giải mục đích sử dụng..." />
            </FormField>
            <FormField label="KG/ĐVT" className="pur-create-plan__ff">
              <input aria-label="KG/ĐVT" className="form-input form-input-sm pur-create-plan__input--num" inputMode="decimal" value={!isMaterial ? '-' : line.kgPerUnit} disabled={linesLocked || !isMaterial} onChange={e => onUpdateLine(line.key, { kgPerUnit: e.target.value })} placeholder={!isMaterial ? 'Không áp dụng' : ''} />
            </FormField>
            <FormField label="Tình trạng" className="pur-create-plan__ff">
              <input aria-label="Tình trạng" className="form-input form-input-sm" value={line.purchaseStatus} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { purchaseStatus: e.target.value })} placeholder="chưa mua" />
            </FormField>
            <FormField label="Ghi chú dòng" className="pur-create-plan__ff">
              <input aria-label="Ghi chú dòng" className="form-input form-input-sm" value={line.lineNote} disabled={linesLocked} onChange={e => onUpdateLine(line.key, { lineNote: e.target.value })} />
            </FormField>
            <FormField label="Ngày cần hàng" className="pur-create-plan__ff">
              <HrmDatePicker value={line.requiredDate} disabled={linesLocked} onChange={requiredDate => onUpdateLine(line.key, { requiredDate })} />
            </FormField>
            <FormField label="Ngày giao dự kiến" className="pur-create-plan__ff">
              <HrmDatePicker value={line.expectedDeliveryDate} disabled={linesLocked} onChange={expectedDeliveryDate => onUpdateLine(line.key, { expectedDeliveryDate })} />
            </FormField>
            <FormField label="Ngày nhận thực tế" className="pur-create-plan__ff">
              <HrmDatePicker value={line.actualReceiptDate} disabled={linesLocked} onChange={actualReceiptDate => onUpdateLine(line.key, { actualReceiptDate })} />
            </FormField>
          </div>

          <div className="pur-create-plan__price-row pur-create-plan__price-row--3" role="group" aria-label="So sánh giá và chọn nhà cung cấp">
            {PRICE_STAGES.map(stage => (
              <div key={stage.mod} className={`pur-create-plan__price-box pur-create-plan__price-box--${stage.mod}`}>
                <header className="pur-create-plan__price-head">
                  <span className="pur-create-plan__price-step" aria-hidden>{stage.step}</span>
                  <div className="pur-create-plan__price-head-text">
                    <p className="pur-create-plan__price-title">{stage.title}</p>
                    <p className="pur-create-plan__price-hint">{stage.hint}</p>
                  </div>
                </header>
                <div className="pur-create-plan__price-fields">
                  <FormField label={stage.priceLabel} className="pur-create-plan__ff">
                    <CurrencyInput
                      compact
                      ariaLabel={stage.priceLabel}
                      value={line[stage.priceKey]}
                      onChange={(_raw, numeric) => {
                        if (!linesLocked) {
                          onUpdateLine(line.key, { [stage.priceKey]: numeric > 0 ? String(numeric) : '' });
                        }
                      }}
                    />
                  </FormField>
                  <FormField label={stage.supplierLabel} className="pur-create-plan__ff">
                    <SupplierAutocomplete
                      compact
                      disabled={linesLocked}
                      value={line[stage.supplierKey]}
                      suppliers={suppliers}
                      onChange={v => onUpdateLine(line.key, { [stage.supplierKey]: v })}
                      placeholder="Chọn NCC…"
                      ariaLabel={stage.supplierLabel}
                    />
                  </FormField>
                  {stage.kgKey && stage.kgLabel ? (
                    <FormField label={stage.kgLabel} className="pur-create-plan__ff pur-create-plan__ff--span">
                      <input
                        aria-label={stage.kgLabel}
                        className="form-input form-input-sm pur-create-plan__input--num"
                        inputMode="decimal"
                        value={!isMaterial ? '-' : line[stage.kgKey]}
                        disabled={linesLocked || !isMaterial}
                        onChange={e => onUpdateLine(line.key, { [stage.kgKey!]: e.target.value })}
                        placeholder={!isMaterial ? 'Không áp dụng' : 'Trống → SL × ĐG'}
                      />
                    </FormField>
                  ) : null}
                  {stage.withReason ? (
                    <FormField label="Lý do chọn" className="pur-create-plan__ff pur-create-plan__ff--span">
                      <input
                        aria-label="Lý do chọn"
                        className="form-input form-input-sm"
                        value={line.selectionReason}
                        disabled={linesLocked}
                        onChange={e => onUpdateLine(line.key, { selectionReason: e.target.value })}
                        placeholder="Ví dụ: giá thấp nhất, tồn kho…"
                      />
                    </FormField>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {line.quotes.length > 0 ? (
            <div className="pur-create-plan__quotes">
              <p className="pur-create-plan__price-title">Báo giá ({line.quotes.length})</p>
              <div className="pur-create-plan__quotes-grid">
                {line.quotes.map(q => (
                  <div key={q.key} className="pur-create-plan__quote-card">
                    <span>#{q.sortOrder}</span>
                    <strong>{q.supplierName || '—'}</strong>
                    <span className="tabular-nums">{q.unitPrice ? formatCurrencyFull(parseCurrencyInput(q.unitPrice)) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {risks.length > 0 ? (
            <div className="pur-create-plan__risk-list" role="status">
              {risks.map(risk => (
                <div key={`${risk.materialCode}|${risk.supplierId ?? ''}|${risk.supplierName ?? ''}`} className="pur-create-plan__risk-banner">
                  <AlertTriangle size={16} aria-hidden />
                  <div>
                    <strong>Cảnh báo NCC {risk.supplierName || '—'} / {risk.materialCode}</strong>
                    {risk.reasons.map(reason => <p key={reason}>{reason}</p>)}
                    <p>Chỉ cảnh báo mềm - vẫn lưu / duyệt bình thường.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
