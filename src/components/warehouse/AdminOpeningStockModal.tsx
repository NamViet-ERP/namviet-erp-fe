import { AlertCircle, Building2, FolderGit2, Warehouse } from 'lucide-react';
import Button from '../ui/Button';
import SelectField from '../ui/SelectField';
import ExcelImportModalShell from '../shared/ExcelImportModalShell';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import AdminOpeningStockErrorModal from './AdminOpeningStockErrorModal';
import AdminOpeningStockPreviewTable from './AdminOpeningStockPreviewTable';
import { useAdminOpeningStock, type OpeningStockFilterTab } from './useAdminOpeningStock';

interface AdminOpeningStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminOpeningStockModal({ isOpen, onClose, onSuccess }: AdminOpeningStockModalProps) {
  const vm = useAdminOpeningStock(onClose, onSuccess);

  const targetDestinationSlot = (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--md-on-surface)]">
        <Warehouse size={16} className="text-[var(--md-primary)] shrink-0" />
        <span>Nơi tiếp nhận số dư tồn kho:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Segmented Pill Switcher cao cấp */}
        <div className="inline-flex p-1 rounded-lg bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] text-xs">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              vm.targetType === 'general'
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-sm'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`}
            onClick={() => {
              vm.setTargetType('general');
              if (vm.selectedFile) void vm.processFile(vm.selectedFile, '');
            }}
          >
            <Building2 size={13} />
            <span className="whitespace-nowrap">Kho trung tâm</span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              vm.targetType === 'project'
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-sm'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`}
            onClick={() => vm.setTargetType('project')}
          >
            <FolderGit2 size={13} />
            <span className="whitespace-nowrap">Kho Dự Án</span>
          </button>
        </div>

        {vm.targetType === 'project' && (
          <SelectField
            variant="hrm"
            aria-label="Chọn dự án nhận tồn kho"
            selectClassName="form-input form-input-sm text-xs min-w-[220px] max-w-[320px] truncate"
            value={vm.selectedProjectCode}
            placeholder="-- Chọn dự án nhận tồn kho --"
            options={vm.projectOptions}
            onChange={value => {
              vm.setSelectedProjectCode(value);
              if (vm.selectedFile) void vm.processFile(vm.selectedFile, value);
            }}
            disabled={vm.isPreviewing || vm.isImporting}
          />
        )}
      </div>
    </div>
  );

  const errorAlertSlot = vm.previewData && vm.previewData.errorRows > 0 ? (
    <div className="p-3 rounded-lg border border-[color-mix(in_srgb,var(--md-error)_40%,transparent)] bg-[var(--tint-error-soft)] text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--md-error)]">
          <AlertCircle size={16} className="shrink-0 text-[var(--md-error)]" />
          <span>Phát hiện {vm.previewData.errorRows} dòng có lỗi đối soát</span>
        </div>
        <Button
          type="button"
          variant="outlined"
          size="sm"
          className="text-[var(--md-error)] border-[color-mix(in_srgb,var(--md-error)_40%,transparent)] hover:bg-[var(--tint-error-soft)]"
          onClick={() => vm.setShowErrorModal(true)}
        >
          Xem chi tiết &amp; Sao chép danh sách lỗi
        </Button>
      </div>
      <ul className="space-y-1 pl-5 list-disc text-[var(--md-error)] text-xs leading-relaxed">
        {vm.errorItems.slice(0, 5).map(it => (
          <li key={`err-summary-${it.originalIndex}`}>
            Dòng Excel {it.originalIndex}: Mã &apos;{it.materialCode || 'Trống'}&apos; — {it.error || 'Lỗi không xác định'}
          </li>
        ))}
        {vm.errorItems.length > 5 && (
          <li className="list-none -ml-5 pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium underline text-[var(--md-error)] hover:opacity-80 transition-opacity"
              onClick={() => vm.setShowErrorModal(true)}
            >
              …và {vm.errorItems.length - 5} lỗi khác (Bấm để xem và sao chép toàn bộ)
            </button>
          </li>
        )}
      </ul>
    </div>
  ) : null;

  return (
    <ExcelImportModalShell
      isOpen={isOpen}
      onClose={vm.handleClose}
      title="Nhập số dư tồn kho đầu kỳ từ file Excel (Admin)"
      subtitle="Hỗ trợ khởi tạo số dư kho tổng hoặc kho dự án, tự động đối soát với danh mục vật tư."
      selectedFile={vm.selectedFile}
      onFileSelect={file => void vm.processFile(file)}
      acceptedExtensions={['xlsx', 'xls']}
      acceptAttr=".xlsx,.xls"
      maxFileSizeMb={10}
      isDownloadingTemplate={vm.isDownloading}
      onDownloadTemplate={() => void vm.handleDownloadTemplate()}
      templateHint="(Bao gồm mã VT, tên VT, ĐVT, số lượng tồn và đơn giá vốn)"
      dropzoneTitle="Kéo thả file Excel (.xlsx, .xls) tồn kho đầu kỳ vào đây"
      dropzoneSubtitle="Hệ thống tự động nhận diện cột: Mã vật tư, Tên vật tư, ĐVT, Số lượng tồn, Đơn giá vốn, Ghi chú..."
      dropzoneHint="Hoặc bấm vào đây để duyệt file từ máy tính (tối đa 10MB)"
      isParsing={vm.isPreviewing}
      parsingTitle="Đang phân tích và đối soát số dư tồn kho với CSDL…"
      parsingSubtitle="Kiểm tra mã vật tư đang hoạt động, đơn vị tính và tính toàn vẹn số liệu"
      hasPreview={Boolean(vm.previewData)}
      beforeUploadSlot={targetDestinationSlot}
      stats={vm.previewData ? [
        { key: 'total', label: 'Tổng số dòng', value: vm.previewData.totalRows, tone: 'neutral' },
        { key: 'valid', label: 'Hợp lệ', value: vm.previewData.validRows, tone: 'success' },
        { key: 'error', label: 'Dòng có lỗi', value: vm.previewData.errorRows, tone: 'danger' },
        { key: 'amount', label: 'Tổng giá trị vốn', value: formatCurrencyFull(vm.previewData.totalAmount), tone: 'neutral' },
      ] : undefined}
      statsColumns={4}
      alertSlot={errorAlertSlot}
      filterTabs={vm.previewData ? [
        { id: 'all', label: `Tất cả (${vm.previewData.totalRows})`, tone: 'neutral' },
        { id: 'valid', label: `Hợp lệ (${vm.previewData.validRows})`, tone: 'success' },
        { id: 'error', label: `Có lỗi (${vm.previewData.errorRows})`, tone: 'danger' },
      ] : undefined}
      activeFilterTab={vm.filterTab}
      onFilterTabChange={tabId => vm.setFilterTab(tabId as OpeningStockFilterTab)}
      searchValue={vm.search}
      onSearchChange={vm.setSearch}
      searchPlaceholder="Lọc theo STT, mã VT, tên VT, ĐVT, nội dung lỗi..."
      footerSummary={vm.selectedFile && vm.previewData && vm.previewData.validRows > 0 ? (
        <span>
          Sẽ xử lý <strong>{vm.previewData.validRows}</strong> mặt hàng hợp lệ vào{' '}
          <strong>{vm.targetWarehouseLabel}</strong>
          {vm.previewData.errorRows > 0 && ` (bỏ qua ${vm.previewData.errorRows} dòng lỗi)`}.
        </span>
      ) : (
        <span>Vui lòng chọn file Excel để bắt đầu xem trước.</span>
      )}
      confirmLabel={`Xác nhận nhập (${vm.previewData?.validRows ?? 0} vật tư)`}
      confirmingLabel="Đang ghi nhận số dư…"
      confirmDisabled={!vm.selectedFile || !vm.previewData || vm.previewData.validRows === 0}
      isImporting={vm.isImporting}
      onConfirm={() => void vm.handleConfirmImport()}
      extraModals={vm.previewData ? (
        <AdminOpeningStockErrorModal
          isOpen={vm.showErrorModal}
          onClose={() => vm.setShowErrorModal(false)}
          fileName={vm.selectedFile?.name ?? 'Excel'}
          targetWarehouseLabel={vm.targetWarehouseLabel}
          totalErrorRows={vm.previewData.errorRows}
          errorItems={vm.errorItems}
          filteredErrorItems={vm.filteredErrorItems}
          errorSearch={vm.errorSearch}
          onErrorSearchChange={vm.setErrorSearch}
          copied={vm.copied}
          onCopyErrors={() => void vm.handleCopyErrors()}
        />
      ) : null}
    >
      <AdminOpeningStockPreviewTable items={vm.filteredItems} />
    </ExcelImportModalShell>
  );
}
