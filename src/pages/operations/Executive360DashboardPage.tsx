import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FolderKanban, RefreshCw } from 'lucide-react';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import { useCskhOpsWorkspace } from '../../hooks/cskh/useCskhOpsWorkspace';
import {
  useProject,
  useProjectInventory,
  useProjectPurchasingProgress,
  useProjects,
} from '../../hooks/useProjects';
import Executive360HeroCard from './executive360/Executive360HeroCard';
import Executive360SitePillars from './executive360/Executive360SitePillars';
import Executive360SupplyFinancePillars from './executive360/Executive360SupplyFinancePillars';

export default function Executive360DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectParam = searchParams.get('project');

  const projectsQ = useProjects({ page: 1, pageSize: 200, status: 'Active' });
  const { data: projectsData, isLoading: projectsLoading } = projectsQ;
  const projects = projectsData?.items ?? [];

  const projectCode = projectParam ?? projects[0]?.projectCode ?? '';

  const projectQ = useProject(projectCode || undefined);
  const { data: project, isLoading: projectLoading } = projectQ;

  const workspace = useCskhOpsWorkspace(projectCode);
  const { ops, isError: opsError, bottlenecksQuery } = workspace;
  const isBottlenecksError = Boolean(bottlenecksQuery?.isError || opsError);

  const progressQ = useProjectPurchasingProgress(projectCode || undefined);
  const invQ = useProjectInventory(projectCode || undefined);

  const openBottlenecks = useMemo(
    () => (ops.bottlenecks || []).filter(b => b.status === 'open'),
    [ops.bottlenecks],
  );
  const criticalBottlenecks = useMemo(
    () => openBottlenecks.filter(b => b.severity === 'urgent'),
    [openBottlenecks],
  );

  const orders = useMemo(
    () => progressQ.data?.flatMap(g => g.orders) ?? [],
    [progressQ.data],
  );
  const fullyDeliveredOrders = useMemo(
    () => orders.filter(o => o.percentComplete >= 100),
    [orders],
  );
  const inProgressOrders = useMemo(
    () => orders.filter(o => o.percentComplete < 100),
    [orders],
  );
  const procurementProgress = useMemo(
    () => (orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.percentComplete, 0) / orders.length) : 0),
    [orders],
  );

  const inventoryLines = useMemo(() => invQ.data ?? [], [invQ.data]);
  const activeStockCount = useMemo(
    () => inventoryLines.filter(r => r.actualInventoryQty > 0).length,
    [inventoryLines],
  );
  const totalStockQty = useMemo(
    () => inventoryLines.reduce((sum, r) => sum + r.actualInventoryQty, 0),
    [inventoryLines],
  );
  const totalImportQty = useMemo(
    () => inventoryLines.reduce((sum, r) => sum + r.actualImportQty, 0),
    [inventoryLines],
  );
  const totalDisbursedQty = useMemo(
    () =>
      inventoryLines.reduce(
        (sum, r) => sum + (r.issuedFromPoQty ?? 0) + (r.issuedFromGeneralQty ?? 0) + r.actualExportQty,
        0,
      ),
    [inventoryLines],
  );

  const hasError = Boolean(
    projectsQ.isError || projectQ.isError || (projectCode && (workspace.isError || progressQ.isError || invQ.isError)),
  );
  const isLoading = Boolean(
    projectsLoading || projectLoading || (projectCode && (workspace.isLoading || progressQ.isLoading || invQ.isLoading)),
  );

  const handleRetryAll = () => {
    void Promise.all([
      projectsQ.refetch(),
      ...(projectCode ? [projectQ.refetch(), workspace.refetch(), progressQ.refetch(), invQ.refetch()] : []),
    ]);
  };

  return (
    <PageShell variant="list" className="executive-360-page space-y-6">
      <PageHeader
        eyebrow="Ban Giám Đốc & PMO"
        title="Điều hành Dự án 360°"
        subtitle="Bức tranh toàn cảnh: Nhân sự, Tiến độ thi công, Mua hàng PO, Tồn kho dự án và Tài chính."
        actions={(
          <div className="flex items-center gap-2 min-w-[280px] sm:min-w-[340px]">
            <ProjectAutocomplete
              value={projectCode}
              onChange={code => {
                if (code) setSearchParams({ project: code });
                else setSearchParams({});
              }}
              projects={projects}
              placeholder="Chọn dự án điều hành…"
              compact
            />
          </div>
        )}
      />

      {hasError ? (
        <div
          role="alert"
          className="rounded-xl border border-[var(--md-error)] bg-[var(--md-error-container)] text-[var(--md-on-error-container)] p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm font-medium">Không tải được dữ liệu tổng quan. Vui lòng thử lại.</p>
          <Button type="button" variant="tonal" size="sm" leftIcon={RefreshCw} onClick={handleRetryAll}>
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="hrm-table-skeleton h-32 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="hrm-table-skeleton h-48 rounded-xl" />
            ))}
          </div>
        </div>
      ) : !project ? (
        <EmptyState
          message="Vui lòng chọn một dự án để xem bức tranh điều hành 360°."
          icon={FolderKanban}
        />
      ) : (
        <>
          <Executive360HeroCard project={project} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <Executive360SitePillars
              project={project}
              openBottlenecks={openBottlenecks}
              criticalBottlenecksCount={criticalBottlenecks.length}
              isBottlenecksError={isBottlenecksError}
              onRetryBottlenecks={() => {
                void (bottlenecksQuery?.refetch ? bottlenecksQuery.refetch() : workspace.refetch());
              }}
            />
            <Executive360SupplyFinancePillars
              project={project}
              ordersCount={orders.length}
              fullyDeliveredCount={fullyDeliveredOrders.length}
              inProgressCount={inProgressOrders.length}
              procurementProgress={procurementProgress}
              progressError={progressQ.isError}
              onRetryProgress={() => void progressQ.refetch()}
              activeStockCount={activeStockCount}
              totalStockQty={totalStockQty}
              totalImportQty={totalImportQty}
              totalDisbursedQty={totalDisbursedQty}
              inventoryLinesCount={inventoryLines.length}
              invError={invQ.isError}
              onRetryInventory={() => void invQ.refetch()}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}
