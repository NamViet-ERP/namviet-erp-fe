import { cskhProjectPath } from '../../constants/cskhProject';
import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShoppingCart,
  Warehouse,
  Wallet,
  ArrowRight,
  CheckCircle2,
  HardHat,
  Building2,
  FolderKanban,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import {
  useProjects,
  useProject,
  useProjectInventory,
  useProjectPurchasingProgress,
} from '../../hooks/useProjects';
import { useCskhOpsWorkspace } from '../../hooks/cskh/useCskhOpsWorkspace';
import { formatDateCell } from '../../lib/hrm/formatters';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import { projectStatusBadge } from '../../lib/wms/projectStatusBadge';
import {
  getBudgetRemainingHint,
  resolveMaterialBudgetRemaining,
} from '../../lib/wms/projectBudget';

export default function Executive360DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectParam = searchParams.get('project');

  const projectsQ = useProjects({ page: 1, pageSize: 200, status: 'Active' });
  const { data: projectsData, isLoading: projectsLoading } = projectsQ;
  const projects = projectsData?.items ?? [];

  const projectCode = projectParam ?? projects[0]?.projectCode ?? '';

  // Project details
  const projectQ = useProject(projectCode || undefined);
  const { data: project, isLoading: projectLoading } = projectQ;

  // Operations Workspace (Bottlenecks, Meetings)
  const workspace = useCskhOpsWorkspace(projectCode);
  const { ops, isError: opsError, bottlenecksQuery } = workspace;
  const isBottlenecksError = Boolean(bottlenecksQuery?.isError || opsError);

  // Purchasing Progress
  const progressQ = useProjectPurchasingProgress(projectCode || undefined);

  // Inventory
  const invQ = useProjectInventory(projectCode || undefined);

  // Calculations for Pillars
  // Pillar 2: Bottlenecks
  const openBottlenecks = useMemo(
    () => (ops.bottlenecks || []).filter(b => b.status === 'open'),
    [ops.bottlenecks],
  );
  const criticalBottlenecks = useMemo(
    () => openBottlenecks.filter(b => b.severity === 'urgent'),
    [openBottlenecks],
  );

  // Pillar 3: Procurement
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

  // Pillar 4: Inventory
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
    () => inventoryLines.reduce((sum, r) => sum + (r.issuedFromPoQty ?? 0) + (r.issuedFromGeneralQty ?? 0) + r.actualExportQty, 0),
    [inventoryLines],
  );

  // Pillar 5: Financials
  const materialBudget = project?.materialBudget ?? 0;
  const approvedImportValue = project?.approvedImportValue ?? 0;
  const materialBudgetRemaining = project?.materialBudgetRemaining ?? resolveMaterialBudgetRemaining(materialBudget, approvedImportValue);
  const budgetUsedPct = materialBudget > 0 ? Math.min(100, Math.max(0, (approvedImportValue / materialBudget) * 100)) : 0;
  const budgetHint = getBudgetRemainingHint(materialBudget, materialBudgetRemaining);

  const isOverBudget = materialBudgetRemaining < 0;
  const isNearLimit = !isOverBudget && materialBudget > 0 && (materialBudgetRemaining / materialBudget) <= 0.2;

  const budgetStatusBadge = isOverBudget ? (
    <Badge status="rejected" label="Vượt dự toán" />
  ) : isNearLimit ? (
    <Badge status="pending" label="Cảnh báo chạm ngưỡng" />
  ) : materialBudget > 0 ? (
    <Badge status="approved" label="An toàn" />
  ) : (
    <Badge status="draft" label="Chưa thiết lập" />
  );

  return (
    <div className="page-shell executive-360-page space-y-6">
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

      {projectsQ.isError || projectQ.isError || (projectCode && (workspace.isError || progressQ.isError || invQ.isError)) ? (
        <div role="alert">
          <p>Không tải được dữ liệu tổng quan. Vui lòng thử lại.</p>
          <button type="button" onClick={() => void Promise.all([projectsQ.refetch(), ...(projectCode ? [projectQ.refetch(), workspace.refetch(), progressQ.refetch(), invQ.refetch()] : [])])}>Thử lại</button>
        </div>
      ) : projectsLoading || projectLoading || (projectCode && (workspace.isLoading || progressQ.isLoading || invQ.isLoading)) ? (
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
          {/* Project Hero Card */}
          <div className="rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-low)] p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--md-surface-container-high)] text-[var(--md-primary)]">
                    {project.projectCode}
                  </span>
                  <Badge status={projectStatusBadge(project.status)} />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--md-on-surface)] m-0">
                  {project.projectName}
                </h1>
                <p className="text-sm text-[var(--md-on-surface-variant)] flex items-center gap-2 m-0">
                  <Building2 size={15} aria-hidden />
                  <span>Khách hàng / CĐT: <strong>{project.clientName || '—'}</strong></span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[var(--md-surface-container)] p-3 rounded-lg border border-[var(--md-outline-variant02)]">
                <div>
                  <span className="text-[var(--md-on-surface-variant)] block">Chỉ huy trưởng:</span>
                  <strong className="text-[var(--md-on-surface)] font-medium truncate block max-w-[140px]" title={project.pmName}>
                    {project.pmName || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-[var(--md-on-surface-variant)] block">Ngày khởi công:</span>
                  <strong className="text-[var(--md-on-surface)] font-mono tabular-nums">
                    {formatDateCell(project.startDate)}
                  </strong>
                </div>
                <div>
                  <span className="text-[var(--md-on-surface-variant)] block">Cam kết bàn giao:</span>
                  <strong className="text-[var(--md-on-surface)] font-mono tabular-nums">
                    {formatDateCell(project.endDate ?? undefined)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Integrated Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Pillar 1: Field HRM & Site Team */}
            <div className="rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-lowest)] p-4 sm:p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--md-outline-variant02)]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-tertiary)]">
                      <HardHat size={18} aria-hidden />
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--md-on-surface)] m-0">
                      1. Nhân sự Hiện trường
                    </h3>
                  </div>
                  <Badge
                    status={project.pmName ? 'approved' : 'pending'}
                    label={project.pmName ? 'Đủ chỉ huy' : 'Thiếu PM'}
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[var(--md-on-surface-variant)] block mb-0.5">Chỉ huy trưởng (PM / PIC):</span>
                    <strong className="text-sm text-[var(--md-on-surface)] font-semibold">
                      {project.pmName || '— Chưa phân công'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--md-on-surface-variant)] block mb-0.5">Ban chỉ huy & Kỹ sư (SC):</span>
                    <span className="text-[var(--md-on-surface)] font-medium block" title={project.scMembers ?? undefined}>
                      {project.scMembers || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--md-on-surface-variant)] block mb-0.5">Thủ kho phụ trách:</span>
                    <span className="text-[var(--md-on-surface)] font-medium">
                      {(project.warehouseKeepers?.length ?? 0) > 0
                        ? project.warehouseKeepers!.map(k => k.displayName).join(', ')
                        : '— Chưa phân công thủ kho'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--md-outline-variant02)] flex items-center justify-between">
                <span className="text-xs text-[var(--md-on-surface-variant)]">
                  {project.warehouseKeepers?.length ?? 0} thủ kho phụ trách
                </span>
                <Link
                  to="/members/list"
                  className="text-xs text-[var(--md-primary)] font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Hồ sơ nhân sự</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Pillar 2: Site Progress & Bottlenecks */}
            <div className="rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-lowest)] p-4 sm:p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--md-outline-variant02)]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-error)]">
                      <AlertTriangle size={18} aria-hidden />
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--md-on-surface)] m-0">
                      2. Tiến độ & Điểm nghẽn
                    </h3>
                  </div>
                  <Badge
                    status={
                      isBottlenecksError
                        ? 'rejected'
                        : openBottlenecks.length === 0
                        ? 'approved'
                        : criticalBottlenecks.length > 0
                        ? 'rejected'
                        : 'pending'
                    }
                    label={
                      isBottlenecksError
                        ? 'Lỗi tải dữ liệu'
                        : openBottlenecks.length === 0
                        ? 'Thông suốt'
                        : `${openBottlenecks.length} điểm nghẽn`
                    }
                  />
                </div>

                <div className="space-y-2 text-xs">
                  {isBottlenecksError ? (
                    <div className="py-4 text-center text-[var(--md-error)]">
                      <AlertTriangle size={24} className="mx-auto text-[var(--md-error)] mb-1" />
                      <p className="m-0 font-medium">Không thể tải dữ liệu điểm nghẽn</p>
                      <button
                        type="button"
                        onClick={() => (bottlenecksQuery?.refetch ? bottlenecksQuery.refetch() : workspace.refetch())}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-[var(--md-error)] bg-[var(--md-error-container)] text-[var(--md-on-error-container)] hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        <span>Thử lại</span>
                      </button>
                    </div>
                  ) : openBottlenecks.length === 0 ? (
                    <div className="py-4 text-center text-[var(--md-on-surface-variant)]">
                      <CheckCircle2 size={24} className="mx-auto text-[var(--md-success)] mb-1" />
                      <p className="m-0">Công trường không có điểm nghẽn cản trở.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {openBottlenecks.slice(0, 3).map(b => (
                        <div
                          key={b.id}
                          className="p-2 rounded bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant02)] text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="truncate max-w-[170px]" title={b.name}>{b.name}</span>
                            <span className={`px-1 py-0.2 rounded text-[10px] ${
                              b.severity === 'urgent'
                                ? 'bg-[var(--md-error)] text-white'
                                : 'bg-[var(--md-warning)] text-black'
                            }`}>
                              {b.severity === 'urgent' ? 'Khẩn cấp' : b.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                            </span>
                          </div>
                          {b.reason && (
                            <p className="text-[11px] text-[var(--md-on-surface-variant)] line-clamp-1 mt-0.5 mb-0">
                              {b.reason}
                            </p>
                          )}
                        </div>
                      ))}
                      {openBottlenecks.length > 3 && (
                        <div className="text-[11px] text-[var(--md-on-surface-variant)] text-center">
                          +{openBottlenecks.length - 3} điểm nghẽn khác
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--md-outline-variant02)] flex items-center justify-between">
                <span className="text-xs text-[var(--md-on-surface-variant)]">
                  {isBottlenecksError ? '—' : `${criticalBottlenecks.length} điểm nghẽn khẩn cấp`}
                </span>
                <Link
                  to={cskhProjectPath(project.projectCode, 'bottlenecks')}
                  className="text-xs text-[var(--md-primary)] font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Chi tiết điểm nghẽn</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Pillar 3: Procurement Pipeline */}
            <div className="rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-lowest)] p-4 sm:p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--md-outline-variant02)]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-primary)]">
                      <ShoppingCart size={18} aria-hidden />
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--md-on-surface)] m-0">
                      3. Tiến độ Cung ứng & Mua sắm
                    </h3>
                  </div>
                  {progressQ.isError ? (
                    <Badge status="rejected" label="Lỗi tải dữ liệu" />
                  ) : (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--md-surface-container-high)] text-[var(--md-primary)]">
                      {procurementProgress}%
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {progressQ.isError ? (
                    <div className="py-4 text-center text-[var(--md-error)]">
                      <AlertTriangle size={24} className="mx-auto text-[var(--md-error)] mb-1" />
                      <p className="m-0 font-medium">Không thể tải dữ liệu tiến độ cung ứng</p>
                      <button
                        type="button"
                        onClick={() => progressQ.refetch()}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-[var(--md-error)] bg-[var(--md-error-container)] text-[var(--md-on-error-container)] hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        <span>Thử lại</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--md-on-surface-variant)]">Tổng đơn hàng PO:</span>
                        <strong className="font-mono tabular-nums text-[var(--md-on-surface)]">{orders.length} đơn</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--md-on-surface-variant)]">Đã giao đủ 100%:</span>
                        <strong className="font-mono tabular-nums text-[var(--md-success)]">{fullyDeliveredOrders.length} đơn</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--md-on-surface-variant)]">Đang giao / chờ nhập:</span>
                        <strong className="font-mono tabular-nums text-[var(--md-warning)]">{inProgressOrders.length} đơn</strong>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-[var(--md-on-surface-variant)]">
                          <span>Mức độ hoàn thành giao hàng:</span>
                          <span className="font-mono tabular-nums">{procurementProgress}%</span>
                        </div>
                        <div className="w-full bg-[var(--md-surface-container-highest)] h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--md-primary)] rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, procurementProgress)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--md-outline-variant02)] flex items-center justify-between">
                <span className="text-xs text-[var(--md-on-surface-variant)]">
                  {progressQ.isError ? '—' : `${orders.length} PO cho công trình`}
                </span>
                <Link
                  to={`/operations/projects?project=${encodeURIComponent(project.projectCode)}`}
                  className="text-xs text-[var(--md-primary)] font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Xem Gantt cung ứng</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Pillar 4: Project Warehouse & Stock */}
            <div className="rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-lowest)] p-4 sm:p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--md-outline-variant02)]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-secondary)]">
                      <Warehouse size={18} aria-hidden />
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--md-on-surface)] m-0">
                      4. Tồn kho Dự Án Thực Tế
                    </h3>
                  </div>
                  {invQ.isError ? (
                    <Badge status="rejected" label="Lỗi tải dữ liệu" />
                  ) : (
                    <Badge
                      status={activeStockCount > 0 ? 'approved' : 'draft'}
                      label={`${activeStockCount} mặt hàng`}
                    />
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {invQ.isError ? (
                    <div className="py-4 text-center text-[var(--md-error)]">
                      <AlertTriangle size={24} className="mx-auto text-[var(--md-error)] mb-1" />
                      <p className="m-0 font-medium">Không thể tải dữ liệu tồn kho dự án</p>
                      <button
                        type="button"
                        onClick={() => invQ.refetch()}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-[var(--md-error)] bg-[var(--md-error-container)] text-[var(--md-on-error-container)] hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        <span>Thử lại</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                    <span className="text-[var(--md-on-surface-variant)]">Tồn thực tế tại công trình:</span>
                    <strong className="font-mono tabular-nums text-sm font-semibold text-[var(--md-on-surface)]">
                      {totalStockQty} SL
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--md-on-surface-variant)]">Đã nhập kho thực tế:</span>
                    <strong className="font-mono tabular-nums text-[var(--md-on-surface)]">
                      {totalImportQty} SL
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--md-on-surface-variant)]">Đã xuất lắp đặt / thi công:</span>
                    <strong className="font-mono tabular-nums text-[var(--md-on-surface)]">
                      {totalDisbursedQty} SL
                    </strong>
                  </div>
                  <p className="text-[11px] text-[var(--md-on-surface-variant)] m-0 pt-1">
                    Cấp vật tư qua phiếu nhập gắn PO, tiêu hao qua phiếu xuất kho công trình.
                  </p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--md-outline-variant02)] flex items-center justify-between">
                <span className="text-xs text-[var(--md-on-surface-variant)]">
                  {invQ.isError ? '—' : `${inventoryLines.length} dòng định mức`}
                </span>
                <Link
                  to={`/warehouse/projects/${encodeURIComponent(project.projectCode)}`}
                  className="text-xs text-[var(--md-primary)] font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Xem thẻ kho dự án</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Pillar 5: Financial & Budget */}
            <div className="rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-lowest)] p-4 sm:p-5 flex flex-col justify-between shadow-sm md:col-span-2 lg:col-span-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--md-outline-variant02)]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-primary)]">
                      <Wallet size={18} aria-hidden />
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--md-on-surface)] m-0">
                      5. Tài chính & Ngân Sách Dự Toán (WBS Financials)
                    </h3>
                  </div>
                  {budgetStatusBadge}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant02)]">
                    <span className="text-xs text-[var(--md-on-surface-variant)] block">Tổng ngân sách duyệt:</span>
                    <strong className="font-mono text-base font-bold text-[var(--md-on-surface)] block mt-0.5">
                      {formatCurrencyFull(materialBudget)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant02)]">
                    <span className="text-xs text-[var(--md-on-surface-variant)] block">Đã giải ngân nhập kho:</span>
                    <strong className="font-mono text-base font-bold text-[var(--md-success)] block mt-0.5">
                      {formatCurrencyFull(approvedImportValue)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant02)]">
                    <span className="text-xs text-[var(--md-on-surface-variant)] block">Ngân sách còn lại:</span>
                    <strong className={`font-mono text-base font-bold block mt-0.5 ${isOverBudget ? 'text-[var(--md-error)]' : 'text-[var(--md-on-surface)]'}`}>
                      {formatCurrencyFull(materialBudgetRemaining)}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-[var(--md-on-surface-variant)]">
                    <span>Tiến độ tiêu hao ngân sách vật tư:</span>
                    <span className="font-mono font-semibold tabular-nums">{budgetUsedPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[var(--md-surface-container-highest)] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverBudget
                          ? 'bg-[var(--md-error)]'
                          : isNearLimit
                            ? 'bg-[var(--md-warning)]'
                            : 'bg-[var(--md-primary)]'
                      }`}
                      style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--md-on-surface-variant)] m-0">
                    {budgetHint}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--md-outline-variant02)] flex items-center justify-between">
                <span className="text-xs text-[var(--md-on-surface-variant)]">
                  Kiểm soát cầu dao chi phí mua hàng
                </span>
                <Link
                  to={`/warehouse/projects/${encodeURIComponent(project.projectCode)}`}
                  className="text-xs text-[var(--md-primary)] font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Chi tiết dự toán WBS</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
