import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircleCheck, Eye, Plus, RefreshCw, Send, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import { usePermission } from '../../hooks/usePermission';
import {
  useCancelPurchasePayment,
  usePayPurchasePayment,
  usePurchasePayments,
  useSubmitPurchasePayment,
} from '../../hooks/usePurchasePayments';
import { getApiErrorMessage } from '../../lib/apiClient';
import type { DropdownItem, TabItem } from '../../types';
import PurchasePaymentsTable from './payments/PurchasePaymentsTable';

const STATUS_TABS: TabItem[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Nháp' },
  { id: 'submitted', label: 'Đã gửi' },
  { id: 'paid', label: 'Đã thanh toán' },
  { id: 'cancelled', label: 'Đã hủy' },
];

/** Danh sách đề nghị thanh toán (DNTT). */
export default function PurchasePaymentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createPo = searchParams.get('createFromPo')?.trim() || '';
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const { has, hasAny } = usePermission();
  const canCreate = has('purchasing.payments.create');
  const canSubmit = hasAny(['purchasing.payments.submit', 'purchasing.payments.create']);
  const canPay = hasAny(['purchasing.payments.pay', 'purchasing.payments.create']);
  const canCancel = hasAny(['purchasing.payments.cancel', 'purchasing.payments.create']);

  const submitMutation = useSubmitPurchasePayment();
  const payMutation = usePayPurchasePayment();
  const cancelMutation = useCancelPurchasePayment();

  useEffect(() => {
    if (!createPo) return;
    navigate(`/purchasing/payments/new?po=${encodeURIComponent(createPo)}`, { replace: true });
  }, [createPo, navigate]);

  const status = activeTab === 'all' ? '' : activeTab;

  const listParams = useMemo(() => ({
    page,
    pageSize,
    status: status || undefined,
    search: search.trim() || undefined,
  }), [page, pageSize, status, search]);

  const { data, isLoading, isError, error, refetch } = usePurchasePayments(listParams);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const hasFilters = Boolean(status || search.trim());

  const emptyMessage = useMemo(() => {
    if (hasFilters) return 'Không tìm thấy DNTT khớp bộ lọc hiện tại.';
    return 'Chưa có đề nghị thanh toán. Tạo DNTT từ đơn hàng PO.';
  }, [hasFilters]);

  const runAction = async (okMsg: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      showToast('success', okMsg);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Thao tác thất bại.'));
    }
  };

  const rowActions = (row: (typeof items)[number]): DropdownItem[] => [
    {
      label: 'Xem chi tiết',
      icon: Eye,
      onClick: () => navigate(`/purchasing/payments/${encodeURIComponent(row.code)}`),
    },
    ...(row.status === 'draft' && canSubmit
      ? [{
          label: 'Gửi đề nghị',
          icon: Send,
          onClick: () => {
            void runAction(`Đã gửi ${row.code}.`, () => submitMutation.mutateAsync(row.code));
          },
        }]
      : []),
    ...(row.status === 'submitted' && canPay
      ? [{
          label: 'Ghi nhận đã thanh toán',
          icon: CircleCheck,
          onClick: () => {
            void runAction(`Đã ghi nhận thanh toán ${row.code}.`, () => payMutation.mutateAsync(row.code));
          },
        }]
      : []),
    ...(row.status === 'submitted' && canCancel
      ? [{
          label: 'Hủy đề nghị',
          icon: XCircle,
          danger: true,
          onClick: () => {
            void runAction(`Đã hủy DNTT ${row.code}.`, () => cancelMutation.mutateAsync(row.code));
          },
        }]
      : []),
  ];

  const errorMessage = isError ? getApiErrorMessage(error, 'Không tải được danh sách DNTT.') : null;
  const pagination = !isLoading && totalCount > 0
    ? {
        embedded: true,
        itemLabel: 'DNTT',
        currentPage: Math.min(page, totalPages),
        totalPages,
        onPageChange: setPage,
        pageSize,
        onPageSizeChange: (size: ListPageSize) => { setPageSize(size); setPage(1); },
        totalItems: totalCount,
      }
    : undefined;

  return (
    <PageShell className="pur-erp pur-erp--plan pur-erp--po pur-erp--payment">
      <PageHeader
        eyebrow="Mua hàng"
        title="Đề nghị thanh toán"
        subtitle="DNTT chi NCC theo đợt PO - Nháp - Gửi đề nghị - Ghi nhận đã thanh toán"
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
        <FilterToolbar
          tabs={STATUS_TABS}
          activeTab={activeTab}
          onTabChange={id => { setActiveTab(id); setPage(1); }}
          search={search}
          onSearchChange={v => { setSearch(v); setPage(1); }}
          searchPlaceholder="Mã DNTT, PO, NCC, hóa đơn…"
        />

        <PurchasePaymentsTable
          items={items}
          isLoading={isLoading}
          errorMessage={errorMessage}
          emptyMessage={emptyMessage}
          onRetry={() => { void refetch(); }}
          onOpenPayment={code => navigate(`/purchasing/payments/${encodeURIComponent(code)}`)}
          rowActions={rowActions}
          pagination={pagination}
        />
      </SectionCard>
    </PageShell>
  );
}
