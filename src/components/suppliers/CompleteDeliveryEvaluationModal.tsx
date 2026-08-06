import { useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import HrmDatePicker from '../hr/HrmDatePicker';
import type {
  CompleteSupplierDeliveryEvaluationRequest,
  SupplierDeliveryEvaluationApiDto,
  SupplierModuleSettingsApiDto,
} from '../../types/api/supplierDirectoryApi';

type Props = {
  isOpen: boolean;
  evaluation: SupplierDeliveryEvaluationApiDto | null;
  settings?: SupplierModuleSettingsApiDto;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (body: CompleteSupplierDeliveryEvaluationRequest) => void;
};

const FORM_ID = 'supplier-delivery-evaluation-form';

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

export default function CompleteDeliveryEvaluationModal({
  isOpen,
  evaluation,
  settings,
  isSaving,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đánh giá nhận hàng"
      size="md"
      footer={(
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
            Hủy
          </button>
          <button type="submit" form={FORM_ID} className="btn btn-primary" disabled={isSaving || !evaluation}>
            {isSaving ? 'Đang lưu…' : 'Hoàn thành đánh giá'}
          </button>
        </>
      )}
    >
      {evaluation ? (
        <CompleteForm
          key={evaluation.id}
          evaluation={evaluation}
          settings={settings}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}

function CompleteForm({
  evaluation,
  settings,
  onSubmit,
}: {
  evaluation: SupplierDeliveryEvaluationApiDto;
  settings?: SupplierModuleSettingsApiDto;
  onSubmit: (body: CompleteSupplierDeliveryEvaluationRequest) => void;
}) {
  const [form, setForm] = useState({
    score: '',
    onTimeDeliveryRate: '',
    defectRate: '',
    warrantyCompletionRate: '',
    evaluatedAt: '',
    note: '',
  });
  const [errors, setErrors] = useState<{
    score?: string;
    onTimeDeliveryRate?: string;
    defectRate?: string;
    warrantyCompletionRate?: string;
  }>({});

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
    const score = Number(form.score);
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
      score,
      onTimeDeliveryRate: Number(form.onTimeDeliveryRate),
      defectRate: Number(form.defectRate),
      warrantyCompletionRate: Number(form.warrantyCompletionRate),
      evaluatedAt: form.evaluatedAt || null,
      note: form.note.trim() || null,
    });
  };

  return (
    <form id={FORM_ID} className="space-y-3 modal-form-bordered" noValidate onSubmit={handleSubmit}>
      <p className="text-sm text-[var(--md-on-surface-variant)]">
        {evaluation.supplierName} · PO {evaluation.poCode} · NK {evaluation.importTicketCode}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <FormField label="Xếp hạng (tự tính)">
          <input className="form-input" value={grade ?? '—'} disabled readOnly />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Giao đúng hạn %" required error={errors.onTimeDeliveryRate}>
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
        <FormField label="Hàng lỗi %" required error={errors.defectRate}>
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
        <FormField label="Hoàn thành BH %" required error={errors.warrantyCompletionRate}>
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

      <FormField label="Ngày đánh giá">
        <HrmDatePicker
          value={form.evaluatedAt}
          onChange={value => setForm(f => ({ ...f, evaluatedAt: value }))}
        />
      </FormField>

      <FormField label="Ghi chú">
        <textarea
          className="form-input"
          rows={3}
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
        />
      </FormField>
    </form>
  );
}
