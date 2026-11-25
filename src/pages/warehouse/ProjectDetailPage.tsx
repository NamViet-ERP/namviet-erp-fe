import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  CircleDollarSign,
  Package,
  PackageMinus,
  PackagePlus,
  PackageX,
  Pencil,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useSession } from '../../auth/AuthProvider';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmNotFound from '../../components/hr/HrmNotFound';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import Badge from '../../components/ui/Badge';
import TabFilter from '../../components/ui/TabFilter';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import ProjectBudgetTab from '../../components/warehouse/ProjectBudgetTab';
import ProjectWarehouseHistoryTab from '../../components/warehouse/ProjectWarehouseHistoryTab';
import { getSessionUser, isSessionAdmin } from '../../constants/systemUsers';
import { useProject, useProjectInventory, useProjectLedger } from '../../hooks/useProjects';
import { isSystemRoleAccount } from '../../lib/projectPersonnel';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';
import {
  getBudgetRemainingHint,
  getBudgetRemainingTone,
  resolveMaterialBudgetRemaining,
} from '../../lib/wms/projectBudget';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import ProjectDialogs from './projectDetail/ProjectDialogs';
import ProjectInfoTab from './projectDetail/ProjectInfoTab';
import ProjectStockTab from './projectDetail/ProjectStockTab';

type DetailTab = 'stock' | 'budget' | 'history' | 'info';

const tabs = [
  { id: 'stock', label: 'Tồn kho' },
  { id: 'budget', label: 'Dự toán' },
  { id: 'history', label: 'Lịch sử phiếu' },
  { id: 'info', label: 'Thông tin' },
];

export default function ProjectDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('stock');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const canViewPrices = useCanViewWmsPrices();

  const { data: project, isLoading, isError } = useProject(code);
  const inventoryQuery = useProjectInventory(code);
  const ledgerQuery = useProjectLedger(code);
  const inventory = useMemo(() => inventoryQuery.data ?? [], [inventoryQuery.data]);
  const invLoading = inventoryQuery.isLoading;
  const ledger = useMemo(() => ledgerQuery.data ?? [], [ledgerQuery.data]);

  const { user: authUser } = useSession();
  const sessionUser = authUser ?? getSessionUser();
  const isAdmin = isSessionAdmin(sessionUser);

  const goBack = () => navigate('/warehouse/projects');

  const stockWithQty = useMemo(
    () => inventory.filter(
      r => r.actualInventoryQty !== 0
        || r.plannedImportQty !== 0
        || r.plannedExportQty !== 0
        || r.pendingDefectQty !== 0
        || r.minStockQty > 0
        || (r.issuedFromPoQty ?? 0) !== 0
        || (r.issuedFromGeneralQty ?? 0) !== 0,
    ),
    [inventory],
  );
  const belowMinRows = useMemo(
    () => inventory.filter(r => r.minStockQty > 0 && r.actualInventoryQty < r.minStockQty),
    [inventory],
  );
  const actualStockLines = useMemo(
    () => inventory.filter(r => r.actualInventoryQty > 0),
    [inventory],
  );
  const pendingLedgerEntries = useMemo(
    () => ledger.filter(r => r.status === 'draft' || r.status === 'pending'),
    [ledger],
  );
  const pendingStockLines = useMemo(
    () => inventory.filter(r => (r.plannedExportQty ?? 0) > 0 || (r.pendingDefectQty ?? 0) > 0),
    [inventory],
  );
  const totalActualQty = actualStockLines.reduce((s, r) => s + r.actualInventoryQty, 0);

  const approvedImportValue = useMemo(() => {
    if (project?.approvedImportValue != null) return project.approvedImportValue;
    return ledger
      .filter(e => e.kind === 'import' && e.status === 'approved' && e.totalValue != null)
      .reduce((sum, e) => sum + (e.totalValue ?? 0), 0);
  }, [project, ledger]);

  const materialBudgetRemaining = useMemo(() => {
    if (!project) return 0;
    if (project.materialBudgetRemaining != null) return project.materialBudgetRemaining;
    return resolveMaterialBudgetRemaining(project.materialBudget, approvedImportValue);
  }, [project, approvedImportValue]);

  const budgetRemainingTone = project
    ? getBudgetRemainingTone(project.materialBudget, materialBudgetRemaining)
    : 'neutral';
  const budgetRemainingHint = project
    ? getBudgetRemainingHint(project.materialBudget, materialBudgetRemaining)
    : undefined;

  if (isLoading) {
    return (
      <div className="hrm-page project-detail-page">
        <div className="mb-4 space-y-2">
          <div className="hrm-table-skeleton h-7 w-72 max-w-full" />
          <div className="hrm-table-skeleton h-3.5 w-40 max-w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hrm-table-skeleton h-16 rounded-xl" />
          ))}
        </div>
        <HrmPanel noPadding>
          <div className="overflow-x-auto table-scroll">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Mã vật tư</th>
                  <th className="table-header-cell">Tên vật tư</th>
                  <th className="table-header-cell text-right">Tồn thực tế</th>
                  <th className="table-header-cell text-right">Nhập dự kiến</th>
                  <th className="table-header-cell text-right">Xuất dự kiến</th>
                  <th className="table-header-cell text-right">Tồn dự kiến</th>
                  <th className="table-header-cell text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody>
                <TableSkeletonRows colSpan={7} />
              </tbody>
            </table>
          </div>
        </HrmPanel>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <HrmNotFound
        message="Không tìm thấy kho dự án."
        backLabel="Quay lại danh sách kho dự án"
        onBack={goBack}
      />
    );
  }

  const isClosed = project.status === 'Closed';

  return (
    <div className="hrm-page project-detail-page">
      <HrmDetailHeader
        onBack={goBack}
        title={project.projectName}
        subtitle={`Mã kho: ${project.projectCode}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isClosed ? (
              <>
                <button type="button" className="hrm-header-btn" onClick={() => setShowEdit(true)}>
                  <Pencil size={14} /> Chỉnh sửa
                </button>
                <Link
                  to="/warehouse/import"
                  state={{ projectCode: project.projectCode }}
                  className="hrm-header-btn"
                >
                  <PackagePlus size={14} /> Nhập kho
                </Link>
                <Link
                  to="/warehouse/export"
                  state={{ projectCode: project.projectCode }}
                  className="hrm-header-btn"
                >
                  <PackageMinus size={14} /> Xuất kho
                </Link>
                <Link
                  to="/warehouse/transfer"
                  state={{ projectCode: project.projectCode }}
                  className="hrm-header-btn"
                >
                  <ArrowRightLeft size={14} /> Hoàn trả
                </Link>
                <button
                  type="button"
                  className="hrm-header-btn"
                  onClick={() => setShowCloseConfirm(true)}
                >
                  <PackageX size={14} /> Đóng kho
                </button>
              </>
            ) : (
              <Badge status="completed" />
            )}
            {isAdmin && (project.stockMaterialCount ?? 0) === 0 && actualStockLines.length === 0 && stockWithQty.length === 0 && (
              <button
                type="button"
                className="hrm-header-btn text-[var(--md-error)] hover:bg-[color-mix(in_srgb,var(--md-error)_12%,transparent)]"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} /> Xóa kho
              </button>
            )}
          </div>
        }
      />

      <div className="hrm-stat-grid project-detail-stat-grid">
        <HrmStatCard
          label="Tồn thực tế"
          value={totalActualQty}
          hint={`${actualStockLines.length} mặt hàng`}
          icon={Package}
          tone="primary"
        />
        {canViewPrices && (
          <HrmStatCard
            label="Giá trị đã nhập"
            value={formatCurrencyFull(approvedImportValue)}
            hint="Phiếu nhập đã duyệt"
            icon={CircleDollarSign}
            tone="success"
          />
        )}
        {canViewPrices && (
          <HrmStatCard
            label="Ngân sách còn lại"
            value={formatCurrencyFull(materialBudgetRemaining)}
            hint={budgetRemainingHint}
            icon={Wallet}
            tone={budgetRemainingTone}
          />
        )}
        <HrmStatCard
          label="Thủ kho phụ trách"
          value={
            (project.warehouseKeepers?.length ?? 0) > 0
              ? project.warehouseKeepers!.map(k => k.displayName).join(', ')
              : !isSystemRoleAccount(project.pmName)
                ? project.pmName
                : '—'
          }
          icon={UserRound}
          tone="neutral"
        />
      </div>

      <HrmPanel noPadding>
        <div className="px-3 pt-2 pb-0 border-b border-[var(--md-outline-variant02)]">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => setActiveTab(id as DetailTab)} />
        </div>

        {activeTab === 'stock' && code && (
          <ProjectStockTab
            code={code}
            stockWithQty={stockWithQty}
            belowMinRows={belowMinRows}
            isLoading={invLoading}
          />
        )}

        {activeTab === 'budget' && (
          <ProjectBudgetTab
            project={project}
            ledger={ledger}
            onOpenEditBudget={() => setShowEdit(true)}
          />
        )}

        {activeTab === 'history' && code && <ProjectWarehouseHistoryTab projectCode={code} />}

        {activeTab === 'info' && (
          <ProjectInfoTab
            project={project}
            materialBudgetRemaining={materialBudgetRemaining}
          />
        )}
      </HrmPanel>

      {code && (
        <ProjectDialogs
          code={code}
          project={project}
          showCloseConfirm={showCloseConfirm}
          onCloseConfirmCancel={() => setShowCloseConfirm(false)}
          showDeleteConfirm={showDeleteConfirm}
          onDeleteConfirmCancel={() => setShowDeleteConfirm(false)}
          onDeleted={goBack}
          showEdit={showEdit}
          onEditClose={() => setShowEdit(false)}
          pendingLedgerEntries={pendingLedgerEntries}
          pendingStockLines={pendingStockLines}
          actualStockLines={actualStockLines}
          totalActualQty={totalActualQty}
        />
      )}
    </div>
  );
}
