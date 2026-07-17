/** UI-only suppliers module mock (align ERP NamViet /admin/suppliers). */

export interface SupplierGroupRow {
  id: string;
  name: string;
  description: string;
  supplierCount: number;
}

export interface SupplierEvaluationRow {
  id: string;
  supplierName: string;
  period: string;
  score: number;
  grade: string;
  evaluatedAt: string;
  note: string;
}

export interface SupplierSettingRow {
  id: string;
  label: string;
  description: string;
  value: string;
}

export interface SupplierDebtByName {
  name: string;
  debt: number;
}

export interface SupplierTrendPoint {
  month: string;
  debt: number;
  payment: number;
}

export interface SuppliersDashboardMock {
  supplierCount: number;
  contactCount: number;
  ordersThisMonth: number;
  debtTotal: number;
  paymentTotal: number;
  remaining: number;
  debtBySupplier: SupplierDebtByName[];
  trend: SupplierTrendPoint[];
}

export function createSuppliersModuleSeed() {
  const groups: SupplierGroupRow[] = [
    { id: 'g1', name: 'Thiết bị điện', description: 'NCC thiết bị điện công nghiệp', supplierCount: 24 },
    { id: 'g2', name: 'Vật tư xây dựng', description: 'Sắt thép, inox, vật liệu', supplierCount: 41 },
    { id: 'g3', name: 'Nhập khẩu', description: 'NCC ngoài nước / đại lý', supplierCount: 18 },
    { id: 'g4', name: 'Dịch vụ', description: 'Vận chuyển, bảo trì', supplierCount: 12 },
  ];

  const evaluations: SupplierEvaluationRow[] = [
    {
      id: 'ev1', supplierName: 'Công ty TNHH Điện Cơ Á Châu', period: 'Q2/2026',
      score: 88, grade: 'A', evaluatedAt: '02/07/2026', note: 'Giao đúng hạn',
    },
    {
      id: 'ev2', supplierName: 'Vật tư Xây dựng Nam Sơn', period: 'Q2/2026',
      score: 74, grade: 'B', evaluatedAt: '28/06/2026', note: 'Trễ 1 đợt giao',
    },
    {
      id: 'ev3', supplierName: 'Shanghai Power Equipment', period: 'Q2/2026',
      score: 81, grade: 'A', evaluatedAt: '15/06/2026', note: 'CO/CQ đủ',
    },
  ];

  const settings: SupplierSettingRow[] = [
    { id: 'ss1', label: 'Ngưỡng điểm đạt', description: 'Điểm tối thiểu để xếp hạng A', value: '80' },
    { id: 'ss2', label: 'Chu kỳ đánh giá', description: 'Tần suất đánh giá NCC định kỳ', value: 'Hàng quý' },
    { id: 'ss3', label: 'Bắt buộc nhóm NCC', description: 'Mỗi NCC phải thuộc ít nhất một nhóm', value: 'Bật' },
  ];

  const dashboard: SuppliersDashboardMock = {
    supplierCount: 182,
    contactCount: 35,
    ordersThisMonth: 2030,
    debtTotal: 6_161_225_710,
    paymentTotal: 0,
    remaining: 6_161_225_710,
    debtBySupplier: [
      { name: 'Siêu thị Sơn', debt: 3_200_000_000 },
      { name: 'Thiên Long', debt: 980_000_000 },
      { name: 'Hưng Thịnh', debt: 720_000_000 },
      { name: 'Fresh Air', debt: 540_000_000 },
      { name: 'TopCV', debt: 310_000_000 },
      { name: 'Per-Fectiv', debt: 220_000_000 },
      { name: 'I.S', debt: 191_225_710 },
    ],
    trend: [
      { month: 'T1', debt: 800_000_000, payment: 0 },
      { month: 'T2', debt: 1_100_000_000, payment: 0 },
      { month: 'T3', debt: 3_400_000_000, payment: 0 },
      { month: 'T4', debt: 2_100_000_000, payment: 0 },
      { month: 'T5', debt: 1_600_000_000, payment: 0 },
      { month: 'T6', debt: 1_200_000_000, payment: 0 },
      { month: 'T7', debt: 900_000_000, payment: 0 },
      { month: 'T8', debt: 700_000_000, payment: 0 },
      { month: 'T9', debt: 650_000_000, payment: 0 },
      { month: 'T10', debt: 500_000_000, payment: 0 },
      { month: 'T11', debt: 400_000_000, payment: 0 },
    ],
  };

  return { groups, evaluations, settings, dashboard };
}

export function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN');
}
