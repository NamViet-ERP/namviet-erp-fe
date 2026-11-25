import { useEffect, useMemo, useRef, useState } from 'react';
import type { Export, Import } from '../../../types';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage, saveBlob } from '../../../lib/apiClient';
import { downloadVoucherExport } from '../../../lib/wms/voucherExportDownload';
import {
  getExportFormFieldErrors,
  validateExportCreate,
  type ExportFormFieldErrors,
} from '../../../lib/wms/exportFormSchema';
import { DUPLICATE_MATERIAL_MESSAGE } from '../../../lib/wms/voucherDuplicateMaterial';
import { getFrozenProjectError } from '../../../lib/wms/stocktakeFreeze';
import { useFrozenProjects } from '../../../hooks/useFrozenProjects';
import {
  useApproveExport,
  useCreateExport,
  useExports,
  useSubmitExport,
  useUpdateExport,
} from '../../../hooks/useExports';
import { useApproveImport } from '../../../hooks/useImports';
import { usePermission } from '../../../hooks/usePermission';
import { useCanViewWmsPrices } from '../../../lib/wms/priceVisibility';
import { getVoucherTabLabels } from '../../../lib/wms/voucherStatusLabels';
import { exportToFormLines } from '../../../lib/wms/voucherFormPopulate';
import { useMaterials } from '../../../hooks/useMaterials';
import { useProjectInventory, useProjects } from '../../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../../constants/pagination';
import type { CreateExportDto } from '../../../services/exportsService';
import { importsService } from '../../../services/importsService';
import { emptyQtyLine, type MaterialQtyLine } from '../voucher/voucherFormTypes';
import { availableExportQty, inventoryRow } from './exportUtils';
import { projectInventoryAvailable } from '../../../lib/wms/stockQtyFormat';
import type { ImportApproveSettlementPayload } from '../import/importReceiveSettlement';

export function useExportListController(initialProjectCode?: string, openVoucherCode?: string) {
  const [activeTab, setActiveTab] = useState('all');
  const [kindTab, setKindTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(Boolean(initialProjectCode));
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Export | null>(null);
  const [directImport, setDirectImport] = useState<Import | null>(null);
  const [showDirectDetail, setShowDirectDetail] = useState(false);
  const [isEvidencePending, setIsEvidencePending] = useState(false);
  const [editing, setEditing] = useState<Export | null>(null);

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<MaterialQtyLine[]>([{ ...emptyQtyLine }]);
  const [createErrors, setCreateErrors] = useState<ExportFormFieldErrors>({});

  const { data: exports = [], isLoading, isError, error } = useExports({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: projectInventory = [] } = useProjectInventory(projectCode || undefined);
  const createMutation = useCreateExport();
  const frozenByProjectCode = useFrozenProjects();
  const updateMutation = useUpdateExport();
  const approveMutation = useApproveExport();
  const submitMutation = useSubmitExport();
  const approveImportMutation = useApproveImport();
  const { has } = usePermission();
  const canApproveImport = has('wms.imports.approve') || has('wms.exports.approve');
  const canViewPrices = useCanViewWmsPrices();

  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);

  const stockMaterials = useMemo(() => {
    if (!projectCode) return materials;
    const editingItems = editing && editing.project === projectCode ? editing.items : [];
    const editingItemCodes = new Set(editingItems.map(it => it.sku || it.productId));
    const codes = new Set(
      projectInventory
        .filter(r => {
          const originalQty = editingItemCodes.has(r.materialCode)
            ? editingItems
                .filter(it => (it.sku || it.productId) === r.materialCode)
                .reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
            : 0;
          return projectInventoryAvailable(r) + originalQty > 0;
        })
        .map(r => r.materialCode),
    );
    return materials.filter(m => codes.has(m.materialCode) || editingItemCodes.has(m.materialCode));
  }, [materials, projectInventory, projectCode, editing]);

  const voucherTabs = getVoucherTabLabels('export');
  const stockExports = useMemo(() => exports.filter(e => !e.isDirectProcurement), [exports]);
  const directExports = useMemo(() => exports.filter(e => e.isDirectProcurement), [exports]);
  const kindFiltered = kindTab === 'direct' ? directExports : kindTab === 'stock' ? stockExports : exports;
  const kindTabs = [
    { id: 'all', label: 'Tất cả', count: exports.length },
    { id: 'stock', label: 'Xuất từ kho', count: stockExports.length },
    { id: 'direct', label: 'Xuất thẳng', count: directExports.length },
  ];
  const tabs = [
    { id: 'all', label: 'Tất cả', count: kindFiltered.length },
    { id: 'draft', label: voucherTabs.draft, count: kindFiltered.filter(e => e.status === 'draft').length },
    { id: 'pending', label: voucherTabs.pending, count: kindFiltered.filter(e => e.status === 'pending').length },
    { id: 'approved', label: voucherTabs.approved, count: kindFiltered.filter(e => e.status === 'approved').length },
  ];

  const filtered = useMemo(() => {
    let list = kindFiltered;
    if (activeTab !== 'all') list = list.filter(e => e.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        e =>
          e.voucherCode.toLowerCase().includes(q) ||
          (e.projectName ?? e.warehouseName).toLowerCase().includes(q) ||
          (e.project ?? '').toLowerCase().includes(q) ||
          e.soCode.toLowerCase().includes(q),
      );
    }
    return list;
  }, [kindFiltered, activeTab, search]);

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
    setNote('');
    setItems([{ ...emptyQtyLine }]);
    setCreateErrors({});
  };

  const buildDto = (status: 'draft' | 'pending'): CreateExportDto | null => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    const editingItems = editing && editing.project === projectCode ? editing.items : undefined;
    const overflow = validItems.some((it, idx) => {
      const max = availableExportQty(projectInventory, it.materialCode, items, idx, editingItems);
      return Number(it.qty) > max;
    });
    const fieldErrors = getExportFormFieldErrors(projectCode, items, overflow, frozenByProjectCode);
    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      return null;
    }
    setCreateErrors({});

    const validation = validateExportCreate(projectCode.trim(), validItems);
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
      };
    });

    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      soCode: editing?.soCode ?? '',
      customer: '',
      warehouseId: '',
      items: mappedItems,
      status,
      createdBy: '',
      note,
      project: projectCode.trim(),
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
          : `Phiếu ${created.voucherCode} — xuất dự kiến, chờ duyệt thực tế.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu xuất'));
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
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật phiếu xuất'));
    }
  };

  const openEdit = (exp: Export) => {
    setEditing(exp);
    setProjectCode(exp.project ?? '');
    setNote(exp.note);
    setItems(exportToFormLines(exp.items));
    setCreateErrors({});
    setShowCreate(true);
  };

  const handleSubmit = async (exp: Export) => {
    try {
      await submitMutation.mutateAsync(exp.id);
      showToast('success', `Đã duyệt dự kiến phiếu ${exp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const openDetail = async (exp: Export) => {
    if (exp.isDirectProcurement) {
      const linked = exp.linkedTicketCode?.trim();
      if (!linked) {
        setSelected(exp);
        setShowDetail(true);
        return;
      }
      try {
        const imp = await importsService.getById(linked);
        setDirectImport(imp);
        setShowDirectDetail(true);
        setShowDetail(false);
        setSelected(null);
      } catch (err) {
        showToast('error', getApiErrorMessage(err, 'Không tải được phiếu xuất thẳng'));
      }
      return;
    }
    setSelected(exp);
    setShowDetail(true);
  };

  const handleApprove = async (exp: Export) => {
    if (exp.isDirectProcurement) {
      await openDetail(exp);
      return;
    }
    try {
      await approveMutation.mutateAsync(exp.id);
      showToast('success', `Thủ kho đã duyệt kho phiếu ${exp.voucherCode}`);
      setShowDetail(false);
      setSelected(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  const projectName = (code?: string) =>
    projects.find(p => p.projectCode === code)?.projectName ?? code ?? '—';

  const reloadDirectImport = async (id: string) => {
    const next = await importsService.getById(id);
    setDirectImport(next);
    return next;
  };

  const handleDirectApprove = async (imp: Import, settlement: ImportApproveSettlementPayload) => {
    const text = settlement.evaluation.trim();
    const hasPhoto = (imp.attachments ?? []).some(a => a.kind === 'photo');
    const hasDocument = (imp.attachments ?? []).some(a => a.kind === 'document');
    if (!text || !hasPhoto || !hasDocument) {
      showToast(
        'error',
        !text
          ? 'Thiếu đánh giá nhận hàng. Nhập trên chi tiết phiếu trước khi duyệt.'
          : !hasPhoto
            ? 'Thiếu ảnh nhận hàng. Tải ảnh trên chi tiết phiếu trước khi duyệt.'
            : 'Thiếu file chứng từ. Tải file trên chi tiết phiếu trước khi duyệt.',
      );
      return;
    }
    try {
      if ((imp.receiptEvaluation ?? '').trim() !== text) {
        setIsEvidencePending(true);
        await importsService.updateReceiptEvaluation(imp.id, text);
        await reloadDirectImport(imp.id);
      }
      await approveImportMutation.mutateAsync({
        id: imp.id,
        lines: settlement.lines,
        shortageReport: settlement.shortageReport,
        defectReason: settlement.defectReason,
      });
      setShowDirectDetail(false);
      setDirectImport(null);
      showToast('success', `Đã duyệt xuất thẳng ${imp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt xuất thẳng'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleDirectUpload = async (
    imp: Import,
    file: File,
    kind: 'document' | 'photo' | 'defect_photo',
  ) => {
    setIsEvidencePending(true);
    try {
      await importsService.uploadAttachment(imp.id, file, kind);
      await reloadDirectImport(imp.id);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được file.'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleDirectDeleteAttachment = async (imp: Import, attachmentId: string) => {
    setIsEvidencePending(true);
    try {
      await importsService.deleteAttachment(imp.id, attachmentId);
      await reloadDirectImport(imp.id);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được file.'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleDirectDownload = async (imp: Import, attachmentId: string, fileName: string) => {
    const blob = await importsService.downloadAttachment(imp.id, attachmentId);
    await saveBlob(blob, fileName);
  };

  const handleDirectSaveEvaluation = async (imp: Import, evaluation: string) => {
    await importsService.updateReceiptEvaluation(imp.id, evaluation);
    await reloadDirectImport(imp.id);
  };

  const openDetailRef = useRef(openDetail);
  useEffect(() => {
    openDetailRef.current = openDetail;
  });

  useEffect(() => {
    if (!openVoucherCode || isLoading || exports.length === 0) return;
    const match = exports.find(
      e => e.voucherCode.toLowerCase() === openVoucherCode.toLowerCase(),
    );
    if (match) {
      setSearch(openVoucherCode);
      void openDetailRef.current(match);
    }
  }, [openVoucherCode, isLoading, exports]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const ok = await downloadVoucherExport(
        '/api/exports/export',
        `phieu-xuat-${new Date().toISOString().slice(0, 10)}.xlsx`,
        {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          status: activeTab,
          search,
        },
      );
      if (ok) showToast('success', 'Đã xuất danh sách phiếu xuất');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xuất Excel'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleProjectCodeChange = (code: string) => {
    setProjectCode(code);
    setCreateErrors(e => ({
      ...e,
      projectCode: getFrozenProjectError(frozenByProjectCode, code),
    }));
  };

  const handleItemsChange = (next: MaterialQtyLine[]) => {
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
      lineErrors: {
        ...e.lineErrors,
        [lineIndex]: { materialCode: DUPLICATE_MATERIAL_MESSAGE },
      },
    }));
  };

  return {
    activeTab, setActiveTab,
    kindTab, setKindTab,
    search, setSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    isExporting,
    page, setPage,
    pageSize, setPageSize,
    showCreate, setShowCreate,
    showDetail, setShowDetail,
    selected,
    directImport, setDirectImport,
    showDirectDetail, setShowDirectDetail,
    isEvidencePending,
    editing,
    projectCode, note, setNote, items, createErrors,
    isLoading, isError, error,
    projects, stockMaterials, projectInventory,
    frozenByProjectCode,
    createMutation, updateMutation, approveMutation, submitMutation, approveImportMutation,
    canApproveImport, canViewPrices,
    kindTabs, tabs, filtered, totalPages, paginated,
    materialUnit, resetForm, projectName,
    handleCreate, handleUpdate, openEdit, handleSubmit, handleApprove, openDetail,
    handleDirectApprove, handleDirectUpload, handleDirectDeleteAttachment,
    handleDirectDownload, handleDirectSaveEvaluation, handleExportExcel,
    handleProjectCodeChange, handleItemsChange, handleDuplicateMaterialAttempt,
  };
}
