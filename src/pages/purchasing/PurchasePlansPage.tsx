import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import CreatePurchasePlanModal from '../../components/purchasing/CreatePurchasePlanModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import TabFilter from '../../components/ui/TabFilter';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import { useDeletePurchasePlan, usePurchasePlans } from '../../hooks/usePurchasePlans';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import type { DropdownItem, TabItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

function planStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'active': return 'Đang mở';
    case 'closed': return 'Đã đóng';
    default: return status || '—';
  }
}

function planStatusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'active': return 'pur-erp__pill pur-erp__pill--ok';
    case 'closed': return 'pur-erp__pill pur-erp__pill--danger';
    default: return 'pur-erp__pill pur-erp__pill--warn';
  }
}

const STATUS_TABS: TabItem[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Nháp' },
  { id: 'active', label: 'Đang mở' },
  { id: 'closed', label: 'Đã đóng' },
];

/** Danh sách KHMH — API, cột theo bảng chính ERP. */
export default function PurchasePlansPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const deleteMutation = useDeletePurchasePlan();

  const status = activeTab === 'all' ? '' : activeTab;

  const listParams = useMemo(() => ({
    page,
    pageSize,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search.trim() || undefined,
  }), [page, pageSize, status, dateFrom, dateTo, search]);

  const { data, isLoading, isError, error, refetch } = usePurchasePlans(listParams);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const hasFilters = Boolean(status || dateFrom || dateTo || search.trim());

  const emptyMessage = useMemo(() => {
    if (hasFilters) return 'Không tìm thấy KHMH khớp bộ lọc hiện tại.';
    return 'Chưa có kế hoạch mua hàng. Tạo KHMH mới hoặc import Excel.';
  }, [hasFilters]);

  const resetFilters = () => {
    setActiveTab('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteCode) return;
    try {
      await deleteMutation.mutateAsync(deleteCode);
      showToast('success', `Đã xóa KHMH ${deleteCode}.`);
      setDeleteCode(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được KHMH.'));
    }
  };

  return (
    <div className="page-shell pur-erp pur-erp--plan">
      <header className="pur-erp__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">Kế hoạch mua hàng</h1>
          <p className="pur-erp__subtitle">Danh sách KHMH theo dự án — tạo mới, import Excel và theo dõi tổng tiền</p>
        </div>
        <div className="pur-erp__head-actions">
          <button
            type="button"
            className="pur-erp__action pur-erp__action--primary"
            onClick={() => { setEditCode(null); setCreateOpen(true); }}
          >
            <Plus size={14} aria-hidden />
            Tạo KHMH
          </button>
        </div>
      </header>

      <div className="pur-erp__workspace">
        <div className="pur-erp__filter-card pur-erp__filter-card--plan">
          <div className="pur-erp__tabs-row">
            <TabFilter
              tabs={STATUS_TABS}
              activeTab={activeTab}
              onChange={id => { setActiveTab(id); setPage(1); }}
            />
          </div>
          <div className="hrm-list-toolbar">
            <div className="hrm-list-toolbar__filters">
              <SearchBar
                value={search}
                onChange={v => { setSearch(v); setPage(1); }}
                placeholder="Tìm mã KHMH, dự án, ghi chú…"
              />
              <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--dates">
                <VoucherDateFilter
                  from={dateFrom}
                  to={dateTo}
                  onFromChange={v => { setDateFrom(v); setPage(1); }}
                  onToChange={v => { setDateTo(v); setPage(1); }}
                  onReset={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                />
                {hasFilters ? (
                  <button type="button" className="hrm-filter-reset" onClick={resetFilters}>
                    <RefreshCw size={14} aria-hidden />
                    Xóa lọc
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="pur-erp__panel">
          {isError ? (
            <EmptyState
              message={getApiErrorMessage(error, 'Không tải được danh sách KHMH.')}
              action={(
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { void refetch(); }}>
                  Thử lại
                </button>
              )}
            />
          ) : isLoading ? (
            <div className="overflow-x-auto table-scroll">
              <table className="pur-erp__table pur-erp__table--plans-list">
                <thead>
                  <tr>
                    <th>Ngày tạo</th>
                    <th>Mã KHMH</th>
                    <th>Dự án</th>
                    <th className="pur-erp__th-num">Dự toán</th>
                    <th className="pur-erp__th-num">Đề xuất</th>
                    <th className="pur-erp__th-num">Mua hàng</th>
                    <th className="pur-erp__th-num">Tổng chi</th>
                    <th className="pur-erp__th-status">Trạng thái</th>
                    <th>Ghi chú</th>
                    <th className="pur-erp__th-actions">Tác vụ</th>
                  </tr>
                </thead>
                <tbody>
                  <TableSkeletonRows rows={8} colSpan={10} />
                </tbody>
              </table>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              message={emptyMessage}
              action={(
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
                  Tạo KHMH
                </button>
              )}
            />
          ) : (
            <>
              <div className="overflow-x-auto table-scroll">
                <table className="pur-erp__table pur-erp__table--plans-list">
                  <thead>
                    <tr>
                      <th>Ngày tạo</th>
                      <th>Mã KHMH</th>
                      <th>Dự án</th>
                      <th className="pur-erp__th-num">Dự toán</th>
                      <th className="pur-erp__th-num">Đề xuất</th>
                      <th className="pur-erp__th-num">Mua hàng</th>
                      <th className="pur-erp__th-num">Tổng chi</th>
                      <th className="pur-erp__th-status">Trạng thái</th>
                      <th>Ghi chú</th>
                      <th className="pur-erp__th-actions">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(row => {
                      const isDraft = row.status === 'draft';
                      const actionItems: DropdownItem[] = [
                        {
                          label: 'Xem chi tiết',
                          icon: Eye,
                          onClick: () => navigate(`/purchasing/plans/${encodeURIComponent(row.code)}`),
                        },
                        ...(isDraft
                          ? [
                              { 
                                label: 'Sửa',
                                icon: Pencil,
                                onClick: () => { setEditCode(row.code); setCreateOpen(true); },
                              },
                              {
                                label: 'Xóa',
                                icon: Trash2,
                                danger: true,
                                onClick: () => setDeleteCode(row.code),
                              },
                            ]
                          : []),
                      ];
                      return (
                        <tr key={row.code}>
                          <td className="tabular-nums">{formatDateTimeVi(row.createdAt) ?? '—'}</td>
                          <td className="pur-erp__td-code">{row.code}</td>
                          <td className="pur-erp__td-project">
                            {row.projectName
                              ? `${row.projectName} (${row.projectCode})`
                              : (row.projectCode || '—')}
                          </td>
                          <td className="pur-erp__td-num">{formatCurrency(row.budgetTotal)} (VNĐ)</td>
                          <td className="pur-erp__td-num">{formatCurrency(row.proposalTotal)} (VNĐ)</td>
                          <td className="pur-erp__td-num">{formatCurrency(row.purchaseTotal)} (VNĐ)</td>
                          <td className="pur-erp__td-num">{formatCurrency(row.paidTotal)} (VNĐ)</td>
                          <td className="pur-erp__td-status">
                            <span className={`pur-plan-status ${planStatusBadgeClass(row.status)}`}>
                              {planStatusLabel(row.status)}
                            </span>
                          </td>
                          <td className="pur-erp__td-note">{row.note || '—'}</td>
                          <td className="pur-erp__td-actions">
                            <Dropdown items={actionItems} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                embedded
                itemLabel="KHMH"
                currentPage={Math.min(page, totalPages)}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={s => { setPageSize(s); setPage(1); }}
                totalItems={totalCount}
              />
            </>
          )}
        </div>
      </div>

      <CreatePurchasePlanModal
        open={createOpen}
        editCode={editCode}
        onClose={() => { setCreateOpen(false); setEditCode(null); }}
        onCreated={code => {
          showToast('info', `Đang mở ${code}`);
          navigate(`/purchasing/plans/${encodeURIComponent(code)}`);
        }}
        onSaved={code => {
          showToast('success', `Đã lưu ${code}.`);
          void refetch();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteCode)}
        onClose={() => setDeleteCode(null)}
        onConfirm={() => { void confirmDelete(); }}
        title="Xóa kế hoạch mua hàng"
        message={deleteCode ? `Xóa KHMH ${deleteCode}? Chỉ xóa được khi đang Nháp và chưa có đơn hàng.` : ''}
        confirmLabel="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
