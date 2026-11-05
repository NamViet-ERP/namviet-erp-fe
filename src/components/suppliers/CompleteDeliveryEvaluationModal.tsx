import type React from 'react';
import { useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import HrmDatePicker from '../hr/HrmDatePicker';
import {
  ORDER_EVAL_LABELS,
  ORDER_EVAL_MAX,
  ORDER_EVAL_MIN,
  ORDER_EVAL_WEIGHTS,
  computeOrderEvalScore,
  orderGradeLabel,
  previewOrderGrade,
  type OrderEvalCriteria,
} from '../../lib/suppliers/orderEvalScoring';
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
const CRITERIA_KEYS = Object.keys(ORDER_EVAL_LABELS) as Array<keyof OrderEvalCriteria>;

const RATING_BUTTONS = [
  { value: 10, label: '🌟 10đ - Xuất sắc' },
  { value: 8, label: '👍 8đ - Tốt (Mặc định)' },
  { value: 6, label: '👌 6đ - Đạt chuẩn' },
  { value: 4, label: '⚠️ 4đ - Cần cải thiện' },
];

function defaultCriteria(): OrderEvalCriteria {
  return { quality: 8, delivery: 8, price: 8, service: 8, compliance: 8 };
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
      title="Đánh giá chất lượng giao hàng PO"
      size="lg"
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
  const [criteria, setCriteria] = useState<OrderEvalCriteria>(defaultCriteria);
  const [evaluatedAt, setEvaluatedAt] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof OrderEvalCriteria, string>>>({});

  const score = computeOrderEvalScore(criteria);
  const grade = settings ? previewOrderGrade(score, settings) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    for (const key of CRITERIA_KEYS) {
      const n = Number(criteria[key]);
      if (Number.isNaN(n) || n < ORDER_EVAL_MIN || n > ORDER_EVAL_MAX) {
        next[key] = `Điểm phải từ ${ORDER_EVAL_MIN} đến ${ORDER_EVAL_MAX}.`;
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      ...criteria,
      evaluatedAt: evaluatedAt || null,
      note: note.trim() || null,
    });
  };

  return (
    <form id={FORM_ID} className="space-y-3 modal-form-bordered" noValidate onSubmit={handleSubmit}>
      <p className="text-sm text-pretty text-[var(--md-on-surface-variant)]">
        {evaluation.supplierName} · PO {evaluation.poCode} · NK {evaluation.importTicketCode}.
        Mỗi tiêu chí chấm theo thang {ORDER_EVAL_MIN}–{ORDER_EVAL_MAX}. Điểm tổng và xếp hạng tự tính theo trọng số.
      </p>

      {CRITERIA_KEYS.map(key => (
        <FormField
          key={key}
          label={`${ORDER_EVAL_LABELS[key]} (trọng số ${Math.round(ORDER_EVAL_WEIGHTS[key] * 100)}%)`}
          required
          error={errors[key]}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RATING_BUTTONS.map(btn => {
              const isSelected = criteria[key] === btn.value;
              return (
                <button
                  key={btn.value}
                  type="button"
                  onClick={() => {
                    setCriteria(c => ({ ...c, [key]: btn.value }));
                    setErrors(prev => {
                      if (!prev[key]) return prev;
                      const copy = { ...prev };
                      delete copy[key];
                      return copy;
                    });
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center flex items-center justify-center ${
                    isSelected
                      ? 'bg-[var(--md-primary)] text-white border-[var(--md-primary)] shadow-sm ring-2 ring-[var(--md-primary)] ring-offset-1'
                      : 'bg-[var(--md-surface)] text-[var(--md-on-surface)] border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-variant05)]'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </FormField>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--md-surface-variant05)] border border-[var(--md-outline-variant)]">
        <div>
          <span className="text-xs font-medium text-[var(--md-on-surface-variant)]">Điểm tổng (tự tính)</span>
          <div className="text-xl font-bold tabular-nums text-[var(--md-primary)] mt-0.5">
            {score} / 10
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-[var(--md-on-surface-variant)]">Xếp hạng kết quả</span>
          <div className="text-xl font-bold text-[var(--md-on-surface)] mt-0.5">
            {grade ? orderGradeLabel(grade) : '—'}
          </div>
        </div>
      </div>

      <FormField label="Ngày đánh giá">
        <HrmDatePicker value={evaluatedAt} onChange={setEvaluatedAt} />
      </FormField>

      <FormField label="Nhận xét">
        <textarea
          className="form-input"
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </FormField>
    </form>
  );
}
