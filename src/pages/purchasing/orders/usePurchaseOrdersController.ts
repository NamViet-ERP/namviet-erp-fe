import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Undo2 } from 'lucide-react';
import { showToast } from '../../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../../constants/pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermission } from '../../../hooks/usePermission';
import { useProjects } from '../../../hooks/useProjects';
import {
  useApprovePurchaseOrder,
  usePlacePurchaseOrder,
  usePurchaseOrders,
  useUnapprovePurchaseOrder,
} from '../../../hooks/usePurchaseOrders';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type { DropdownItem } from '../../../types';
import type { PurchaseOrderApiDto } from '../../../types/api/purchasingApi';

export function usePurchaseOrdersController() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? searchParams.get('supplier') ?? '';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [supplierName, setSupplierName] = useState(urlSearch);
  const prevUrlSearchRef = useRef(urlSearch);

  useEffect(() => {
    if (urlSearch !== prevUrlSearchRef.current) {
      prevUrlSearchRef.current = urlSearch;
      if (urlSearch) {
        setSupplierName(urlSearch);
        setPage(1);
      }
    }
  }, [urlSearch]);

  const [planCode, setPlanCode] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [orderPlacementStatus, setOrderPlacementStatus] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentWarning, setPaymentWarning] = useState('');

  const approveMutation = useApprovePurchaseOrder();
  const unapproveMutation = useUnapprovePurchaseOrder();
  const placeMutation = usePlacePurchaseOrder();
  const { has } = usePermission();
  const canApprove = has('purchasing.orders.approve');
  const canUnapprove = has('purchasing.orders.unapprove');
  const canPlace = has('purchasing.orders.place');

  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200, status: 'Active' });
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const selectedProject = useMemo(
    () => projects.find(p => p.projectCode === projectCode),
    [projects, projectCode],
  );
  const projectBudgetRemaining = selectedProject
    ? (selectedProject.materialBudgetRemaining
      ?? (selectedProject.materialBudget - (selectedProject.approvedImportValue ?? 0)))
    : 0;

  const debouncedSupplierName = useDebounce(supplierName, 350);
  const debouncedPlanCode = useDebounce(planCode, 350);

  const listParams = useMemo(() => ({
    page,
    pageSize,
    search: debouncedSupplierName.trim() || undefined,
    planCode: debouncedPlanCode.trim() || undefined,
    projectCode: projectCode.trim() || undefined,
    orderPlacementStatus: orderPlacementStatus || undefined,
    deliveryStatus: deliveryStatus || undefined,
    paymentStatus: paymentStatus || undefined,
    paymentWarning: paymentWarning === '' ? undefined : paymentWarning === 'true',
  }), [
    page, pageSize, debouncedSupplierName, debouncedPlanCode, projectCode,
    orderPlacementStatus, deliveryStatus, paymentStatus, paymentWarning,
  ]);

  const { data, isLoading, isError, error } = usePurchaseOrders(listParams);
  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const handleApprove = async (code: string) => {
    try {
      await approveMutation.mutateAsync(code);
      showToast('success', `Đã duyệt ${code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, `Không duyệt được ${code}`));
    }
  };

  const handleUnapprove = async (code: string) => {
    try {
      await unapproveMutation.mutateAsync(code);
      showToast('success', `Đã hủy duyệt ${code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, `Không hủy duyệt được ${code}`));
    }
  };

  const handlePlace = async (code: string) => {
    try {
      await placeMutation.mutateAsync(code);
      showToast('success', `Đã đặt NCC cho ${code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, `Không thể đặt NCC cho ${code}`));
    }
  };

  const rowActions = (row: PurchaseOrderApiDto): DropdownItem[] => [
    ...(canUnapprove && row.approvalStatus === 'approved' && row.orderPlacementStatus !== 'placed'
      ? [{ label: 'Hủy duyệt', icon: Undo2, onClick: () => { void handleUnapprove(row.code); } }]
      : []),
    ...(canPlace && row.approvalStatus === 'approved' && row.orderPlacementStatus !== 'placed'
      ? [{ label: 'Đã đặt NCC', icon: Send, onClick: () => { void handlePlace(row.code); } }]
      : []),
  ];

  const showActionsCol = items.some(row => rowActions(row).length > 0);
  const openOrder = (code: string) => navigate(`/purchasing/orders/${encodeURIComponent(code)}`);
  const navigateNewOrder = () => navigate('/purchasing/orders/new');

  const resetFilters = () => {
    setSupplierName('');
    setPlanCode('');
    setProjectCode('');
    setOrderPlacementStatus('');
    setDeliveryStatus('');
    setPaymentStatus('');
    setPaymentWarning('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    supplierName.trim()
    || planCode.trim()
    || projectCode.trim()
    || orderPlacementStatus
    || deliveryStatus
    || paymentStatus
    || paymentWarning,
  );

  const errorMessage = isError ? getApiErrorMessage(error, 'Không tải được danh sách đơn hàng.') : null;
  const pagination =
    items.length > 0 && !isLoading && !isError
      ? {
          embedded: true,
          itemLabel: 'đơn',
          currentPage: Math.min(page, totalPages),
          totalPages,
          onPageChange: setPage,
          pageSize,
          onPageSizeChange: (s: ListPageSize) => { setPageSize(s); setPage(1); },
          totalItems: totalCount,
        }
      : undefined;

  return {
    supplierName,
    setSupplierName: (v: string) => { setSupplierName(v); setPage(1); },
    planCode,
    setPlanCode: (v: string) => { setPlanCode(v); setPage(1); },
    projectCode,
    setProjectCode: (v: string) => { setProjectCode(v); setPage(1); },
    orderPlacementStatus,
    setOrderPlacementStatus: (v: string) => { setOrderPlacementStatus(v); setPage(1); },
    deliveryStatus,
    setDeliveryStatus: (v: string) => { setDeliveryStatus(v); setPage(1); },
    paymentStatus,
    setPaymentStatus: (v: string) => { setPaymentStatus(v); setPage(1); },
    paymentWarning,
    setPaymentWarning: (v: string) => { setPaymentWarning(v); setPage(1); },
    projects,
    selectedProject,
    projectBudgetRemaining,
    items,
    isLoading,
    errorMessage,
    pagination,
    canApprove,
    approving: approveMutation.isPending,
    showActionsCol,
    hasActiveFilters,
    resetFilters,
    handleApprove,
    rowActions,
    openOrder,
    navigateNewOrder,
  };
}
