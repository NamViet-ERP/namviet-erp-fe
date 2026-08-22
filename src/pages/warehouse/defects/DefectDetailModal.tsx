import { useEffect, useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import PermissionGate from '../../../components/auth/PermissionGate';
import QtyStepper from '../../../components/ui/QtyStepper';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import {
  useApproveDefect,
  useSubmitDefect,
  useUpdateDefectItems,
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
  onRequestCancel?: (row: PurchaseDefectApiDto) => void;
}

function dash(value: string | null | undefined): string {
  return value?.trim() || '-';
}

export default function DefectDetailModal({
  isOpen,
  selected,
  onClose,
  onHide,
  onSelectedChange,
  onRequestCancel,
}: DefectDetailModalProps) {
  const [uploading, setUploading] = useState(false);
  const [causeSource, setCauseSource] = useState('');
  const [supplierFeedback, setSupplierFeedback] = useState('');
  const [handlingMethod, setHandlingMethod] = useState('');
  const [qtyDrafts, setQtyDrafts] = useState<Record<number, string>>({});

  const { has } = usePermission();
  const canApprove = has('wms.defects.approve');
  const canCreate = has('wms.defects.create');

  const submitMutation = useSubmitDefect();
  const approveMutation = useApproveDefect();
  const updateProcessingMutation = useUpdateDefectProcessing();
  const updateItemsMutation = useUpdateDefectItems();

  const canEditQty = Boolean(
    canCreate && selected && (selected.status === 'draft' || selected.status === 'pending'),
  );

  useEffect(() => {
    if (!selected) return;
    setCauseSource(selected.causeSource ?? '');
    setSupplierFeedback(selected.supplierFeedback ?? '');
    setHandlingMethod(selected.handlingMethod ?? '');
    setQtyDrafts(Object.fromEntries(selected.items.map(it => [it.id, String(it.quantity)])));
  }, [selected]);

  const qtyDirty = useMemo(() => {
    if (!selected) return false;
    return selected.items.some(it => Number(qtyDrafts[it.id]) !== it.quantity);
  }, [selected, qtyDrafts]);

  const qtyValid = useMemo(() => {
    if (!selected) return false;
    return selected.items.every(it => Number(qtyDrafts[it.id]) >= 1);
  }, [selected, qtyDrafts]);

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

  const handleSaveQty = async () => {
    if (!selected) return;
    try {
      const updated = await updateItemsMutation.mutateAsync({
        id: selected.ticketCode,
        request: {
          items: selected.items.map(it => ({
            id: it.id,
            quantity: Number(qtyDrafts[it.id]),
          })),
        },
      });
      onSelectedChange(updated);
      showToast('success', `Đã cập nhật số lượng ${selected.ticketCode}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không cập nhật được số lượng'));
    }
  };

  const canEditEvidence = selected && selected.status !== 'approved' && selected.status !== 'rejected';
  const canEditProcessing = Boolean(canApprove && selected && selected.status === 'approved');

  return (
    <Modal
      isOpen={isOpen && Boolean(selected)}
      onClose={onClose}
      title={selected ? `Phiếu hàng lỗi - ${selected.ticketCode}` : 'Chi tiết'}
      size="full"
      footer={selected ? (
        <>
          <button type="button" className="btn btn-outline" onClick={onHide}>Đóng</button>
          <div className="md-dialog__footer-actions flex items-center gap-2 flex-wrap">
            <DefectStatusCell row={selected} />
            <span className="text-sm text-[var(--md-on-surface-variant)]">
              {selected.sourceType === 'stock' ? selected.projectCode : selected.poCode}
            </span>
            {canEditQty && qtyDirty ? (
              <PermissionGate permission="wms.defects.create">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={updateItemsMutation.isPending || !qtyValid}
                  onClick={() => void handleSaveQty()}
                >
                  Lưu số lượng
                </button>
              </PermissionGate>
            ) : null}
            {selected.status === 'pending' && canCreate && onRequestCancel ? (
              <PermissionGate permission="wms.defects.create">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onRequestCancel(selected)}
                >
                  Hủy phiếu
                </button>
              </PermissionGate>
            ) : null}
            {selected.status === 'draft' ? (
              <PermissionGate permission="wms.defects.create">
                <button
                  type="button"
                  className="btn btn-filled"
                  disabled={submitMutation.isPending || qtyDirty}
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
                  disabled={approveMutation.isPending || qtyDirty}
                  onClick={async () => {
                    try {
                      const updated = await approveMutation.mutateAsync(selected.ticketCode);
                      onSelectedChange(updated);
                      showToast('success', `Đã duyệt ${selected.ticketCode} - cập nhật PO/KHMH, không cộng tồn.`);
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
            <div>Dự án: <strong>{dash(selected.projectCode)}</strong></div>
            {selected.sourceType === 'stock' ? null : (
              <>
                <div>PO: <strong>{dash(selected.poCode)}</strong></div>
                <div>KHMH: <strong>{dash(selected.planCode)}</strong></div>
                <div>NCC: <strong>{dash(selected.supplierName)}</strong></div>
              </>
            )}
          </div>

          <div>
            <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)] mb-1">Dòng hàng</div>
            <div className="wms-voucher-detail-table-wrap">
              <table className="wms-voucher-detail-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Mặt hàng</th>
                  <th className="table-header-cell text-center">SL lỗi</th>
                  <th className="table-header-cell">Lý do dòng</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map(it => (
                  <tr key={it.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
                        {[it.materialCode, it.unit].filter(Boolean).join(' · ') || '-'}
                      </div>
                    </td>
                    <td className="table-cell text-center tabular-nums">
                      {canEditQty ? (
                        <QtyStepper
                          value={qtyDrafts[it.id] ?? String(it.quantity)}
                          min={1}
                          ariaLabel={`Số lượng lỗi ${it.name}`}
                          onChange={qty => setQtyDrafts(prev => ({ ...prev, [it.id]: qty }))}
                        />
                      ) : (
                        it.quantity
                      )}
                    </td>
                    <td className="table-cell whitespace-pre-wrap">{it.lineReason || '-'}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            {canEditQty ? (
              <p className="mt-2 text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
                Có thể giảm SL nếu tồn đã thấp hơn lúc gửi duyệt. Lưu xong mới duyệt được.
              </p>
            ) : null}
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
            <p className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
              {selected.sourceType === 'stock'
                ? 'Phiếu đang giữ chỗ tồn kho dự án. Xuất/chuyển kho không lấy phần này cho đến khi duyệt hoặc hủy. Duyệt sẽ trừ tồn thực tế.'
                : 'Duyệt cần lý do trên từng dòng + ít nhất 1 ảnh. Duyệt xong chỉ cập nhật PO/KHMH - không cộng tồn kho.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
