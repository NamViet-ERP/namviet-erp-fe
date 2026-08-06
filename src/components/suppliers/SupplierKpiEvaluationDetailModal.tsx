import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import {
  KPI_GROUPS,
  computeKpiGroupAverage,
  computeKpiOverall,
  kpiCriterionKey,
  kpiGradeLabel,
} from '../../lib/suppliers/kpiCriteriaCatalog';
import type { SupplierEvaluationApiDto } from '../../types/api/supplierDirectoryApi';

type Props = {
  isOpen: boolean;
  evaluation: SupplierEvaluationApiDto | null;
  isLoading?: boolean;
  onClose: () => void;
  onEdit?: () => void;
};

export default function SupplierKpiEvaluationDetailModal({
  isOpen,
  evaluation,
  isLoading,
  onClose,
  onEdit,
}: Props) {
  const scores = evaluation?.criteriaScores ?? {};
  const overall = evaluation ? computeKpiOverall(scores) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        evaluation
          ? `Đánh giá định kỳ — ${evaluation.supplierName} (${evaluation.period})`
          : 'Chi tiết đánh giá định kỳ'
      }
      size="xl"
      footer={(
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
          {onEdit && evaluation ? (
            <button type="button" className="btn btn-primary" onClick={onEdit}>
              Sửa đánh giá
            </button>
          ) : null}
        </>
      )}
    >
      {isLoading || !evaluation ? (
        <p className="text-sm text-[var(--md-on-surface-variant)]">Đang tải chi tiết…</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Người đánh giá">
              <input
                className="form-input"
                value={evaluation.evaluatedByName || '—'}
                disabled
                readOnly
              />
            </FormField>
            <FormField label="Điểm tổng">
              <input
                className="form-input"
                value={`${overall}/5 — ${evaluation.gradeLabel || kpiGradeLabel(evaluation.grade)}`}
                disabled
                readOnly
              />
            </FormField>
          </div>

          {KPI_GROUPS.map(group => {
            const avg = computeKpiGroupAverage(scores, group);
            return (
              <section key={group.key} className="space-y-2">
                <h3 className="purchasing-section-title mb-0 text-sm">
                  {group.name}{' '}
                  <span className="font-normal tabular-nums text-[var(--md-on-surface-variant)]">
                    — {Math.round(avg * 100) / 100}/5
                  </span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse hrm-table">
                    <tbody>
                      {group.criteria.map((label, i) => {
                        const key = kpiCriterionKey(group.key, i);
                        return (
                          <tr key={key} className="table-row">
                            <td className="table-cell text-pretty">{label}</td>
                            <td className="table-cell text-right tabular-nums whitespace-nowrap">
                              {scores[key] ?? '—'}/5
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          {evaluation.note ? (
            <p className="text-sm text-pretty text-[var(--md-on-surface-variant)] rounded-lg border border-[var(--md-outline-variant)] p-3">
              {evaluation.note}
            </p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
