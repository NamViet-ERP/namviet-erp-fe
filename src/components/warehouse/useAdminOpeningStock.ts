import { useMemo, useState } from 'react';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useProjects } from '../../hooks/useProjects';
import { stockService } from '../../services/stockService';
import type { OpeningStockPreviewResponseDto } from '../../types/wms';
import { showToast } from '../ui/Toast';
import type { OpeningStockIndexedItem } from './AdminOpeningStockErrorModal';

export type OpeningStockFilterTab = 'all' | 'valid' | 'error';

export function useAdminOpeningStock(onClose: () => void, onSuccess: () => void) {
  const [targetType, setTargetType] = useState<'general' | 'project'>('general');
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<OpeningStockPreviewResponseDto | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filterTab, setFilterTab] = useState<OpeningStockFilterTab>('all');
  const [search, setSearch] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorSearch, setErrorSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: projectPage } = useProjects();
  const targetWarehouseLabel =
    targetType === 'project' ? `Kho Dự án ${selectedProjectCode}` : 'Kho trung tâm';

  const projectOptions = useMemo(
    () => (projectPage?.items ?? []).map(p => ({ value: p.projectCode, label: `${p.projectCode} — ${p.projectName}` })),
    [projectPage?.items],
  );

  const handleClose = () => {
    if (isImporting) return;
    setSelectedFile(null);
    setPreviewData(null);
    setIsPreviewing(false);
    setIsImporting(false);
    setFilterTab('all');
    setSearch('');
    setShowErrorModal(false);
    setErrorSearch('');
    setCopied(false);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await stockService.downloadOpeningStockTemplate();
      showToast('success', 'Đã tải xuống file Excel mẫu tồn kho đầu kỳ.');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải file mẫu.'));
    } finally {
      setIsDownloading(false);
    }
  };

  const processFile = async (file: File, projectOverride?: string) => {
    setSelectedFile(file);
    setIsPreviewing(true);
    setPreviewData(null);
    setFilterTab('all');
    setSearch('');
    try {
      const projCode =
        projectOverride !== undefined
          ? projectOverride || undefined
          : targetType === 'project'
            ? selectedProjectCode
            : undefined;
      const res = await stockService.previewOpeningStock(file, projCode);
      setPreviewData(res);
      if (res.errorRows > 0) {
        showToast('warning', `Tìm thấy ${res.validRows} dòng hợp lệ và ${res.errorRows} dòng có lỗi/cảnh báo.`);
      } else {
        showToast('success', `Phân tích thành công: ${res.validRows} dòng dữ liệu hợp lệ.`);
      }
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể đọc nội dung file Excel.'));
    } finally {
      setIsPreviewing(false);
    }
  };

  const indexedItems: OpeningStockIndexedItem[] = useMemo(
    () => (previewData?.items ?? []).map((item, index) => ({ ...item, originalIndex: index + 1 })),
    [previewData],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return indexedItems.filter(item => {
      if (filterTab === 'valid' && !item.isValid) return false;
      if (filterTab === 'error' && item.isValid) return false;
      if (!q) return true;
      return (
        item.materialCode?.toLowerCase().includes(q) ||
        item.materialName?.toLowerCase().includes(q) ||
        item.unit?.toLowerCase().includes(q) ||
        item.error?.toLowerCase().includes(q) ||
        String(item.originalIndex) === q ||
        `dòng ${item.originalIndex}`.toLowerCase().includes(q)
      );
    });
  }, [indexedItems, filterTab, search]);

  const errorItems = useMemo(() => indexedItems.filter(item => !item.isValid), [indexedItems]);

  const filteredErrorItems = useMemo(() => {
    const q = errorSearch.trim().toLowerCase();
    if (!q) return errorItems;
    return errorItems.filter(it => {
      const idxStr = String(it.originalIndex);
      return (
        idxStr.includes(q) ||
        (it.materialCode ?? '').toLowerCase().includes(q) ||
        (it.materialName ?? '').toLowerCase().includes(q) ||
        (it.error ?? '').toLowerCase().includes(q) ||
        `dòng ${idxStr}`.includes(q)
      );
    });
  }, [errorItems, errorSearch]);

  const handleCopyErrors = async () => {
    if (!errorItems.length) return;
    const text = errorItems
      .map(err => `Dòng ${err.originalIndex}: [Mã: ${err.materialCode || 'Trống'}] ${err.error || 'Lỗi không xác định'}`)
      .join('\n');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Không thể sao chép vào bộ nhớ tạm.');
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    if (targetType === 'project' && !selectedProjectCode) {
      showToast('warning', 'Vui lòng chọn Dự án nhận tồn kho.');
      return;
    }
    setIsImporting(true);
    try {
      const projCode = targetType === 'project' ? selectedProjectCode : undefined;
      const res = await stockService.importOpeningStock(selectedFile, projCode);
      showToast('success', res.message || `Đã nạp thành công số dư tồn kho đầu kỳ! Mã phiếu: ${res.ticketCode}`);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Nạp số dư tồn kho thất bại.'));
    } finally {
      setIsImporting(false);
    }
  };

  return {
    targetType,
    setTargetType,
    selectedProjectCode,
    setSelectedProjectCode,
    selectedFile,
    previewData,
    isPreviewing,
    isImporting,
    isDownloading,
    filterTab,
    setFilterTab,
    search,
    setSearch,
    showErrorModal,
    setShowErrorModal,
    errorSearch,
    setErrorSearch,
    copied,
    projectOptions,
    targetWarehouseLabel,
    filteredItems,
    errorItems,
    filteredErrorItems,
    handleClose,
    handleDownloadTemplate,
    processFile,
    handleCopyErrors,
    handleConfirmImport,
  };
}
