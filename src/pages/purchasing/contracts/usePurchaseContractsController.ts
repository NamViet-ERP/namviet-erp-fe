import { useMemo, useRef, useState } from 'react';
import { showToast } from '../../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../../constants/pagination';
import { usePermission } from '../../../hooks/usePermission';
import { useProjects } from '../../../hooks/useProjects';
import {
  useCreatePurchaseContract,
  useDeletePurchaseContract,
  useImportPurchaseContractsFromPo,
  usePurchaseContract,
  usePurchaseContracts,
  useUpdatePurchaseContract,
  useUploadPurchaseContractFile,
} from '../../../hooks/usePurchaseContracts';
import { usePurchaseOrders } from '../../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../../hooks/useSuppliers';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { purchaseContractsService } from '../../../services/purchaseContractsService';
import { findSupplierByName } from '../../../services/suppliersService';
import type { PurchaseContractApiDto } from '../../../types/api/purchasingApi';
import { parseCurrencyInput } from '../../../utils/currencyInput';

export const CONTRACT_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'active', label: 'Hiệu lực' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export function contractStatusTone(status: string): 'ok' | 'warn' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'active':
      return 'ok';
    case 'draft':
      return 'warn';
    case 'expired':
    case 'void':
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function contractStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Nháp';
    case 'active':
      return 'Hiệu lực';
    case 'expired':
      return 'Hết hạn';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

export type ContractFormState = {
  contractNo: string;
  title: string;
  poCode: string;
  projectCode: string;
  supplierName: string;
  status: string;
  signedDate: string;
  effectiveFrom: string;
  effectiveTo: string;
  amount: string;
  note: string;
};

function emptyForm(): ContractFormState {
  return {
    contractNo: '',
    title: '',
    poCode: '',
    projectCode: '',
    supplierName: '',
    status: 'draft',
    signedDate: '',
    effectiveFrom: '',
    effectiveTo: '',
    amount: '',
    note: '',
  };
}

function fromRow(row: PurchaseContractApiDto): ContractFormState {
  return {
    contractNo: row.contractNo ?? '',
    title: row.title ?? '',
    poCode: row.poCode ?? '',
    projectCode: row.projectCode ?? '',
    supplierName: row.supplierName ?? '',
    status: row.status || 'draft',
    signedDate: row.signedDate ? String(row.signedDate).slice(0, 10) : '',
    effectiveFrom: row.effectiveFrom ? String(row.effectiveFrom).slice(0, 10) : '',
    effectiveTo: row.effectiveTo ? String(row.effectiveTo).slice(0, 10) : '',
    amount: row.amount != null && row.amount > 0 ? String(row.amount) : '',
    note: row.note ?? '',
  };
}

export function usePurchaseContractsController() {
  const { has } = usePermission();
  const canCreate = has('purchasing.contracts.create');
  const canUpdate = has('purchasing.contracts.update');
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const { data: suppliersPage } = useSuppliers({ all: true });
  const { data: ordersPage } = usePurchaseOrders({ page: 1, pageSize: 200 });
  const projects = projectsPage?.items ?? [];
  const suppliers = suppliersPage?.items ?? [];
  const orders = useMemo(() => ordersPage?.items ?? [], [ordersPage?.items]);

  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ContractFormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectableOrders = useMemo(() => {
    const hasSup = Boolean(form.supplierName?.trim());
    const hasProj = Boolean(form.projectCode?.trim());
    if (!hasSup && !hasProj) return orders;

    const sup = form.supplierName.trim().toLowerCase();
    const proj = form.projectCode.trim().toLowerCase();

    return [...orders].sort((a, b) => {
      const aBoth = hasSup && hasProj && a.supplierName?.trim().toLowerCase() === sup && a.projectCode?.trim().toLowerCase() === proj;
      const bBoth = hasSup && hasProj && b.supplierName?.trim().toLowerCase() === sup && b.projectCode?.trim().toLowerCase() === proj;
      if (aBoth !== bBoth) return aBoth ? -1 : 1;

      const aSup = hasSup && a.supplierName?.trim().toLowerCase() === sup;
      const bSup = hasSup && b.supplierName?.trim().toLowerCase() === sup;
      if (aSup !== bSup) return aSup ? -1 : 1;

      const aProj = hasProj && a.projectCode?.trim().toLowerCase() === proj;
      const bProj = hasProj && b.projectCode?.trim().toLowerCase() === proj;
      if (aProj !== bProj) return aProj ? -1 : 1;

      return 0;
    });
  }, [orders, form.supplierName, form.projectCode]);

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      projectCode: projectCode.trim() || undefined,
      status: status || undefined,
    }),
    [page, pageSize, search, projectCode, status],
  );
  const hasFilters = Boolean(search.trim() || projectCode.trim() || status);

  const handleResetFilters = () => {
    setSearch('');
    setProjectCode('');
    setStatus('');
    setPage(1);
  };

  const { data, isLoading, isError, error } = usePurchaseContracts(listParams);
  const detailQuery = usePurchaseContract(selectedId ?? undefined);
  const createMutation = useCreatePurchaseContract();
  const updateMutation = useUpdatePurchaseContract();
  const uploadMutation = useUploadPurchaseContractFile();
  const deleteMutation = useDeletePurchaseContract();
  const importMutation = useImportPurchaseContractsFromPo();

  const items = data?.items ?? [];
  const totalItems = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const busy =
    createMutation.isPending
    || updateMutation.isPending
    || uploadMutation.isPending
    || deleteMutation.isPending
    || importMutation.isPending;

  const openCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setForm(emptyForm());
  };

  const openEdit = (row: PurchaseContractApiDto) => {
    setCreating(false);
    setSelectedId(row.id);
    setForm(fromRow(row));
  };

  const closeModal = () => {
    if (busy) return;
    setCreating(false);
    setSelectedId(null);
    setForm(emptyForm());
  };

  const patchForm = (patch: Partial<ContractFormState>) => {
    setForm(prev => ({ ...prev, ...patch }));
  };

  const buildBody = () => {
    const matched = findSupplierByName(suppliers, form.supplierName);
    const amountNum = parseCurrencyInput(form.amount);
    return {
      contractNo: form.contractNo.trim(),
      title: form.title.trim(),
      poCode: form.poCode.trim() || null,
      projectCode: form.projectCode.trim() || null,
      supplierId: matched?.id ?? null,
      status: form.status || 'draft',
      signedDate: form.signedDate || null,
      effectiveFrom: form.effectiveFrom || null,
      effectiveTo: form.effectiveTo || null,
      amount: Number.isFinite(amountNum) && amountNum > 0 ? amountNum : null,
      note: form.note.trim() || null,
    };
  };

  const onSave = async () => {
    if (!form.contractNo.trim() || !form.title.trim()) {
      showToast('warning', 'Nhập số hợp đồng và tiêu đề.');
      return;
    }
    try {
      if (creating) {
        const created = await createMutation.mutateAsync(buildBody());
        showToast('success', `Đã tạo ${created.code}.`);
        setCreating(false);
        setSelectedId(created.id);
        setForm(fromRow(created));
      } else if (selectedId) {
        const updated = await updateMutation.mutateAsync({ id: selectedId, body: buildBody() });
        showToast('success', `Đã cập nhật ${updated.code}.`);
        setForm(fromRow(updated));
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lưu được hợp đồng.'));
    }
  };

  const onUpload = async (file: File) => {
    if (!selectedId) return;
    try {
      const updated = await uploadMutation.mutateAsync({ id: selectedId, file });
      showToast('success', 'Đã tải file hợp đồng.');
      setForm(fromRow(updated));
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được file.'));
    }
  };

  const onDownload = async (row: PurchaseContractApiDto) => {
    if (!row.hasFile || !row.fileName) return;
    try {
      await purchaseContractsService.download(row.id, row.fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được tệp hợp đồng.'));
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      showToast('success', 'Đã xóa hợp đồng.');
      if (selectedId === deleteId) closeModal();
      setDeleteId(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được hợp đồng.'));
    }
  };

  const onImportFromPo = () => {
    void importMutation
      .mutateAsync()
      .then(r => {
        showToast('success', `Đã nhập ${r.imported} HĐ từ PO (bỏ qua ${r.skipped} đã có).`);
      })
      .catch(err => {
        showToast('error', getApiErrorMessage(err, 'Không nhập được từ PO.'));
      });
  };

  const modalOpen = creating || Boolean(selectedId);
  const modalTitle = creating
    ? 'Tạo hợp đồng'
    : detailQuery.data
      ? `Hợp đồng ${detailQuery.data.code}`
      : 'Chi tiết hợp đồng';
  const errorMessage = isError ? getApiErrorMessage(error, 'Không tải được danh sách hợp đồng.') : null;
  const pagination =
    totalItems > 0 && !isLoading && !isError
      ? {
          embedded: true,
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          onPageChange: setPage,
          onPageSizeChange: (size: ListPageSize) => {
            setPageSize(size);
            setPage(1);
          },
        }
      : undefined;

  return {
    canCreate,
    canUpdate,
    projects,
    suppliers,
    orders,
    selectableOrders,
    search,
    setSearch,
    projectCode,
    setProjectCode,
    status,
    setStatus,
    setPage,
    hasFilters,
    handleResetFilters,
    items,
    isLoading,
    errorMessage,
    pagination,
    detailQuery,
    busy,
    importPending: importMutation.isPending,
    deletePending: deleteMutation.isPending,
    modalOpen,
    modalTitle,
    creating,
    selectedId,
    form,
    deleteId,
    setDeleteId,
    fileInputRef,
    openCreate,
    openEdit,
    closeModal,
    patchForm,
    onSave,
    onUpload,
    onDownload,
    onConfirmDelete,
    onImportFromPo,
  };
}
