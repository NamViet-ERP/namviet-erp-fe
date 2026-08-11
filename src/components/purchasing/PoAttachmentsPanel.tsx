import { useEffect, useId, useRef, useState } from 'react';
import { Download, FileText, Save, Trash2, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmDialog from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage, saveBlob } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import { queryKeys } from '../../services/queryKeys';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import { usePurchaseOrderAttachments } from '../../hooks/usePurchaseOrders';
import type {
  PurchaseOrderAttachmentApiDto,
  PurchaseOrderDocType,
} from '../../types/api/purchaseOrderAttachmentApi';
import { PURCHASE_DOC_TYPE_OPTIONS } from '../../lib/purchasing/purchaseDocTypes';

/** Ô hồ sơ trên chi tiết PO — đủ loại Phase 3. */
const ATTACHMENT_SLOTS = PURCHASE_DOC_TYPE_OPTIONS;

interface PendingAttachment {
  localId: string;
  docType: PurchaseOrderDocType;
  file: File;
}

interface PoAttachmentsPanelProps {
  poCode: string;
  canUpload: boolean;
  /** Báo parent khi còn tệp chưa lưu (để chặn Quay lại). */
  onDirtyChange?: (dirty: boolean) => void;
}

interface PoAttachmentSlotProps {
  docType: PurchaseOrderDocType;
  label: string;
  items: PurchaseOrderAttachmentApiDto[];
  pending: PendingAttachment[];
  canUpload: boolean;
  busy: boolean;
  onPickFile: (docType: PurchaseOrderDocType, file: File) => void;
  onRemovePending: (localId: string) => void;
  onDeleteSaved: (attachmentId: string, fileName: string) => void;
  onDownload: (attachmentId: string, fileName: string) => Promise<void>;
}

function PoAttachmentSlot({
  docType,
  label,
  items,
  pending,
  canUpload,
  busy,
  onPickFile,
  onRemovePending,
  onDeleteSaved,
  onDownload,
}: PoAttachmentSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const count = items.length + pending.length;

  return (
    <article className="po-attach-slot" aria-label={label}>
      <header className="po-attach-slot__head">
        <div className="po-attach-slot__title">
          <span className="po-attach-slot__name">{label}</span>
          <span className="po-attach-slot__count">({count})</span>
        </div>
        {canUpload ? (
          <>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} strokeWidth={1.75} aria-hidden />
              Tải lên
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              disabled={busy}
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.rtf,.xls,.xlsx,.xlsm,.xlsb,.csv,.ppt,.pptx,.txt"
              aria-label={`Tải lên ${label}`}
              onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onPickFile(docType, file);
              }}
            />
          </>
        ) : null}
      </header>

      {count === 0 ? (
        <p className="po-attach-slot__empty">Chưa có hồ sơ.</p>
      ) : (
        <ul className="po-attach-slot__list">
          {pending.map(p => (
            <li key={p.localId} className="po-attach-slot__item po-attach-slot__item--pending">
              <div className="po-attach-slot__file">
                <FileText size={14} strokeWidth={1.75} aria-hidden />
                <div className="min-w-0">
                  <div className="po-attach-slot__filename" title={p.file.name}>
                    {p.file.name}
                  </div>
                  <div className="po-attach-slot__meta">Chưa lưu · {(p.file.size / 1024).toFixed(0)} KB</div>
                </div>
              </div>
              {canUpload ? (
                <div className="po-attach-slot__actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    title={`Bỏ ${p.file.name}`}
                    aria-label={`Bỏ ${p.file.name}`}
                    disabled={busy}
                    onClick={() => onRemovePending(p.localId)}
                  >
                    <Trash2 size={13} strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {items.map(att => (
            <li key={att.id} className="po-attach-slot__item">
              <div className="po-attach-slot__file">
                <FileText size={14} strokeWidth={1.75} aria-hidden />
                <div className="min-w-0">
                  <div className="po-attach-slot__filename" title={att.fileName}>
                    {att.fileName}
                  </div>
                  <div className="po-attach-slot__meta">
                    {formatDateTimeVi(att.uploadedAt) ?? '—'}
                    {att.uploadedByName ? ` · ${att.uploadedByName}` : ''}
                  </div>
                </div>
              </div>
              <div className="po-attach-slot__actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  title={`Tải ${att.fileName}`}
                  aria-label={`Tải ${att.fileName}`}
                  disabled={busy}
                  onClick={() => {
                    void onDownload(att.id, att.fileName);
                  }}
                >
                  <Download size={13} strokeWidth={1.75} aria-hidden />
                </button>
                {canUpload ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    title={`Xóa ${att.fileName}`}
                    aria-label={`Xóa ${att.fileName}`}
                    disabled={busy}
                    onClick={() => onDeleteSaved(att.id, att.fileName)}
                  >
                    <Trash2 size={13} strokeWidth={1.75} aria-hidden />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function PoAttachmentsPanel({
  poCode,
  canUpload,
  onDirtyChange,
}: PoAttachmentsPanelProps) {
  const qc = useQueryClient();
  const localIdPrefix = useId();
  const localSeq = useRef(0);
  const { data: attachments = [], isLoading } = usePurchaseOrderAttachments(poCode);
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; fileName: string } | null>(null);

  const hasUnsaved = pending.length > 0;

  useEffect(() => {
    onDirtyChange?.(hasUnsaved);
  }, [hasUnsaved, onDirtyChange]);

  useEffect(() => {
    if (!hasUnsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsaved]);

  const reload = () => qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.attachments(poCode) });

  const pickFile = (docType: PurchaseOrderDocType, file: File) => {
    localSeq.current += 1;
    setPending(prev => [
      ...prev,
      { localId: `${localIdPrefix}-${localSeq.current}`, docType, file },
    ]);
  };

  const removePending = (localId: string) => {
    setPending(prev => prev.filter(p => p.localId !== localId));
  };

  const savePending = async () => {
    if (pending.length === 0) return;
    setSaving(true);
    const queue = [...pending];
    let ok = 0;
    try {
      for (const item of queue) {
        await purchaseOrdersService.uploadAttachment(poCode, item.file, item.docType);
        ok += 1;
        setPending(prev => prev.filter(p => p.localId !== item.localId));
      }
      await reload();
      showToast('success', ok === 1 ? 'Đã lưu hồ sơ đính kèm.' : `Đã lưu ${ok} hồ sơ đính kèm.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Lưu hồ sơ thất bại'));
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await purchaseOrdersService.deleteAttachment(poCode, deleteTarget.id);
      await reload();
      showToast('success', 'Đã xóa hồ sơ đính kèm.');
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được hồ sơ'));
    }
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      const blob = await purchaseOrdersService.downloadAttachment(poCode, attachmentId);
      await saveBlob(blob, fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được hồ sơ'));
    }
  };

  const totalInSlots = ATTACHMENT_SLOTS.reduce((sum, slot) => {
    const saved = attachments.filter(a => a.docType === slot.value).length;
    const draft = pending.filter(p => p.docType === slot.value).length;
    return sum + saved + draft;
  }, 0);

  return (
    <section className="pur-detail__card" aria-label="Hồ sơ đính kèm">
      <div className="po-attach-panel__head">
        <h2 className="purchasing-section-title mb-0">
          Hồ sơ đính kèm
          <span className="ml-2 text-xs font-normal text-[var(--md-on-surface-variant)]">
            ({isLoading ? '…' : totalInSlots})
          </span>
          {hasUnsaved ? (
            <span className="po-attach-panel__unsaved"> · Chưa lưu {pending.length} tệp</span>
          ) : null}
        </h2>
        {canUpload && hasUnsaved ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving}
            onClick={() => { void savePending(); }}
          >
            <Save size={14} strokeWidth={1.75} aria-hidden />
            {saving ? 'Đang lưu…' : `Lưu hồ sơ (${pending.length})`}
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="pur-detail__muted">Đang tải hồ sơ…</p>
      ) : (
        <div className="po-attach-grid">
          {ATTACHMENT_SLOTS.map(slot => (
            <PoAttachmentSlot
              key={slot.value}
              docType={slot.value}
              label={slot.label}
              items={attachments.filter(a => a.docType === slot.value)}
              pending={pending.filter(p => p.docType === slot.value)}
              canUpload={canUpload}
              busy={saving}
              onPickFile={pickFile}
              onRemovePending={removePending}
              onDeleteSaved={(id, fileName) => setDeleteTarget({ id, fileName })}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { void confirmDelete(); }}
        title="Xóa hồ sơ đính kèm"
        message={deleteTarget
          ? `Bạn có chắc muốn xóa “${deleteTarget.fileName}”? Thao tác không thể hoàn tác.`
          : ''}
        confirmLabel="Xóa"
        variant="danger"
      />
    </section>
  );
}
