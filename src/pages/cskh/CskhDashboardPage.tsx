import { Link, useOutletContext } from 'react-router-dom';
import { Bell, ShoppingCart, Warehouse, WalletCards } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import type { WarehouseProjectApiDto } from '../../types/wms';

interface CskhOutletContext {
  projectCode: string;
  projects: WarehouseProjectApiDto[];
}

const INTEGRATIONS = [
  { to: '/purchasing/orders', label: 'Mua hàng - Đơn hàng', icon: ShoppingCart },
  { to: '/warehouse/stock', label: 'Kho - Tồn kho', icon: Warehouse },
  { to: '/purchasing/payments', label: 'Thanh toán - Đề nghị thanh toán', icon: WalletCards },
] as const;

export default function CskhDashboardPage() {
  const { projectCode } = useOutletContext<CskhOutletContext>();

  return (
    <>
      <PageHeader
        title="Tổng quan CSKH"
        subtitle="Nhắc hồ sơ quá hạn, điểm nghẽn, bảo hành CĐT. Phase 3 đọc số thật."
      />

      <EmptyState
        icon={Bell}
        message={
          projectCode
            ? 'Chưa có nhắc cho dự án này. Nhắc hiện khi có hồ sơ, yêu cầu hoặc bảo hành quá hạn.'
            : 'Chọn dự án đang làm để xem nhắc theo dự án.'
        }
      />

      <section className="cskh-integrations" aria-label="Tích hợp phân hệ khác">
        <h2 className="cskh-integrations__title">Mở phân hệ liên quan</h2>
        <ul className="cskh-integrations__list">
          {INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link className="cskh-integrations__link" to={item.to}>
                  <Icon size={16} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
