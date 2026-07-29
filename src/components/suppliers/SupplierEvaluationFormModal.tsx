import { useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import HrmDatePicker from '../hr/HrmDatePicker';
import { useSuppliers } from '../../hooks/useSuppliers';
import type {
  SupplierEvaluationApiDto,
  SupplierModuleSettingsApiDto,
  UpsertSupplierEvaluationRequest,
} from '../../types/api/supplierDirectoryApi';

interface SupplierEvaluationFormModalProps {
  isOpen: boolean;
  editing: SupplierEvaluationApiDto | null;
  settings?: SupplierModuleSettingsApiDto;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (body: UpsertSupplierEvaluationRequest) => void;
}

const FORM_ID = 'supplier-evaluation-form';

/** Xếp hạng do BE suy ra từ ngưỡng — hiển thị trước để người đánh giá biết kết quả. */
function previewGrade(score: number, settings?: SupplierModuleSettingsApiDto) {
  if (!settings || Number.isNaN(score)) return null;
  const ladder: Array<[number, string]> = [
    [settings.gradeAMinScore, 'A'],
    [settings.gradeBMinScore, 'B'],
    [settings.gradeCMinScore, 'C'],
    [settings.gradeDMinScore, 'D'],
    [settings.gradeEMinScore, 'E'],
    [settings.gradeFMinScore, 'F'],
    [settings.gradeGMinScore, 'G'],
    [settings.gradeHMinScore, 'H'],
  ];
  for (const [min, grade] of ladder) {
    if (score >= min) return grade;
  }
  return 'H';
}

function rateError(raw: string, emptyMsg: string): string | undefined {
  if (raw.trim() === '') return emptyMsg;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0 || n > 100) return 'Giá trị phải từ 0 đến 100.';
  return undefined;
}

export default function SupplierEvaluationFormModal({
  isOpen,
  editing,
  settings,
  isSaving,
  onClose,
  onSubmit,
}: SupplierEvaluationFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Sửa đánh giá nhà cung cấp' : 'Thêm đánh giá nhà cung cấp'}
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <button type="submit" form={FORM_ID} className="btn btn-filled" disabled={isSaving}>
            Lưu
          </button>
        </>
      }
    >
      <EvaluationForm editing={editing} settings={settings} onSubmit={onSubmit} />
    </Modal>
  );
}

/** Modal chỉ render khi mở nên state khởi tạo lại mỗi lần mở — không cần đồng bộ qua effect. */
function EvaluationForm({
  editing,
  settings,
  onSubmit,
}: Pick<SupplierEvaluationFormModalProps, 'editing' | 'settings' | 'onSubmit'>) {
  const [form, setForm] = useState({
    supplierId: editing ? String(editing.supplierId) : '',
    period: editing?.period ?? '',
    score: editing ? String(editing.score) : '',
    onTimeDeliveryRate: editing ? String(editing.onTimeDeliveryRate) : '',
    defectRate: editing ? String(editing.defectRate) : '',
    warrantyCompletionRate: editing ? String(editing.warrantyCompletionRate) : '',
    evaluatedAt: editing?.evaluatedAt?.slice(0, 10) ?? '',
    note: editing?.note ?? '',
  });
  const [errors, setErrors] = useState<{
    supplierId?: string;
    period?: string;
    score?: string;
    onTimeDeliveryRate?: string;
    defectRate?: string;
    warrantyCompletionRate?: string;
  }>({});
  const { data: suppliers } = useSuppliers({ all: true });

  const grade = previewGrade(Number(form.score), settings);

  const clearError = (key: keyof typeof errors) => {
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const supplierId = Number(form.supplierId);
    const period = form.period.trim();
    const score = Number(form.score);
    const onTimeDeliveryRate = Number(form.onTimeDeliveryRate);
    const defectRate = Number(form.defectRate);
    const warrantyCompletionRate = Number(form.warrantyCompletionRate);

    if (!supplierId) next.supplierId = 'Vui lòng chọn nhà cung cấp.';
    if (!period) next.period = 'Vui lòng nhập kỳ đánh giá.';
    if (form.score.trim() === '') next.score = 'Vui lòng nhập điểm.';
    else if (Number.isNaN(score) || score < 0 || score > 100) next.score = 'Điểm phải từ 0 đến 100.';

    const onTimeErr = rateError(form.onTimeDeliveryRate, 'Vui lòng nhập tỷ lệ giao đúng hạn.');
    if (onTimeErr) next.onTimeDeliveryRate = onTimeErr;
    const defectErr = rateError(form.defectRate, 'Vui lòng nhập tỷ lệ hàng lỗi.');
    if (defectErr) next.defectRate = defectErr;
    const warrantyErr = rateError(form.warrantyCompletionRate, 'Vui lòng nhập tỷ lệ hoàn thành bảo hành.');
    if (warrantyErr) next.warrantyCompletionRate = warrantyErr;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      supplierId,
      period,
      score,
      onTimeDeliveryRate,
      defectRate,
      warrantyCompletionRate,
      evaluatedAt: form.evaluatedAt || null,
      note: form.note.trim() || null,
    });
  };

  return (
    <form id={FORM_ID} className="space-y-3 modal-form-bordered" noValidate onSubmit={handleSubmit}>
      <FormField label="Nhà cung cấp" required error={errors.supplierId}>
        <select
          className="form-select"
          value={form.supplierId}
          disabled={Boolean(editing)}
          onChange={e => {
            setForm(f => ({ ...f, supplierId: e.target.value }));
            clearError('supplierId');
          }}
        >
          <option value="">— Chọn nhà cung cấp —</option>
          {(suppliers?.items ?? []).map(s => (
            <option key={s.id} value={s.id}>
              {s.supplierCode} — {s.supplierName}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Kỳ đánh giá" required error={errors.period}>
          <input
            className="form-input"
            value={form.period}
            disabled={Boolean(editing)}
            onChange={e => {
              setForm(f => ({ ...f, period: e.target.value }));
              clearError('period');
            }}
            placeholder="VD: Q2/2026"
          />
        </FormField>
        <FormField label="Điểm (0–100)" required error={errors.score}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className="form-input tabular-nums"
            value={form.score}
            onChange={e => {
              setForm(f => ({ ...f, score: e.target.value }));
              clearError('score');
            }}
          />
        </FormField>
        <FormField label="Ngày đánh giá">
          <HrmDatePicker
            value={form.evaluatedAt}
            onChange={v => setForm(f => ({ ...f, evaluatedAt: v }))}
            placeholder="Chọn ngày"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Tỷ lệ giao đúng hạn (%)" required error={errors.onTimeDeliveryRate}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className="form-input tabular-nums"
            value={form.onTimeDeliveryRate}
            onChange={e => {
              setForm(f => ({ ...f, onTimeDeliveryRate: e.target.value }));
              clearError('onTimeDeliveryRate');
            }}
          />
        </FormField>
        <FormField label="Tỷ lệ hàng lỗi (%)" required error={errors.defectRate}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className="form-input tabular-nums"
            value={form.defectRate}
            onChange={e => {
              setForm(f => ({ ...f, defectRate: e.target.value }));
              clearError('defectRate');
            }}
          />
        </FormField>
        <FormField label="Tỷ lệ hoàn thành bảo hành (%)" required error={errors.warrantyCompletionRate}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className="form-input tabular-nums"
            value={form.warrantyCompletionRate}
            onChange={e => {
              setForm(f => ({ ...f, warrantyCompletionRate: e.target.value }));
              clearError('warrantyCompletionRate');
            }}
          />
        </FormField>
      </div>

      {grade && (
        <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty">
          Xếp hạng dự kiến: <strong className="text-[var(--md-on-surface)]">{grade}</strong>
          {settings
            ? ` (A≥${settings.gradeAMinScore}, B≥${settings.gradeBMinScore}, C≥${settings.gradeCMinScore}, … H≥${settings.gradeHMinScore})`
            : ''}
        </p>
      )}

      <FormField label="Ghi chú">
        <textarea
          className="form-input"
          rows={3}
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
          placeholder="Nhận xét về chất lượng, tiến độ, thái độ phối hợp"
        />
      </FormField>
    </form>
  );
}
