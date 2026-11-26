import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Package,
  ShoppingCart,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Card, { type KpiStat } from '../../../components/ui/Card';
import type { useOperationsDashboard } from '../../../hooks/useOperationsDashboard';
import type { CardAccent } from '../../../types';

type OperationsDashboardCounts = ReturnType<typeof useOperationsDashboard>['counts'];

interface KpiCardSpec {
  title: string;
  to: string;
  accent: CardAccent;
  icon: LucideIcon;
  stats: KpiStat[];
}

export default function OperationsKpiGrid({ counts }: { counts: OperationsDashboardCounts }) {
  const cards: KpiCardSpec[] = [
    {
      title: 'Dự án', to: '/operations/projects', accent: 'info', icon: CheckCircle2,
      stats: [
        { label: 'Đang triển khai', value: counts.projectActive, tone: 'ok' },
        { label: 'Đã đóng', value: counts.projectClosed, tone: 'info' },
        { label: 'Tổng', value: counts.projectTotal, tone: 'neutral' },
      ],
    },
    {
      title: 'Phân công', to: '/operations/projects', accent: 'neutral', icon: FolderKanban,
      stats: [
        { label: 'Chưa gán PM', value: counts.projectWithoutPm, tone: 'warn' },
        { label: 'Có PM', value: counts.projectWithPm, tone: 'ok' },
        { label: 'Có thủ kho', value: counts.projectWithKeeper, tone: 'info' },
      ],
    },
    {
      title: 'Tồn thấp', to: '/warehouse/stock', accent: 'warning', icon: AlertTriangle,
      stats: [
        { label: 'Dưới ngưỡng', value: counts.stockBelowMin, tone: 'warn' },
        { label: 'Hết tồn', value: counts.stockZero, tone: 'danger' },
        { label: 'Số dự án', value: counts.stockProjects, tone: 'info' },
      ],
    },
    {
      title: 'Vật tư', to: '/operations/materials', accent: 'success', icon: Package,
      stats: [
        { label: 'Đang dùng', value: counts.materialActive, tone: 'ok' },
        { label: 'Ngừng dùng', value: counts.materialInactive, tone: 'warn' },
        { label: 'Tổng', value: counts.materialTotal, tone: 'neutral' },
      ],
    },
    {
      title: 'Đơn hàng', to: '/purchasing/orders', accent: 'amber', icon: ShoppingCart,
      stats: [
        { label: 'Chưa giao', value: counts.orderNone, tone: 'warn' },
        { label: 'Giao 1 phần', value: counts.orderPartial, tone: 'info' },
        { label: 'Kế hoạch mua', value: counts.planCount, tone: 'neutral' },
      ],
    },
    {
      title: 'Hàng về', to: '/warehouse/arrival-plans', accent: 'primary', icon: Truck,
      stats: [
        { label: 'Quá hạn', value: counts.arrivalOverdue, tone: 'danger' },
        { label: 'Đến hạn', value: counts.arrivalDueToday, tone: 'warn' },
        { label: 'Sắp về', value: counts.arrivalUpcoming, tone: 'info' },
      ],
    },
    {
      title: 'Đề nghị TT', to: '/purchasing/payments', accent: 'purple', icon: Wallet,
      stats: [
        { label: 'Nháp', value: counts.paymentDraft, tone: 'info' },
        { label: 'Đã gửi', value: counts.paymentSubmitted, tone: 'warn' },
        { label: 'Đã thanh toán', value: counts.paymentPaid, tone: 'ok' },
      ],
    },
    {
      title: 'Thanh toán PO', to: '/purchasing/orders', accent: 'danger', icon: AlertTriangle,
      stats: [
        { label: 'Trễ hạn', value: counts.poOverdue, tone: 'danger' },
        { label: 'Chưa thanh toán', value: counts.poUnpaid, tone: 'warn' },
        { label: 'Thanh toán 1 phần', value: counts.poPartialPay, tone: 'info' },
      ],
    },
  ];

  return (
    <div className="dashboard-kpi-grid" role="list" aria-label="Chỉ số vận hành">
      {cards.map(card => (
        <Card key={card.title} {...card} />
      ))}
    </div>
  );
}
