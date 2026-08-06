/**
 * KPI periodic criteria catalog — keep in sync with BE
 * `NamViet.ERP.Modules.Warehouse.Domain.SupplierEvaluation.KpiCriteriaCatalog`
 * and QuanLyCungUng_EPC.html KPI_GROUPS.
 */

export type KpiCriteriaGroup = {
  key: string;
  name: string;
  criteria: string[];
};

export const KPI_MIN = 1;
export const KPI_MAX = 5;
export const KPI_CATALOG_VERSION = 1;

export const KPI_GROUPS: KpiCriteriaGroup[] = [
  {
    key: 'flex',
    name: '1. Khả năng đáp ứng & linh hoạt',
    criteria: [
      'Khả năng đáp ứng đơn hàng gấp',
      'Khả năng tăng sản lượng khi nhu cầu tăng',
      'Khả năng thay đổi lịch giao hàng',
      'Khả năng chia nhỏ đơn hàng',
      'Khả năng đáp ứng nhiều địa điểm giao hàng',
      'Khả năng cung cấp sản phẩm/vật tư thay thế',
    ],
  },
  {
    key: 'coord',
    name: '2. Khả năng phối hợp & xử lý vấn đề',
    criteria: [
      'Tốc độ phản hồi khi có vấn đề',
      'Tốc độ xác nhận đơn hàng',
      'Mức độ chủ động cập nhật tình trạng đơn hàng',
      'Khả năng phối hợp khi giao hàng trễ',
      'Khả năng phối hợp khi hàng bị lỗi',
      'Khả năng đưa ra phương án xử lý',
    ],
  },
  {
    key: 'supply',
    name: '3. Năng lực cung ứng & độ tin cậy',
    criteria: [
      'Năng lực cung ứng thực tế',
      'Độ ổn định của nguồn cung',
      'Mức độ phụ thuộc vào nguồn cung khác',
      'Khả năng duy trì nguồn cung khi thị trường biến động',
    ],
  },
  {
    key: 'commercial',
    name: '4. Năng lực thương mại & hỗ trợ cung ứng',
    criteria: [
      'Tốc độ cung cấp báo giá',
      'Mức độ rõ ràng của báo giá',
      'Khả năng giữ giá trong thời gian cam kết',
      'Khả năng đưa ra phương án thương mại phù hợp',
      'Mức độ linh hoạt về điều khoản thanh toán',
      'Khả năng cung cấp thông tin thị trường',
      'Khả năng cung cấp thông tin về biến động giá và nguồn hàng',
    ],
  },
  {
    key: 'tech',
    name: '5. Năng lực kỹ thuật & giải pháp',
    criteria: [
      'Mức độ hiểu rõ sản phẩm',
      'Khả năng tư vấn kỹ thuật',
      'Khả năng đề xuất sản phẩm/vật tư thay thế',
      'Khả năng hỗ trợ xử lý vấn đề kỹ thuật',
      'Khả năng xác định nguyên nhân khi vật tư không phù hợp',
      'Khả năng hỗ trợ hướng dẫn sử dụng/lắp đặt',
      'Khả năng cung cấp tài liệu kỹ thuật và hồ sơ liên quan',
    ],
  },
];

export function kpiCriterionKey(groupKey: string, index: number): string {
  return `${groupKey}_${index}`;
}

export function allKpiKeys(): string[] {
  return KPI_GROUPS.flatMap(g => g.criteria.map((_, i) => kpiCriterionKey(g.key, i)));
}

export function emptyKpiScores(defaultValue = 3): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const key of allKpiKeys()) scores[key] = defaultValue;
  return scores;
}

export function computeKpiGroupAverage(
  scores: Record<string, number>,
  group: KpiCriteriaGroup,
): number {
  const vals = group.criteria.map((_, i) => Number(scores[kpiCriterionKey(group.key, i)]) || 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function computeKpiOverall(scores: Record<string, number>): number {
  const avgs = KPI_GROUPS.map(g => computeKpiGroupAverage(scores, g));
  const overall = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  return Math.round(overall * 100) / 100;
}

export function previewKpiGrade(overall: number): string {
  if (overall >= 4.25) return 'A';
  if (overall >= 3.5) return 'B';
  if (overall >= 2.5) return 'C';
  return 'D';
}

export function kpiGradeLabel(grade: string | null | undefined): string {
  switch (grade) {
    case 'A': return 'Hạng A — Xuất sắc';
    case 'B': return 'Hạng B — Tốt';
    case 'C': return 'Hạng C — Trung bình, cần cải thiện';
    case 'D': return 'Hạng D — Yếu, cần xem xét lại';
    default: return grade ? `Hạng ${grade}` : 'Chưa đánh giá';
  }
}
