import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Plus, RefreshCw } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import TabFilter from '../../components/ui/TabFilter';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import { usePurchasePayments } from '../../hooks/usePurchasePayments';
import { usePermission } from '../../hooks/usePermission';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { formatCurrency } from '../../utils/formatCurrency';
import type { TabItem } from '../../types';

const STATUS_TABS: TabItem[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Nháp' },
  { id: 'submitted', label: 'Đã gửi' },
  { id: 'paid', label: 'Đã thanh toán' },
  { id: 'cancelled', label: 'Đã hủy' },
];

function paymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'submitted': return 'Đã gửi';
    case 'paid': return 'Đã thanh toán';
    case 'cancelled': return 'Đã hủy';
    default: return status || '—';
  }
}

function paymentStatusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'paid': return 'pur-erp__pill pur-erp__pill--ok';
    case 'cancelled': return 'pur-erp__pill pur-erp__pill--danger';
    case 'submitted': return 'pur-erp__pill pur-erp__pill--info';
    default: return 'pur-erp__pill pur-erp__pill--warn';
  }
}

const COL_COUNT = 9;

/** Danh sách đề nghị thanh toán (DNTT). */
export default function PurchasePaymentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createPo = searchParams.get('createFromPo')?.trim() || '';
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const { has } = usePermission();
  const canCreate = has('purchasing.payments.create');

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

  return (
    <div className="page-shell pur-erp pur-erp--plan pur-erp--po pur-erp--payment">
      <header className="pur-erp__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">Đề nghị thanh toán</h1>
          <p className="pur-erp__subtitle">DNTT chi nhà cung cấp — tạo từ đơn hàng PO</p>
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
          <div className="pur-erp__tabs-row">
            <TabFilter
              tabs={STATUS_TABS}
              activeTab={activeTab}
              onChange={id => { setActiveTab(id); setPage(1); }}
            />
          </div>
          <div className="pur-erp__toolbar pur-erp__toolbar--po">
            <div className="pur-erp__toolbar-fields" style={{ flex: 1 }}>
              <SearchBar
                value={search}
                onChange={v => { setSearch(v); setPage(1); }}
                placeholder="Mã DNTT, PO, NCC, hóa đơn…"
              />
            </div>
          </div>
        </div>

        <div className="pur-erp__panel">
          {isError ? (
            <EmptyState
              message={getApiErrorMessage(error, 'Không tải được danh sách DNTT.')}
              action={(
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { void refetch(); }}>
                  Thử lại
                </button>
              )}
            />
          ) : (
            <>
              <div className="overflow-x-auto table-scroll">
                <table className="pur-erp__table pur-erp__table--po pur-erp__table--payments-list">
                  <thead>
                    <tr>
                      <th>Mã DNTT</th>
                      <th>Mã PO</th>
                      <th>Nhà cung cấp</th>
                      <th>Hóa đơn</th>
                      <th className="pur-erp__th-num">Số tiền</th>
                      <th>Hạn TT</th>
                      <th className="pur-erp__th-status">Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <TableSkeletonRows colSpan={COL_COUNT} rows={8} />
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={COL_COUNT}>
                          <EmptyState message={emptyMessage} />
                        </td>
                      </tr>
                    ) : (
                      items.map(row => (
                        <tr
                          key={row.code}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/purchasing/payments/${encodeURIComponent(row.code)}`)}
                        >
                          <td className="pur-erp__td-code">{row.code}</td>
                          <td className="pur-erp__td-code">{row.poCode}</td>
                          <td>{row.supplierName || '—'}</td>
                          <td>{row.invoiceNo || '—'}</td>
                          <td className="pur-erp__td-num">{formatCurrency(row.amount)}</td>
                          <td>{formatDateCell(row.dueDate)}</td>
                          <td className="pur-erp__td-status">
                            <span className={paymentStatusBadgeClass(row.status)}>
                              {paymentStatusLabel(row.status)}
                            </span>
                          </td>
                          <td className="pur-erp__td-datetime">{formatDateTimeVi(row.createdAt)}</td>
                          <td className="pur-erp__td-actions">
                            <button
                              type="button"
                              className="pur-erp__icon-btn"
                              title="Xem phiếu"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/purchasing/payments/${encodeURIComponent(row.code)}`);
                              }}
                            >
                              <Eye size={14} aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!isLoading && totalCount > 0 ? (
                <Pagination
                  embedded
                  itemLabel="DNTT"
                  currentPage={Math.min(page, totalPages)}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  onPageSizeChange={size => { setPageSize(size); setPage(1); }}
                  totalItems={totalCount}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
