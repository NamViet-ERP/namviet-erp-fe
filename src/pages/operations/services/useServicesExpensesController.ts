import { useMemo, useState } from 'react';
import type { ListPageSize } from '../../../constants/pagination';
import { showToast } from '../../../components/ui/Toast';
import {
  useCreateServiceExpenseItem,
  useDeleteServiceExpenseItem,
  useServiceExpenseItems,
  useToggleServiceExpenseItemActive,
  useUpdateServiceExpenseItem,
} from '../../../hooks/useServiceExpenseItems';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type {
  CreateServiceExpenseItemRequest,
  ServiceExpenseItemApiDto,
  ServiceExpenseType,
} from '../../../types/api/serviceExpenseItem';
import { parseCurrencyInput } from '../../../utils/currencyInput';

export type ServiceExpenseTypeFilter = 'all' | 'service' | 'expense';

export interface ServiceExpenseFormState {
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const initialFormState: ServiceExpenseFormState = {
  code: '',
  name: '',
  type: 'service',
  unit: '',
  referencePrice: '',
  description: '',
  isActive: true,
  sortOrder: 0,
};

export function useServicesExpensesController() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ServiceExpenseTypeFilter>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(15);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceExpenseItemApiDto | null>(null);
  const [formData, setFormData] = useState<ServiceExpenseFormState>(initialFormState);
  const [deleteTarget, setDeleteTarget] = useState<ServiceExpenseItemApiDto | null>(null);

  const queryParams = useMemo(() => ({
    page,
    pageSize,
    search: search.trim() || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    isActive: showInactive ? undefined : true,
  }), [page, pageSize, search, typeFilter, showInactive]);

  const { data, isLoading, isError, refetch } = useServiceExpenseItems(queryParams);
  const createMutation = useCreateServiceExpenseItem();
  const updateMutation = useUpdateServiceExpenseItem();
  const toggleMutation = useToggleServiceExpenseItemActive();
  const deleteMutation = useDeleteServiceExpenseItem();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasActiveFilters = Boolean(search || typeFilter !== 'all' || showInactive);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeFilterChange = (value: ServiceExpenseTypeFilter) => {
    setTypeFilter(value);
    setPage(1);
  };

  const toggleShowInactive = () => {
    setShowInactive(prev => !prev);
    setPage(1);
  };

  const handlePageSizeChange = (size: ListPageSize) => {
    setPageSize(size);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setShowInactive(false);
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      ...initialFormState,
      type: typeFilter === 'expense' ? 'expense' : 'service',
      unit: '',
      sortOrder: total + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: ServiceExpenseItemApiDto) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
      unit: item.unit,
      referencePrice: item.referencePrice != null ? String(item.referencePrice) : '',
      description: item.description ?? '',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setModalOpen(true);
  };

  const handleToggle = async (item: ServiceExpenseItemApiDto) => {
    try {
      await toggleMutation.mutateAsync(item.id);
      showToast('success', `Đã ${item.isActive ? 'tắt' : 'bật'} kích hoạt "${item.code}".`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đổi trạng thái hoạt động.'));
    }
  };

  const handleSave = async () => {
    const code = formData.code.trim().toUpperCase();
    const name = formData.name.trim();
    const unit = formData.unit.trim();

    if (!code) {
      showToast('warning', 'Vui lòng nhập mã dịch vụ / chi phí.');
      return;
    }
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên dịch vụ / chi phí.');
      return;
    }
    if (!unit) {
      showToast('warning', 'Vui lòng chọn đơn vị tính.');
      return;
    }

    const refPriceNum = formData.referencePrice.trim() ? parseCurrencyInput(formData.referencePrice) : null;
    if (refPriceNum != null && (Number.isNaN(refPriceNum) || refPriceNum < 0)) {
      showToast('warning', 'Đơn giá tham chiếu không hợp lệ.');
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: {
            code,
            name,
            type: formData.type,
            unit,
            referencePrice: refPriceNum,
            description: formData.description.trim() || null,
            isActive: formData.isActive,
            sortOrder: formData.sortOrder,
          },
        });
        showToast('success', `Đã cập nhật "${code}".`);
      } else {
        const createPayload: CreateServiceExpenseItemRequest = {
          code,
          name,
          type: formData.type,
          unit,
          referencePrice: refPriceNum,
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder,
        };
        await createMutation.mutateAsync(createPayload);
        showToast('success', `Đã tạo mới "${code}".`);
      }
      setModalOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, editingItem ? 'Không thể cập nhật.' : 'Không thể tạo mới.'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa "${deleteTarget.code}".`);
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa mục này.'));
    }
  };

  return {
    search,
    typeFilter,
    showInactive,
    page,
    pageSize,
    modalOpen,
    editingItem,
    formData,
    deleteTarget,
    items,
    total,
    totalPages,
    hasActiveFilters,
    isLoading,
    isError,
    isSaving,
    isToggling: toggleMutation.isPending,
    isDeleting: deleteMutation.isPending,
    setPage,
    setModalOpen,
    setFormData,
    setDeleteTarget,
    handleSearchChange,
    handleTypeFilterChange,
    toggleShowInactive,
    handlePageSizeChange,
    resetFilters,
    openCreateModal,
    openEditModal,
    handleToggle,
    handleSave,
    handleDeleteConfirm,
    refetch,
  };
}
