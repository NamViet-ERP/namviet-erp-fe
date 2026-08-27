import { useEffect, useMemo, useState } from 'react';
import PermissionGate from '../../../components/auth/PermissionGate';
import QtyStepper from '../../../components/ui/QtyStepper';
import { showToast } from '../../../components/ui/Toast';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import { displayValue } from '../../../components/warehouse/voucherDetailUtils';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
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
import {
  defectDetailBadgeLabel,
  defectDetailBadgeStatus,
  defectStatusHint,
} from './defectUtils';

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

  if (!selected) return null;

  const canEditEvidence = selected.status !== 'approved' && selected.status !== 'rejected';
  const canEditProcessing = Boolean(canApprove && selected.status === 'approved');
  const status = defectDetailBadgeStatus(selected);
  const importTicket = selected.importTicketCode;

  return (
    <VoucherDetailModal
      isOpen={isOpen}
      onClose={onClose}
      voucherCode={selected.ticketCode}
      status={status}
      size="wide"
      className="wms-voucher-detail--lines"
      statusLabel={defectDetailBadgeLabel(selected)}
      statusHint={defectStatusHint(selected)}
      approvedBy={selected.approvedByName ?? undefined}
      approvedAt={selected.approvedAt ? String(selected.approvedAt) : undefined}
      fields={[
        {
          label: 'Nguồn',
          value: selected.sourceType === 'stock' ? 'Hàng lỗi tồn kho' : 'Hàng lỗi PO',
        },
        { label: 'Kho dự án', value: displayValue(selected.projectCode) },
        ...(selected.sourceType === 'stock'
          ? []
          : [
              { label: 'PO', value: displayValue(selected.poCode) },
              { label: 'KHMH', value: displayValue(selected.planCode) },
              { label: 'Nhà cung cấp', value: displayValue(selected.supplierName) },
            ]),
        ...(importTicket ? [{ label: 'NK liên kết', value: displayValue(importTicket) }] : []),
        {
          label: 'Tạo lúc',
          value: displayValue(formatDateTimeVi(
            typeof selected.createdAt === 'string'
              ? selected.createdAt
              : selected.createdAt
                ? new Date(selected.createdAt).toISOString()
                : undefined,
          )),
        },
        { label: 'Người lập', value: displayValue(selected.createdByName) },
        { label: 'Ghi chú', value: displayValue(selected.note ?? selected.reason), wide: true },
      ]}
      itemsTitle={`Danh sách vật tư (${selected.items.length})`}
      footer={
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <button type="button" className="btn btn-outline btn-sm" onClick={onHide}>
            Đóng
          </button>
          <div className="flex items-center gap-2 flex-wrap">
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
                  className="btn btn-primary"
                  disabled={approveMutation.isPending || qtyDirty}
                  onClick={async () => {
                    try {
                      const updated = await approveMutation.mutateAsync(selected.ticketCode);
                      onSelectedChange(updated);
                      showToast(
                        'success',
                        `Đã duyệt ${selected.ticketCode} - cập nhật PO/KHMH, không cộng tồn.`,
                      );
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
        </div>
      }
    >
      <div className="overflow-x-auto table-scroll">
        <table className="form-table import-items-table import-items-table--defect-detail text-xs">
          <thead>
            <tr>
              <th className="table-header-cell text-center import-line-item-col">Mặt hàng</th>
              <th className="table-header-cell text-center import-manual-col-qty">SL lỗi</th>
              <th className="table-header-cell text-center import-po-col-unit">ĐVT</th>
              <th className="table-header-cell text-center defect-col-reason">Lý do dòng</th>
            </tr>
          </thead>
          <tbody>
            {selected.items.map(it => {
              const code = (it.materialCode ?? '').trim();
              return (
                <tr key={it.id} className="table-row">
                  <td className="table-cell import-line-item-col">
                    <div className="import-line-item__name">{it.name}</div>
                    <div className="import-line-item__code">{code || '-'}</div>
                  </td>
                  <td className="table-cell text-center import-manual-col-qty">
                    {canEditQty ? (
                      <div className="import-cell-placeholder import-cell-placeholder--center">
                        <QtyStepper
                          value={qtyDrafts[it.id] ?? String(it.quantity)}
                          min={0}
                          max={it.quantity}
                          className="qty-stepper--compact"
                          ariaLabel={`Số lượng lỗi ${it.name}`}
                          onChange={qtyVal =>
                            setQtyDrafts(prev => ({ ...prev, [it.id]: qtyVal }))
                          }
                        />
                      </div>
                    ) : (
                      <div className="import-cell-placeholder import-cell-placeholder--center tabular-nums font-semibold">
                        {it.quantity}
                      </div>
                    )}
                  </td>
                  <td className="table-cell text-center import-po-col-unit">
                    <div className="import-cell-placeholder import-cell-placeholder--center">
                      {it.unit?.trim() || '-'}
                    </div>
                  </td>
                  <td className="table-cell defect-col-reason text-[var(--md-on-surface)]">
                    {dash(it.lineReason)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[var(--md-outline-variant)]">
              <td className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2">
                Tổng cộng ({selected.items.length} dòng)
              </td>
              <td className="table-cell text-center tabular-nums font-bold text-[var(--md-primary)] py-2">
                {selected.items.reduce((sum, it) => {
                  const q = canEditQty ? Number(qtyDrafts[it.id]) : it.quantity;
                  return sum + (Number.isFinite(q) ? q : 0);
                }, 0)}
              </td>
              <td className="table-cell" />
              <td className="table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>

      {canEditQty ? (
        <p className="mt-2 text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)] text-pretty">
          Có thể giảm SL rồi bấm Lưu số lượng trước khi duyệt.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
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
          canEditEvidence={canEditEvidence}
          uploading={uploading}
          onUploadingChange={setUploading}
          onReloadSelected={reloadSelected}
        />
      </div>
    </VoucherDetailModal>
  );
}
