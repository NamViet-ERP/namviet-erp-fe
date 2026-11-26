import type { StatusTone } from '../../../components/ui/StatusBadge';
import { hasValidPm } from '../../../lib/projectPersonnel';

export type StockFilter = 'all' | 'zero' | 'low';
export type OrderFilter = 'all' | 'none' | 'partial';
export type PaymentFilter = 'all' | 'draft' | 'submitted';
export type ProjectFilter = 'all' | 'noPm' | 'hasPm';

export const STOCK_FILTERS: { id: StockFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'zero', label: 'Hết tồn' },
  { id: 'low', label: 'Dưới ngưỡng' },
];

export const ORDER_FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'none', label: 'Chưa giao' },
  { id: 'partial', label: 'Giao 1 phần' },
];

export const PAYMENT_FILTERS: { id: PaymentFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Nháp' },
  { id: 'submitted', label: 'Đã gửi' },
];

export const PROJECT_FILTERS: { id: ProjectFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'noPm', label: 'Chưa gán PM' },
  { id: 'hasPm', label: 'Có PM' },
];

export function projectStatusLabel(status: string): string {
  if (status === 'Active') return 'Đang triển khai';
  if (status === 'Closed') return 'Đã đóng';
  return status;
}

export function paymentStatusBadge(status: string): { tone: StatusTone; label: string } {
  switch (status) {
    case 'draft':
      return { tone: 'neutral', label: 'Nháp' };
    case 'submitted':
      return { tone: 'warning', label: 'Đã gửi' };
    case 'paid':
      return { tone: 'success', label: 'Đã thanh toán' };
    case 'cancelled':
      return { tone: 'error', label: 'Đã hủy' };
    default:
      return { tone: 'neutral', label: status || '-' };
  }
}

export function hasPm(row: { pmName?: string | null; pmId?: string | null }): boolean {
  return hasValidPm(row.pmName, row.pmId);
}
