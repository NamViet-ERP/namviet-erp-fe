import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import { usePurchasePaymentPlans } from '../../hooks/usePurchasePaymentPlans';
import { useProjects } from '../../hooks/useProjects';
import { usePermission } from '../../hooks/usePermission';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import type { DropdownItem } from '../../types';
import type { PurchasePaymentPlanStageApiDto } from '../../types/api/purchasingApi';

const PAYMENT_PLAN_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'uncompleted', label: 'Chưa thanh toán đủ (còn đợt)' },
  { value: 'paid', label: 'Đã thanh toán đủ' },
  { value: 'partial', label: 'Thanh toán 1 phần' },
  { value: 'none', label: 'Chưa thanh toán đợt nào' },
];

function stageStatusLabel(status: string): string {
  switch (status.trim().toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'đã thanh toán':
      return 'Đã thanh toán';
    case 'in_progress':
    case 'partial':
      return 'Chờ thanh toán';
    default:
      return 'Chưa lập DNTT';
  }
}

function stageTone(status: string): 'paid' | 'open' {
  const s = status.trim().toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'đã thanh toán') return 'paid';
  return 'open';
}

function stagePillClass(tone: 'paid' | 'open'): string {
  return tone === 'paid' ? 'pur-erp__pill pur-erp__pill--ok' : 'pur-erp__pill pur-erp__pill--warn';
}

function StageCell({ stage }: { stage: PurchasePaymentPlanStageApiDto }) {
  const tone = stageTone(stage.paymentStatus);
  return (
    <div className={`pur-pay-plan__stage pur-pay-plan__stage--${tone}`}>
      <div className="pur-pay-plan__stage-money">
        <span className="pur-pay-plan__stage-amt tabular-nums">
          {formatCurrency(stage.amount)}
        </span>
        <span
          className="pur-pay-plan__stage-pct tabular-nums"
          title={`${stage.percent}% giá trị PO`}
        >
          {stage.percent}%
        </span>
      </div>
      <span className={stagePillClass(tone)}>
        {stageStatusLabel(stage.paymentStatus)}
      </span>
    </div>
  );
}

function ProgressCell({
  completed,
  total,
  amount,
}: {
  completed: number;
  total: number;
  amount: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="pur-pay-plan__total">
      <span className="pur-pay-plan__total-amt tabular-nums">{formatCurrency(amount)}</span>
      <div className="pur-pay-plan__progress" aria-label={`Hoàn thành ${completed}/${total}`}>
        <div className="pur-pay-plan__progress-track">
          <div className="pur-pay-plan__progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="pur-pay-plan__progress-label tabular-nums">
          {completed}/{total} đợt
        </span>
      </div>
    </div>
  );
}

/** Kế hoạch thanh toán — sinh từ PO đã duyệt + đợt; trạng thái theo DNTT từng đợt. */
export default function PurchasePaymentPlansPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const { has } = usePermission();
  const canCreate = has('purchasing.payments.create');

  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const projects = projectsPage?.items ?? [];

  const hasActiveFilters = Boolean(search.trim() || projectCode || paymentStatus);

  const resetFilters = () => {
    setSearch('');
    setProjectCode('');
    setPaymentStatus('');
    setPage(1);
  };

  const listParams = useMemo(() => ({
    page,
    pageSize,
    search: search.trim() || undefined,
    projectCode: projectCode || undefined,
    paymentStatus: paymentStatus || undefined,
  }), [page, pageSize, search, projectCode, paymentStatus]);

  const { data, isLoading, isError, error, refetch } = usePurchasePaymentPlans(listParams);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const maxStages = useMemo(
    () => items.reduce((max, row) => Math.max(max, row.totalStages), 0),
    [items],
  );
  const stageHeaders = useMemo(
    () => Array.from({ length: Math.max(maxStages, 1) }, (_, i) => i + 1),
    [maxStages],
  );
  const colCount = 4 + stageHeaders.length;

  const rowActions = (poCode: string): DropdownItem[] => [
    {
      label: 'Xem PO',
      icon: Eye,
      onClick: () => navigate(`/purchasing/orders/${encodeURIComponent(poCode)}`),
    },
    ...(canCreate
      ? [{
          label: 'Tạo DNTT',
          icon: Plus,
          onClick: () => navigate(`/purchasing/payments/new?po=${encodeURIComponent(poCode)}`),
        }]
      : []),
  ];

  return (
    <div className="page-shell pur-erp pur-erp--plan pur-erp--po pur-erp--payment pur-erp--pay-plan">
      <header className="pur-erp__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">Kế hoạch thanh toán</h1>
          <p className="pur-erp__subtitle">
            Theo dõi đợt thanh toán theo PO đã duyệt — tạo DNTT tuần tự theo từng đợt
          </p>
        </div>
        <div className="pur-erp__head-actions">
          <button
            type="button"
            className="pur-erp__action"
            onClick={() => { void refetch(); }}
            aria-label="Tải lại"
          >
            <RefreshCw size={14} aria-hidden />
            Tải lại
          </button>
          {canCreate ? (
            <button
              type="button"
              className="pur-erp__action pur-erp__action--primary"
              onClick={() => navigate('/purchasing/payments/new')}
            >
              <Plus size={14} aria-hidden />
              Tạo DNTT
            </button>
          ) : null}
        </div>
      </header>

      <div className="pur-erp__workspace">
        <div className="pur-erp__filter-card pur-erp__filter-card--po">
          <div className="pur-erp__toolbar pur-erp__toolbar--po">
            <div className="pur-erp__toolbar-fields pur-erp__filter-grid pur-erp__filter-grid--pay-plan">
              <label className="pur-erp__field">
                <span>Tìm kiếm</span>
                <SearchBar
                  value={search}
                  onChange={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                  placeholder="Mã PO, đợt…"
                />
              </label>
              <label className="pur-erp__field">
                <span>Dự án</span>
                <ProjectAutocomplete
                  value={projectCode}
                  onChange={(code) => {
                    setProjectCode(code);
                    setPage(1);
                  }}
                  projects={projects}
                  placeholder="Mã / tên dự án"
                  compact
                />
              </label>
              <label className="pur-erp__field">
                <span>Tình trạng thanh toán</span>
                <select
                  className="pur-erp__select"
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Lọc tình trạng thanh toán"
                >
                  {PAYMENT_PLAN_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {hasActiveFilters ? (
              <div className="pur-erp__toolbar-actions">
                <button
                  type="button"
                  className="hrm-filter-reset"
                  onClick={resetFilters}
                  aria-label="Xóa bộ lọc"
                >
                  <RotateCcw size={14} aria-hidden />
                  Xóa lọc
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="pur-erp__panel">
          {isError ? (
            <EmptyState
              message={getApiErrorMessage(error, 'Không tải được kế hoạch thanh toán.')}
              action={(
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { void refetch(); }}>
                  Thử lại
                </button>
              )}
            />
          ) : (
            <>
              <div className="overflow-x-auto table-scroll">
                <table className="pur-erp__table pur-erp__table--po pur-erp__table--pay-plan">
                  <colgroup>
                    <col className="pur-pay-plan__col-po" />
                    <col className="pur-pay-plan__col-project" />
                    {stageHeaders.map(n => (
                      <col key={n} className="pur-pay-plan__col-stage" />
                    ))}
                    <col className="pur-pay-plan__col-total" />
                    <col className="pur-pay-plan__col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="pur-pay-plan__th-po">Mã PO</th>
                      <th className="pur-pay-plan__th-project">Dự án</th>
                      {stageHeaders.map(n => (
                        <th key={n} className="pur-pay-plan__th-stage">Đợt {n}</th>
                      ))}
                      <th className="pur-pay-plan__th-total">Tổng</th>
                      <th className="pur-pay-plan__th-actions">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <TableSkeletonRows rows={6} colSpan={colCount} />
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={colCount}>
                          <EmptyState message={
                            hasActiveFilters
                              ? 'Không tìm thấy kế hoạch khớp bộ lọc.'
                              : 'Chưa có kế hoạch — duyệt PO có đợt thanh toán để hiện tại đây.'
                          } />
                        </td>
                      </tr>
                    ) : (
                      items.map(row => (
                        <tr key={row.poCode}>
                          <td className="pur-erp__td-code pur-pay-plan__td-po">
                            <button
                              type="button"
                              className="pur-pay-plan__po-link"
                              onClick={() => navigate(`/purchasing/orders/${encodeURIComponent(row.poCode)}`)}
                            >
                              {row.poCode}
                            </button>
                          </td>
                          <td className="pur-pay-plan__td-project">
                            <div className="pur-pay-plan__project">
                              <span className="pur-pay-plan__project-code">
                                {row.projectCode || '—'}
                              </span>
                              {row.projectName ? (
                                <span className="pur-pay-plan__project-name" title={row.projectName}>
                                  {row.projectName}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          {stageHeaders.map(n => {
                            const stage = row.stages.find(s => s.stageNumber === n);
                            return (
                              <td key={n} className="pur-pay-plan__td-stage">
                                {stage ? <StageCell stage={stage} /> : <span className="hrm-empty-cell">—</span>}
                              </td>
                            );
                          })}
                          <td className="pur-pay-plan__td-total">
                            <ProgressCell
                              completed={row.completedStages}
                              total={row.totalStages}
                              amount={row.poTotalAmount}
                            />
                          </td>
                          <td className="text-center pur-pay-plan__td-actions">
                            <Dropdown trigger="Tác vụ" items={rowActions(row.poCode)} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                embedded
                itemLabel="PO"
                currentPage={Math.min(page, totalPages)}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={size => { setPageSize(size); setPage(1); }}
                totalItems={totalCount}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
