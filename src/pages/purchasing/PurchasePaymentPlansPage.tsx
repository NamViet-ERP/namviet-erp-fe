import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SearchBar from '../../components/ui/SearchBar';
import SectionCard from '../../components/ui/SectionCard';
import SelectField from '../../components/ui/SelectField';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { usePurchasePaymentPlans } from '../../hooks/usePurchasePaymentPlans';
import { getApiErrorMessage } from '../../lib/apiClient';
import type { DropdownItem } from '../../types';
import PurchasePaymentPlansTable from './payments/PurchasePaymentPlansTable';

const PAYMENT_PLAN_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'uncompleted', label: 'Chưa thanh toán đủ (còn đợt)' },
  { value: 'paid', label: 'Đã thanh toán đủ' },
  { value: 'partial', label: 'Thanh toán 1 phần' },
  { value: 'none', label: 'Chưa thanh toán đợt nào' },
];

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

  const items = useMemo(() => data?.items ?? [], [data?.items]);
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

  const errorMessage = isError
    ? getApiErrorMessage(error, 'Không tải được kế hoạch thanh toán.')
    : null;
  const emptyMessage = hasActiveFilters
    ? 'Không tìm thấy kế hoạch khớp bộ lọc.'
    : 'Chưa có kế hoạch — duyệt PO có đợt thanh toán để hiện tại đây.';

  return (
    <PageShell className="pur-erp pur-erp--plan pur-erp--po pur-erp--payment pur-erp--pay-plan">
      <PageHeader
        eyebrow="Mua hàng"
        title="Kế hoạch thanh toán"
        subtitle="Theo dõi đợt thanh toán theo PO đã duyệt — tạo DNTT tuần tự theo từng đợt"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outlined"
              size="sm"
              leftIcon={RefreshCw}
              onClick={() => { void refetch(); }}
              aria-label="Tải lại"
            >
              Tải lại
            </Button>
            {canCreate ? (
              <Button
                type="button"
                variant="filled"
                size="sm"
                leftIcon={Plus}
                onClick={() => navigate('/purchasing/payments/new')}
              >
                Tạo DNTT
              </Button>
            ) : null}
          </div>
        )}
      />

      <SectionCard noPadding>
        <div className="pur-erp__filter-card pur-erp__filter-card--po">
          <div className="pur-erp__toolbar pur-erp__toolbar--po">
            <div className="pur-erp__toolbar-fields pur-erp__filter-grid pur-erp__filter-grid--pay-plan">
              <label className="pur-erp__field">
                <span>Tìm kiếm</span>
                <SearchBar
                  value={search}
                  onChange={value => {
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
                  onChange={nextCode => {
                    setProjectCode(nextCode);
                    setPage(1);
                  }}
                  projects={projects}
                  placeholder="Mã / tên dự án"
                  compact
                />
              </label>
              <label className="pur-erp__field">
                <span>Tình trạng thanh toán</span>
                <SelectField
                  selectClassName="pur-erp__select"
                  value={paymentStatus}
                  onChange={next => {
                    setPaymentStatus(next);
                    setPage(1);
                  }}
                  options={PAYMENT_PLAN_STATUS_OPTIONS}
                  aria-label="Lọc tình trạng thanh toán"
                />
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

        <PurchasePaymentPlansTable
          items={items}
          stageHeaders={stageHeaders}
          isLoading={isLoading}
          errorMessage={errorMessage}
          emptyMessage={emptyMessage}
          onRetry={() => { void refetch(); }}
          onOpenOrder={poCode => navigate(`/purchasing/orders/${encodeURIComponent(poCode)}`)}
          rowActions={rowActions}
          pagination={{
            embedded: true,
            itemLabel: 'PO',
            currentPage: Math.min(page, totalPages),
            totalPages,
            onPageChange: setPage,
            pageSize,
            onPageSizeChange: size => { setPageSize(size); setPage(1); },
            totalItems: totalCount,
          }}
        />
      </SectionCard>
    </PageShell>
  );
}
