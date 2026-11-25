import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { PurchaseDefectAttachmentApiDto } from '../../types/api/poDefectApi';
import type { ImportAttachment } from '../../types';
import { defectsService } from '../../services/defectsService';
import { importsService } from '../../services/importsService';
import { exportReturnsService } from '../../services/exportReturnsService';
import { ApiError } from '../../lib/apiClient';

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(fileName: string): string {
  return fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.') + 1).toUpperCase() : 'FILE';
}

function useObjectUrls(files: File[]): string[] {
  const urls = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  useEffect(() => () => {
    for (const url of urls) URL.revokeObjectURL(url);
  }, [urls]);
  return urls;
}

function RemoveEvidenceButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="pending-evidence__remove" aria-label={label} onClick={onClick}>
      <Trash2 size={14} />
    </button>
  );
}

export function PendingPhotoGrid({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  const urls = useObjectUrls(files);
  if (files.length === 0) return null;
  return (
    <ul className="pending-evidence__photos" aria-label="Ảnh đã chọn">
      {files.map((file, idx) => (
        <li key={`${file.name}-${file.size}-${idx}`} className="pending-evidence__photo">
          <img src={urls[idx]} alt={file.name} className="pending-evidence__photo-img" />
          <div className="pending-evidence__photo-meta">
            <span className="pending-evidence__name" title={file.name}>{file.name}</span>
            <span className="pending-evidence__size">{formatBytes(file.size)}</span>
          </div>
          <RemoveEvidenceButton label={`Xóa ảnh ${file.name}`} onClick={() => onRemove(idx)} />
        </li>
      ))}
    </ul>
  );
}

export function PendingDocList({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  if (files.length === 0) return null;
  return (
    <ul className="pending-evidence__docs" aria-label="File đã chọn">
      {files.map((file, idx) => (
        <li key={`${file.name}-${file.size}-${idx}`} className="pending-evidence__doc">
          <span className="pending-evidence__doc-icon" aria-hidden><FileText size={16} /></span>
          <div className="pending-evidence__doc-body">
            <span className="pending-evidence__name" title={file.name}>{file.name}</span>
            <span className="pending-evidence__size">{getFileExt(file.name)} · {formatBytes(file.size)}</span>
          </div>
          <RemoveEvidenceButton label={`Xóa file ${file.name}`} onClick={() => onRemove(idx)} />
        </li>
      ))}
    </ul>
  );
}

type EvidenceAttachment = { id: string; kind: string; fileName: string };

type SavedBlobPhotoGridProps = {
  entityKey: string;
  attachments: EvidenceAttachment[];
  kinds?: string[];
  ariaLabel: string;
  fetchBlob: (attachmentId: string) => Promise<Blob>;
  onOpen?: (attachmentId: string, fileName: string) => void;
  canEdit?: boolean;
  onDelete?: (attachmentId: string) => void;
  distinguish404?: boolean;
};

function SavedBlobPhotoGrid({
  entityKey,
  attachments,
  kinds = ['photo'],
  ariaLabel,
  fetchBlob,
  onOpen,
  canEdit = false,
  onDelete,
  distinguish404 = true,
}: SavedBlobPhotoGridProps) {
  const photos = useMemo(() => attachments.filter(a => kinds.includes(a.kind)), [attachments, kinds]);
  const photoKey = photos.map(p => p.id).join(',');
  const photosRef = useRef(photos);
  const fetchBlobRef = useRef(fetchBlob);
  useEffect(() => {
    photosRef.current = photos;
    fetchBlobRef.current = fetchBlob;
  }, [photos, fetchBlob]);

  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, 'missing' | 'error'>>({});
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    const created: string[] = [];
    const currentPhotos = photosRef.current;
    if (currentPhotos.length === 0) return () => { alive = false; };
    void (async () => {
      const next: Record<string, string> = {};
      const nextFailed: Record<string, 'missing' | 'error'> = {};
      await Promise.all(
        currentPhotos.map(async att => {
          try {
            const blob = await fetchBlobRef.current(att.id);
            if (!alive) return;
            const url = URL.createObjectURL(blob);
            created.push(url);
            next[att.id] = url;
          } catch (err) {
            nextFailed[att.id] = distinguish404 && err instanceof ApiError && err.status === 404 ? 'missing' : 'error';
          }
        }),
      );
      if (!alive) {
        for (const url of created) URL.revokeObjectURL(url);
        return;
      }
      setUrls(next);
      setFailed(nextFailed);
    })();
    return () => {
      alive = false;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [entityKey, photoKey, reloadToken, distinguish404]);

  if (photos.length === 0) return <p className="pending-evidence__empty">Chưa có ảnh.</p>;

  return (
    <ul className="pending-evidence__photos" aria-label={ariaLabel}>
      {photos.map(att => (
        <li key={att.id} className="pending-evidence__photo">
          {urls[att.id] ? (
            <button type="button" className="pending-evidence__photo-open" onClick={() => onOpen?.(att.id, att.fileName)} title={`Tải ${att.fileName}`}>
              <img src={urls[att.id]} alt={att.fileName} className="pending-evidence__photo-img" />
            </button>
          ) : failed[att.id] ? (
            <button
              type="button"
              className="pending-evidence__photo-img pending-evidence__photo-img--failed"
              onClick={() => setReloadToken(t => t + 1)}
              title={failed[att.id] === 'missing' ? 'Ảnh không còn trên máy chủ (mã 404). Bấm để thử lại.' : 'Thử tải lại ảnh'}
            >
              {failed[att.id] === 'missing' ? 'Ảnh không còn trên máy chủ' : 'Không tải được — bấm thử lại'}
            </button>
          ) : (
            <div className="pending-evidence__photo-img pending-evidence__photo-img--loading">Đang tải…</div>
          )}
          <div className="pending-evidence__photo-meta">
            <span className="pending-evidence__name" title={att.fileName}>{att.fileName}</span>
          </div>
          {canEdit && onDelete ? <RemoveEvidenceButton label={`Xóa ảnh ${att.fileName}`} onClick={() => onDelete(att.id)} /> : null}
        </li>
      ))}
    </ul>
  );
}

type SavedDocListBaseProps = {
  attachments: EvidenceAttachment[];
  canEdit?: boolean;
  onDelete?: (attachmentId: string) => void;
  onDownload?: (attachmentId: string, fileName: string) => void;
};

function SavedDocListBase({ attachments, canEdit = false, onDelete, onDownload }: SavedDocListBaseProps) {
  const docs = useMemo(() => attachments.filter(a => a.kind !== 'photo'), [attachments]);
  if (docs.length === 0) return <p className="pending-evidence__empty">Chưa có file.</p>;
  return (
    <ul className="pending-evidence__docs" aria-label="File chứng từ">
      {docs.map(att => (
        <li key={att.id} className="pending-evidence__doc">
          <span className="pending-evidence__doc-icon" aria-hidden><FileText size={16} /></span>
          <div className="pending-evidence__doc-body">
            <button
              type="button"
              className="pending-evidence__name pending-evidence__name--link"
              title={att.fileName}
              onClick={() => onDownload?.(att.id, att.fileName)}
            >
              {att.fileName}
            </button>
            <span className="pending-evidence__size">{getFileExt(att.fileName)}</span>
          </div>
          {canEdit && onDelete ? <RemoveEvidenceButton label={`Xóa file ${att.fileName}`} onClick={() => onDelete(att.id)} /> : null}
        </li>
      ))}
    </ul>
  );
}

type SavedDefectProps = { ticketCode: string; attachments: PurchaseDefectAttachmentApiDto[]; canEdit?: boolean; onDelete?: (attachmentId: string) => void };
type SavedVoucherProps = { attachments: ImportAttachment[]; canEdit?: boolean; onDelete?: (attachmentId: string) => void; onDownload?: (attachmentId: string, fileName: string) => void };

export function SavedDefectPhotoGrid({ ticketCode, attachments, canEdit = false, onDelete }: SavedDefectProps) {
  return (
    <SavedBlobPhotoGrid
      entityKey={ticketCode} attachments={attachments} ariaLabel="Ảnh hàng lỗi" distinguish404={false}
      fetchBlob={id => defectsService.getAttachmentBlob(ticketCode, id)}
      onOpen={(id, fileName) => { void defectsService.downloadAttachment(ticketCode, id, fileName); }}
      canEdit={canEdit} onDelete={onDelete}
    />
  );
}

export function SavedDefectDocList({ ticketCode, attachments, canEdit = false, onDelete }: SavedDefectProps) {
  return (
    <SavedDocListBase
      attachments={attachments} canEdit={canEdit} onDelete={onDelete}
      onDownload={(id, fileName) => { void defectsService.downloadAttachment(ticketCode, id, fileName); }}
    />
  );
}

/** Ảnh đã lưu trên phiếu nhập — cùng chrome với PendingPhotoGrid. Mặc định chỉ ảnh nhận hàng (`photo`). */
export function SavedImportPhotoGrid({ importId, attachments, canEdit = false, onDelete, onDownload, kinds = ['photo'] }: SavedVoucherProps & { importId: string; kinds?: string[] }) {
  return (
    <SavedBlobPhotoGrid
      entityKey={importId} attachments={attachments} kinds={kinds} ariaLabel="Ảnh nhận hàng"
      fetchBlob={id => importsService.downloadAttachment(importId, id)}
      onOpen={onDownload} canEdit={canEdit} onDelete={onDelete}
    />
  );
}

/** Ảnh đã lưu trên phiếu trả hàng — cùng chrome với PendingPhotoGrid. */
export function SavedExportReturnPhotoGrid({ returnId, attachments, canEdit = false, onDelete, onDownload }: SavedVoucherProps & { returnId: string }) {
  return (
    <SavedBlobPhotoGrid
      entityKey={returnId} attachments={attachments} ariaLabel="Ảnh trả hàng"
      fetchBlob={id => exportReturnsService.downloadAttachment(returnId, id)}
      onOpen={onDownload} canEdit={canEdit} onDelete={onDelete}
    />
  );
}

/** File chứng từ đã lưu trên phiếu nhập — cùng chrome với PendingDocList. */
export function SavedImportDocList({ attachments, canEdit = false, onDelete, onDownload }: SavedVoucherProps) {
  return <SavedDocListBase attachments={attachments} canEdit={canEdit} onDelete={onDelete} onDownload={onDownload} />;
}
