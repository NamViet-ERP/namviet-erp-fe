import { useState, useRef, type DragEvent } from 'react';
import { Upload, FileText, Download, Trash2, Check, AlertCircle, FileCheck2, FileQuestion } from 'lucide-react';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import { suppliersService, type SupplierAttachmentDto } from '../../services/suppliersService';

export const SUPPLIER_ONBOARDING_DOC_TYPES = [
  {
    key: 'business_license',
    title: 'GPKD / ĐKKD doanh nghiệp',
    description: 'Giấy chứng nhận đăng ký kinh doanh hoặc giấy phép đầu tư (bắt buộc cho Hạng D).',
    required: true,
  },
  {
    key: 'company_profile',
    title: 'Hồ sơ năng lực (Profile)',
    description: 'Giới thiệu năng lực tài chính, máy móc, dự án tiêu biểu và chứng chỉ ngành nghề.',
    required: false,
  },
  {
    key: 'catalog_price_list',
    title: 'Catalog & Bảng giá sản phẩm',
    description: 'Bảng báo giá vật tư, catalog quy cách sản phẩm, chính sách chiết khấu/bảo hành.',
    required: false,
  },
] as const;

export interface StagedAttachment {
  localId: string;
  docType: string;
  file: File;
}

export interface SupplierAttachmentUploaderProps {
  supplierId?: number;
  initialAttachments?: SupplierAttachmentDto[];
  stagedFiles?: StagedAttachment[];
  onAddStagedFile?: (docType: string, file: File) => void;
  onRemoveStagedFile?: (localId: string) => void;
  readOnly?: boolean;
  onAttachmentChanged?: () => void;
}

export default function SupplierAttachmentUploader({
  supplierId,
  initialAttachments = [],
  stagedFiles = [],
  onAddStagedFile,
  onRemoveStagedFile,
  readOnly = false,
  onAttachmentChanged,
}: SupplierAttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<SupplierAttachmentDto[]>(initialAttachments);
  const [deleteTarget, setDeleteTarget] = useState<SupplierAttachmentDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOverDocType, setDragOverDocType] = useState<string | null>(null);

  // Sync if initialAttachments changes
  const prevInitialRef = useRef(initialAttachments);
  if (prevInitialRef.current !== initialAttachments) {
    prevInitialRef.current = initialAttachments;
    setAttachments(initialAttachments);
  }

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handlePickFile = async (docType: string, file: File) => {
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast('error', 'Dung lượng tệp vượt quá giới hạn 20MB.');
      return;
    }

    if (supplierId) {
      // Direct upload mode
      setBusy(true);
      try {
        const created = await suppliersService.uploadAttachment(supplierId, file, docType);
        setAttachments(prev => [created, ...prev]);
        showToast('success', `Đã tải lên hồ sơ "${file.name}".`);
        onAttachmentChanged?.();
      } catch (err) {
        showToast('error', getApiErrorMessage(err, 'Không thể tải lên tệp đính kèm.'));
      } finally {
        setBusy(false);
      }
    } else {
      // Staged mode (for create supplier form)
      onAddStagedFile?.(docType, file);
    }
  };

  const handleDownload = async (attachment: SupplierAttachmentDto) => {
    if (!supplierId) return;
    try {
      await suppliersService.downloadAttachment(supplierId, attachment.id, attachment.fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải tệp về.'));
    }
  };

  const handleDeleteSaved = async () => {
    if (!supplierId || !deleteTarget) return;
    setBusy(true);
    try {
      await suppliersService.deleteAttachment(supplierId, deleteTarget.id);
      setAttachments(prev => prev.filter(a => a.id !== deleteTarget.id));
      showToast('success', `Đã xóa hồ sơ "${deleteTarget.fileName}".`);
      onAttachmentChanged?.();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa tệp đính kèm.'));
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, docType: string) => {
    e.preventDefault();
    if (!readOnly && dragOverDocType !== docType) {
      setDragOverDocType(docType);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>, docType: string) => {
    e.preventDefault();
    if (dragOverDocType === docType) {
      setDragOverDocType(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, docType: string) => {
    e.preventDefault();
    setDragOverDocType(null);
    if (readOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handlePickFile(docType, file);
    }
  };

  // Evaluation status
  const hasBusinessLicense = attachments.some(a => a.docType === 'business_license')
    || stagedFiles.some(f => f.docType === 'business_license');
  const hasProfile = attachments.some(a => a.docType === 'company_profile')
    || stagedFiles.some(f => f.docType === 'company_profile');
  const hasCatalog = attachments.some(a => a.docType === 'catalog_price_list')
    || stagedFiles.some(f => f.docType === 'catalog_price_list');

  const fulfilledCount = (hasBusinessLicense ? 1 : 0) + (hasProfile ? 1 : 0) + (hasCatalog ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Onboarding Compliance Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-variant)]/30">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface)] flex items-center gap-1.5">
            <FileCheck2 size={16} className="text-primary-600 dark:text-primary-400" />
            Hồ sơ Onboarding đầu vào (Quy chuẩn Hạng D)
          </div>
          <div className="text-[11px] text-[var(--md-on-surface-variant)] mt-0.5">
            Tải lên tài liệu thực tế (PDF, Word, Excel, hình ảnh) để lưu trữ và đánh giá xếp hạng NCC.
          </div>
        </div>

        <div>
          {fulfilledCount === 3 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
              <Check size={14} className="stroke-[2.5]" />
              Đạt chuẩn Hạng D — Đủ 3/3 hồ sơ đầu vào
            </span>
          ) : hasBusinessLicense ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-300 dark:border-blue-800">
              <Check size={14} className="stroke-[2.5]" />
              Đạt chuẩn Hạng D — Đã có GPKD ({fulfilledCount}/3 hồ sơ)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              <AlertCircle size={14} />
              Chưa có GPKD / ĐKKD — Bắt buộc để đạt chuẩn Hạng D
            </span>
          )}
        </div>
      </div>

      {/* 3 Upload Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SUPPLIER_ONBOARDING_DOC_TYPES.map(slot => {
          const slotAttachments = attachments.filter(a => a.docType === slot.key);
          const slotStaged = stagedFiles.filter(f => f.docType === slot.key);
          const totalSlotItems = slotAttachments.length + slotStaged.length;
          const isSlotFulfilled = totalSlotItems > 0;
          const isDragOver = dragOverDocType === slot.key;

          return (
            <div
              key={slot.key}
              onDragOver={e => handleDragOver(e, slot.key)}
              onDragLeave={e => handleDragLeave(e, slot.key)}
              onDrop={e => handleDrop(e, slot.key)}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 ${
                isDragOver
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 scale-[1.01]'
                  : isSlotFulfilled
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/15 dark:bg-emerald-950/10'
                  : slot.required
                  ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/15 dark:bg-amber-950/10'
                  : 'border-[var(--md-outline-variant)] bg-[var(--md-surface)]'
              }`}
            >
              <div>
                {/* Slot Header */}
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isSlotFulfilled ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                    ) : slot.required ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
                        <AlertCircle size={12} />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        <FileQuestion size={12} />
                      </span>
                    )}
                    <span className="text-xs font-bold text-[var(--md-on-surface)] leading-snug">
                      {slot.title}
                    </span>
                  </div>
                  {slot.required && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                      Bắt buộc
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[var(--md-on-surface-variant)] line-clamp-2 mb-3">
                  {slot.description}
                </p>

                {/* File list */}
                <div className="space-y-1.5 mb-3">
                  {slotStaged.map(staged => (
                    <div
                      key={staged.localId}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/40 dark:bg-primary-950/30 text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText size={14} className="text-primary-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--md-on-surface)]" title={staged.file.name}>
                            {staged.file.name}
                          </div>
                          <div className="text-[10px] text-[var(--md-on-surface-variant)]">
                            Sẵn sàng tải lên · {(staged.file.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onRemoveStagedFile?.(staged.localId)}
                          className="p-1 text-zinc-400 hover:text-red-500 transition-colors rounded"
                          title="Hủy chọn tệp này"
                          aria-label={`Bỏ chọn ${staged.file.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}

                  {slotAttachments.map(att => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--md-on-surface)]" title={att.fileName}>
                            {att.fileName}
                          </div>
                          <div className="text-[10px] text-[var(--md-on-surface-variant)]">
                            {formatDateTimeVi(att.uploadedAt) ?? '—'}
                            {att.fileSizeBytes > 0 && ` · ${(att.fileSizeBytes / 1024).toFixed(0)} KB`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDownload(att)}
                          className="p-1 text-zinc-500 hover:text-primary-600 transition-colors rounded"
                          title={`Tải về ${att.fileName}`}
                          aria-label={`Tải về ${att.fileName}`}
                        >
                          <Download size={13} />
                        </button>
                        {!readOnly && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setDeleteTarget(att)}
                            className="p-1 text-zinc-400 hover:text-red-500 transition-colors rounded"
                            title={`Xóa ${att.fileName}`}
                            aria-label={`Xóa ${att.fileName}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {totalSlotItems === 0 && (
                    <div className="py-2.5 px-3 rounded-lg border border-dashed border-[var(--md-outline-variant)] text-center text-[11px] text-[var(--md-on-surface-variant)]/70">
                      Chưa có tệp đính kèm
                    </div>
                  )}
                </div>
              </div>

              {/* Upload trigger button & hidden input */}
              {!readOnly && (
                <div>
                  <input
                    ref={el => {
                      fileInputRefs.current[slot.key] = el;
                    }}
                    type="file"
                    className="hidden"
                    disabled={busy}
                    accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf,.doc,.docx,.rtf,.xls,.xlsx,.xlsm,.xlsb,.csv,.ppt,.pptx,.txt,.zip,.rar"
                    aria-label={`Tải lên ${slot.title}`}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) void handlePickFile(slot.key, file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    size="sm"
                    className="w-full text-xs"
                    disabled={busy}
                    onClick={() => fileInputRefs.current[slot.key]?.click()}
                  >
                    <Upload size={13} className="mr-1.5" />
                    {totalSlotItems > 0 ? 'Thêm / Đổi tệp' : 'Chọn hoặc thả tệp'}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa tệp đính kèm"
        message={`Bạn có chắc chắn muốn xóa tệp "${deleteTarget?.fileName}" khỏi hồ sơ nhà cung cấp không?`}
        confirmLabel="Xóa tệp"
        variant="danger"
        isLoading={busy}
        onConfirm={() => void handleDeleteSaved()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
