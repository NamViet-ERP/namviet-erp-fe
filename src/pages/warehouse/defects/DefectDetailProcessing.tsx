import FormField from '../../../components/ui/FormField';
import type { PurchaseDefectApiDto } from '../../../types/api/poDefectApi';
import { causeSourceLabel, handlingMethodLabel } from './defectUtils';

interface DefectDetailProcessingProps {
  selected: PurchaseDefectApiDto;
  canEditProcessing: boolean;
  causeSource: string;
  supplierFeedback: string;
  handlingMethod: string;
  onCauseSourceChange: (value: string) => void;
  onSupplierFeedbackChange: (value: string) => void;
  onHandlingMethodChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}

export default function DefectDetailProcessing({
  selected,
  canEditProcessing,
  causeSource,
  supplierFeedback,
  handlingMethod,
  onCauseSourceChange,
  onSupplierFeedbackChange,
  onHandlingMethodChange,
  onSave,
  saving,
}: DefectDetailProcessingProps) {
  if (canEditProcessing) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--md-outline)] bg-[var(--md-surface-container-low)] p-3 space-y-3">
        <p className="wms-voucher-detail__section-label">Xử lý bảo hành</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Nguyên nhân">
            <select
              className="form-input"
              value={causeSource}
              onChange={e => onCauseSourceChange(e.target.value)}
            >
              <option value="">- Chọn nguyên nhân -</option>
              <option value="supplier">NCC</option>
              <option value="customer">Khách hàng</option>
            </select>
          </FormField>
          <FormField label="Hướng xử lý">
            <select
              className="form-input"
              value={handlingMethod}
              onChange={e => onHandlingMethodChange(e.target.value)}
            >
              <option value="">- Chọn hướng xử lý -</option>
              <option value="warranty_repair">Bảo hành sửa chữa</option>
              <option value="replace">Đổi mới</option>
            </select>
          </FormField>
        </div>
        <FormField label="Phản hồi của NCC">
          <textarea
            className="form-input min-h-[4.5rem]"
            rows={3}
            value={supplierFeedback}
            onChange={e => onSupplierFeedbackChange(e.target.value)}
            placeholder="Ghi nhận phản hồi từ nhà cung cấp..."
          />
        </FormField>
        <div className="flex justify-end">
          <button type="button" className="btn btn-filled" disabled={saving} onClick={onSave}>
            Lưu xử lý
          </button>
        </div>
      </div>
    );
  }

  if (selected.status === 'approved' && selected.processingPhase !== 'approved') {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--md-outline)] bg-[var(--md-surface-container-low)] p-3 space-y-2">
        <p className="wms-voucher-detail__section-label">Xử lý bảo hành</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[length:var(--fs-sm)]">
          <div>
            <span className="text-[var(--md-on-surface-variant)]">Nguyên nhân: </span>
            <strong className="text-[var(--md-on-surface)]">{causeSourceLabel(selected.causeSource)}</strong>
          </div>
          <div>
            <span className="text-[var(--md-on-surface-variant)]">Hướng xử lý: </span>
            <strong className="text-[var(--md-on-surface)]">{handlingMethodLabel(selected.handlingMethod)}</strong>
          </div>
          <div className="md:col-span-2">
            <span className="text-[var(--md-on-surface-variant)]">Phản hồi NCC: </span>
            <strong className="whitespace-pre-wrap text-[var(--md-on-surface)]">
              {selected.supplierFeedback?.trim() || '-'}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
