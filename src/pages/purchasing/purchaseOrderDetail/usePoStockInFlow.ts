import { useEffect, useMemo, useState } from 'react';
import { showToast } from '../../../components/ui/Toast';
import {
  useCreateImportFromPo,
  useDeleteImport,
  useImports,
  usePoImportPreview,
  useSubmitImport,
  useUpdateImport,
} from '../../../hooks/useImports';
import { useMaterials } from '../../../hooks/useMaterials';
import { usePermission } from '../../../hooks/usePermission';
import { useProjects } from '../../../hooks/useProjects';
import { useFrozenProjects } from '../../../hooks/useFrozenProjects';
import { useSuppliers } from '../../../hooks/useSuppliers';
import { getApiErrorMessage, saveBlob } from '../../../lib/apiClient';
import {
  getImportFormFieldErrors,
  isImportLineComplete,
  validateImportCreate,
} from '../../../lib/wms/importFormSchema';
import { useCanViewWmsPrices } from '../../../lib/wms/priceVisibility';
import { importToFormLines } from '../../../lib/wms/voucherFormPopulate';
import { findSupplierByName } from '../../../services/suppliersService';
import { importsService, type CreateImportDto } from '../../../services/importsService';
import type { Import } from '../../../types';
import type { PurchaseOrderApiDto } from '../../../types/api/purchasingApi';
import type { ImportFormFieldErrors } from '../../../lib/wms/importFormSchema';
import { parseCurrencyInput } from '../../../utils/currencyInput';
import { emptyQtyPriceLine, type MaterialQtyPriceLine } from '../../warehouse/voucher/voucherFormTypes';
import { importLineTotal } from '../../warehouse/import/importUtils';
import { resolvePoImportItems } from '../../warehouse/import/importCreatePoDrafts';

type Props = {
  poCode: string;
  order: PurchaseOrderApiDto | undefined;
};

/**
 * Tạo / sửa / chốt dự kiến / xóa phiếu nhập gắn PO — luồng cung ứng trên chi tiết PO.
 */
export function usePoStockInFlow({ poCode, order }: Props) {
  const { has } = usePermission();
  const canCreate = has('wms.imports.create');
  const canUpdate = has('wms.imports.update');
  const canViewPrices = useCanViewWmsPrices();

  const importsQuery = useImports();
  const relatedImports = useMemo(
    () => {
      const rank = (status: string) => {
        if (status === 'approved') return 0;
        if (status === 'pending') return 1;
        if (status === 'draft') return 2;
        return 3;
      };
      return (importsQuery.data ?? [])
        .filter(imp => (imp.referenceCode ?? '').trim().toLowerCase() === poCode.trim().toLowerCase())
        .slice()
        .sort((a, b) => {
          const byStatus = rank(a.status) - rank(b.status);
          if (byStatus !== 0) return byStatus;
          return (b.approvedAt || b.date || '').localeCompare(a.approvedAt || a.date || '');
        });
    },
    [importsQuery.data, poCode],
  );

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Import | null>(null);
  const [editing, setEditing] = useState<Import | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Import | null>(null);
  const [isEvidencePending, setIsEvidencePending] = useState(false);

  const [defaultSupplier, setDefaultSupplier] = useState('');
  const [referenceCode, setReferenceCode] = useState(poCode);
  const [selectedPoCode, setSelectedPoCode] = useState(poCode);
  /** Luôn lấy từ PO — không cho đổi kho dự án khi tạo/sửa NK gắn PO. */
  const projectCode = order?.projectCode ?? '';
  const [note, setNote] = useState('');
  const [items, setItems] = useState<MaterialQtyPriceLine[]>([{ ...emptyQtyPriceLine }]);
  const [createErrors, setCreateErrors] = useState<ImportFormFieldErrors>({});

  const { data: materialsPage } = useMaterials({ pageSize: 500 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: suppliersPage } = useSuppliers({ all: true });
  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const suppliers = useMemo(() => suppliersPage?.items ?? [], [suppliersPage?.items]);
  const frozenByProjectCode = useFrozenProjects();

  const createFromPoMutation = useCreateImportFromPo();
  const updateMutation = useUpdateImport();
  const submitMutation = useSubmitImport();
  const deleteMutation = useDeleteImport();

  const previewEnabled = Boolean(order && order.orderPlacementStatus === 'placed');
  const poPreviewQuery = usePoImportPreview(
    selectedPoCode || poCode || undefined,
    previewEnabled,
    editing?.voucherCode,
  );

  const hasAvailableQty = Boolean(
    poPreviewQuery.data?.lines?.some(line => (line.available ?? 0) > 0),
  );

  const canPlaceImport = Boolean(
    order
    && order.orderPlacementStatus === 'placed'
    && hasAvailableQty,
  );

  const placeImportBlockedReason = !order
    ? 'Chưa tải được PO'
    : order.orderPlacementStatus !== 'placed'
      ? 'Chỉ tạo khi PO đã đặt NCC'
      : poPreviewQuery.isFetching && !poPreviewQuery.data
        ? 'Đang kiểm tra SL còn lại trên PO'
        : !hasAvailableQty
          ? 'Không còn SL khả dụng (đã nhập thực tế / đang chờ duyệt)'
          : '';

  const poOptions = useMemo(
    () => (order ? [order] : []),
    [order],
  );

  const formGrandTotal = useMemo(
    () => items.reduce((sum, it) => sum + importLineTotal(it), 0),
    [items],
  );

  const projectName = (code?: string) =>
    projects.find(p => p.projectCode === code)?.projectName ?? code ?? '—';

  const materialUnit = (code: string) =>
    materials.find(m => m.materialCode === code)?.unit ?? '—';

  const resetForm = () => {
    setEditing(null);
    setDefaultSupplier(order?.supplierName ?? '');
    setReferenceCode(poCode);
    setSelectedPoCode(poCode);
    setNote('');
    setItems([{ ...emptyQtyPriceLine }]);
    setCreateErrors({});
  };

  useEffect(() => {
    if (!order) return;
    if (!showCreate || editing) return;
    setDefaultSupplier(order.supplierName ?? '');
    setReferenceCode(poCode);
    setSelectedPoCode(poCode);
  }, [order, poCode, showCreate, editing]);

  useEffect(() => {
    if (editing || !showCreate) return;
    const preview = poPreviewQuery.data;
    if (!preview) return;
    setDefaultSupplier(preview.supplierName ?? order?.supplierName ?? '');
    setReferenceCode(preview.poCode ?? poCode);
    setCreateErrors({});
  }, [poPreviewQuery.data, editing, showCreate, order?.supplierName, poCode]);

  const openCreate = () => {
    if (!canCreate || !canPlaceImport) return;
    resetForm();
    setShowCreate(true);
  };

  const openDetail = (imp: Import) => {
    setSelected(imp);
    setShowDetail(true);
  };

  const openEdit = (imp: Import) => {
    if (!canUpdate && !canCreate) return;
    if (imp.status !== 'draft') {
      openDetail(imp);
      return;
    }
    setShowDetail(false);
    setEditing(imp);
    setDefaultSupplier(imp.supplier);
    setReferenceCode(imp.referenceCode || poCode);
    setSelectedPoCode(imp.referenceCode?.trim() || poCode);
    setNote(imp.note);
    setItems(importToFormLines(imp.items));
    setCreateErrors({});
    setShowCreate(true);
  };

  const buildDto = (status: 'draft' | 'pending'): CreateImportDto | null => {
    const lockedProject = projectCode.trim();
    if (!lockedProject) {
      setCreateErrors(e => ({ ...e, projectCode: 'PO thiếu mã dự án — không thể lưu phiếu nhập.' }));
      return null;
    }
    const priceOpts = { requireUnitPrice: canViewPrices };
    const validItems = items.filter(line => isImportLineComplete(line, priceOpts));
    const supplierValid = Boolean(findSupplierByName(suppliers, defaultSupplier));
    const fieldErrors = getImportFormFieldErrors(
      lockedProject,
      referenceCode,
      defaultSupplier,
      supplierValid,
      items,
      frozenByProjectCode,
      priceOpts,
    );
    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      return null;
    }
    setCreateErrors({});
    const validation = validateImportCreate(lockedProject, validItems, priceOpts);
    if (!validation.success) {
      showToast('error', validation.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
      return null;
    }
    const supplierMatch = findSupplierByName(suppliers, defaultSupplier.trim());
    const mappedItems = validItems.map(it => {
      const mat = materials.find(m => m.materialCode === it.materialCode);
      return {
        productId: it.materialCode,
        sku: it.materialCode,
        name: mat?.materialName ?? it.materialCode,
        qty: Number(it.qty),
        unit: mat?.unit ?? '',
        unitPrice: parseCurrencyInput(it.unitPrice),
        supplier: defaultSupplier.trim(),
        supplierId: supplierMatch?.id,
        notes: it.notes?.trim() ? it.notes.trim() : undefined,
      };
    });
    const totalValue = mappedItems.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      supplier: defaultSupplier.trim(),
      referenceCode: referenceCode.trim(),
      totalValue,
      status,
      warehouseApproval: 'pending',
      approvedBy: '',
      warehouseKeeper: '',
      items: mappedItems,
      createdBy: '',
      note,
      warehouseId: '',
      isDirectProcurement: false,
      project: lockedProject,
    };
  };

  const handleCreate = async (
    status: 'draft' | 'pending',
    evidence?: { files: File[]; evaluation: string; poItems?: { poItemId: number; qty: number }[] },
  ) => {
    if (editing) return;
    if (!selectedPoCode) {
      setCreateErrors(e => ({ ...e, referenceCode: 'Thiếu mã PO.' }));
      return;
    }
    const selectedItems = resolvePoImportItems({
      evidencePoItems: evidence?.poItems,
      formItems: items,
      previewLines: poPreviewQuery.data?.lines ?? [],
    });

    if (selectedItems.length === 0) {
      setCreateErrors(e => ({ ...e, items: 'PO chưa có dòng hợp lệ để nhập kho.' }));
      return;
    }

    try {
      const created = await createFromPoMutation.mutateAsync({
        poCode: selectedPoCode,
        request: { items: selectedItems },
      });
      const files = evidence?.files ?? [];
      const evaluation = (evidence?.evaluation ?? '').trim();
      if (evaluation) {
        await importsService.updateReceiptEvaluation(created.id, evaluation);
      }
      for (const file of files) {
        const kind = file.type.startsWith('image/') ? 'photo' : 'document';
        await importsService.uploadAttachment(created.id, file, kind);
      }
      if (status === 'pending') {
        await submitMutation.mutateAsync(created.id);
      }
      showToast(
        'success',
        status === 'draft'
          ? `Phiếu nháp ${created.voucherCode} — chưa chốt dự kiến.`
          : `Phiếu ${created.voucherCode} — nhập dự kiến, chờ thủ kho duyệt thực tế.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu nhập từ PO'));
    }
  };

  const handleUpdate = async (payload?: { evaluation: string }) => {
    if (!editing) return;
    const status = editing.status === 'draft' ? 'draft' : 'pending';
    const dto = buildDto(status);
    if (!dto) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, dto: { ...dto, status: editing.status } });
      const evaluation = (payload?.evaluation ?? '').trim();
      if (evaluation !== (editing.receiptEvaluation ?? '').trim()) {
        await importsService.updateReceiptEvaluation(editing.id, evaluation);
      }
      showToast('success', `Đã cập nhật phiếu ${editing.voucherCode}.`);
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật phiếu nhập'));
    }
  };

  const handleSubmit = async (imp: Import) => {
    try {
      await submitMutation.mutateAsync(imp.id);
      showToast('success', `Đã chốt dự kiến phiếu ${imp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.status !== 'draft') {
      showToast('error', 'Chỉ phiếu nháp mới được xóa.');
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa ${deleteTarget.voucherCode}.`);
      if (selected?.id === deleteTarget.id) {
        setShowDetail(false);
        setSelected(null);
      }
      if (editing?.id === deleteTarget.id) {
        setEditing(null);
        setShowCreate(false);
      }
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được phiếu nhập.'));
    }
  };

  const reloadImport = async (id: string) => {
    const refreshed = await importsService.getById(id);
    setSelected(prev => (prev?.id === id ? refreshed : prev));
    setEditing(prev => (prev?.id === id ? refreshed : prev));
    return refreshed;
  };

  const handleUploadAttachment = async (
    imp: Import,
    file: File,
    kind: 'document' | 'photo',
  ) => {
    try {
      setIsEvidencePending(true);
      await importsService.uploadAttachment(imp.id, file, kind);
      await reloadImport(imp.id);
      showToast('success', 'Đã tải file lên phiếu nhập.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được file.'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleDeleteAttachment = async (imp: Import, attachmentId: string) => {
    try {
      setIsEvidencePending(true);
      await importsService.deleteAttachment(imp.id, attachmentId);
      await reloadImport(imp.id);
      showToast('success', 'Đã xóa file.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được file.'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleDownloadAttachment = async (
    imp: Import,
    attachmentId: string,
    fileName: string,
  ) => {
    try {
      const blob = await importsService.downloadAttachment(imp.id, attachmentId);
      await saveBlob(blob, fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được file.'));
    }
  };

  return {
    relatedImports,
    importsLoading: importsQuery.isLoading,
    canCreate,
    canUpdate,
    canViewPrices,
    canPlaceImport,
    placeImportBlockedReason,
    canSubmit: canCreate,
    canDelete: canCreate,
    showCreate,
    setShowCreate,
    showDetail,
    setShowDetail,
    selected,
    editing,
    deleteTarget,
    setDeleteTarget,
    isEvidencePending,
    defaultSupplier,
    setDefaultSupplier,
    referenceCode,
    setReferenceCode,
    selectedPoCode,
    projectCode,
    note,
    setNote,
    items,
    setItems,
    createErrors,
    setCreateErrors,
    materials,
    projects,
    suppliers,
    frozenByProjectCode,
    poOptions,
    poPreviewQuery,
    formGrandTotal,
    projectName,
    materialUnit,
    openCreate,
    openDetail,
    openEdit,
    handleCreate,
    handleUpdate,
    handleSubmit,
    handleConfirmDelete,
    handleUploadAttachment,
    handleDeleteAttachment,
    handleDownloadAttachment,
    resetForm,
    isPending:
      createFromPoMutation.isPending
      || updateMutation.isPending
      || submitMutation.isPending,
    deletePending: deleteMutation.isPending,
  };
}
