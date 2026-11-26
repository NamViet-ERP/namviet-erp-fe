import { useMemo, useState } from 'react';
import { showToast } from '../../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../../constants/pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  useCreateProject,
  useProjects,
  useUpdateProject,
} from '../../../hooks/useProjects';
import { getApiErrorMessage, getApiFieldErrors } from '../../../lib/apiClient';
import { nextProjectCode } from '../../../lib/cskh/commandCenter';
import { projectsService } from '../../../services/projectsService';
import type { WarehouseProjectApiDto } from '../../../types/wms';

export type ProjectStatusFilter = 'all' | 'Active' | 'Transferring' | 'Closed';

export const PROJECT_STATUS_FILTERS: { id: ProjectStatusFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Active', label: 'Đang triển khai' },
  { id: 'Transferring', label: 'Đang chuyển giao' },
  { id: 'Closed', label: 'Đã đóng' },
];

export type ProjectFormState = {
  projectCode: string;
  projectName: string;
  clientName: string;
  pmName: string;
  scMembers: string[];
  startDate: string;
  endDate: string;
  materialBudget: string;
};

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';

function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const emptyForm = (projectCode = ''): ProjectFormState => ({
  projectCode,
  projectName: '',
  clientName: '',
  pmName: '',
  scMembers: [],
  startDate: todayIso(),
  endDate: '',
  materialBudget: '1',
});

export function projectStatusLabel(status: string) {
  if (status === 'Active') return 'Đang triển khai';
  if (status === 'Closed') return 'Đã đóng';
  if (status === 'Transferring') return 'Đang chuyển giao';
  if (status === 'Transferred') return 'Đã chuyển giao';
  return status;
}

export function useOperationsProjectListController() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WarehouseProjectApiDto | null>(null);
  const [form, setForm] = useState<ProjectFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebounce(search, 350);

  const summaryQuery = useProjects({ page: 1, pageSize: 200 }, { staleTime: 60_000 });
  const summaryData = summaryQuery.data;
  const needsFallbackCounts = (summaryData?.totalCount ?? 0) > 200;

  const canShareSummaryForList =
    !debouncedSearch.trim() && statusFilter === 'all' && page === 1 && pageSize <= 200;

  const listQuery = useProjects(
    {
      page,
      pageSize,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    { enabled: !canShareSummaryForList },
  );

  const fallbackActive = useProjects(
    { page: 1, pageSize: 1, status: 'Active' },
    { enabled: needsFallbackCounts, staleTime: 60_000 },
  );
  const fallbackTransferring = useProjects(
    { page: 1, pageSize: 1, status: 'Transferring' },
    { enabled: needsFallbackCounts, staleTime: 60_000 },
  );
  const fallbackClosed = useProjects(
    { page: 1, pageSize: 1, status: 'Closed' },
    { enabled: needsFallbackCounts, staleTime: 60_000 },
  );

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const items = useMemo(() => {
    if (canShareSummaryForList) {
      return (summaryData?.items ?? []).slice(0, pageSize);
    }
    return listQuery.data?.items ?? [];
  }, [canShareSummaryForList, summaryData?.items, pageSize, listQuery.data?.items]);

  const totalCount = canShareSummaryForList
    ? (summaryData?.totalCount ?? 0)
    : (listQuery.data?.totalCount ?? 0);

  const totalPages = canShareSummaryForList
    ? Math.max(1, Math.ceil((summaryData?.totalCount ?? 0) / pageSize))
    : (listQuery.data?.totalPages ?? 1);

  const isLoading = canShareSummaryForList ? summaryQuery.isLoading : listQuery.isLoading;
  const hasFilters = Boolean(search.trim() || statusFilter !== 'all');
  const pending = createMutation.isPending || updateMutation.isPending;

  const stats = useMemo(() => {
    if (!summaryData) {
      return {
        all: undefined,
        active: undefined,
        transferring: undefined,
        closed: undefined,
      };
    }
    if (needsFallbackCounts) {
      return {
        all: summaryData.totalCount,
        active: fallbackActive.data?.totalCount,
        transferring: fallbackTransferring.data?.totalCount,
        closed: fallbackClosed.data?.totalCount,
      };
    }
    const summaryItems = summaryData.items ?? [];
    return {
      all: summaryData.totalCount,
      active: summaryItems.filter(p => p.status === 'Active').length,
      transferring: summaryItems.filter(p => p.status === 'Transferring').length,
      closed: summaryItems.filter(p => p.status === 'Closed').length,
    };
  }, [
    summaryData,
    needsFallbackCounts,
    fallbackActive.data?.totalCount,
    fallbackTransferring.data?.totalCount,
    fallbackClosed.data?.totalCount,
  ]);

  const openCreate = () => {
    setEditing(null);
    const currentYear = new Date().getFullYear();
    const fallbackCode = nextProjectCode(items.map(p => p.projectCode), currentYear);
    setForm(emptyForm(fallbackCode));
    setErrors({});
    setShowForm(true);

    void projectsService.getNextCode(currentYear).then(res => {
      if (res?.projectCode) {
        setForm(f => ({ ...f, projectCode: res.projectCode }));
      }
    }).catch(() => {
      // Giữ mã fallback nếu mạng hoặc BE chưa phản hồi
    });
  };

  const openEdit = (row: WarehouseProjectApiDto) => {
    setEditing(row);
    const pm = row.pmName?.trim() ?? '';
    setForm({
      projectCode: row.projectCode,
      projectName: row.projectName,
      clientName: row.clientName ?? '',
      pmName: pm,
      scMembers: (row.scMembers ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(s => Boolean(s) && s.toLowerCase() !== pm.toLowerCase()),
      startDate: row.startDate?.slice(0, 10) ?? todayIso(),
      endDate: row.endDate?.slice(0, 10) ?? '',
      materialBudget: String(row.materialBudget || 1),
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (nextStatus: ProjectStatusFilter) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handlePageSizeChange = (size: ListPageSize) => {
    setPageSize(size);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.projectCode.trim()) e.projectCode = 'Nhập mã dự án';
    if (!form.projectName.trim()) e.projectName = 'Nhập tên dự án';
    if (!form.pmName.trim()) e.pmName = 'Nhập PIC / quản lý';
    if (!form.startDate) e.startDate = 'Chọn ngày bắt đầu';
    return e;
  };

  const handleSave = async () => {
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    const budget = Number(String(form.materialBudget).replace(/[^\d.]/g, '')) || 1;
    const scMembersString = form.scMembers.map(s => s.trim()).filter(Boolean).join(', ') || null;
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          code: editing.projectCode,
          body: {
            projectName: form.projectName.trim(),
            pmId: editing.pmId || EMPTY_PM_ID,
            pmName: form.pmName.trim(),
            endDate: form.endDate || null,
            materialBudget: budget,
            status: editing.status as 'Active' | 'Transferring' | 'Transferred' | 'Closed',
            warehouseKeepers: editing.warehouseKeepers ?? [],
            clientName: form.clientName.trim() || null,
            scMembers: scMembersString,
          },
        });
        showToast('success', `Đã cập nhật dự án ${editing.projectCode}.`);
      } else {
        const created = await createMutation.mutateAsync({
          projectCode: form.projectCode.trim(),
          projectName: form.projectName.trim(),
          projectType: 'Project',
          pmId: EMPTY_PM_ID,
          pmName: form.pmName.trim(),
          startDate: form.startDate,
          endDate: form.endDate || null,
          materialBudget: budget,
          warehouseKeepers: [],
          clientName: form.clientName.trim() || null,
          scMembers: scMembersString,
        });
        showToast(
          'success',
          `Đã tạo dự án ${created.projectCode} - kho dự án đã sẵn sàng trong Kho hàng.`,
        );
      }
      setShowForm(false);
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else showToast('error', getApiErrorMessage(err, 'Không lưu được dự án'));
    }
  };

  return {
    search,
    statusFilter,
    page,
    pageSize,
    showForm,
    editing,
    form,
    errors,
    items,
    totalCount,
    totalPages,
    isLoading,
    hasFilters,
    pending,
    stats,
    setPage,
    setShowForm,
    setForm,
    handleSearchChange,
    handleStatusFilterChange,
    handlePageSizeChange,
    resetFilters,
    openCreate,
    openEdit,
    handleSave,
  };
}
