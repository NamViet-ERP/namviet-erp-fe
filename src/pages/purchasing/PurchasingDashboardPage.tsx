import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, ShoppingCart, AlertTriangle, FileWarning, Globe2,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import PurchasingWorkflowStrip from '../../components/purchasing/PurchasingWorkflowStrip';
import { orderKindLabel } from '../../data/purchasingMock';
import { selectDashboard, usePurchasingStore } from '../../lib/purchasing/purchasingStore';

const STAT_ICONS = [Target, ShoppingCart, FileWarning, Globe2] as const;

export default function PurchasingDashboardPage() {
  const store = usePurchasingStore();
  const dash = useMemo(() => selectDashboard(store), [store]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visibleAlerts = dash.alerts.filter(a => !dismissed.includes(a.id));

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Mua hàng"
        title="Mua hàng"
        subtitle="Kế hoạch mua → đơn hàng (theo kế hoạch hoặc phát sinh)."
      />

      <PurchasingWorkflowStrip />

      <div className="hrm-stat-grid mt-4">
        {dash.stats.map((s, i) => {
          const Icon = STAT_ICONS[i] ?? ShoppingCart;
          return (
            <HrmStatCard
              key={s.id}
              label={s.label}
              value={s.value}
              hint={s.hint}
              icon={Icon}
              tone={s.tone}
            />
          );
        })}
      </div>

      <div className="purchasing-dash-grid">
        <HrmPanel>
          <h2 className="purchasing-section-title">Cần xử lý</h2>
          {visibleAlerts.length === 0 ? (
            <p className="text-sm text-[var(--md-on-surface-variant)]">Không có cảnh báo.</p>
          ) : (
            <ul className="purchasing-alert-list">
              {visibleAlerts.map(a => (
                <li key={a.id} className={`purchasing-alert purchasing-alert--${a.tone}`}>
                  <AlertTriangle size={16} aria-hidden />
                  <span>{a.text}</span>
                  <button
                    type="button"
                    className="purchasing-alert__dismiss"
                    onClick={() => setDismissed(prev => [...prev, a.id])}
                    aria-label="Ẩn"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </HrmPanel>

        <HrmPanel noPadding>
          <div className="purchasing-section-pad flex items-center justify-between gap-2">
            <h2 className="purchasing-section-title mb-0">Đơn gần đây</h2>
            <Link to="/purchasing/orders" className="text-xs font-semibold text-[var(--md-primary)]">
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto table-scroll">
            <table className="w-full border-collapse hrm-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Mã đơn</th>
                  <th className="table-header-cell">Loại</th>
                  <th className="table-header-cell">Dự án</th>
                  <th className="table-header-cell">Giá trị</th>
                  <th className="table-header-cell">Tình trạng</th>
                </tr>
              </thead>
              <tbody>
                {dash.recentOrders.length === 0 ? (
                  <tr>
                    <td className="table-cell text-[var(--md-on-surface-variant)]" colSpan={5}>Chưa có đơn.</td>
                  </tr>
                ) : dash.recentOrders.map(row => (
                  <tr key={row.id} className="table-row">
                    <td className="table-cell font-semibold text-[var(--md-primary)]">{row.code}</td>
                    <td className="table-cell whitespace-nowrap">{orderKindLabel(row.kind)}</td>
                    <td className="table-cell">{row.project}</td>
                    <td className="table-cell whitespace-nowrap tabular-nums">{row.amount}</td>
                    <td className="table-cell">
                      <PurchasingStatusBadge label={row.status} tone={row.statusTone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HrmPanel>
      </div>
    </div>
  );
}
