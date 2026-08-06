import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CopyPlus,
  Eye,
  FolderLock,
  FolderOpen,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import CreatePurchasePlanModal from '../../components/purchasing/CreatePurchasePlanModal';
import PurchasePlanVariancePanel from '../../components/purchasing/PurchasePlanVariancePanel';
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
import { usePermission } from '../../hooks/usePermission';
import {
  useApprovePurchasePlanL1,
  useApprovePurchasePlanL2,
  useDeletePurchasePlan,
  usePurchasePlans,
  useRejectPurchasePlan,
  useRemakePurchasePlan,
  useSubmitPurchasePlan,
  useUpdatePurchasePlan,
} from '../../hooks/usePurchasePlans';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import type { PurchasePlanKind } from '../../types/api/purchasingApi';
import type { DropdownItem, TabItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

function planStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'pending_l1': return 'Chờ duyệt cấp 1';
    case 'pending_l2': return 'Chờ duyệt cấp 2';
    case 'approved':
    case 'active': return 'Đã duyệt';
    case 'rejected': return 'Từ chối';
    case 'closed': return 'Đã đóng';
    default: return status || '—';
  }
}

function planStatusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'approved':
    case 'active': return 'pur-erp__pill pur-erp__pill--ok';
    case 'rejected':
    case 'closed': return 'pur-erp__pill pur-erp__pill--danger';
    case 'pending_l1':
    case 'pending_l2': return 'pur-erp__pill pur-erp__pill--warn';
    default: return 'pur-erp__pill pur-erp__pill--warn';
  }
}

/** Meta duyệt cuối (C2 ưu tiên, fallback C1) — giống cột trạng thái phiếu nhập. */
function planApprovalMeta(row: {
  status?: string | null;
  l1ApprovedByName?: string | null;
  l1ApprovedAt?: string | null;
  l2ApprovedByName?: string | null;
  l2ApprovedAt?: string | null;
}) {
  const isApproved = row.status === 'approved' || row.status === 'active';
  if (!isApproved) return null;
  const approver = (row.l2ApprovedByName || row.l1ApprovedByName)?.trim() || '';
  const approvedAt = row.l2ApprovedAt || row.l1ApprovedAt;
  const approvedTime = formatDateTimeVi(approvedAt);
  if (!approver && !approvedTime) return null;
  return { approver, approvedTime };
}

const STATUS_TABS: TabItem[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Nháp' },
  { id: 'pending_l1', label: 'Duyệt cấp 1' },
  { id: 'pending_l2', label: 'Duyệt cấp 2' },
  { id: 'approved', label: 'Đã duyệt' },
  { id: 'rejected', label: 'Từ chối' },
  { id: 'closed', label: 'Đã đóng' },
];

type Props = {
  kind?: PurchasePlanKind;
};

/** Danh sách KHMH hoặc Mua hàng phát sinh — cùng form, lọc theo kind. */
export default function PurchasePlansPage({ kind = 'plan' }: Props) {
  const isAdhoc = kind === 'adhoc';
  const title = isAdhoc ? 'Mua hàng phát sinh' : 'Kế hoạch mua hàng';
  const codeLabel = isAdhoc ? 'Mã phiếu' : 'Mã KHMH';
  const detailBase = isAdhoc ? '/purchasing/adhoc' : '/purchasing/plans';

  const navigate = useNavigate();
  const { has } = usePermission();
  const canSubmit = has('purchasing.plans.submit');
  const canApproveL1 = has('purchasing.plans.approve_l1');
  const canApproveL2 = has('purchasing.plans.approve_l2');
  const canReject = has('purchasing.plans.reject');
  const canRemake = has('purchasing.plans.remake');

  const [activeTab, setActiveTab] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [closeCode, setCloseCode] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showVariance, setShowVariance] = useState(false);

  const deleteMutation = useDeletePurchasePlan();
  const updateMutation = useUpdatePurchasePlan();
  const submitMutation = useSubmitPurchasePlan();
  const approveL1Mutation = useApprovePurchasePlanL1();
  const approveL2Mutation = useApprovePurchasePlanL2();
  const rejectMutation = useRejectPurchasePlan();
  const remakeMutation = useRemakePurchasePlan();

  const status = activeTab === 'all' ? '' : activeTab;

  const listParams = useMemo(() => ({
    page,
    pageSize,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search.trim() || undefined,
    kind,
  }), [page, pageSize, status, dateFrom, dateTo, search, kind]);

  const { data, isLoading, isError, error, refetch } = usePurchasePlans(listParams);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const hasFilters = Boolean(status || dateFrom || dateTo || search.trim());

  const emptyMessage = useMemo(() => {
    if (hasFilters) return `Không tìm thấy ${title.toLowerCase()} khớp bộ lọc hiện tại.`;
    return isAdhoc
      ? 'Chưa có phiếu mua hàng phát sinh. Tạo phiếu mới theo dự án.'
      : 'Chưa có kế hoạch mua hàng. Tạo KHMH mới hoặc import Excel.';
  }, [hasFilters, isAdhoc, title]);

  const resetFilters = () => {
    setActiveTab('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(1);
  };

  const setPlanStatus = async (code: string, next: 'approved' | 'closed') => {
    try {
      await updateMutation.mutateAsync({ code, body: { status: next } });
      showToast(
        'success',
        next === 'approved' ? `Đã mở lại ${code}.` : `Đã đóng ${code}.`,
      );
      setCloseCode(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không đổi được trạng thái.'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteCode) return;
    try {
      await deleteMutation.mutateAsync(deleteCode);
      showToast('success', `Đã xóa ${deleteCode}.`);
      setDeleteCode(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được phiếu.'));
    }
  };

  const runAction = async (
    label: string,
    fn: () => Promise<unknown>,
  ) => {
    try {
      await fn();
      showToast('success', label);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Thao tác thất bại.'));
    }
  };

  return (
    <div className="page-shell pur-erp pur-erp--plan">
      <header className="pur-erp__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">{title}</h1>
          <p className="pur-erp__subtitle">
            {isAdhoc
              ? 'Yêu cầu mua phát sinh theo dự án — duyệt 2 cấp rồi mới tạo PO'
              : 'Kế hoạch mua theo dự án — gửi duyệt Trưởng cung ứng → Sếp, rồi mới tạo PO'}
          </p>
        </div>
        <div className="pur-erp__head-actions">
          {!isAdhoc ? (
            <button
              type="button"
              className="pur-erp__action pur-erp__action--history"
              onClick={() => setShowVariance(v => !v)}
            >
              <AlertTriangle size={14} aria-hidden />
              {showVariance ? 'Ẩn cảnh báo lệch' : 'Cảnh báo lệch KHMH'}
            </button>
          ) : null}
          <button
            type="button"
            className="pur-erp__action pur-erp__action--primary"
            onClick={() => { setEditCode(null); setCreateOpen(true); }}
          >
            <Plus size={14} aria-hidden />
            {isAdhoc ? 'Tạo phiếu phát sinh' : 'Tạo KHMH'}
          </button>
        </div>
      </header>

      <div className="pur-erp__workspace">
        {!isAdhoc && showVariance ? <PurchasePlanVariancePanel /> : null}

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
                placeholder={`Tìm ${codeLabel.toLowerCase()}, dự án, ghi chú…`}
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
              message={getApiErrorMessage(error, `Không tải được danh sách ${title.toLowerCase()}.`)}
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
                    <th>{codeLabel}</th>
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
                  {isAdhoc ? 'Tạo phiếu phát sinh' : 'Tạo KHMH'}
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
                      <th>{codeLabel}</th>
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
                      const isPendingL1 = row.status === 'pending_l1';
                      const isPendingL2 = row.status === 'pending_l2';
                      const isApproved = row.status === 'approved' || row.status === 'active';
                      const isRejected = row.status === 'rejected';
                      const isClosed = row.status === 'closed';
                      const approvalMeta = planApprovalMeta(row);
                      const actionItems: DropdownItem[] = [
                        {
                          label: 'Xem chi tiết',
                          icon: Eye,
                          onClick: () => navigate(`${detailBase}/${encodeURIComponent(row.code)}`),
                        },
                        ...(isDraft && canSubmit
                          ? [{
                              label: 'Gửi duyệt',
                              icon: Send,
                              onClick: () => {
                                void runAction(`Đã gửi duyệt ${row.code}.`, () =>
                                  submitMutation.mutateAsync(row.code));
                              },
                            }]
                          : []),
                        ...(isPendingL1 && canApproveL1
                          ? [{
                              label: 'Duyệt cấp 1',
                              icon: CheckCircle2,
                              onClick: () => {
                                void runAction(`Đã duyệt cấp 1 ${row.code}.`, () =>
                                  approveL1Mutation.mutateAsync(row.code));
                              },
                            }]
                          : []),
                        ...(isPendingL2 && canApproveL2
                          ? [{
                              label: 'Duyệt cấp 2',
                              icon: CheckCircle2,
                              onClick: () => {
                                void runAction(`Đã duyệt cấp 2 ${row.code}.`, () =>
                                  approveL2Mutation.mutateAsync(row.code));
                              },
                            }]
                          : []),
                        ...((isPendingL1 || isPendingL2) && canReject
                          ? [{
                              label: 'Từ chối',
                              icon: XCircle,
                              danger: true,
                              onClick: () => { setRejectCode(row.code); setRejectReason(''); },
                            }]
                          : []),
                        ...(isRejected && canRemake
                          ? [{
                              label: 'Lập phiếu mới',
                              icon: CopyPlus,
                              onClick: () => {
                                void (async () => {
                                  try {
                                    const created = await remakeMutation.mutateAsync(row.code);
                                    showToast('success', `Đã lập phiếu nháp ${created.code}.`);
                                    navigate(`${detailBase}/${encodeURIComponent(created.code)}`);
                                  } catch (err) {
                                    showToast('error', getApiErrorMessage(err, 'Không lập được phiếu mới.'));
                                  }
                                })();
                              },
                            }]
                          : []),
                        ...(isClosed
                          ? [{
                              label: 'Mở lại',
                              icon: FolderOpen,
                              onClick: () => { void setPlanStatus(row.code, 'approved'); },
                            }]
                          : []),
                        ...(isApproved
                          ? [{
                              label: 'Đóng',
                              icon: FolderLock,
                              danger: true,
                              onClick: () => setCloseCode(row.code),
                            }]
                          : []),
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
                        <tr key={row.code} className={isRejected ? 'pur-erp__row--rejected' : undefined}>
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
                            <div className="pur-plan-status-cell">
                              <span className={`pur-plan-status ${planStatusBadgeClass(row.status)}`}>
                                {planStatusLabel(row.status)}
                              </span>
                              {approvalMeta ? (
                                <div className="pur-plan-status-meta">
                                  {approvalMeta.approvedTime ? (
                                    <div className="tabular-nums">{approvalMeta.approvedTime}</div>
                                  ) : null}
                                  {approvalMeta.approver ? (
                                    <div className="pur-plan-status-meta__name" title={approvalMeta.approver}>
                                      {approvalMeta.approver}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                              {isRejected && row.rejectReason ? (
                                <div className="pur-erp__muted text-xs mt-1">{row.rejectReason}</div>
                              ) : null}
                            </div>
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
              <div className="pur-erp__pager">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  onPageSizeChange={s => { setPageSize(s); setPage(1); }}
                  totalItems={totalCount}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <CreatePurchasePlanModal
        open={createOpen}
        kind={kind}
        editCode={editCode}
        onClose={() => { setCreateOpen(false); setEditCode(null); }}
        onCreated={code => navigate(`${detailBase}/${encodeURIComponent(code)}`)}
        onSaved={code => navigate(`${detailBase}/${encodeURIComponent(code)}`)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteCode)}
        title="Xóa phiếu nháp?"
        message={`Xóa ${deleteCode}? Chỉ xóa được khi còn nháp và chưa có PO.`}
        confirmLabel="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => { void confirmDelete(); }}
        onClose={() => setDeleteCode(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(closeCode)}
        title="Đóng phiếu?"
        message={`Đóng ${closeCode}? Sau khi đóng sẽ không tạo thêm PO.`}
        confirmLabel="Đóng"
        variant="danger"
        isLoading={updateMutation.isPending}
        onConfirm={() => { if (closeCode) void setPlanStatus(closeCode, 'closed'); }}
        onClose={() => setCloseCode(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(rejectCode)}
        title="Từ chối duyệt?"
        message={(
          <div className="space-y-2">
            <p>Từ chối {rejectCode}? Phiếu sẽ đánh dấu từ chối; cung ứng có thể Lập phiếu mới.</p>
            <textarea
              className="form-input w-full text-sm"
              rows={3}
              placeholder="Lý do từ chối (tuỳ chọn)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
        )}
        confirmLabel="Từ chối"
        variant="danger"
        isLoading={rejectMutation.isPending}
        onConfirm={() => {
          if (!rejectCode) return;
          void runAction(`Đã từ chối ${rejectCode}.`, async () => {
            await rejectMutation.mutateAsync({ code: rejectCode, reason: rejectReason.trim() || undefined });
            setRejectCode(null);
            setRejectReason('');
          });
        }}
        onClose={() => { setRejectCode(null); setRejectReason(''); }}
      />
    </div>
  );
}
