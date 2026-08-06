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
      title="Đánh giá nhà cung cấp"
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
          <input
            type="number"
            inputMode="numeric"
            min={ORDER_EVAL_MIN}
            max={ORDER_EVAL_MAX}
            step="1"
            className="form-input tabular-nums"
            value={criteria[key]}
            onChange={e => {
              const n = Number(e.target.value);
              setCriteria(c => ({ ...c, [key]: Number.isNaN(n) ? 0 : n }));
              setErrors(prev => {
                if (!prev[key]) return prev;
                const copy = { ...prev };
                delete copy[key];
                return copy;
              });
            }}
          />
        </FormField>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Điểm tổng (tự tính)">
          <input className="form-input tabular-nums" value={`${score}/10`} disabled readOnly />
        </FormField>
        <FormField label="Xếp hạng (tự tính)">
          <input
            className="form-input"
            value={grade ? orderGradeLabel(grade) : '—'}
            disabled
            readOnly
          />
        </FormField>
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
