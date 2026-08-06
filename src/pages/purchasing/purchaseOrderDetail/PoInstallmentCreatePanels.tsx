import { Plus, Trash2 } from 'lucide-react';
import FormField from '../../../components/ui/FormField';

export type PoInstallmentDraft = {
  percent: string;
  requiredDocTypes: string[];
};

const DOCUMENT_TYPES = [
  { value: 'CO', label: 'C/O' },
  { value: 'CQ', label: 'C/Q' },
  { value: 'DNTT', label: 'Đề nghị thanh toán' },
  { value: 'CONTRACT', label: 'Hợp đồng' },
  { value: 'INVOICE', label: 'Hóa đơn' },
  { value: 'BBNT', label: 'Biên bản nghiệm thu' },
  { value: 'BBGH', label: 'Biên bản giao hàng' },
  { value: 'OTHER', label: 'Khác' },
] as const;

type Props = {
  installmentCount: number;
  installments: PoInstallmentDraft[];
  onCountChange: (count: number) => void;
  onPercentChange: (index: number, value: string) => void;
  onAddDocType: (index: number) => void;
  onDocTypeChange: (installmentIndex: number, docIndex: number, value: string) => void;
  onRemoveDocType: (installmentIndex: number, docIndex: number) => void;
};

export function PoInstallmentCreatePanels({
  installmentCount,
  installments,
  onCountChange,
  onPercentChange,
  onAddDocType,
  onDocTypeChange,
  onRemoveDocType,
}: Props) {
  const totalPercent = installments.reduce(
    (sum, item) => sum + (Number(item.percent) || 0),
    0,
  );
  const totalValid = Math.abs(totalPercent - 100) < 0.001;

  return (
    <section className="pur-detail__card po-installment-create" aria-label="Tiến độ thanh toán">
      <div className="po-installment-section__head">
        <div>
          <h2 className="purchasing-section-title mb-0">Tiến độ thanh toán</h2>
          <p className="pur-detail__muted mt-1">
            Khai báo tỷ lệ và chứng từ bắt buộc cho từng đợt.
          </p>
        </div>
        <FormField label="Số đợt">
          <select
            className="form-input form-input-md po-installment-create__count"
            value={installmentCount}
            onChange={event => onCountChange(Number(event.target.value))}
            aria-label="Số đợt thanh toán"
          >
            {[1, 2, 3, 4].map(count => (
              <option key={count} value={count}>{count} đợt</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="po-installment-create__grid">
        {installments.map((installment, installmentIndex) => (
          <article key={installmentIndex} className="po-installment-create__panel">
            <header className="po-installment-create__panel-head">
              <strong>Đợt {installmentIndex + 1}</strong>
              <label className="po-installment-create__percent">
                <span>Tỷ lệ</span>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  className="form-input form-input-md"
                  value={installment.percent}
                  onChange={event => onPercentChange(installmentIndex, event.target.value)}
                  aria-label={`Tỷ lệ đợt ${installmentIndex + 1}`}
                />
                <span>%</span>
              </label>
            </header>

            <div className="po-installment-create__docs">
              <span className="po-installment-create__docs-label">Chứng từ bắt buộc</span>
              {installment.requiredDocTypes.length === 0 ? (
                <p className="pur-detail__muted">Chưa yêu cầu chứng từ.</p>
              ) : (
                installment.requiredDocTypes.map((docType, docIndex) => (
                  <div key={docIndex} className="po-installment-create__doc-row">
                    <select
                      className="form-input form-input-md"
                      value={docType}
                      onChange={event => onDocTypeChange(
                        installmentIndex,
                        docIndex,
                        event.target.value,
                      )}
                      aria-label={`Loại chứng từ đợt ${installmentIndex + 1}, dòng ${docIndex + 1}`}
                    >
                      {DOCUMENT_TYPES.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      title="Xóa dòng chứng từ"
                      aria-label={`Xóa dòng chứng từ ${docIndex + 1} của đợt ${installmentIndex + 1}`}
                      onClick={() => onRemoveDocType(installmentIndex, docIndex)}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                ))
              )}
              <button
                type="button"
                className="btn btn-outline btn-sm po-installment-create__add"
                onClick={() => onAddDocType(installmentIndex)}
              >
                <Plus size={14} aria-hidden />
                Thêm dòng
              </button>
            </div>
          </article>
        ))}
      </div>

      <p
        className={`po-installment-create__total${totalValid ? ' is-valid' : ' is-invalid'}`}
        role={totalValid ? undefined : 'alert'}
      >
        Tổng tỷ lệ: <strong>{totalPercent.toLocaleString('vi-VN')}%</strong>
        {!totalValid ? ' (phải bằng 100%)' : ''}
      </p>
    </section>
  );
}
