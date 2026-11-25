import { useMemo, useState } from 'react';
import type { ImportBudgetExceededApiDto } from '../../../types/api/importBudgetApi';
import type { Import } from '../../../types';
import { usePermission } from '../../../hooks/usePermission';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage, saveBlob } from '../../../lib/apiClient';
import { parseImportBudgetExceeded } from '../../../lib/wms/projectBudget';
import { downloadVoucherExport } from '../../../lib/wms/voucherExportDownload';
import type { ImportApproveSettlementPayload } from './importReceiveSettlement';
import { useCanViewWmsPrices } from '../../../lib/wms/priceVisibility';
import { getVoucherTabLabels } from '../../../lib/wms/voucherStatusLabels';
import { useImports, useApproveImport } from '../../../hooks/useImports';
import { useProjects } from '../../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../../constants/pagination';
import { importsService } from '../../../services/importsService';

export function useImportListController(initialProjectCode?: string) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);

  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Import | null>(null);
  const [isEvidencePending, setIsEvidencePending] = useState(false);

  const [budgetConfirmImport, setBudgetConfirmImport] = useState<Import | null>(null);
  const [budgetExceeded, setBudgetExceeded] = useState<ImportBudgetExceededApiDto | null>(null);
  const [pendingSettlement, setPendingSettlement] = useState<ImportApproveSettlementPayload | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: imports = [], isLoading, isError, error } = useImports({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const approveMutation = useApproveImport();

  const { has } = usePermission();
  const canApproveImport = has('wms.imports.approve');
  const canViewPrices = useCanViewWmsPrices();

  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const voucherTabs = getVoucherTabLabels('import');

  // Thủ kho: chỉ xem và duyệt dự kiến + thực tế (phiếu nháp/dự kiến được tạo bên Mua hàng PO).
  const warehouseImports = useMemo(
    () => imports.filter(i =>
      (i.status === 'pending' || i.status === 'approved')
      && !i.isDirectProcurement
      && (!initialProjectCode || i.project === initialProjectCode)),
    [imports, initialProjectCode],
  );

  const tabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: warehouseImports.length },
    { id: 'pending', label: voucherTabs.pending, count: warehouseImports.filter(i => i.status === 'pending').length },
    { id: 'approved', label: voucherTabs.approved, count: warehouseImports.filter(i => i.status === 'approved').length },
  ], [warehouseImports, voucherTabs]);

  const filtered = useMemo(() => {
    let list = warehouseImports;
    if (activeTab !== 'all') list = list.filter(i => i.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        i =>
          i.voucherCode.toLowerCase().includes(q) ||
          i.supplier.toLowerCase().includes(q) ||
          i.referenceCode.toLowerCase().includes(q) ||
          (i.project ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [warehouseImports, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const projectName = (code?: string) =>
    projects.find(p => p.projectCode === code)?.projectName ?? code ?? '—';

  const reloadImport = async (id: string) => {
    const refreshed = await importsService.getById(id);
    setSelected(prev => (prev?.id === id ? refreshed : prev));
    return refreshed;
  };

  const runApprove = async (
    imp: Import,
    bypassBudget: boolean,
    settlement?: ImportApproveSettlementPayload | null,
  ) => {
    try {
      await approveMutation.mutateAsync({
        id: imp.id,
        confirmOverBudget: bypassBudget,
        lines: settlement?.lines,
        shortageReport: settlement?.shortageReport,
        defectReason: settlement?.defectReason,
      });
      showToast('success', `Đã duyệt phiếu ${imp.voucherCode}.`);
      setBudgetConfirmImport(null);
      setBudgetExceeded(null);
      setPendingSettlement(null);
      setShowDetail(false);
    } catch (err) {
      const budget = parseImportBudgetExceeded(err);
      if (budget) {
        setBudgetConfirmImport(imp);
        setBudgetExceeded(budget);
        setPendingSettlement(settlement ?? null);
        return;
      }
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  const handleApprove = async (imp: Import, settlement: ImportApproveSettlementPayload) => {
    const text = (settlement.evaluation ?? imp.receiptEvaluation ?? '').trim();
    const hasPhoto = (imp.attachments ?? []).some(a => a.kind === 'photo' || a.kind === 'defect_photo');
    const hasDoc = (imp.attachments ?? []).some(a => a.kind === 'document');

    if (!text || !hasPhoto || !hasDoc) {
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
        await reloadImport(imp.id);
      }
      await runApprove(imp, false, settlement);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const ok = await downloadVoucherExport(
        '/api/imports/export',
        `PhieuNhapKho_${new Date().toISOString().slice(0, 10)}.xlsx`,
        {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      );
      if (ok) showToast('success', 'Đã xuất file Excel.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xuất file Excel'));
    } finally {
      setIsExporting(false);
    }
  };

  const openDetail = (imp: Import) => {
    setSelected(imp);
    setShowDetail(true);
  };

  const handleUploadAttachment = async (
    imp: Import,
    file: File,
    kind: 'document' | 'photo' | 'defect_photo',
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
      showToast('success', 'Đã xóa file đính kèm.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa file.'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleDownloadAttachment = async (imp: Import, attachmentId: string, fileName: string) => {
    try {
      const blob = await importsService.downloadAttachment(imp.id, attachmentId);
      await saveBlob(blob, fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải file'));
    }
  };

  const handleSaveEvaluation = async (imp: Import, evaluation: string) => {
    try {
      setIsEvidencePending(true);
      await importsService.updateReceiptEvaluation(imp.id, evaluation.trim());
      await reloadImport(imp.id);
      showToast('success', 'Đã lưu đánh giá nhận hàng.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu đánh giá'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  return {
    activeTab, setActiveTab,
    search, setSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    page, setPage,
    pageSize, setPageSize,
    showDetail, setShowDetail,
    selected,
    isEvidencePending,
    budgetConfirmImport, setBudgetConfirmImport,
    budgetExceeded, setBudgetExceeded,
    pendingSettlement,
    isExporting,
    isLoading, isError, error,
    approveMutation,
    canApproveImport,
    canViewPrices,
    tabs, filtered, totalPages, paginated,
    projectName,
    runApprove,
    handleApprove,
    handleExportExcel,
    openDetail,
    handleUploadAttachment,
    handleDeleteAttachment,
    handleDownloadAttachment,
    handleSaveEvaluation,
  };
}
