/** Luồng mua hàng — phase hiện tại: kế hoạch → đơn (kể cả phát sinh). */

export interface PurchasingStep {
  id: string;
  step: number;
  title: string;
  what: string;
  path: string;
  doNext: string;
}

export const PURCHASING_STEPS: PurchasingStep[] = [
  {
    id: 'plans',
    step: 1,
    title: 'Kế hoạch mua hàng',
    what: 'Nhu cầu máy / phụ tùng, ngày cần hàng & ngày cần đặt.',
    path: '/purchasing/plans',
    doNext: 'Từ kế hoạch tạo đơn theo kế hoạch khi sẵn sàng đặt.',
  },
  {
    id: 'orders',
    step: 2,
    title: 'Đơn hàng (PO)',
    what: 'PO theo kế hoạch hoặc phiếu phát sinh gắn dự án.',
    path: '/purchasing/orders',
    doNext: 'Lọc tab Phát sinh để xem phiếu mua ngoài kế hoạch.',
  },
];

export function findPurchasingStep(path: string): PurchasingStep | undefined {
  if (path.startsWith('/purchasing/orders')) {
    return PURCHASING_STEPS.find(s => s.id === 'orders');
  }
  return PURCHASING_STEPS.find(s => path.startsWith(s.path) || path.includes(s.id));
}
