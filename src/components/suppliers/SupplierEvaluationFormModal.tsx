import type React from 'react';
import { useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import HrmDatePicker from '../hr/HrmDatePicker';
import { useSuppliers } from '../../hooks/useSuppliers';
import {
  KPI_GROUPS,
  KPI_MAX,
  KPI_MIN,
  computeKpiOverall,
  emptyKpiScores,
  kpiCriterionKey,
  kpiGradeLabel,
  previewKpiGrade,
} from '../../lib/suppliers/kpiCriteriaCatalog';
import type {
  SupplierEvaluationApiDto,
  UpsertSupplierEvaluationRequest,
} from '../../types/api/supplierDirectoryApi';

const FORM_ID = 'supplier-evaluation-form';
const SCORE_LABELS = ['Rất yếu', 'Yếu', 'Trung bình', 'Tốt', 'Xuất sắc'] as const;

interface Props {
  isOpen: boolean;
  editing: SupplierEvaluationApiDto | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (body: UpsertSupplierEvaluationRequest) => void;
}

export default function SupplierEvaluationFormModal({
  isOpen,
  editing,
  isSaving,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Sửa đánh giá định kỳ (KPI)' : 'Tạo đánh giá định kỳ (KPI)'}
      size="xl"
      footer={(
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
            Hủy
          </button>
          <button type="submit" form={FORM_ID} className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Đang lưu…' : 'Lưu đánh giá'}
          </button>
        </>
      )}
    >
      <EvaluationForm key={editing?.id ?? 'new'} editing={editing} onSubmit={onSubmit} />
    </Modal>
  );
}

function EvaluationForm({
  editing,
  onSubmit,
}: Pick<Props, 'editing' | 'onSubmit'>) {
  const { data: suppliers } = useSuppliers({ all: true });
  const [supplierId, setSupplierId] = useState(editing ? String(editing.supplierId) : '');
  const [period, setPeriod] = useState(editing?.period ?? '');
  const [evaluatedAt, setEvaluatedAt] = useState(editing?.evaluatedAt?.slice(0, 10) ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [scores, setScores] = useState<Record<string, number>>(
    () => ({ ...emptyKpiScores(3), ...(editing?.criteriaScores ?? {}) }),
  );
  const [errors, setErrors] = useState<{ supplierId?: string; period?: string }>({});

  const overall = computeKpiOverall(scores);
  const grade = previewKpiGrade(overall);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const sid = Number(supplierId);
    if (!sid) next.supplierId = 'Vui lòng chọn nhà cung cấp.';
    if (!period.trim()) next.period = 'Vui lòng nhập kỳ đánh giá.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      supplierId: sid,
      period: period.trim(),
      criteriaScores: scores,
      evaluatedAt: evaluatedAt || null,
      note: note.trim() || null,
    });
  };

  return (
    <form id={FORM_ID} className="space-y-3 modal-form-bordered" noValidate onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Nhà cung cấp" required error={errors.supplierId}>
          <select
            className="form-select"
            value={supplierId}
            disabled={Boolean(editing)}
            onChange={e => {
              setSupplierId(e.target.value);
              setErrors(prev => ({ ...prev, supplierId: undefined }));
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
        <FormField label="Kỳ đánh giá" required error={errors.period}>
          <input
            className="form-input"
            value={period}
            disabled={Boolean(editing)}
            onChange={e => {
              setPeriod(e.target.value);
              setErrors(prev => ({ ...prev, period: undefined }));
            }}
            placeholder="VD: Quý 2/2026"
          />
        </FormField>
        <FormField label="Ngày đánh giá">
          <HrmDatePicker value={evaluatedAt} onChange={setEvaluatedAt} placeholder="Chọn ngày" />
        </FormField>
        <FormField label="Điểm tổng / xếp hạng (tự tính)">
          <input
            className="form-input"
            value={`${overall}/5 — ${kpiGradeLabel(grade)}`}
            disabled
            readOnly
          />
        </FormField>
      </div>

      {KPI_GROUPS.map(group => (
        <section key={group.key} className="space-y-2">
          <h3 className="purchasing-section-title mb-0 text-sm">{group.name}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse hrm-table">
              <tbody>
                {group.criteria.map((label, i) => {
                  const key = kpiCriterionKey(group.key, i);
                  return (
                    <tr key={key} className="table-row">
                      <td className="table-cell text-pretty">{label}</td>
                      <td className="table-cell text-right whitespace-nowrap" style={{ width: 140 }}>
                        <select
                          className="form-select"
                          aria-label={label}
                          value={scores[key] ?? 3}
                          onChange={e => {
                            const n = Number(e.target.value);
                            setScores(prev => ({ ...prev, [key]: n }));
                          }}
                        >
                          {Array.from({ length: KPI_MAX - KPI_MIN + 1 }, (_, idx) => {
                            const n = KPI_MIN + idx;
                            return (
                              <option key={n} value={n}>
                                {n} — {SCORE_LABELS[n - 1]}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <FormField label="Nhận xét tổng thể">
        <textarea
          className="form-input"
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Nhận xét về năng lực hợp tác lâu dài"
        />
      </FormField>
    </form>
  );
}
