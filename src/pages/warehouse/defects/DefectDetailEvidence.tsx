import { useRef } from 'react';
import { FileText, Upload } from 'lucide-react';
import FormField from '../../../components/ui/FormField';
import {
  SavedDefectDocList,
  SavedDefectPhotoGrid,
} from '../../../components/warehouse/PendingLocalEvidence';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { defectsService } from '../../../services/defectsService';
import type { PurchaseDefectApiDto } from '../../../types/api/poDefectApi';

interface DefectDetailEvidenceProps {
  selected: PurchaseDefectApiDto;
  canEditEvidence: boolean;
  uploading: boolean;
  onUploadingChange: (value: boolean) => void;
  onReloadSelected: () => Promise<void>;
}

export default function DefectDetailEvidence({
  selected,
  canEditEvidence,
  uploading,
  onUploadingChange,
  onReloadSelected,
}: DefectDetailEvidenceProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const photos = selected.attachments.filter(a => a.kind === 'photo');
  const docs = selected.attachments.filter(a => a.kind === 'document');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <FormField label="Ảnh hàng lỗi">
        <div className={`pending-evidence${canEditEvidence && photos.length === 0 ? '' : ''}`}>
          {canEditEvidence ? (
            <>
              <button
                type="button"
                className={`pending-evidence__zone${uploading ? ' is-disabled' : ''}`}
                disabled={uploading}
                onClick={() => photoInputRef.current?.click()}
              >
                <Upload size={20} aria-hidden />
                <span className="pending-evidence__zone-hint">
                  {uploading ? 'Đang tải...' : 'Chọn ảnh (có thể chọn nhiều)'}
                </span>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="pending-evidence__input"
                disabled={uploading}
                onChange={async e => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (files.length === 0) return;
                  onUploadingChange(true);
                  try {
                    for (const file of files) {
                      await defectsService.uploadAttachment(selected.ticketCode, file, 'photo');
                    }
                    await onReloadSelected();
                    showToast('success', 'Đã thêm ảnh.');
                  } catch (err) {
                    showToast('error', getApiErrorMessage(err, 'Upload thất bại'));
                  } finally {
                    onUploadingChange(false);
                  }
                }}
              />
            </>
          ) : null}
          <SavedDefectPhotoGrid
            ticketCode={selected.ticketCode}
            attachments={selected.attachments}
            canEdit={canEditEvidence}
            onDelete={async attachmentId => {
              try {
                await defectsService.deleteAttachment(selected.ticketCode, attachmentId);
                await onReloadSelected();
              } catch (err) {
                showToast('error', getApiErrorMessage(err, 'Không xóa được'));
              }
            }}
          />
          {!canEditEvidence && photos.length === 0 ? (
            <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">-</p>
          ) : null}
        </div>
      </FormField>

      <FormField label="File chứng từ">
        <div className="pending-evidence">
          {canEditEvidence ? (
            <>
              <button
                type="button"
                className={`pending-evidence__zone${uploading ? ' is-disabled' : ''}`}
                disabled={uploading}
                onClick={() => docInputRef.current?.click()}
              >
                <FileText size={20} aria-hidden />
                <span className="pending-evidence__zone-hint">
                  {uploading ? 'Đang tải...' : 'Chọn file PDF / Word / Excel'}
                </span>
              </button>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                multiple
                className="pending-evidence__input"
                disabled={uploading}
                onChange={async e => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (files.length === 0) return;
                  onUploadingChange(true);
                  try {
                    for (const file of files) {
                      await defectsService.uploadAttachment(selected.ticketCode, file, 'document');
                    }
                    await onReloadSelected();
                    showToast('success', 'Đã thêm file.');
                  } catch (err) {
                    showToast('error', getApiErrorMessage(err, 'Upload thất bại'));
                  } finally {
                    onUploadingChange(false);
                  }
                }}
              />
            </>
          ) : null}
          <SavedDefectDocList
            ticketCode={selected.ticketCode}
            attachments={selected.attachments}
            canEdit={canEditEvidence}
            onDelete={async attachmentId => {
              try {
                await defectsService.deleteAttachment(selected.ticketCode, attachmentId);
                await onReloadSelected();
              } catch (err) {
                showToast('error', getApiErrorMessage(err, 'Không xóa được'));
              }
            }}
          />
          {!canEditEvidence && docs.length === 0 ? (
            <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">-</p>
          ) : null}
        </div>
      </FormField>
    </div>
  );
}
