import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download } from 'lucide-react';

import type { ImportBudgetExceededApiDto } from '../../types/api/importBudgetApi';
import type { Import } from '../../types';

import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import HrmPanel from '../../components/hr/HrmPanel';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage, saveBlob } from '../../lib/apiClient';
import { parseImportBudgetExceeded } from '../../lib/wms/projectBudget';
import { downloadVoucherExport } from '../../lib/wms/voucherExportDownload';
import type { ImportApproveSettlementPayload } from './import/importReceiveSettlement';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';
import { getVoucherTabLabels } from '../../lib/wms/voucherStatusLabels';
import { useImports, useApproveImport } from '../../hooks/useImports';
import { useProjects } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { importsService } from '../../services/importsService';
import { isIssueFromGeneralWarehouse } from './import/importUtils';
import ImportTable from './import/ImportTable';
import ImportDetailModal from './import/ImportDetailModal';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';

export default function ImportListPageRoute() {
  const location = useLocation();
  const initialProjectCode = (location.state as { projectCode?: string } | null)?.projectCode;
  return <ImportListPageApi key={location.key} initialProjectCode={initialProjectCode} />;
}

interface ImportListPageApiProps {
  initialProjectCode?: string;
}

function ImportListPageApi({ initialProjectCode }: ImportListPageApiProps) {
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

  const tabs = [
    { id: 'all', label: 'Tất cả', count: warehouseImports.length },
    { id: 'pending', label: voucherTabs.pending, count: warehouseImports.filter(i => i.status === 'pending').length },
    { id: 'approved', label: voucherTabs.approved, count: warehouseImports.filter(i => i.status === 'approved').length },
  ];

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

  const runApprove = async (
    imp: Import,
    bypassBudget: boolean,
    settlement?: ImportApproveSettlementPayload | null,
  ) => {
    try {
      await approveMutation.mutateAsync({
        id: imp.id,
        bypassBudgetWarning: bypassBudget,
        settlement: settlement ?? undefined,
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
    const text = (settlement.receiptEvaluation ?? imp.receiptEvaluation ?? '').trim();
    const hasPhoto = (imp.attachments ?? []).some(a => a.fileType === 'photo' || a.fileType === 'defect_photo');
    const hasDoc = (imp.attachments ?? []).some(a => a.fileType === 'document');

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
      const blob = await downloadVoucherExport('/api/imports', {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      await saveBlob(blob, `PhieuNhapKho_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('success', 'Đã xuất file Excel.');
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

  const reloadImport = async (id: string) => {
    const refreshed = await importsService.getById(id);
    setSelected(prev => (prev?.id === id ? refreshed : prev));
    return refreshed;
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

  return (
    <div className="hrm-page">
      <PageHeader
        title="Nhập kho"
        subtitle="Phiếu nhập dự kiến chờ duyệt thực tế và phiếu đã nhập — tạo phiếu nháp/dự kiến trên đơn hàng PO."
        actions={
          <button type="button" className="hrm-header-btn" onClick={() => void handleExportExcel()} disabled={isExporting}>
            <Download size={14} /> {isExporting ? 'Đang xuất…' : 'Xuất Excel'}
          </button>
        }
      />

      <HrmPanel noPadding>
        <div className="px-4 pt-3 pb-1 border-b border-[var(--md-outline-variant02)]">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => { setActiveTab(id); setPage(1); }} />
        </div>

        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã chứng từ, NCC, kho dự án..." />
            <VoucherDateFilter
              from={dateFrom}
              to={dateTo}
              onFromChange={v => { setDateFrom(v); setPage(1); }}
              onToChange={v => { setDateTo(v); setPage(1); }}
              onReset={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            />
          </div>
        </div>

        <ImportTable
          rows={paginated}
          isLoading={isLoading}
          isError={isError}
          error={error}
          projectName={projectName}
          onOpenDetail={openDetail}
          showPrices={canViewPrices}
        />

        {filtered.length > 0 && !isLoading && (
          <Pagination
            embedded
            itemLabel="phiếu nhập"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={filtered.length}
          />
        )}
      </HrmPanel>

      <ImportDetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        selected={selected}
        projectName={projectName}
        onApprove={canApproveImport ? (imp, settlement) => { void handleApprove(imp, settlement); } : undefined}
        isApproving={approveMutation.isPending}
        onDownloadAttachment={handleDownloadAttachment}
        canUpdateEvidence={canApproveImport}
        isEvidencePending={isEvidencePending}
        onUploadAttachment={handleUploadAttachment}
        onDeleteAttachment={handleDeleteAttachment}
        onSaveEvaluation={handleSaveEvaluation}
        showPrices={canViewPrices && !isIssueFromGeneralWarehouse(selected)}
      />

      <ConfirmDialog
        isOpen={budgetConfirmImport != null && budgetExceeded != null}
        onClose={() => {
          setBudgetConfirmImport(null);
          setBudgetExceeded(null);
        }}
        onConfirm={() => {
          if (budgetConfirmImport) void runApprove(budgetConfirmImport, true, pendingSettlement);
        }}
        title="Vượt ngân sách vật tư"
        variant="default"
        confirmLabel="Vẫn duyệt"
        isLoading={approveMutation.isPending}
        message={budgetExceeded ? (
          <div>
            <p className="mb-2">
              Dự án <strong>{projectName(budgetExceeded.projectCode)}</strong> ({budgetExceeded.projectCode})
              đang vượt ngân sách kế hoạch:
            </p>
            <div className="bg-[var(--md-surface-variant)] p-3 rounded text-sm space-y-1 mb-2">
              <div className="flex justify-between">
                <span>Ngân sách kế hoạch:</span>
                <span className="font-semibold">{formatCurrencyFull(budgetExceeded.plannedBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span>Đã thực hiện (gồm phiếu này):</span>
                <span className="font-semibold text-amber-600">{formatCurrencyFull(budgetExceeded.actualCost)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--md-outline-variant)] pt-1 text-red-600 font-semibold">
                <span>Vượt ngân sách:</span>
                <span>+{formatCurrencyFull(budgetExceeded.exceededAmount)}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--md-on-surface-variant)]">
              Bạn có quyền phê duyệt để tiếp tục duyệt phiếu nhập này.
            </p>
          </div>
        ) : ''}
      />
    </div>
  );
}
