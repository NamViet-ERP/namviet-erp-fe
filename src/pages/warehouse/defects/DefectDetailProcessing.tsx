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
      <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-3 space-y-3">
        <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Xử lý bảo hành</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Nguyên nhân">
            <select
              className="form-input"
              value={causeSource}
              onChange={e => onCauseSourceChange(e.target.value)}
            >
              <option value="">— Chọn nguyên nhân —</option>
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
              <option value="">— Chọn hướng xử lý —</option>
              <option value="warranty_repair">Bảo hành sửa chữa</option>
              <option value="replace">Đổi mới</option>
            </select>
          </FormField>
        </div>
        <FormField label="Phản hồi của NCC">
          <textarea
            className="form-input"
            rows={3}
            value={supplierFeedback}
            onChange={e => onSupplierFeedbackChange(e.target.value)}
            placeholder="Ghi nhận phản hồi từ nhà cung cấp…"
          />
        </FormField>
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-filled"
            disabled={saving}
            onClick={onSave}
          >
            Lưu xử lý
          </button>
        </div>
      </div>
    );
  }

  if (selected.status === 'approved' && selected.processingPhase !== 'approved') {
    return (
      <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-3 space-y-1 text-xs">
        <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)] mb-1">Xử lý bảo hành</div>
        <div>Nguyên nhân: <strong>{causeSourceLabel(selected.causeSource)}</strong></div>
        <div>Phản hồi của NCC: <strong className="whitespace-pre-wrap">{selected.supplierFeedback || '—'}</strong></div>
        <div>
          Hướng xử lý: <strong>{handlingMethodLabel(selected.handlingMethod)}</strong>
        </div>
      </div>
    );
  }

  return null;
}
