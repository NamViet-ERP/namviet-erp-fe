/**
 * Order / delivery evaluation scoring — keep in sync with BE
 * `NamViet.ERP.Modules.Warehouse.Domain.SupplierEvaluation.OrderEvaluationScoring`
 * and QuanLyCungUng_EPC.html EVAL_WEIGHTS.
 */
export const ORDER_EVAL_WEIGHTS = {
  quality: 0.3,
  delivery: 0.25,
  price: 0.2,
  service: 0.15,
  compliance: 0.1,
} as const;

export const ORDER_EVAL_MIN = 1;
export const ORDER_EVAL_MAX = 10;

export type OrderEvalCriteria = {
  quality: number;
  delivery: number;
  price: number;
  service: number;
  compliance: number;
};

export const ORDER_EVAL_LABELS: Record<keyof OrderEvalCriteria, string> = {
  quality: 'Chất lượng hàng hoá',
  delivery: 'Tiến độ giao hàng',
  price: 'Giá cả cạnh tranh',
  service: 'Dịch vụ & hỗ trợ',
  compliance: 'Tuân thủ hợp đồng/hồ sơ',
};

export function computeOrderEvalScore(c: OrderEvalCriteria): number {
  const score =
    c.quality * ORDER_EVAL_WEIGHTS.quality
    + c.delivery * ORDER_EVAL_WEIGHTS.delivery
    + c.price * ORDER_EVAL_WEIGHTS.price
    + c.service * ORDER_EVAL_WEIGHTS.service
    + c.compliance * ORDER_EVAL_WEIGHTS.compliance;
  return Math.round(score * 100) / 100;
}

export function orderGradeLabel(grade: string | null | undefined): string {
  switch (grade) {
    case 'A': return 'Hạng A — Ưu tiên hợp tác';
    case 'B': return 'Hạng B — Đạt yêu cầu';
    case 'C': return 'Hạng C — Cần cải thiện';
    case 'D': return 'Hạng D — Hạn chế hợp tác';
    case 'E': return 'Hạng E';
    case 'F': return 'Hạng F';
    case 'G': return 'Hạng G';
    case 'H': return 'Hạng H — Yếu nhất';
    case '—': return 'Chưa đánh giá';
    default: return grade ? `Hạng ${grade}` : 'Chưa đánh giá';
  }
}

/** Preview grade from score using module settings thresholds (scale 0–10). */
export function previewOrderGrade(
  score: number,
  thresholds: {
    gradeAMinScore: number;
    gradeBMinScore: number;
    gradeCMinScore: number;
    gradeDMinScore: number;
    gradeEMinScore: number;
    gradeFMinScore: number;
    gradeGMinScore: number;
    gradeHMinScore: number;
  },
): string {
  if (score >= thresholds.gradeAMinScore) return 'A';
  if (score >= thresholds.gradeBMinScore) return 'B';
  if (score >= thresholds.gradeCMinScore) return 'C';
  if (score >= thresholds.gradeDMinScore) return 'D';
  if (score >= thresholds.gradeEMinScore) return 'E';
  if (score >= thresholds.gradeFMinScore) return 'F';
  if (score >= thresholds.gradeGMinScore) return 'G';
  if (score >= thresholds.gradeHMinScore) return 'H';
  return 'H';
}
