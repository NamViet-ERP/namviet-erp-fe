import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FilePlus2,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import TabFilter from '../../components/ui/TabFilter';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import {
  useApproveEstimateL1,
  useConvertEstimateToPlan,
  useCreatePurchaseEstimate,
  usePurchaseEstimates,
  useRejectEstimateApproval,
  useSubmitEstimateApproval,
} from '../../hooks/usePurchaseEstimates';
import { useMaterials } from '../../hooks/useMaterials';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  canSubmitEstimate,
  estimateStatusBadge,
  estimateStatusLabel,
} from '../../lib/purchaseEstimateStatus';
import { formatCurrencyVnd, formatCurrencyFull } from '../../utils/formatCurrency';
import RfqQuotesPanel, { type RfqQuotesPanelHandle } from './RfqQuotesPanel';
import type { DropdownItem, TabItem } from '../../types';
import type { PurchaseEstimateListItemApiDto } from '../../types/api/purchasingApi';

type CreateLine = { key: string; materialCode: string; qty: string; price: string };

const emptyLine = (): CreateLine => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  materialCode: '',
  qty: '',
  price: '',
});

export default function PurchaseEstimateProcurementPage() {
  const { has } = usePermission();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const canViewEstimates = has('purchasing.estimates.view');
  const canViewRfq = has('purchasing.rfq.view');
  const canWriteEstimate = has('purchasing.estimates.create');
  const canUpdateEstimate = has('purchasing.estimates.update');
  const canApproveL1 = has('purchasing.estimates.approve_l1');
  const canConvert = has('purchasing.plans.create');
  const canWriteRfq = has('purchasing.rfq.create');
  const canUpdateRfq = has('purchasing.rfq.update');
  const requestedTab = params.get('tab') === 'rfq' ? 'rfq' : 'estimates';
  const tab = requestedTab === 'rfq'
    ? (canViewRfq ? 'rfq' : 'estimates')
    : (canViewEstimates ? 'estimates' : 'rfq');
  const setTab = (next: 'rfq' | 'estimates') => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    setParams(nextParams, { replace: true });
  };

  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [creating, setCreating] = useState(false);
  const [createProject, setCreateProject] = useState('');
  const [createLines, setCreateLines] = useState<CreateLine[]>([emptyLine()]);
  const rfqPanelRef = useRef<RfqQuotesPanelHandle>(null);

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      projectCode: projectCode || undefined,
    }),
    [page, pageSize, search, projectCode],
  );
  const list = usePurchaseEstimates(listParams);
  const createMutation = useCreatePurchaseEstimate();
  const submitMutation = useSubmitEstimateApproval();
  const approveL1Mutation = useApproveEstimateL1();
  const rejectMutation = useRejectEstimateApproval();
  const convertMutation = useConvertEstimateToPlan();
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const { data: materialsPage } = useMaterials({ page: 1, pageSize: 500 });
  const projects = projectsPage?.items ?? [];
  const materials = materialsPage?.items ?? [];

  const runEstimateAction = async (okMsg: string, action: () => Promise<unknown>) => {
    try {
      await action();
      showToast('success', okMsg);
      void list.refetch();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thực hiện được tác vụ.'));
    }
  };

  const rowActions = (row: PurchaseEstimateListItemApiDto): DropdownItem[] => {
    const items: DropdownItem[] = [
      {
        label: 'Xem chi tiết',
        icon: Eye,
        onClick: () => navigate(`/purchasing/estimate-procurement/${row.id}`),
      },
    ];

    if (canUpdateEstimate && canSubmitEstimate(row.status)) {
      items.push({
        label: 'Gửi duyệt',
        icon: Send,
        onClick: () => {
          void runEstimateAction(`Đã gửi duyệt ${row.code}.`, () => submitMutation.mutateAsync(row.id));
        },
      });
    }

    if (canApproveL1 && row.status === 'pending_approval') {
      items.push(
        { divider: true },
        {
          label: 'Duyệt',
          icon: CheckCircle2,
          onClick: () => {
            void runEstimateAction(`Đã duyệt ${row.code}.`, () =>
              approveL1Mutation.mutateAsync({ id: row.id }));
          },
        },
        {
          label: 'Từ chối',
          icon: XCircle,
          danger: true,
          onClick: () => {
            void runEstimateAction(`Đã từ chối ${row.code}.`, () =>
              rejectMutation.mutateAsync({ id: row.id }));
          },
        },
      );
    }

    if (canConvert && row.status === 'approved') {
      items.push(
        { divider: true },
        {
          label: 'Tạo kế hoạch mua hàng',
          icon: FilePlus2,
          onClick: () => {
            void runEstimateAction(`Đã tạo KHMH từ ${row.code}.`, () => convertMutation.mutateAsync(row.id));
          },
        },
      );
    }

    return items;
  };

  const createProjectName = projects.find(p => p.projectCode === createProject)?.projectName ?? '';
  const selectedCreateProject = useMemo(
    () => projects.find(p => p.projectCode === createProject),
    [projects, createProject],
  );
  const toolbarSelectedProject = useMemo(
    () => projects.find(p => p.projectCode === projectCode),
    [projects, projectCode],
  );
  const createProjectBudgetRemaining = selectedCreateProject
    ? (selectedCreateProject.materialBudgetRemaining ?? (selectedCreateProject.materialBudget - (selectedCreateProject.approvedImportValue ?? 0)))
    : 0;
  const createTotal = useMemo(
    () => createLines.reduce((sum, line) => {
      const qty = Number(String(line.qty).replace(/[^\d.-]/g, '')) || 0;
      const price = Number(String(line.price).replace(/[^\d.-]/g, '')) || 0;
      return sum + qty * price;
    }, 0),
    [createLines],
  );
  const isCreateEstimateOverBudget = Boolean(
    selectedCreateProject
    && selectedCreateProject.materialBudget > 0
    && createTotal > createProjectBudgetRemaining,
  );
  const filledLineCount = createLines.filter(l => l.materialCode).length;

  const saveCreate = async () => {
    if (!createProject) {
      showToast('error', 'Chọn dự án.');
      return;
    }
    const lines = createLines
      .filter(l => l.materialCode)
      .map(l => ({
        materialCode: l.materialCode,
        newQty: Number(String(l.qty).replace(/[^\d.-]/g, '')) || 0,
        estimateUnitPrice: Number(String(l.price).replace(/[^\d.-]/g, '')) || 0,
      }));
    if (lines.length === 0) {
      showToast('error', 'Thêm ít nhất một vật tư.');
      return;
    }
    if (lines.some(l => l.newQty <= 0 || l.estimateUnitPrice <= 0)) {
      showToast('error', 'Mỗi dòng phải có số lượng và giá dự toán lớn hơn 0.');
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        projectCode: createProject,
        title: createProjectName || createProject,
        lines,
      });
      showToast('success', `Đã tạo ${created.code}.`);
      setCreating(false);
      navigate(`/purchasing/estimate-procurement/${created.id}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được dự toán.'));
    }
  };

  const openCreate = () => {
    setCreating(true);
    setCreateProject(projectCode);
    setCreateLines([emptyLine()]);
  };

  return (
    <PurchasingListLayout
      title="Mua hàng dự toán"
      subtitle="Dự toán vật tư theo dự án và giá chào thầu"
      hideSearch
      search=""
      onSearchChange={() => {}}
      actions={
        tab === 'estimates' && canWriteEstimate ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} aria-hidden />
            Tạo dự toán
          </button>
        ) : tab === 'rfq' ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => rfqPanelRef.current?.exportCsv()}
            >
              Xuất CSV
            </button>
            {canWriteRfq ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => rfqPanelRef.current?.openCreate()}
              >
                <Plus size={14} aria-hidden />
                Ghi nhận báo giá mới
              </button>
            ) : null}
          </div>
        ) : null
      }
    >
      <div className="pur-erp__tabs-row px-4 pt-3">
        <TabFilter
          tabs={[
            ...(canViewEstimates ? [{ id: 'estimates', label: 'Dự toán' }] : []),
            ...(canViewRfq ? [{ id: 'rfq', label: 'Giá chào thầu' }] : []),
          ] satisfies TabItem[]}
          activeTab={tab}
          onChange={id => setTab(id as 'rfq' | 'estimates')}
        />
      </div>

      {tab === 'rfq' ? (
        <RfqQuotesPanel
          ref={rfqPanelRef}
          canWrite={canWriteRfq}
          canUpdate={canUpdateRfq}
          hideToolbarActions
        />
      ) : (
        <>
          <div className="hrm-list-toolbar">
            <div className="hrm-list-toolbar__filters">
              <SearchBar
                value={search}
                onChange={v => { setSearch(v); setPage(1); }}
                placeholder="Tìm mã DT / tiêu đề…"
              />
              <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
                <ProjectAutocomplete
                  value={projectCode}
                  onChange={v => { setProjectCode(v); setPage(1); }}
                  projects={projects}
                  placeholder="Lọc dự án"
                />
              </div>
              {toolbarSelectedProject ? (
                <div className="hrm-list-toolbar__filter-row">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container-low)] px-2.5 py-1.5 rounded-md border border-[var(--md-outline-variant02)]">
                    <span className="font-semibold text-[var(--md-primary)]">Ngân sách VT:</span>
                    <span className="font-mono tabular-nums">{formatCurrencyFull(toolbarSelectedProject.materialBudget)}</span>
                    <span>· Còn lại:</span>
                    <span className={`font-mono tabular-nums font-semibold ${(toolbarSelectedProject.materialBudgetRemaining ?? 0) < 0 ? 'text-[var(--md-error)]' : ''}`}>
                      {formatCurrencyFull(toolbarSelectedProject.materialBudgetRemaining ?? (toolbarSelectedProject.materialBudget - (toolbarSelectedProject.approvedImportValue ?? 0)))}
                    </span>
                  </div>
                </div>
              ) : null}
              {projectCode ? (
                <div className="hrm-list-toolbar__filter-row">
                  <button
                    type="button"
                    onClick={() => { setProjectCode(''); setPage(1); }}
                    className="hrm-filter-reset"
                  >
                    <RotateCcw size={14} aria-hidden />
                    Xóa lọc
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <p className="mb-3 px-4 text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            Chọn dự án → thêm vật tư, số lượng, giá dự toán → Gửi duyệt → Trưởng dự án duyệt → tạo Kế hoạch mua hàng.
          </p>
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Mã DT</th>
                  <th className="table-header-cell">Tiêu đề / Dự án</th>
                  <th className="table-header-cell">Số dòng</th>
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell">Ver</th>
                  <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {list.isError ? (
                  <tr>
                    <td colSpan={6} className="table-cell">
                      <EmptyState message={getApiErrorMessage(list.error, 'Không tải được danh sách dự toán.')} />
                    </td>
                  </tr>
                ) : list.isLoading ? (
                  <TableSkeletonRows colSpan={6} />
                ) : (list.data?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell">
                      <EmptyState message="Chưa có dự toán. Tạo mới để bắt đầu." />
                    </td>
                  </tr>
                ) : (
                  (list.data?.items ?? []).map(row => (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell font-mono">{row.code}</td>
                      <td className="table-cell">
                        <div className="font-medium">{row.title}</div>
                        <div className="text-[var(--md-on-surface-variant)]">{row.projectCode}</div>
                      </td>
                      <td className="table-cell tabular-nums">{row.filledLineCount}/{row.lineCount}</td>
                      <td className="table-cell">
                        <span className={`badge ${estimateStatusBadge(row.status)}`}>
                          {estimateStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="table-cell">Ver {row.currentVersion}</td>
                      <td className="table-cell hrm-table-col-actions">
                        <Dropdown trigger="Tác vụ" items={rowActions(row)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, list.data?.totalPages ?? 1)}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={list.data?.totalCount ?? 0}
          />
        </>
      )}

      <Modal
        isOpen={creating}
        onClose={() => !createMutation.isPending && setCreating(false)}
        title="Tạo dự toán"
        size="xl"
        className="modal-form-bordered"
        subtitle="Chọn dự án, lập dòng vật tư rồi tạo phiếu để gửi duyệt."
        footer={(
          <>
            <button
              type="button"
              className="btn btn-text"
              disabled={createMutation.isPending}
              onClick={() => setCreating(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={createMutation.isPending}
              onClick={() => void saveCreate()}
            >
              {createMutation.isPending ? 'Đang tạo…' : 'Tạo dự toán'}
            </button>
          </>
        )}
      >
        <div className="pur-create-plan">
          <div className="pur-create-plan__header-grid">
            <FormField label="Dự án" required className="pur-create-plan__field-project">
              <ProjectAutocomplete
                value={createProject}
                onChange={setCreateProject}
                projects={projects}
                placeholder="Chọn dự án…"
              />
            </FormField>
            <FormField label="Tiêu đề phiếu" className="pur-create-plan__field-note">
              <input
                className="form-input"
                value={createProject ? (createProjectName || createProject) : ''}
                readOnly
                placeholder="Tự lấy theo tên dự án"
                aria-label="Tiêu đề phiếu (theo dự án)"
              />
            </FormField>
          </div>

          {selectedCreateProject ? (
            <div
              className={`p-3 rounded-lg border text-xs my-3 ${
                isCreateEstimateOverBudget
                  ? 'border-[var(--md-error)] bg-[color-mix(in_srgb,var(--md-error)_8%,transparent)] text-[var(--md-on-surface)]'
                  : 'border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-low)] text-[var(--md-on-surface)]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--md-primary)]">
                    Ngân sách dự toán vật tư:
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatCurrencyFull(selectedCreateProject.materialBudget)}
                  </span>
                  <span className="text-[var(--md-on-surface-variant)]">
                    · Còn lại:{' '}
                    <strong
                      className={`font-mono ${createProjectBudgetRemaining < 0 ? 'text-[var(--md-error)]' : ''}`}
                    >
                      {formatCurrencyFull(createProjectBudgetRemaining)}
                    </strong>
                  </span>
                </div>
                {isCreateEstimateOverBudget ? (
                  <div className="flex items-center gap-1 font-semibold text-[var(--md-error)]">
                    <AlertTriangle size={14} aria-hidden />
                    <span>
                      Cảnh báo: Giá trị mua sắm ({formatCurrencyFull(createTotal)}) vượt quá ngân sách còn lại!
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <section className="pur-create-plan__section" aria-label="Dòng vật tư dự toán">
            <div className="pur-create-plan__section-head">
              <div>
                <h3 className="pur-create-plan__section-title">Dòng vật tư</h3>
                <p className="pur-create-plan__section-hint">
                  {filledLineCount > 0
                    ? `${filledLineCount} dòng · Tổng ${formatCurrencyVnd(createTotal)}`
                    : 'Chọn vật tư, nhập số lượng và giá dự toán.'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCreateLines(prev => [...prev, emptyLine()])}
              >
                <Plus size={14} aria-hidden />
                Thêm vật tư
              </button>
            </div>

            <div className="pur-create-plan__table-shell">
              <table className="form-table import-items-table pur-create-plan__table pur-estimate-create__table">
                <thead>
                  <tr>
                    <th className="table-header-cell text-center">#</th>
                    <th className="table-header-cell">Vật tư *</th>
                    <th className="table-header-cell text-center">SL *</th>
                    <th className="table-header-cell text-right">Giá dự toán</th>
                    <th className="table-header-cell text-right">Thành tiền</th>
                    <th className="table-header-cell text-center" aria-label="Xóa" />
                  </tr>
                </thead>
                <tbody>
                  {createLines.map((line, index) => {
                    const qty = Number(String(line.qty).replace(/[^\d.-]/g, '')) || 0;
                    const price = Number(String(line.price).replace(/[^\d.-]/g, '')) || 0;
                    return (
                      <tr key={line.key} className="table-row">
                        <td className="table-cell text-center tabular-nums text-[var(--md-on-surface-variant)]">
                          {index + 1}
                        </td>
                        <td className="table-cell">
                          <MaterialAutocomplete
                            value={line.materialCode}
                            onChange={materialCode => setCreateLines(prev => prev.map(l => l.key === line.key ? { ...l, materialCode } : l))}
                            materials={materials}
                          />
                        </td>
                        <td className="table-cell">
                          <input
                            className="form-input text-center tabular-nums"
                            inputMode="decimal"
                            value={line.qty}
                            onChange={e => setCreateLines(prev => prev.map(l => l.key === line.key ? { ...l, qty: e.target.value } : l))}
                            aria-label={`Số lượng dòng ${index + 1}`}
                          />
                        </td>
                        <td className="table-cell">
                          <CurrencyInput
                            value={line.price}
                            onChange={next => setCreateLines(prev => prev.map(l => l.key === line.key ? { ...l, price: next } : l))}
                            suffix="VND"
                          />
                        </td>
                        <td className="table-cell text-right tabular-nums font-medium">
                          {formatCurrencyVnd(qty * price)}
                        </td>
                        <td className="table-cell text-center">
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            aria-label={`Xóa dòng ${index + 1}`}
                            onMouseDown={e => e.preventDefault()}
                            onClick={e => {
                              (e.currentTarget as HTMLButtonElement).blur();
                              setCreateLines(prev => {
                                if (prev.length <= 1) {
                                  return prev.map(l => (
                                    l.key === line.key ? { ...l, materialCode: '', qty: '', price: '' } : l
                                  ));
                                }
                                return prev.filter(l => l.key !== line.key);
                              });
                            }}
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="table-row">
                    <td className="table-cell" colSpan={4}>
                      <span className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
                        Tổng dự toán
                      </span>
                    </td>
                    <td className="table-cell text-right tabular-nums font-semibold">
                      {formatCurrencyVnd(createTotal)}
                    </td>
                    <td className="table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </Modal>
    </PurchasingListLayout>
  );
}
