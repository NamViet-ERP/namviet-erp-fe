import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PackagePlus, PackageMinus, PackageX, Boxes, Package, UserRound, CalendarDays, ArrowRightLeft } from 'lucide-react';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import TabFilter from '../../components/ui/TabFilter';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ProjectWarehouseHistoryTab from '../../components/warehouse/ProjectWarehouseHistoryTab';
import HrmNotFound from '../../components/hr/HrmNotFound';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import { fmtExpectedStock, fmtPlannedNet, fmtStockQtyOrDash } from '../../lib/wms/stockQtyFormat';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import { useProject, useProjectInventory, useCloseProject } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';

type DetailTab = 'stock' | 'history' | 'info';

const tabs = [
  { id: 'stock', label: 'Tồn kho' },
  { id: 'history', label: 'Lịch sử phiếu' },
  { id: 'info', label: 'Thông tin' },
];

export default function ProjectDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('stock');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [stockPageRaw, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const { data: project, isLoading, isError } = useProject(code);
  const { data: inventory = [], isLoading: invLoading } = useProjectInventory(code);
  const closeMutation = useCloseProject();

  const goBack = () => navigate('/warehouse/projects');

  const handleConfirmClose = async () => {
    if (!code || !project) return;
    try {
      await closeMutation.mutateAsync(code);
      setShowCloseConfirm(false);
      showToast('success', 'Đã đóng kho dự án. Tồn còn lại đã chuyển về kho tổng.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đóng kho dự án'));
    }
  };

  const stockWithQty = useMemo(
    () => inventory.filter(
      r => r.actualInventoryQty !== 0
        || r.plannedImportQty !== 0
        || r.plannedExportQty !== 0,
    ),
    [inventory],
  );
  const actualStockLines = useMemo(
    () => inventory.filter(r => r.actualInventoryQty > 0),
    [inventory],
  );
  const totalActualQty = actualStockLines.reduce((s, r) => s + r.actualInventoryQty, 0);
  const stockTotalPages = Math.max(1, Math.ceil(stockWithQty.length / stockPageSize));
  const stockPage = Math.min(stockPageRaw, stockTotalPages);
  const paginatedStock = stockWithQty.slice(
    (stockPage - 1) * stockPageSize,
    stockPage * stockPageSize,
  );

  if (isLoading) {
    return (
      <div className="hrm-page">
        <div className="mb-6 space-y-3">
          <div className="hrm-table-skeleton h-8 w-72 max-w-full" />
          <div className="hrm-table-skeleton h-4 w-40 max-w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hrm-table-skeleton h-20 rounded-2xl" />
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
                  <th className="table-header-cell text-right">Tồn kỳ vọng</th>
                  <th className="table-header-cell text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody>
                <TableSkeletonRows colSpan={8} />
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
    <div className="hrm-page">
      <HrmDetailHeader
        onBack={goBack}
        title={project.projectName}
        subtitle={`Mã kho: ${project.projectCode}`}
        actions={
          !isClosed ? (
            <div className="flex flex-wrap gap-2">
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
            </div>
          ) : (
            <Badge status="completed" />
          )
        }
      />

      <div className="hrm-stat-grid">
        <HrmStatCard
          label="Tồn thực tế"
          value={totalActualQty}
          hint={`${actualStockLines.length} mặt hàng`}
          icon={Package}
          tone="primary"
        />
        <HrmStatCard
          label="Mặt hàng có tồn"
          value={stockWithQty.length}
          icon={Boxes}
          tone="success"
        />
        <HrmStatCard
          label="Người phụ trách"
          value={project.pmName && project.pmName !== '—' ? project.pmName : '—'}
          icon={UserRound}
          tone="neutral"
        />
        <HrmStatCard
          label="Ngân sách Vật tư"
          value={formatCurrencyFull(project.materialBudget)}
          hint={`Bắt đầu ${formatDateCell(project.startDate)}`}
          icon={CalendarDays}
          tone="neutral"
        />
      </div>

      <HrmPanel noPadding>
        <div className="px-4 pt-3 pb-1 border-b border-[var(--md-outline-variant02)]">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => setActiveTab(id as DetailTab)} />
        </div>

        {activeTab === 'stock' && (
          invLoading ? (
            <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
              <table className="wms-inventory-table project-warehouse-table">
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                      <td colSpan={8}><div className="hrm-table-skeleton" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : stockWithQty.length === 0 ? (
            <EmptyState message="Chưa có vật tư tại kho dự án. Tạo phiếu nhập kho để cấp vật tư." icon={Package} />
          ) : (
            <>
              <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
                <table className="wms-inventory-table project-warehouse-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell whitespace-nowrap">Mã VT</th>
                      <th className="table-header-cell">Tên vật tư</th>
                      <th className="table-header-cell text-center">ĐVT</th>
                      <th className="table-header-cell text-right">Tồn thực tế</th>
                      <th className="table-header-cell text-right">Nhập dự kiến</th>
                      <th className="table-header-cell text-right">Xuất dự kiến</th>
                      <th className="table-header-cell text-right" title="Nhập dự kiến − Xuất dự kiến">Tồn dự kiến</th>
                      <th className="table-header-cell text-right" title="Tồn thực tế + Tồn dự kiến">Tồn kỳ vọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStock.map(row => (
                      <tr key={row.materialCode} className="table-row wms-inventory-row--interactive">
                        <td className="table-cell font-mono text-sm text-[var(--md-primary)] whitespace-nowrap">
                          {row.materialCode}
                        </td>
                        <td className="table-cell max-w-[280px]">
                          <span className="line-clamp-2" title={row.materialName}>{row.materialName}</span>
                        </td>
                        <td className="table-cell text-center">{row.unit}</td>
                        <td className="table-cell text-right font-semibold tabular-nums">{row.actualInventoryQty}</td>
                        <td className="table-cell text-right tabular-nums stock-qty--pending">
                          {fmtStockQtyOrDash(row.plannedImportQty)}
                        </td>
                        <td className="table-cell text-right tabular-nums stock-qty--reserved">
                          {fmtStockQtyOrDash(row.plannedExportQty)}
                        </td>
                        <td className="table-cell text-right font-semibold tabular-nums">
                          {fmtPlannedNet(row.plannedImportQty, row.plannedExportQty)}
                        </td>
                        <td className="table-cell text-right font-semibold tabular-nums">
                          {fmtExpectedStock(row.actualInventoryQty, row.plannedImportQty, row.plannedExportQty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                embedded
                itemLabel="mặt hàng"
                currentPage={stockPage}
                totalPages={stockTotalPages}
                onPageChange={setStockPage}
                pageSize={stockPageSize}
                onPageSizeChange={size => { setStockPageSize(size); setStockPage(1); }}
                totalItems={stockWithQty.length}
              />
            </>
          )
        )}

        {activeTab === 'history' && code && <ProjectWarehouseHistoryTab projectCode={code} />}

        {activeTab === 'info' && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Loại dự án</div>
              <div className="font-semibold">{project.projectType}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Trạng thái</div>
              <Badge status={isClosed ? 'completed' : 'active'} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Ngân sách vật tư</div>
              <div className="font-semibold tabular-nums">{formatCurrencyFull(project.materialBudget)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Ngày kết thúc</div>
              <div className="font-semibold tabular-nums">{formatDateCell(project.endDate ?? undefined)}</div>
            </div>
            <div className="md:col-span-2 text-sm text-[var(--md-on-surface-variant)] text-pretty leading-relaxed">
              Kho dự án lưu tồn thực tế tại công trình. Vật tư cấp qua phiếu nhập; tiêu hao qua phiếu xuất;
              phần dư hoàn về kho tổng qua chuyển kho hoặc khi đóng kho.
            </div>
          </div>
        )}
      </HrmPanel>

      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleConfirmClose}
        title="Đóng kho dự án?"
        confirmLabel="Đóng kho"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={closeMutation.isPending}
        message={
          <div className="space-y-2 text-left">
            <p>
              Bạn sắp đóng kho <strong>{project.projectName}</strong> ({project.projectCode}).
            </p>
            {actualStockLines.length > 0 ? (
              <p>
                <strong>{actualStockLines.length}</strong> mặt hàng (tổng{' '}
                <strong>{totalActualQty}</strong> đơn vị) sẽ được hoàn về <strong>kho tổng</strong>.
              </p>
            ) : (
              <p>Kho không còn tồn thực tế — chỉ khóa thao tác nhập/xuất.</p>
            )}
            <p className="text-[var(--md-on-surface-variant)]">
              Sau khi đóng, không thể nhập hoặc xuất thêm cho kho dự án này.
            </p>
          </div>
        }
      />
    </div>
  );
}
