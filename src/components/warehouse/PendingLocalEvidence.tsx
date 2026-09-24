import { useEffect, useMemo, useState } from 'react';
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

function useObjectUrls(files: File[]): string[] {
  const urls = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  useEffect(() => () => {
    for (const url of urls) URL.revokeObjectURL(url);
  }, [urls]);
  return urls;
}

type PendingPhotoGridProps = {
  files: File[];
  onRemove: (index: number) => void;
};

export function PendingPhotoGrid({ files, onRemove }: PendingPhotoGridProps) {
  const urls = useObjectUrls(files);
  if (files.length === 0) {
    return null;
  }
  return (
    <ul className="pending-evidence__photos" aria-label="Ảnh đã chọn">
      {files.map((file, idx) => (
        <li key={`${file.name}-${file.size}-${idx}`} className="pending-evidence__photo">
          <img src={urls[idx]} alt={file.name} className="pending-evidence__photo-img" />
          <div className="pending-evidence__photo-meta">
            <span className="pending-evidence__name" title={file.name}>{file.name}</span>
            <span className="pending-evidence__size">{formatBytes(file.size)}</span>
          </div>
          <button
            type="button"
            className="pending-evidence__remove"
            aria-label={`Xóa ảnh ${file.name}`}
            onClick={() => onRemove(idx)}
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}

type PendingDocListProps = {
  files: File[];
  onRemove: (index: number) => void;
};

export function PendingDocList({ files, onRemove }: PendingDocListProps) {
  if (files.length === 0) {
    return null;
  }
  return (
    <ul className="pending-evidence__docs" aria-label="File đã chọn">
      {files.map((file, idx) => {
        const ext = file.name.includes('.')
          ? file.name.slice(file.name.lastIndexOf('.') + 1).toUpperCase()
          : 'FILE';
        return (
          <li key={`${file.name}-${file.size}-${idx}`} className="pending-evidence__doc">
            <span className="pending-evidence__doc-icon" aria-hidden>
              <FileText size={16} />
            </span>
            <div className="pending-evidence__doc-body">
              <span className="pending-evidence__name" title={file.name}>{file.name}</span>
              <span className="pending-evidence__size">{ext} · {formatBytes(file.size)}</span>
            </div>
            <button
              type="button"
              className="pending-evidence__remove"
              aria-label={`Xóa file ${file.name}`}
              onClick={() => onRemove(idx)}
            >
              <Trash2 size={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type SavedPhotoGridProps = {
  ticketCode: string;
  attachments: PurchaseDefectAttachmentApiDto[];
  canEdit?: boolean;
  onDelete?: (attachmentId: string) => void;
};

export function SavedDefectPhotoGrid({
  ticketCode,
  attachments,
  canEdit = false,
  onDelete,
}: SavedPhotoGridProps) {
  const photos = useMemo(
    () => attachments.filter(a => a.kind === 'photo'),
    [attachments],
  );
  const photoKey = photos.map(p => p.id).join(',');
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    const created: string[] = [];
    if (photos.length === 0) {
      return () => {
        alive = false;
      };
    }
    void (async () => {
      const next: Record<string, string> = {};
      const nextFailed: Record<string, boolean> = {};
      await Promise.all(
        photos.map(async att => {
          try {
            const blob = await defectsService.getAttachmentBlob(ticketCode, att.id);
            if (!alive) return;
            const url = URL.createObjectURL(blob);
            created.push(url);
            next[att.id] = url;
          } catch {
            nextFailed[att.id] = true;
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
  }, [ticketCode, photoKey, reloadToken]);

  if (photos.length === 0) {
    return <p className="pending-evidence__empty">Chưa có ảnh.</p>;
  }

  return (
    <ul className="pending-evidence__photos" aria-label="Ảnh hàng lỗi">
      {photos.map(att => (
        <li key={att.id} className="pending-evidence__photo">
          {urls[att.id] ? (
            <button
              type="button"
              className="pending-evidence__photo-open"
              onClick={() => {
                void defectsService.downloadAttachment(ticketCode, att.id, att.fileName);
              }}
              title={`Tải ${att.fileName}`}
            >
              <img src={urls[att.id]} alt={att.fileName} className="pending-evidence__photo-img" />
            </button>
          ) : failed[att.id] ? (
            <button
              type="button"
              className="pending-evidence__photo-img pending-evidence__photo-img--failed"
              onClick={() => setReloadToken(t => t + 1)}
              title="Thử tải lại ảnh"
            >
              Không tải được — bấm thử lại
            </button>
          ) : (
            <div className="pending-evidence__photo-img pending-evidence__photo-img--loading">
              Đang tải…
            </div>
          )}
          <div className="pending-evidence__photo-meta">
            <span className="pending-evidence__name" title={att.fileName}>{att.fileName}</span>
          </div>
          {canEdit && onDelete ? (
            <button
              type="button"
              className="pending-evidence__remove"
              aria-label={`Xóa ảnh ${att.fileName}`}
              onClick={() => onDelete(att.id)}
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type SavedDocListProps = {
  ticketCode: string;
  attachments: PurchaseDefectAttachmentApiDto[];
  canEdit?: boolean;
  onDelete?: (attachmentId: string) => void;
};

export function SavedDefectDocList({
  ticketCode,
  attachments,
  canEdit = false,
  onDelete,
}: SavedDocListProps) {
  const docs = useMemo(
    () => attachments.filter(a => a.kind !== 'photo'),
    [attachments],
  );
  if (docs.length === 0) {
    return <p className="pending-evidence__empty">Chưa có file.</p>;
  }
  return (
    <ul className="pending-evidence__docs" aria-label="File chứng từ">
      {docs.map(att => {
        const ext = att.fileName.includes('.')
          ? att.fileName.slice(att.fileName.lastIndexOf('.') + 1).toUpperCase()
          : 'FILE';
        return (
          <li key={att.id} className="pending-evidence__doc">
            <span className="pending-evidence__doc-icon" aria-hidden>
              <FileText size={16} />
            </span>
            <div className="pending-evidence__doc-body">
              <button
                type="button"
                className="pending-evidence__name pending-evidence__name--link"
                title={att.fileName}
                onClick={() => {
                  void defectsService.downloadAttachment(ticketCode, att.id, att.fileName);
                }}
              >
                {att.fileName}
              </button>
              <span className="pending-evidence__size">{ext}</span>
            </div>
            {canEdit && onDelete ? (
              <button
                type="button"
                className="pending-evidence__remove"
                aria-label={`Xóa file ${att.fileName}`}
                onClick={() => onDelete(att.id)}
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

type SavedImportPhotoGridProps = {
  importId: string;
  attachments: ImportAttachment[];
  canEdit?: boolean;
  onDelete?: (attachmentId: string) => void;
  onDownload?: (attachmentId: string, fileName: string) => void;
  /** Mặc định chỉ ảnh nhận hàng (`photo`). */
  kinds?: string[];
};

/** Ảnh đã lưu trên phiếu nhập — cùng chrome với PendingPhotoGrid. */
export function SavedImportPhotoGrid({
  importId,
  attachments,
  canEdit = false,
  onDelete,
  onDownload,
  kinds = ['photo'],
}: SavedImportPhotoGridProps) {
  const photos = useMemo(
    () => attachments.filter(a => kinds.includes(a.kind)),
    [attachments, kinds],
  );
  const photoKey = photos.map(p => p.id).join(',');
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, 'missing' | 'error'>>({});
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    const created: string[] = [];
    if (photos.length === 0) {
      return () => {
        alive = false;
      };
    }
    void (async () => {
      const next: Record<string, string> = {};
      const nextFailed: Record<string, 'missing' | 'error'> = {};
      await Promise.all(
        photos.map(async att => {
          try {
            const blob = await importsService.downloadAttachment(importId, att.id);
            if (!alive) return;
            const url = URL.createObjectURL(blob);
            created.push(url);
            next[att.id] = url;
          } catch (err) {
            nextFailed[att.id] = err instanceof ApiError && err.status === 404 ? 'missing' : 'error';
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
  }, [importId, photoKey, reloadToken]);

  if (photos.length === 0) {
    return <p className="pending-evidence__empty">Chưa có ảnh.</p>;
  }

  return (
    <ul className="pending-evidence__photos" aria-label="Ảnh nhận hàng">
      {photos.map(att => (
        <li key={att.id} className="pending-evidence__photo">
          {urls[att.id] ? (
            <button
              type="button"
              className="pending-evidence__photo-open"
              onClick={() => onDownload?.(att.id, att.fileName)}
              title={`Tải ${att.fileName}`}
            >
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
            <div className="pending-evidence__photo-img pending-evidence__photo-img--loading">
              Đang tải…
            </div>
          )}
          <div className="pending-evidence__photo-meta">
            <span className="pending-evidence__name" title={att.fileName}>{att.fileName}</span>
          </div>
          {canEdit && onDelete ? (
            <button
              type="button"
              className="pending-evidence__remove"
              aria-label={`Xóa ảnh ${att.fileName}`}
              onClick={() => onDelete(att.id)}
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type SavedExportReturnPhotoGridProps = {
  returnId: string;
  attachments: ImportAttachment[];
  canEdit?: boolean;
  onDelete?: (attachmentId: string) => void;
  onDownload?: (attachmentId: string, fileName: string) => void;
};

/** Ảnh đã lưu trên phiếu trả hàng — cùng chrome với PendingPhotoGrid. */
export function SavedExportReturnPhotoGrid({
  returnId,
  attachments,
  canEdit = false,
  onDelete,
  onDownload,
}: SavedExportReturnPhotoGridProps) {
  const photos = useMemo(
    () => attachments.filter(a => a.kind === 'photo'),
    [attachments],
  );
  const photoKey = photos.map(p => p.id).join(',');
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, 'missing' | 'error'>>({});
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    const created: string[] = [];
    if (photos.length === 0) {
      return () => {
        alive = false;
      };
    }
    void (async () => {
      const next: Record<string, string> = {};
      const nextFailed: Record<string, 'missing' | 'error'> = {};
      await Promise.all(
        photos.map(async att => {
          try {
            const blob = await exportReturnsService.downloadAttachment(returnId, att.id);
            if (!alive) return;
            const url = URL.createObjectURL(blob);
            created.push(url);
            next[att.id] = url;
          } catch (err) {
            nextFailed[att.id] = err instanceof ApiError && err.status === 404 ? 'missing' : 'error';
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
  }, [returnId, photoKey, reloadToken]);

  if (photos.length === 0) {
    return <p className="pending-evidence__empty">Chưa có ảnh.</p>;
  }

  return (
    <ul className="pending-evidence__photos" aria-label="Ảnh trả hàng">
      {photos.map(att => (
        <li key={att.id} className="pending-evidence__photo">
          {urls[att.id] ? (
            <button
              type="button"
              className="pending-evidence__photo-open"
              onClick={() => onDownload?.(att.id, att.fileName)}
              title={`Tải ${att.fileName}`}
            >
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
            <div className="pending-evidence__photo-img pending-evidence__photo-img--loading">
              Đang tải…
            </div>
          )}
          <div className="pending-evidence__photo-meta">
            <span className="pending-evidence__name" title={att.fileName}>{att.fileName}</span>
          </div>
          {canEdit && onDelete ? (
            <button
              type="button"
              className="pending-evidence__remove"
              aria-label={`Xóa ảnh ${att.fileName}`}
              onClick={() => onDelete(att.id)}
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type SavedImportDocListProps = {
  attachments: ImportAttachment[];
  canEdit?: boolean;
  onDelete?: (attachmentId: string) => void;
  onDownload?: (attachmentId: string, fileName: string) => void;
};

/** File chứng từ đã lưu trên phiếu nhập — cùng chrome với PendingDocList. */
export function SavedImportDocList({
  attachments,
  canEdit = false,
  onDelete,
  onDownload,
}: SavedImportDocListProps) {
  const docs = useMemo(
    () => attachments.filter(a => a.kind !== 'photo'),
    [attachments],
  );
  if (docs.length === 0) {
    return <p className="pending-evidence__empty">Chưa có file.</p>;
  }
  return (
    <ul className="pending-evidence__docs" aria-label="File chứng từ">
      {docs.map(att => {
        const ext = att.fileName.includes('.')
          ? att.fileName.slice(att.fileName.lastIndexOf('.') + 1).toUpperCase()
          : 'FILE';
        return (
          <li key={att.id} className="pending-evidence__doc">
            <span className="pending-evidence__doc-icon" aria-hidden>
              <FileText size={16} />
            </span>
            <div className="pending-evidence__doc-body">
              <button
                type="button"
                className="pending-evidence__name pending-evidence__name--link"
                title={att.fileName}
                onClick={() => onDownload?.(att.id, att.fileName)}
              >
                {att.fileName}
              </button>
              <span className="pending-evidence__size">{ext}</span>
            </div>
            {canEdit && onDelete ? (
              <button
                type="button"
                className="pending-evidence__remove"
                aria-label={`Xóa file ${att.fileName}`}
                onClick={() => onDelete(att.id)}
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
