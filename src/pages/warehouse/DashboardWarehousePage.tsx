import type React from 'react';
import { useState } from 'react';
import {
  Package,
  DollarSign,
  Warehouse,
  TrendingUp,
  ArrowUpRight,
  Activity,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import KpiCard, { type KpiCardTone } from '../../components/ui/KpiCard';
import MetricsStrip from '../../components/ui/MetricsStrip';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import PageShell from '../../components/ui/PageShell';
import { WMS_ERROR } from '../../lib/wms/messages';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import { fmtStockQty } from '../../lib/wms/stockQtyFormat';
import { useWarehouseDashboard } from '../../hooks/useWarehouseDashboard';
import { useLowStockAlerts } from '../../hooks/useLowStockAlerts';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';
import {
  emptyWarehouseDashboardData,
  type WarehouseDashboardData,
} from '../../lib/wms/warehouseDashboardData';
import { TrendChart } from './dashboard/WarehouseTrendChart';
import { CategoryPieChart } from './dashboard/WarehouseCategoryPieChart';
import { WarehouseBarChart } from './dashboard/WarehouseBarChart';
import { ActivityFeed } from './dashboard/WarehouseActivityFeed';

const ACTIVITY_PREVIEW_COUNT = 5;

const OPS_STAT_META: Record<string, { tone: KpiCardTone; icon: LucideIcon }> = {
  'Chờ duyệt': { tone: 'danger', icon: Activity },
  'Nhập hôm nay': { tone: 'success', icon: TrendingUp },
  'Xuất hôm nay': { tone: 'warning', icon: ArrowUpRight },
};

function SectionHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="section-heading">
      <h2 className="section-heading__title">{children}</h2>
      {sub && <p className="section-heading__sub">{sub}</p>}
    </div>
  );
}

function BentoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bento-card${className ? ` ${className}` : ''}`}>{children}</div>;
}

export default function DashboardWarehousePage() {
  const { data, isLoading, isError, refetch, isRefetching } = useWarehouseDashboard();

  if (isLoading) {
    return <PageLoader />;
  }

  const hasLoadError = isError || !data;
  const displayData = data ?? emptyWarehouseDashboardData();

  return (
    <DashboardWarehouseContent
      data={displayData}
      hasLoadError={hasLoadError}
      onRetry={() => void refetch()}
      isRetrying={isRefetching}
    />
  );
}

interface DashboardWarehouseContentProps {
  data: WarehouseDashboardData;
  hasLoadError?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

function DashboardWarehouseContent({
  data,
  hasLoadError = false,
  onRetry,
  isRetrying = false,
}: DashboardWarehouseContentProps) {
  const [activityExpanded, setActivityExpanded] = useState(false);
  const canViewPrices = useCanViewWmsPrices();
  const { data: lowStockAlerts = [] } = useLowStockAlerts(undefined, 8);
  const activityItems = activityExpanded
    ? data.recentActivity
    : data.recentActivity.slice(0, ACTIVITY_PREVIEW_COUNT);
  const hasMoreActivity = data.recentActivity.length > ACTIVITY_PREVIEW_COUNT;

  return (
    <PageShell variant="dashboard" className="warehouse-dash">
      <PageHeader
        eyebrow="Tổng quan"
        title="Tổng quan kho hàng"
        actions={
          <p className="page-header__updated">
            <Activity size={13} aria-hidden />
            Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        }
      />

      {hasLoadError && (
        <div className="alert-banner alert-banner--error dashboard-load-alert" role="alert">
          <AlertTriangle size={18} className="alert-banner__icon" aria-hidden />
          <div className="dashboard-load-alert__body">
            <p className="dashboard-load-alert__message">{WMS_ERROR.loadDefault}</p>
            <p className="dashboard-load-alert__hint">Các mục bên dưới hiển thị khung trống cho đến khi tải lại thành công.</p>
          </div>
          {onRetry && (
            <Button
              type="button"
              variant="outlined"
              size="sm"
              className="dashboard-load-alert__retry"
              onClick={onRetry}
              disabled={isRetrying}
            >
              <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} aria-hidden />
              {isRetrying ? 'Đang tải…' : 'Thử lại'}
            </Button>
          )}
        </div>
      )}

      {lowStockAlerts.length > 0 && (
        <div className="alert-banner alert-banner--warning" role="alert">
          <AlertTriangle size={18} className="alert-banner__icon" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="alert-banner__title">
              {lowStockAlerts.length} cảnh báo tồn dưới ngưỡng tối thiểu
            </p>
            <ul className="alert-banner__list">
              {lowStockAlerts.slice(0, 5).map(a => (
                <li key={`${a.projectCode}-${a.materialCode}`}>
                  <EntityCodeLink
                    code={a.projectCode}
                    to={`/warehouse/projects/${encodeURIComponent(a.projectCode)}`}
                  />
                  {' - '}
                  <EntityCodeLink
                    code={a.materialCode}
                    to="/warehouse/materials"
                    state={{ highlightCode: a.materialCode }}
                  />
                  {' '}
                  ({a.actualQty}/{a.minStockQty} {a.unit})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <MetricsStrip ariaLabel="Việc cần xử lý" className="warehouse-dash-kpis">
        {data.miniStats.map(stat => {
          const meta = OPS_STAT_META[stat.label] ?? { tone: 'info' as const, icon: Activity };
          return (
            <KpiCard
              key={stat.label}
              label={stat.label}
              value={hasLoadError ? '-' : stat.value}
              tone={meta.tone}
              icon={meta.icon}
            />
          );
        })}
      </MetricsStrip>

      <MetricsStrip ariaLabel="Chỉ số kho" className="warehouse-dash-kpis">
        <KpiCard
          label="Tồn tất cả kho"
          value={hasLoadError ? '-' : fmtStockQty(data.totalStock)}
          hint="Kho trung tâm cộng các kho dự án"
          tone="info"
          icon={Package}
        />
        {canViewPrices && (
          <KpiCard
            label="Tổng giá trị"
            value={hasLoadError ? '-' : formatCurrencyShort(data.totalValue)}
            hint="ước tính từ giá bình quân"
            tone="warning"
            icon={DollarSign}
          />
        )}
        <KpiCard
          label="Kho dự án hoạt động"
          value={hasLoadError ? '-' : data.activeProjects}
          hint="dự án chưa đóng"
          tone="neutral"
          icon={Warehouse}
        />
      </MetricsStrip>

      <div className="dashboard-grid-charts">
        <BentoCard className="bento-card--chart">
          <SectionHeading sub="6 tháng gần nhất - giá trị">Xu hướng Nhập / Xuất</SectionHeading>
          {canViewPrices ? (
            <TrendChart data={data.trendData} />
          ) : (
            <div className="chart-panel">
              <EmptyState message="Biểu đồ giá trị nhập/xuất yêu cầu quyền xem giá." />
            </div>
          )}
        </BentoCard>

        <BentoCard className="bento-card--chart">
          <SectionHeading sub="Số lượng tồn theo từng vật tư">Cơ cấu tồn kho</SectionHeading>
          <CategoryPieChart data={data.stockByCategory} />
        </BentoCard>
      </div>

      <div className="dashboard-grid-row dashboard-grid-row--split">
        <BentoCard className="bento-card--chart bento-card--chart-bar">
          <SectionHeading sub="Top kho dự án theo tồn thực tế">Phân bổ theo kho</SectionHeading>
          <WarehouseBarChart data={data.stockByWarehouse} />
        </BentoCard>

        <BentoCard>
          <SectionHeading sub="Phiếu gần đây">Nhật ký kho</SectionHeading>
          <div className={activityExpanded ? 'activity-feed-scroll' : undefined}>
            <ActivityFeed items={activityItems} />
          </div>
          {hasMoreActivity && (
            <Button
              type="button"
              variant="outlined"
              size="sm"
              fullWidth
              className="mt-4"
              onClick={() => setActivityExpanded(prev => !prev)}
            >
              {activityExpanded
                ? 'Thu gọn'
                : `Xem thêm (${data.recentActivity.length - ACTIVITY_PREVIEW_COUNT})`}
              <ChevronDown
                size={14}
                className={activityExpanded ? 'nv-dropdown__chevron--open' : ''}
                aria-hidden
              />
            </Button>
          )}
        </BentoCard>
      </div>
    </PageShell>
  );
}
