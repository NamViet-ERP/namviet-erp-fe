import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import PermissionGate from '../../../components/auth/PermissionGate';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import {
  useApproveDefect,
  useSubmitDefect,
  useUpdateDefectProcessing,
} from '../../../hooks/useDefects';
import { usePermission } from '../../../hooks/usePermission';
import { defectsService } from '../../../services/defectsService';
import type { PurchaseDefectApiDto } from '../../../types/api/poDefectApi';
import DefectDetailEvidence from './DefectDetailEvidence';
import DefectDetailProcessing from './DefectDetailProcessing';
import DefectStatusCell from './DefectStatusCell';

interface DefectDetailModalProps {
  isOpen: boolean;
  selected: PurchaseDefectApiDto | null;
  /** Backdrop / X — đóng và clear selected. */
  onClose: () => void;
  /** Nút Đóng — chỉ ẩn modal, giữ selected (hành vi cũ). */
  onHide: () => void;
  onSelectedChange: (row: PurchaseDefectApiDto | null) => void;
}

export default function DefectDetailModal({
  isOpen,
  selected,
  onClose,
  onHide,
  onSelectedChange,
}: DefectDetailModalProps) {
  const [uploading, setUploading] = useState(false);
  const [causeSource, setCauseSource] = useState('');
  const [supplierFeedback, setSupplierFeedback] = useState('');
  const [handlingMethod, setHandlingMethod] = useState('');

  const { has } = usePermission();
  const canApprove = has('wms.defects.approve');

  const submitMutation = useSubmitDefect();
  const approveMutation = useApproveDefect();
  const updateProcessingMutation = useUpdateDefectProcessing();

  useEffect(() => {
    if (!selected) return;
    setCauseSource(selected.causeSource ?? '');
    setSupplierFeedback(selected.supplierFeedback ?? '');
    setHandlingMethod(selected.handlingMethod ?? '');
  }, [selected]);

  const reloadSelected = async () => {
    if (!selected) return;
    const fresh = await defectsService.getById(selected.ticketCode);
    onSelectedChange(fresh);
  };

  const handleSaveProcessing = async () => {
    if (!selected) return;
    try {
      const updated = await updateProcessingMutation.mutateAsync({
        id: selected.ticketCode,
        request: {
          causeSource: causeSource || null,
          supplierFeedback: supplierFeedback.trim() || null,
          handlingMethod: handlingMethod || null,
        },
      });
      onSelectedChange(updated);
      showToast('success', 'Đã lưu thông tin xử lý.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lưu được thông tin xử lý'));
    }
  };

  const canEditEvidence = selected && selected.status !== 'approved';
  const canEditProcessing = Boolean(canApprove && selected && selected.status === 'approved');

  return (
    <Modal
      isOpen={isOpen && Boolean(selected)}
      onClose={onClose}
      title={selected ? `Phiếu hàng lỗi — ${selected.ticketCode}` : 'Chi tiết'}
      size="full"
      footer={selected ? (
        <>
          <button type="button" className="btn btn-outline" onClick={onHide}>Đóng</button>
          <div className="md-dialog__footer-actions flex items-center gap-2 flex-wrap">
            <DefectStatusCell row={selected} />
            <span className="text-sm text-[var(--md-on-surface-variant)]">
              {selected.sourceType === 'stock' ? selected.projectCode : selected.poCode}
            </span>
            {selected.status === 'draft' ? (
              <PermissionGate permission="wms.defects.create">
                <button
                  type="button"
                  className="btn btn-filled"
                  disabled={submitMutation.isPending}
                  onClick={async () => {
                    try {
                      const updated = await submitMutation.mutateAsync(selected.ticketCode);
                      onSelectedChange(updated);
                      showToast('success', 'Đã gửi duyệt.');
                    } catch (err) {
                      showToast('error', getApiErrorMessage(err, 'Không gửi duyệt được'));
                    }
                  }}
                >
                  Gửi duyệt
                </button>
              </PermissionGate>
            ) : null}
            {selected.status === 'pending' ? (
              <PermissionGate permission="wms.defects.approve">
                <button
                  type="button"
                  className="btn btn-filled"
                  disabled={approveMutation.isPending}
                  onClick={async () => {
                    try {
                      const updated = await approveMutation.mutateAsync(selected.ticketCode);
                      onSelectedChange(updated);
                      showToast('success', 'Đã duyệt — đã cập nhật PO/KHMH, không cộng tồn.');
                    } catch (err) {
                      showToast('error', getApiErrorMessage(err, 'Không duyệt được'));
                    }
                  }}
                >
                  Duyệt
                </button>
              </PermissionGate>
            ) : null}
          </div>
        </>
      ) : null}
    >
      {selected ? (
        <div className="space-y-3 text-sm defect-detail-form">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Nguồn: <strong>{selected.sourceType === 'stock' ? 'Hàng lỗi nhập kho' : 'Hàng lỗi PO'}</strong></div>
            <div>Dự án: <strong>{selected.projectCode || '—'}</strong></div>
            {selected.sourceType === 'stock' ? null : (
              <>
                <div>PO: <strong>{selected.poCode || '—'}</strong></div>
                <div>KHMH: <strong>{selected.planCode || '—'}</strong></div>
                <div>NCC: <strong>{selected.supplierName || '—'}</strong></div>
              </>
            )}
          </div>

          <div>
            <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)] mb-1">Dòng hàng</div>
            <table className="form-table text-xs w-full">
              <thead>
                <tr>
                  <th className="table-header-cell">Mặt hàng</th>
                  <th className="table-header-cell text-center">SL lỗi</th>
                  <th className="table-header-cell">Lý do dòng</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map(it => (
                  <tr key={it.id}>
                    <td className="table-cell">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-[10px] text-[var(--md-on-surface-variant)]">
                        {[it.materialCode, it.unit].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </td>
                    <td className="table-cell text-center tabular-nums">{it.quantity}</td>
                    <td className="table-cell whitespace-pre-wrap">{it.lineReason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DefectDetailProcessing
            selected={selected}
            canEditProcessing={canEditProcessing}
            causeSource={causeSource}
            supplierFeedback={supplierFeedback}
            handlingMethod={handlingMethod}
            onCauseSourceChange={setCauseSource}
            onSupplierFeedbackChange={setSupplierFeedback}
            onHandlingMethodChange={setHandlingMethod}
            onSave={() => void handleSaveProcessing()}
            saving={updateProcessingMutation.isPending}
          />

          <DefectDetailEvidence
            selected={selected}
            canEditEvidence={Boolean(canEditEvidence)}
            uploading={uploading}
            onUploadingChange={setUploading}
            onReloadSelected={reloadSelected}
          />
          {selected.status === 'pending' ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">
              Duyệt cần lý do trên từng dòng + ít nhất 1 ảnh. Duyệt xong chỉ cập nhật PO/KHMH — không cộng tồn kho.
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
