import { useEffect, useMemo, useState } from 'react';
import type { Transfer } from '../../../types';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { downloadVoucherExport } from '../../../lib/wms/voucherExportDownload';
import {
  getTransferFormFieldErrors,
  validateTransferCreate,
  type TransferFormFieldErrors,
} from '../../../lib/wms/transferFormSchema';
import { DUPLICATE_MATERIAL_MESSAGE } from '../../../lib/wms/voucherDuplicateMaterial';
import { getFrozenProjectError } from '../../../lib/wms/stocktakeFreeze';
import { useFrozenProjects } from '../../../hooks/useFrozenProjects';
import {
  useApproveTransfer,
  useCreateTransfer,
  useSubmitTransfer,
  useTransfers,
  useUpdateTransfer,
} from '../../../hooks/useTransfers';
import { getVoucherTabLabels } from '../../../lib/wms/voucherStatusLabels';
import { projectInventoryAvailable } from '../../../lib/wms/stockQtyFormat';
import { transferToFormLines } from '../../../lib/wms/voucherFormPopulate';
import { useMaterials } from '../../../hooks/useMaterials';
import { useProjectInventory, useProjects } from '../../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../../constants/pagination';
import type { CreateTransferDto } from '../../../services/transfersService';
import { emptyQtyPhaseLine } from '../voucher/voucherFormTypes';
import {
  availableReturnQty,
  inventoryRow,
  isCrossProjectTransfer,
  type MaterialQtyPhaseLine,
  type TransferMode,
} from './transferUtils';

export function useTransferListController(initialProjectCode?: string) {
  const [transferTypeTab, setTransferTypeTab] = useState<'all' | 'return' | 'cross-project'>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(Boolean(initialProjectCode));
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [editing, setEditing] = useState<Transfer | null>(null);

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');
  const [toProjectCode, setToProjectCode] = useState('');
  const [transferMode, setTransferMode] = useState<TransferMode>('return');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<MaterialQtyPhaseLine[]>([{ ...emptyQtyPhaseLine }]);
  const [createErrors, setCreateErrors] = useState<TransferFormFieldErrors>({});

  const { data: transfers = [], isLoading, isError, error } = useTransfers({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: projectInventory = [] } = useProjectInventory(projectCode || undefined);
  const createMutation = useCreateTransfer();
  const updateMutation = useUpdateTransfer();
  const approveMutation = useApproveTransfer();
  const submitMutation = useSubmitTransfer();
  const frozenByProjectCode = useFrozenProjects();

  useEffect(() => {
    if (!showCreate) return;
    const sourceErr = getFrozenProjectError(frozenByProjectCode, projectCode);
    const destErr = transferMode === 'cross-project'
      ? getFrozenProjectError(frozenByProjectCode, toProjectCode)
      : undefined;
    if (!sourceErr && !destErr) return;
    setCreateErrors(prev => ({
      ...prev,
      ...(sourceErr ? { projectCode: sourceErr } : {}),
      ...(destErr ? { toProjectCode: destErr } : {}),
    }));
  }, [showCreate, frozenByProjectCode, projectCode, toProjectCode, transferMode]);

  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);

  const targetProjects = useMemo(
    () => projects.filter(p => p.projectCode !== projectCode),
    [projects, projectCode],
  );

  const stockMaterials = useMemo(() => {
    if (!projectCode) return materials;
    const codes = new Set(
      projectInventory
        .filter(r => projectInventoryAvailable(r) > 0)
        .map(r => r.materialCode),
    );
    return materials.filter(m => codes.has(m.materialCode));
  }, [materials, projectInventory, projectCode]);

  const returnTransfers = useMemo(
    () => transfers.filter(t => !isCrossProjectTransfer(t)),
    [transfers],
  );
  const crossProjectTransfers = useMemo(
    () => transfers.filter(t => isCrossProjectTransfer(t)),
    [transfers],
  );
  const typeFiltered = useMemo(() => {
    if (transferTypeTab === 'return') return returnTransfers;
    if (transferTypeTab === 'cross-project') return crossProjectTransfers;
    return transfers;
  }, [transferTypeTab, returnTransfers, crossProjectTransfers, transfers]);

  const typeTabs = [
    { id: 'all', label: 'Tất cả', count: transfers.length },
    { id: 'return', label: 'Hoàn trả kho trung tâm', count: returnTransfers.length },
    { id: 'cross-project', label: 'Chuyển kho dự án', count: crossProjectTransfers.length },
  ];

  const voucherTabs = getVoucherTabLabels('transfer');
  const tabs = [
    { id: 'all', label: 'Tất cả', count: typeFiltered.length },
    { id: 'draft', label: voucherTabs.draft, count: typeFiltered.filter(t => t.status === 'draft').length },
    { id: 'pending', label: voucherTabs.pending, count: typeFiltered.filter(t => t.status === 'pending').length },
    { id: 'approved', label: voucherTabs.approved, count: typeFiltered.filter(t => t.status === 'approved').length },
  ];

  const filtered = useMemo(() => {
    let list = typeFiltered;
    if (activeTab !== 'all') list = list.filter(t => t.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        t =>
          t.voucherCode.toLowerCase().includes(q) ||
          (t.projectName ?? t.fromWarehouseName).toLowerCase().includes(q) ||
          (t.project ?? '').toLowerCase().includes(q) ||
          (t.toProjectName ?? t.toProject ?? '').toLowerCase().includes(q) ||
          t.toWarehouseName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [typeFiltered, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const materialUnit = (code: string) => {
    const inv = inventoryRow(projectInventory, code);
    if (inv?.unit) return inv.unit;
    return materials.find(m => m.materialCode === code)?.unit ?? '—';
  };

  const resetForm = () => {
    setEditing(null);
    setProjectCode('');
    setToProjectCode('');
    setTransferMode('return');
    setNote('');
    setItems([{ ...emptyQtyPhaseLine }]);
    setCreateErrors({});
  };

  const buildDto = (status: 'draft' | 'pending'): CreateTransferDto | null => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    const overflow = validItems.some((it, idx) => {
      const max = availableReturnQty(projectInventory, it.materialCode, items, idx);
      return Number(it.qty) > max;
    });
    const fieldErrors = getTransferFormFieldErrors(
      projectCode,
      toProjectCode,
      transferMode,
      items,
      overflow,
      frozenByProjectCode,
    );
    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      return null;
    }
    setCreateErrors({});

    const validation = validateTransferCreate(projectCode.trim(), validItems);
    if (!validation.success) {
      showToast('error', validation.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
      return null;
    }

    const mappedItems = validItems.map(it => {
      const mat = materials.find(m => m.materialCode === it.materialCode);
      const inv = inventoryRow(projectInventory, it.materialCode);
      return {
        productId: it.materialCode,
        sku: it.materialCode,
        name: mat?.materialName ?? inv?.materialName ?? it.materialCode,
        qty: Number(it.qty),
        unit: inv?.unit ?? mat?.unit ?? '',
        constructionPhase: it.constructionPhase.trim() || undefined,
      };
    });

    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      fromWarehouseId: '',
      toWarehouseId: '',
      items: mappedItems,
      status,
      createdBy: '',
      note,
      project: projectCode.trim(),
      toProject: transferMode === 'cross-project' ? toProjectCode.trim() : undefined,
    };
  };

  const handleCreate = async (status: 'draft' | 'pending') => {
    const dto = buildDto(status);
    if (!dto) return;
    try {
      const created = await createMutation.mutateAsync(dto);
      showToast(
        'success',
        status === 'draft'
          ? `Phiếu nháp ${created.voucherCode} — chưa chốt dự kiến.`
          : `Phiếu ${created.voucherCode} — chuyển dự kiến, chờ duyệt thực tế.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu chuyển kho'));
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const status = editing.status === 'draft' ? 'draft' : 'pending';
    const dto = buildDto(status);
    if (!dto) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, dto: { ...dto, status: editing.status } });
      showToast('success', `Đã cập nhật phiếu ${editing.voucherCode}.`);
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật phiếu chuyển kho'));
    }
  };

  const openEdit = (tf: Transfer) => {
    setEditing(tf);
    setProjectCode(tf.project ?? '');
    setToProjectCode(tf.toProject ?? '');
    setTransferMode(tf.toProject ? 'cross-project' : 'return');
    setNote(tf.note);
    setItems(transferToFormLines(tf.items));
    setCreateErrors({});
    setShowCreate(true);
  };

  const handleSubmit = async (tf: Transfer) => {
    try {
      await submitMutation.mutateAsync(tf.id);
      showToast('success', `Đã duyệt dự kiến phiếu ${tf.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const handleApprove = async (tf: Transfer) => {
    try {
      await approveMutation.mutateAsync(tf.id);
      showToast('success', `Thủ kho đã duyệt kho phiếu ${tf.voucherCode}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  const openDetail = (tf: Transfer) => {
    setSelected(tf);
    setShowDetail(true);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const ok = await downloadVoucherExport(
        '/api/transfers/export',
        `phieu-chuyen-${new Date().toISOString().slice(0, 10)}.xlsx`,
        {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          status: activeTab,
          search,
        },
      );
      if (ok) showToast('success', 'Đã xuất danh sách phiếu chuyển');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xuất Excel'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleProjectCodeChange = (code: string) => {
    setProjectCode(code);
    setCreateErrors(e => ({ ...e, projectCode: getFrozenProjectError(frozenByProjectCode, code) }));
  };

  const handleToProjectCodeChange = (code: string) => {
    setToProjectCode(code);
    setCreateErrors(e => ({ ...e, toProjectCode: getFrozenProjectError(frozenByProjectCode, code) }));
  };

  const handleItemsChange = (next: MaterialQtyPhaseLine[]) => {
    setItems(next);
    setCreateErrors(e => {
      const cleared = { ...e, items: undefined };
      delete cleared.lineErrors;
      return cleared;
    });
  };

  const handleDuplicateMaterialAttempt = (lineIndex: number) => {
    setCreateErrors(e => ({
      ...e,
      lineErrors: { ...e.lineErrors, [lineIndex]: { materialCode: DUPLICATE_MATERIAL_MESSAGE } },
    }));
  };

  return {
    transferTypeTab, setTransferTypeTab,
    activeTab, setActiveTab,
    search, setSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    isExporting,
    page, setPage,
    pageSize, setPageSize,
    showCreate, setShowCreate,
    showDetail, setShowDetail,
    selected, editing,
    projectCode, toProjectCode, transferMode, setTransferMode,
    note, setNote, items, createErrors,
    isLoading, isError, error,
    projects, targetProjects, stockMaterials, projectInventory,
    frozenByProjectCode,
    createMutation, updateMutation, approveMutation, submitMutation,
    typeTabs, tabs, filtered, totalPages, paginated,
    materialUnit, resetForm,
    handleCreate, handleUpdate, openEdit, handleSubmit, handleApprove, openDetail,
    handleExportExcel, handleProjectCodeChange, handleToProjectCodeChange,
    handleItemsChange, handleDuplicateMaterialAttempt,
  };
}
