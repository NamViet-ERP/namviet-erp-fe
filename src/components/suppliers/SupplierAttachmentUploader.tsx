import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Upload, FileText, Download, Trash2, Check, AlertCircle, FileCheck2, FileQuestion } from 'lucide-react';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import { suppliersService, type SupplierAttachmentDto } from '../../services/suppliersService';
import { SUPPLIER_ONBOARDING_DOC_TYPES } from '../../constants/supplierAttachmentConstants';

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

const EMPTY_ATTACHMENTS: SupplierAttachmentDto[] = [];

export default function SupplierAttachmentUploader({
  supplierId,
  initialAttachments = EMPTY_ATTACHMENTS,
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

  const prevInitialRef = useRef(initialAttachments);
  const prevSupplierIdRef = useRef(supplierId);

  useEffect(() => {
    const sameSupplier = prevSupplierIdRef.current === supplierId;
    const sameRef = prevInitialRef.current === initialAttachments;
    const bothEmpty = prevInitialRef.current.length === 0 && initialAttachments.length === 0;
    prevInitialRef.current = initialAttachments;
    prevSupplierIdRef.current = supplierId;
    if (sameSupplier && (sameRef || bothEmpty)) return;
    setAttachments(initialAttachments);
  }, [initialAttachments, supplierId]);

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
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
        <div>
          <div className="text-[length:var(--fs-xs)] font-bold uppercase tracking-wider text-[var(--md-on-surface)] flex items-center gap-1.5">
            <FileCheck2 size={16} className="text-[var(--md-primary)]" />
            Hồ sơ Onboarding đầu vào (Quy chuẩn Hạng D)
          </div>
          <div className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)] mt-0.5">
            Tải lên tài liệu thực tế (PDF, Word, Excel, hình ảnh) để lưu trữ và đánh giá xếp hạng NCC.
          </div>
        </div>

        <div>
          {fulfilledCount === 3 ? (
            <span className="inline-flex items-center gap-1.5 text-[length:var(--fs-xs)] font-semibold text-[var(--md-on-success-container)] bg-[var(--md-success-container)] px-2.5 py-1 rounded-full border border-[var(--tint-success-border)]">
              <Check size={14} className="stroke-[2.5]" />
              Đạt chuẩn Hạng D — Đủ 3/3 hồ sơ đầu vào
            </span>
          ) : hasBusinessLicense ? (
            <span className="inline-flex items-center gap-1.5 text-[length:var(--fs-xs)] font-semibold text-[var(--md-on-info-container)] bg-[var(--md-info-container)] px-2.5 py-1 rounded-full border border-[var(--md-outline-variant)]">
              <Check size={14} className="stroke-[2.5]" />
              Đạt chuẩn Hạng D — Đã có GPKD ({fulfilledCount}/3 hồ sơ)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[length:var(--fs-xs)] font-semibold text-[var(--md-on-warning-container)] bg-[var(--md-warning-container)] px-2.5 py-1 rounded-full border border-[var(--tint-warning-border)]">
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
                  ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)] scale-[1.01]'
                  : isSlotFulfilled
                  ? 'border-[var(--tint-success-border)] bg-[var(--tint-success-soft)]'
                  : slot.required
                  ? 'border-[var(--tint-warning-border)] bg-[var(--tint-warning-soft)]'
                  : 'border-[var(--md-outline-variant)] bg-[var(--md-surface)]'
              }`}
            >
              <div>
                {/* Slot Header */}
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isSlotFulfilled ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--md-success-container)] text-[var(--md-on-success-container)]">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                    ) : slot.required ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)]">
                        <AlertCircle size={12} />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--md-surface-container-highest)] text-[var(--md-on-surface-variant)]">
                        <FileQuestion size={12} />
                      </span>
                    )}
                    <span className="text-[length:var(--fs-xs)] font-bold text-[var(--md-on-surface)] leading-snug">
                      {slot.title}
                    </span>
                  </div>
                  {slot.required && (
                    <span className="text-[length:var(--fs-micro)] font-semibold text-[var(--md-on-warning-container)] bg-[var(--md-warning-container)] px-1.5 py-0.5 rounded-[var(--radius-xs)]">
                      Bắt buộc
                    </span>
                  )}
                </div>

                <p className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)] line-clamp-2 mb-3">
                  {slot.description}
                </p>

                {/* File list */}
                <div className="space-y-1.5 mb-3">
                  {slotStaged.map(staged => (
                    <div
                      key={staged.localId}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-dashed border-[var(--md-primary)] bg-[var(--md-primary-container)] text-[length:var(--fs-xs)]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText size={14} className="text-[var(--md-primary)] shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--md-on-surface)]" title={staged.file.name}>
                            {staged.file.name}
                          </div>
                          <div className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
                            Sẵn sàng tải lên · {(staged.file.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onRemoveStagedFile?.(staged.localId)}
                          className="icon-btn icon-btn--danger shrink-0"
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
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[length:var(--fs-xs)]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText size={14} className="text-[var(--md-success)] shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--md-on-surface)]" title={att.fileName}>
                            {att.fileName}
                          </div>
                          <div className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
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
                          className="icon-btn"
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
                            className="icon-btn icon-btn--danger"
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
                    <div className="py-2.5 px-3 rounded-lg border border-dashed border-[var(--md-outline-variant)] text-center text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)] opacity-75">
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
                    fullWidth
                    leftIcon={Upload}
                    disabled={busy}
                    onClick={() => fileInputRefs.current[slot.key]?.click()}
                  >
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
