import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PackagePlus, PackageMinus, PackageX, Package, UserRound, ArrowRightLeft, Pencil, CircleDollarSign, Wallet, AlertTriangle } from 'lucide-react';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { projectStatusBadge } from '../../lib/wms/projectStatusBadge';
import TabFilter from '../../components/ui/TabFilter';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import CurrencyInput from '../../components/ui/CurrencyInput';
import ProjectWarehouseHistoryTab from '../../components/warehouse/ProjectWarehouseHistoryTab';
import HrmNotFound from '../../components/hr/HrmNotFound';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage, getApiFieldErrors } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import { fmtPlannedStock, fmtStockQtyOrDash } from '../../lib/wms/stockQtyFormat';
import { GENERAL_WAREHOUSE_LABEL_LOWER } from '../../lib/wms/stockTerminology';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import { parseCurrencyInput } from '../../utils/currencyInput';
import { MAX_MATERIAL_BUDGET, MAX_MATERIAL_BUDGET_LABEL } from '../../constants/wmsLimits';
import {
  getBudgetRemainingHint,
  getBudgetRemainingTone,
  resolveMaterialBudgetRemaining,
} from '../../lib/wms/projectBudget';
import { useProject, useProjectInventory, useProjectLedger, useCloseProject, useUpdateProject, useUpdateProjectInventoryMinStock } from '../../hooks/useProjects';
import PermissionGate from '../../components/auth/PermissionGate';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { WarehouseProjectApiDto, ProjectWarehouseKeeperDto, UpdateWarehouseProjectRequest } from '../../types/wms';
import WarehouseKeeperMultiSelect from '../../components/warehouse/WarehouseKeeperMultiSelect';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';

type DetailTab = 'stock' | 'history' | 'info';

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';
const MAX_MIN_STOCK_QTY = 1_000_000_000;
const MIN_STOCK_INVALID_MSG = 'Tồn tối thiểu không hợp lệ';

const tabs = [
  { id: 'stock', label: 'Tồn kho' },
  { id: 'history', label: 'Lịch sử phiếu' },
  { id: 'info', label: 'Thông tin' },
];

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

/** Integer ≥ 0 and ≤ MAX; empty rejected (require explicit 0). */
function parseMinStockQty(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isSafeInteger(n) || n < 0 || n > MAX_MIN_STOCK_QTY) return null;
  return n;
}

function minStockDisplayValue(qty: number): string {
  return qty > 0 ? String(qty) : '';
}

function validateEditForm(form: {
  projectName: string;
  materialBudget: string;
  warehouseKeepers: ProjectWarehouseKeeperDto[];
}): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.projectName.trim()) errs.projectName = 'Vui lòng nhập tên công trình';
  if (form.warehouseKeepers.length < 1) {
    errs.warehouseKeepers = 'Chọn ít nhất 1 thủ kho phụ trách';
  }
  if (parseCurrencyInput(form.materialBudget) <= 0) {
    errs.materialBudget = 'Vui lòng nhập ngân sách vật tư';
  } else if (parseCurrencyInput(form.materialBudget) > MAX_MATERIAL_BUDGET) {
    errs.materialBudget = `Ngân sách tối đa ${MAX_MATERIAL_BUDGET_LABEL} đ`;
  }
  return errs;
}

function openEditForm(project: WarehouseProjectApiDto) {
  return {
    projectName: project.projectName,
    pmName: project.pmName && project.pmName !== '—' ? project.pmName : '',
    endDate: toDateInputValue(project.endDate ?? undefined),
    materialBudget: project.materialBudget > 0 ? String(project.materialBudget) : '',
    warehouseKeepers: [...(project.warehouseKeepers ?? [])],
  };
}

export default function ProjectDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('stock');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    projectName: '',
    pmName: '',
    endDate: '',
    materialBudget: '',
    warehouseKeepers: [] as ProjectWarehouseKeeperDto[],
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const canViewPrices = useCanViewWmsPrices();
  const [stockPageRaw, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  /** Per-row draft for Tồn tối thiểu — key = materialCode */
  const [minStockDrafts, setMinStockDrafts] = useState<Record<string, string>>({});
  const [savingMinStockCode, setSavingMinStockCode] = useState<string | null>(null);
  const { data: project, isLoading, isError } = useProject(code);
  const { data: inventory = [], isLoading: invLoading } = useProjectInventory(code);
  const { data: ledger = [] } = useProjectLedger(code);
  const closeMutation = useCloseProject();
  const updateMutation = useUpdateProject();
  const minStockMutation = useUpdateProjectInventoryMinStock();

  const goBack = () => navigate('/warehouse/projects');

  const handleConfirmClose = async () => {
    if (!code || !project) return;
    try {
      await closeMutation.mutateAsync(code);
      setShowCloseConfirm(false);
      showToast('success', `Đã đóng kho dự án. Tồn còn lại đã chuyển về ${GENERAL_WAREHOUSE_LABEL_LOWER}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đóng kho dự án'));
    }
  };

  const openEdit = () => {
    if (!project) return;
    setEditForm(openEditForm(project));
    setEditErrors({});
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!code || !project) return;
    const clientErrors = validateEditForm(editForm);
    if (Object.keys(clientErrors).length > 0) {
      setEditErrors(clientErrors);
      return;
    }

    setEditErrors({});
    try {
      await updateMutation.mutateAsync({
        code,
        body: {
          projectName: editForm.projectName.trim(),
          pmId: EMPTY_PM_ID,
          pmName:
            editForm.warehouseKeepers.map(k => k.displayName).join(', ')
            || editForm.pmName.trim()
            || '—',
          endDate: editForm.endDate || null,
          materialBudget: parseCurrencyInput(editForm.materialBudget),
          status: project.status as UpdateWarehouseProjectRequest['status'],
          warehouseKeepers: editForm.warehouseKeepers,
        },
      });
      setShowEdit(false);
      showToast('success', 'Đã cập nhật thông tin kho dự án.');
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setEditErrors(fieldErrors);
      } else {
        showToast('error', getApiErrorMessage(err, 'Không thể cập nhật kho dự án'));
      }
    }
  };

  const stockWithQty = useMemo(
    () => inventory.filter(
      r => r.actualInventoryQty !== 0
        || r.plannedImportQty !== 0
        || r.plannedExportQty !== 0
        || r.minStockQty > 0,
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
  const totalActualQty = actualStockLines.reduce((s, r) => s + r.actualInventoryQty, 0);
  const approvedImportValue = (() => {
    if (project?.approvedImportValue != null) return project.approvedImportValue;
    return ledger
      .filter(e => e.kind === 'import' && e.status === 'approved' && e.totalValue != null)
      .reduce((sum, e) => sum + (e.totalValue ?? 0), 0);
  })();
  const materialBudgetRemaining = (() => {
    if (!project) return 0;
    if (project.materialBudgetRemaining != null) return project.materialBudgetRemaining;
    return resolveMaterialBudgetRemaining(project.materialBudget, approvedImportValue);
  })();
  const budgetRemainingTone = project
    ? getBudgetRemainingTone(project.materialBudget, materialBudgetRemaining)
    : 'neutral';
  const budgetRemainingHint = project
    ? getBudgetRemainingHint(project.materialBudget, materialBudgetRemaining)
    : undefined;
  const stockTotalPages = Math.max(1, Math.ceil(stockWithQty.length / stockPageSize));
  const stockPage = Math.min(stockPageRaw, stockTotalPages);
  const paginatedStock = stockWithQty.slice(
    (stockPage - 1) * stockPageSize,
    stockPage * stockPageSize,
  );

  const beginMinStockEdit = (materialCode: string, current: number) => {
    setMinStockDrafts(prev => {
      if (prev[materialCode] !== undefined) return prev;
      return { ...prev, [materialCode]: String(current) };
    });
  };

  const cancelMinStockEdit = (materialCode: string) => {
    setMinStockDrafts(prev => {
      const next = { ...prev };
      delete next[materialCode];
      return next;
    });
  };

  const saveMinStock = async (materialCode: string, current: number) => {
    if (!code) return;
    const raw = minStockDrafts[materialCode];
    if (raw === undefined) return;
    const next = parseMinStockQty(raw);
    if (next === null) {
      showToast('error', MIN_STOCK_INVALID_MSG);
      return;
    }
    if (next === current) {
      cancelMinStockEdit(materialCode);
      return;
    }
    setSavingMinStockCode(materialCode);
    try {
      await minStockMutation.mutateAsync({ projectCode: code, materialCode, minStockQty: next });
      cancelMinStockEdit(materialCode);
      showToast('success', 'Đã cập nhật tồn tối thiểu.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật tồn tối thiểu'));
    } finally {
      setSavingMinStockCode(null);
    }
  };

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
          !isClosed ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="hrm-header-btn" onClick={openEdit}>
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
            </div>
          ) : (
            <Badge status="completed" />
          )
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
              : project.pmName && project.pmName !== '—'
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
              {belowMinRows.length > 0 && (
                <div className="mx-3 mt-2 mb-0 rounded-lg border border-[var(--md-warning)]/40 bg-[var(--md-warning-container)]/30 px-3 py-2 flex items-start gap-2 text-sm text-[var(--md-on-surface)]">
                  <AlertTriangle size={16} className="text-[var(--md-warning)] shrink-0 mt-0.5" aria-hidden />
                  <p>
                    <strong>{belowMinRows.length}</strong> mặt hàng đang dưới tồn tối thiểu.
                    Kiểm tra cột <strong>Tồn tối thiểu</strong> và lập phiếu nhập bổ sung.
                  </p>
                </div>
              )}
              <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
                <table className="wms-inventory-table project-warehouse-table project-detail-stock-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell whitespace-nowrap">Mã VT</th>
                      <th className="table-header-cell">Tên vật tư</th>
                      <th className="table-header-cell text-center">ĐVT</th>
                      <th className="table-header-cell text-right">Tồn thực tế</th>
                      <th className="table-header-cell text-right" title="Ngưỡng cảnh báo theo dự án">Tồn tối thiểu</th>
                      <th className="table-header-cell text-right">Nhập dự kiến</th>
                      <th className="table-header-cell text-right">Xuất dự kiến</th>
                      <th className="table-header-cell text-right" title="Tồn thực tế + nhập/hoàn trả/chuyển kho dự kiến">Tồn dự kiến</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStock.map(row => {
                      const isBelowMin = row.minStockQty > 0 && row.actualInventoryQty < row.minStockQty;
                      const draft = minStockDrafts[row.materialCode];
                      const isEditing = draft !== undefined;
                      const isSavingRow = savingMinStockCode === row.materialCode;
                      return (
                      <tr key={row.materialCode} className={`table-row wms-inventory-row--interactive${isBelowMin ? ' bg-[color-mix(in_srgb,var(--md-warning)_8%,transparent)]' : ''}`}>
                        <td className="table-cell font-mono text-sm text-[var(--md-primary)] whitespace-nowrap">
                          {row.materialCode}
                        </td>
                        <td className="table-cell max-w-[280px]">
                          <span className="line-clamp-2" title={row.materialName}>{row.materialName}</span>
                        </td>
                        <td className="table-cell text-center">{row.unit}</td>
                        <td className={`table-cell text-right font-semibold tabular-nums${isBelowMin ? ' text-[var(--md-warning)]' : ''}`}>
                          {row.actualInventoryQty}
                        </td>
                        <td className="table-cell text-right align-middle">
                          <PermissionGate permission="wms.projects.update" fallback={
                            <span className="tabular-nums">{row.minStockQty > 0 ? row.minStockQty : '—'}</span>
                          }>
                            <div className="inline-flex items-center justify-end gap-1 min-w-[7.5rem]">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="form-input w-[4.5rem] text-right text-xs tabular-nums py-1 px-1.5"
                                value={isEditing ? draft : minStockDisplayValue(row.minStockQty)}
                                placeholder="0"
                                disabled={isSavingRow}
                                aria-label={`Tồn tối thiểu ${row.materialCode}`}
                                onFocus={() => beginMinStockEdit(row.materialCode, row.minStockQty)}
                                onChange={e => {
                                  const next = e.target.value;
                                  setMinStockDrafts(prev => ({ ...prev, [row.materialCode]: next }));
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void saveMinStock(row.materialCode, row.minStockQty);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    cancelMinStockEdit(row.materialCode);
                                  }
                                }}
                              />
                              {isEditing && (
                                <span className="inline-flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    className="btn btn-text btn-sm px-1 py-0.5 text-[0.6875rem] font-semibold leading-none"
                                    disabled={isSavingRow}
                                    onClick={() => void saveMinStock(row.materialCode, row.minStockQty)}
                                  >
                                    {isSavingRow ? '…' : 'Lưu'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-text btn-sm px-1 py-0.5 text-[0.6875rem] leading-none text-[var(--md-on-surface-variant)]"
                                    disabled={isSavingRow}
                                    onClick={() => cancelMinStockEdit(row.materialCode)}
                                  >
                                    Hủy
                                  </button>
                                </span>
                              )}
                            </div>
                          </PermissionGate>
                        </td>
                        <td className="table-cell text-right tabular-nums stock-qty--pending">
                          {fmtStockQtyOrDash(row.plannedImportQty)}
                        </td>
                        <td className="table-cell text-right tabular-nums stock-qty--reserved">
                          {fmtStockQtyOrDash(row.plannedExportQty)}
                        </td>
                        <td className="table-cell text-right font-semibold tabular-nums">
                          {fmtPlannedStock(row.actualInventoryQty, row.plannedImportQty)}
                        </td>
                      </tr>
                      );
                    })}
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
              <Badge status={projectStatusBadge(project.status)} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Ngân sách vật tư</div>
              <div className="font-semibold tabular-nums">{formatCurrencyFull(project.materialBudget)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Còn lại (đã trừ nhập duyệt)</div>
              <div className={`font-semibold tabular-nums ${materialBudgetRemaining < 0 ? 'text-[var(--md-error)]' : ''}`}>
                {formatCurrencyFull(materialBudgetRemaining)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Ngày kết thúc</div>
              <div className="font-semibold tabular-nums">{formatDateCell(project.endDate ?? undefined)}</div>
            </div>
            <div className="md:col-span-2 text-sm text-[var(--md-on-surface-variant)] text-pretty leading-relaxed">
              Kho dự án lưu tồn thực tế tại công trình. Vật tư cấp qua phiếu nhập; tiêu hao qua phiếu xuất;
              phần dư hoàn về {GENERAL_WAREHOUSE_LABEL_LOWER} qua chuyển kho hoặc khi đóng kho.
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
                <strong>{totalActualQty}</strong> đơn vị) sẽ được hoàn về <strong>{GENERAL_WAREHOUSE_LABEL_LOWER}</strong>.
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

      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Chỉnh sửa kho dự án"
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowEdit(false)}>Hủy</button>
            <button
              type="button"
              className="btn btn-filled"
              disabled={updateMutation.isPending}
              onClick={handleSaveEdit}
            >
              Lưu thay đổi
            </button>
          </>
        }
      >
        <div className="space-y-4 modal-form-bordered">
          <FormField label="Mã kho dự án">
            <input className="form-input font-mono" value={project.projectCode} readOnly disabled />
          </FormField>
          <FormField label="Tên công trình" required error={editErrors.projectName}>
            <input
              className="form-input"
              value={editForm.projectName}
              onChange={e => {
                setEditForm({ ...editForm, projectName: e.target.value });
                if (editErrors.projectName) {
                  setEditErrors(prev => {
                    const next = { ...prev };
                    delete next.projectName;
                    return next;
                  });
                }
              }}
            />
          </FormField>
          <FormField label="Người phụ trách dự án (Thủ kho)" required error={editErrors.warehouseKeepers}>
            <WarehouseKeeperMultiSelect
              value={editForm.warehouseKeepers}
              onChange={warehouseKeepers => {
                setEditForm({ ...editForm, warehouseKeepers });
                if (editErrors.warehouseKeepers) {
                  setEditErrors(prev => {
                    const next = { ...prev };
                    delete next.warehouseKeepers;
                    return next;
                  });
                }
              }}
              placeholder="Chọn ≥1 thủ kho…"
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Ngày kết thúc dự kiến">
              <input
                type="date"
                className="form-input"
                value={editForm.endDate}
                onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
              />
            </FormField>
            <FormField label="Ngân sách Vật tư" required error={editErrors.materialBudget}>
              <CurrencyInput
                suffix="(VNĐ)"
                className="tabular-nums"
                value={editForm.materialBudget}
                onChange={(_raw, numeric) => {
                  setEditForm({ ...editForm, materialBudget: numeric > 0 ? String(numeric) : '' });
                  if (editErrors.materialBudget) {
                    setEditErrors(prev => {
                      const next = { ...prev };
                      delete next.materialBudget;
                      return next;
                    });
                  }
                }}
                placeholder="0"
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
