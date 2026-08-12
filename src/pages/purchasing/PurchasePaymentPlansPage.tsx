import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, RefreshCw } from 'lucide-react';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import { usePurchasePaymentPlans } from '../../hooks/usePurchasePaymentPlans';
import { usePermission } from '../../hooks/usePermission';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import type { DropdownItem } from '../../types';
import type { PurchasePaymentPlanStageApiDto } from '../../types/api/purchasingApi';

function stageStatusLabel(status: string): string {
  switch (status) {
    case 'paid': return 'Đã thanh toán';
    case 'in_progress': return 'Chưa hoàn thành';
    default: return 'Chưa thanh toán';
  }
}

function stageTone(status: string): 'paid' | 'busy' | 'open' {
  const s = status.trim().toLowerCase();
  if (s === 'paid') return 'paid';
  if (s === 'in_progress') return 'busy';
  return 'open';
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
      <span className={`pur-pay-plan__badge pur-pay-plan__badge--${tone}`}>
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const { has } = usePermission();
  const canCreate = has('purchasing.payments.create');

  const listParams = useMemo(() => ({
    page,
    pageSize,
    search: search.trim() || undefined,
  }), [page, pageSize, search]);

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

  useEffect(() => {
    setPage(1);
  }, [search]);

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
            <div className="pur-erp__toolbar-fields" style={{ flex: 1 }}>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Mã PO, dự án…"
              />
            </div>
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
                            search.trim()
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
