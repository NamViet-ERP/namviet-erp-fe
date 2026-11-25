import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../../constants/pagination';
import { usePermission } from '../../../hooks/usePermission';
import {
  useApprovePurchasePlanL1,
  useApprovePurchasePlanL2,
  useDeletePurchasePlan,
  usePurchasePlans,
  useRejectPurchasePlan,
  useRemakePurchasePlan,
  useSubmitPurchasePlan,
  useUpdatePurchasePlan,
} from '../../../hooks/usePurchasePlans';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type { PurchasePlanKind } from '../../../types/api/purchasingApi';

export function usePurchasePlansController(kind: PurchasePlanKind) {
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

  const { data, isLoading, isError, error } = usePurchasePlans(listParams);
  const statsBase = useMemo(() => ({ page: 1, pageSize: 1, kind }), [kind]);
  const { data: statsAll } = usePurchasePlans(statsBase);
  const { data: statsDraft } = usePurchasePlans({ ...statsBase, status: 'draft' });
  const { data: statsPendingL1 } = usePurchasePlans({ ...statsBase, status: 'pending_l1' });
  const { data: statsPendingL2 } = usePurchasePlans({ ...statsBase, status: 'pending_l2' });
  const { data: statsApproved } = usePurchasePlans({ ...statsBase, status: 'approved' });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const pendingCount = (statsPendingL1?.totalCount ?? 0) + (statsPendingL2?.totalCount ?? 0);
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

  const navigateDetail = (code: string) => {
    navigate(`${detailBase}/${encodeURIComponent(code)}`);
  };

  const setPlanStatus = async (code: string, next: 'approved' | 'closed') => {
    try {
      await updateMutation.mutateAsync({ code, body: { status: next } });
      showToast('success', next === 'approved' ? `Đã mở lại ${code}.` : `Đã đóng ${code}.`);
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

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      showToast('success', label);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Thao tác thất bại.'));
    }
  };

  const confirmReject = () => {
    if (!rejectCode) return;
    const targetCode = rejectCode;
    void runAction(`Đã từ chối ${targetCode}.`, async () => {
      await rejectMutation.mutateAsync({
        code: targetCode,
        reason: rejectReason.trim() || undefined,
      });
      setRejectCode(null);
      setRejectReason('');
    });
  };

  const handleRemake = async (code: string) => {
    try {
      const created = await remakeMutation.mutateAsync(code);
      showToast('success', `Đã lập phiếu nháp ${created.code}.`);
      navigateDetail(created.code);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lập được phiếu mới.'));
    }
  };

  const errorMessage = isError
    ? getApiErrorMessage(error, `Không tải được danh sách ${title.toLowerCase()}.`)
    : null;

  const pagination =
    items.length > 0 && !isLoading && !isError
      ? {
          embedded: true,
          itemLabel: isAdhoc ? 'phiếu' : 'KHMH',
          currentPage: page,
          totalPages,
          onPageChange: setPage,
          pageSize,
          onPageSizeChange: (s: ListPageSize) => { setPageSize(s); setPage(1); },
          totalItems: totalCount,
        }
      : undefined;

  return {
    isAdhoc,
    title,
    codeLabel,
    detailBase,
    canSubmit,
    canApproveL1,
    canApproveL2,
    canReject,
    canRemake,
    activeTab,
    setActiveTab,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    createOpen,
    setCreateOpen,
    editCode,
    setEditCode,
    deleteCode,
    setDeleteCode,
    closeCode,
    setCloseCode,
    rejectCode,
    setRejectCode,
    rejectReason,
    setRejectReason,
    showVariance,
    setShowVariance,
    deleteMutation,
    updateMutation,
    submitMutation,
    approveL1Mutation,
    approveL2Mutation,
    rejectMutation,
    items,
    totalCount,
    totalPages,
    isLoading,
    errorMessage,
    pagination,
    statsAll,
    statsDraft,
    statsApproved,
    pendingCount,
    hasFilters,
    emptyMessage,
    resetFilters,
    navigateDetail,
    setPlanStatus,
    confirmDelete,
    confirmReject,
    runAction,
    handleRemake,
  };
}
