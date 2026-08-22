import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PoVoucherModel } from '../../../components/purchasing/PoVoucherPreview';
import { showToast } from '../../../components/ui/Toast';
import {
  useApprovePurchaseOrder,
  usePlacePurchaseOrder,
  usePurchaseOrder,
  useUnapprovePurchaseOrder,
  useUpdatePurchaseOrder,
} from '../../../hooks/usePurchaseOrders';
import { usePermission } from '../../../hooks/usePermission';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { printPoSheet } from '../../../lib/purchasing/printPoSheet';
import {
  poApprovalStatus,
  poDeliveryStatus,
  poPaymentStatus,
  poPaymentWarningStatus,
  poPlacementStatus,
} from '../../../lib/purchasing/purchaseOrderStatus';

export type PoEditLineDraft = {
  qty: string;
  unitPrice: string;
  note: string;
  expectedDeliveryDate: string;
  warrantyMonths: string;
  warrantyAnchorType: string;
};

export function usePurchaseOrderDetail(code: string) {
  const navigate = useNavigate();
  const { data: order, isLoading, isError, error, refetch } = usePurchaseOrder(code);
  const approveMutation = useApprovePurchaseOrder();
  const unapproveMutation = useUnapprovePurchaseOrder();
  const placeMutation = usePlacePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const { has } = usePermission();
  const canApprove = has('purchasing.orders.approve');
  const canUnapprove = has('purchasing.orders.unapprove');
  const canPlace = has('purchasing.orders.place');
  const canUpdate = has('purchasing.orders.update');
  const lines = order?.lines ?? [];
  const actionBusy =
    approveMutation.isPending
    || unapproveMutation.isPending
    || placeMutation.isPending
    || updateMutation.isPending;
  const isDraft = order?.approvalStatus === 'draft';
  const isApproved = order?.approvalStatus === 'approved';
  const isPlaced = order?.orderPlacementStatus === 'placed';

  const [editing, setEditing] = useState(false);
  const [attachDirty, setAttachDirty] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editLines, setEditLines] = useState<Record<number, PoEditLineDraft>>({});

  const approval = poApprovalStatus(order?.approvalStatus);
  const placement = poPlacementStatus(order?.orderPlacementStatus);
  const delivery = poDeliveryStatus(order?.deliveryStatus);
  const payment = poPaymentStatus(order?.paymentStatus);
  const paymentWarning = poPaymentWarningStatus(Boolean(order?.paymentWarning));

  const printModel: PoVoucherModel | null = useMemo(() => {
    if (!order) return null;
    return {
      code: order.code,
      supplierName: order.supplierName || '',
      projectLabel: order.projectName ? `${order.projectCode} — ${order.projectName}` : (order.projectCode || undefined),
      planCode: order.planCode,
      orderDateLabel: formatDateCell(order.orderDate) ?? '',
      procurementStaff: order.createdByName ?? undefined,
      paymentTermsDays: order.supplierPaymentTermsDays,
      paymentDueDateLabel: order.paymentDueDate ?? undefined,
      note: order.note ?? undefined,
      totalAmount: order.totalAmount,
      lines: order.lines.map(l => ({
        name: l.name,
        model: l.spec ?? undefined,
        code: l.materialCode || l.sku || undefined,
        unit: l.unit,
        qty: l.ordered,
        unitPrice: l.poPrice,
        amount: l.lineAmount,
        expectedDeliveryDate: l.expectedDeliveryDate ?? undefined,
      })),
    };
  }, [order]);

  const printDoc = () => {
    const sheet = document.querySelector('.po-voucher-print-sheet');
    if (!(sheet instanceof HTMLElement) || !printModel) {
      showToast('error', 'Không mở được hộp thoại in. Vui lòng thử lại.');
      return;
    }
    if (!printPoSheet(sheet, ' ')) {
      showToast('error', 'Không mở được hộp thoại in. Vui lòng thử lại.');
    }
  };

  const startEdit = () => {
    if (!order) return;
    setEditNote(order.note ?? '');
    setEditOrderDate(order.orderDate ? String(order.orderDate).slice(0, 10) : '');
    const next: Record<number, PoEditLineDraft> = {};
    for (const line of order.lines) {
      next[line.id] = {
        qty: String(line.ordered),
        unitPrice: String(line.poPrice),
        note: line.note ?? '',
        expectedDeliveryDate: line.expectedDeliveryDate
          ? String(line.expectedDeliveryDate).slice(0, 10)
          : '',
        warrantyMonths: String(line.warrantyMonths ?? 0),
        warrantyAnchorType: line.warrantyAnchorType || 'delivery',
      };
    }
    setEditLines(next);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditLines({});
  };

  const saveEdit = async () => {
    if (!order) return;
    const bodyLines = order.lines.map(line => {
      const draft = editLines[line.id];
      const planLineId = line.planLineId;
      if (planLineId == null) {
        throw new Error(`Dòng "${line.name}" thiếu planLineId — không thể lưu.`);
      }
      return {
        planLineId,
        qty: Number(draft?.qty ?? line.ordered),
        unitPrice: Number(draft?.unitPrice ?? line.poPrice),
        expectedDeliveryDate: draft?.expectedDeliveryDate?.trim()
          ? draft.expectedDeliveryDate.trim()
          : null,
        note: draft?.note?.trim() ? draft.note.trim() : null,
        warrantyMonths: Number(draft?.warrantyMonths ?? line.warrantyMonths ?? 0),
        warrantyAnchorType:
          draft?.warrantyAnchorType || line.warrantyAnchorType || 'delivery',
      };
    });
    try {
      await updateMutation.mutateAsync({
        code,
        body: {
          note: editNote.trim() || null,
          orderDate: editOrderDate.trim() || null,
          lines: bodyLines,
        },
      });
      showToast('success', `Đã cập nhật ${code}.`);
      setEditing(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không cập nhật được PO.'));
    }
  };

  const runAction = async (
    kind: 'approve' | 'unapprove' | 'place',
  ) => {
    try {
      if (kind === 'approve') {
        await approveMutation.mutateAsync(code);
        showToast('success', `Đã duyệt ${code}.`);
      } else if (kind === 'unapprove') {
        await unapproveMutation.mutateAsync(code);
        showToast('success', `Đã hủy duyệt ${code}.`);
      } else {
        await placeMutation.mutateAsync(code);
        showToast('success', `Đã đánh dấu đặt hàng ${code}.`);
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Thao tác thất bại.'));
    }
  };

  const goBackToOrders = () => navigate('/purchasing/orders');

  const requestBack = () => {
    if (attachDirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    goBackToOrders();
  };

  const confirmLeave = () => {
    setLeaveConfirmOpen(false);
    setAttachDirty(false);
    goBackToOrders();
  };

  return {
    order,
    isLoading,
    isError,
    error,
    refetch,
    lines,
    approval,
    placement,
    delivery,
    payment,
    paymentWarning,
    printModel,
    printDoc,
    editing,
    editNote,
    setEditNote,
    editOrderDate,
    setEditOrderDate,
    editLines,
    setEditLines,
    startEdit,
    cancelEdit,
    saveEdit,
    runAction,
    actionBusy,
    updatePending: updateMutation.isPending,
    canApprove,
    canUnapprove,
    canPlace,
    canUpdate,
    isDraft,
    isApproved,
    isPlaced,
    attachDirty,
    setAttachDirty,
    leaveConfirmOpen,
    setLeaveConfirmOpen,
    requestBack,
    confirmLeave,
    navigate,
  };
}
