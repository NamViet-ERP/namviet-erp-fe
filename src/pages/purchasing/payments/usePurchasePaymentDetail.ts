import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { DnttPreviewModel } from '../../../components/purchasing/DnttVoucherPreview';
import { showToast } from '../../../components/ui/Toast';
import { getSessionUser } from '../../../constants/systemUsers';
import { usePermission } from '../../../hooks/usePermission';
import { usePurchaseOrder, usePurchaseOrders } from '../../../hooks/usePurchaseOrders';
import { usePurchasePaymentNextStage } from '../../../hooks/usePurchasePaymentPlans';
import {
  useCancelPurchasePayment,
  useCreatePurchasePayment,
  usePayPurchasePayment,
  usePurchasePayment,
  usePurchasePayments,
  useSubmitPurchasePayment,
} from '../../../hooks/usePurchasePayments';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import type {
  PurchaseOrderDetailApiDto,
  PurchasePaymentApiDto,
  PurchasePaymentNextStageApiDto,
} from '../../../types/api/purchasingApi';
import { formatCurrencyInput, parseCurrencyInput } from '../../../utils/formatCurrency';
import { paymentStatusLabel } from './paymentStatusHelpers';

export interface CannotCreateReason {
  title: string;
  detail: string;
  paymentCode: string | null;
}

function todayIso(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function computeCannotCreateReason(params: {
  isCreate: boolean;
  poCode: string;
  order?: PurchaseOrderDetailApiDto;
  nextStageLoading: boolean;
  nextStage?: PurchasePaymentNextStageApiDto | null;
  poPaymentsLoading: boolean;
  poPaymentsItems?: PurchasePaymentApiDto[];
}): CannotCreateReason | null {
  const { isCreate, poCode, order, nextStageLoading, nextStage, poPaymentsLoading, poPaymentsItems } = params;
  if (!isCreate || !poCode || !order || nextStageLoading || nextStage) {
    return null;
  }

  if (poPaymentsLoading) {
    return {
      title: 'Đang kiểm tra các đợt thanh toán…',
      detail: 'Hệ thống đang kiểm tra tiến độ thanh toán của đơn hàng PO.',
      paymentCode: null,
    };
  }

  if (order.approvalStatus !== 'approved') {
    return {
      title: 'PO chưa được phê duyệt',
      detail: `Đơn hàng PO đang ở trạng thái "${order.approvalStatus}". Chỉ có thể tạo DNTT cho PO đã được duyệt.`,
      paymentCode: null,
    };
  }

  const stages = (order.installments ?? []).slice().sort((a, b) => a.stageNumber - b.stageNumber);
  if (stages.length === 0) {
    return {
      title: 'PO chưa có cấu hình đợt thanh toán',
      detail: 'Đơn hàng này chưa được thiết lập các đợt thanh toán (Installments).',
      paymentCode: null,
    };
  }

  const existingPayments = (poPaymentsItems ?? []).filter(p => p.status !== 'cancelled');

  for (const stage of stages) {
    const sp = existingPayments.filter(p => p.stageNumber === stage.stageNumber);
    const isPaid = sp.some(p => p.status === 'paid');
    if (isPaid) continue;

    const pending = sp.find(p => p.status === 'draft' || p.status === 'submitted');
    if (pending) {
      const statusText = paymentStatusLabel(pending.status);
      return {
        title: `Đợt ${stage.stageNumber} đang chờ thanh toán (${pending.code} · ${statusText})`,
        detail: `Theo quy trình thanh toán tuần tự, đợt ${stage.stageNumber} (${pending.code}) cần được ghi nhận đã thanh toán trước khi có thể lập DNTT cho đợt tiếp theo.`,
        paymentCode: pending.code,
      };
    }

    const priorUnpaid = stages.find(
      s => s.stageNumber < stage.stageNumber && !existingPayments.some(p => p.stageNumber === s.stageNumber && p.status === 'paid'),
    );
    if (priorUnpaid) {
      return {
        title: `Đợt ${priorUnpaid.stageNumber} chưa hoàn tất thanh toán`,
        detail: `Cần hoàn tất thanh toán cho đợt ${priorUnpaid.stageNumber} trước khi lập DNTT cho đợt ${stage.stageNumber}.`,
        paymentCode: null,
      };
    }
  }

  const paidStagesCount = stages.filter(stage =>
    existingPayments.some(p => p.stageNumber === stage.stageNumber && p.status === 'paid'),
  ).length;

  if (paidStagesCount >= stages.length) {
    return {
      title: 'Đã hoàn tất thanh toán toàn bộ các đợt',
      detail: `Đơn hàng này đã thanh toán đủ ${paidStagesCount}/${stages.length} đợt. Không còn đợt nào cần tạo DNTT.`,
      paymentCode: null,
    };
  }

  return {
    title: 'Không còn đợt cần tạo DNTT',
    detail: 'PO chưa duyệt, chưa có đợt, đã đủ DNTT, hoặc đang chờ thanh toán đợt hiện tại.',
    paymentCode: null,
  };
}

export function usePurchasePaymentDetail() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const isCreate = !code || code === 'new';
  const navigate = useNavigate();
  const { has, hasAny } = usePermission();
  const canCreate = has('purchasing.payments.create');
  const canSubmit = hasAny(['purchasing.payments.submit', 'purchasing.payments.create']);
  const canPay = hasAny(['purchasing.payments.pay', 'purchasing.payments.create']);
  const canCancel = hasAny(['purchasing.payments.cancel', 'purchasing.payments.create']);
  const sessionUser = getSessionUser();

  const [poCode, setPoCode] = useState(searchParams.get('po')?.trim() || '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  const createMutation = useCreatePurchasePayment();
  const submitMutation = useSubmitPurchasePayment();
  const payMutation = usePayPurchasePayment();
  const cancelMutation = useCancelPurchasePayment();
  const paymentQuery = usePurchasePayment(isCreate ? undefined : code);
  const ordersQuery = usePurchaseOrders({ page: 1, pageSize: 200 });
  const orderQuery = usePurchaseOrder(poCode || undefined);
  const nextStageQuery = usePurchasePaymentNextStage(isCreate ? poCode || undefined : undefined);
  const poPaymentsQuery = usePurchasePayments(
    isCreate && poCode ? { poCode: poCode.trim(), pageSize: 50 } : undefined,
    { enabled: isCreate && Boolean(poCode.trim()) },
  );

  const orders = ordersQuery.data?.items ?? [];
  const payment = paymentQuery.data;
  const order = orderQuery.data;
  const nextStage = nextStageQuery.data;
  const hasPoContext = Boolean(order || payment);

  const missingDocTypes = useMemo(() => {
    if (!isCreate || !nextStage) return [] as string[];
    return nextStage.missingDocTypes;
  }, [isCreate, nextStage]);

  const docsGateBlocked = isCreate && Boolean(nextStage) && missingDocTypes.length > 0;
  const poHasNoApprovedImport = Boolean(
    isCreate
    && order
    && (order.lines ?? []).length > 0
    && (order.lines ?? []).every(line => (line.received ?? 0) <= 0),
  );

  const nextStageLoading = nextStageQuery.isLoading;
  const poPaymentsLoading = poPaymentsQuery.isLoading;
  const poPaymentsItems = poPaymentsQuery.data?.items;

  const cannotCreateReason = useMemo(
    () =>
      computeCannotCreateReason({
        isCreate,
        poCode,
        order,
        nextStageLoading,
        nextStage,
        poPaymentsLoading,
        poPaymentsItems,
      }),
    [isCreate, poCode, order, nextStageLoading, nextStage, poPaymentsLoading, poPaymentsItems],
  );

  const hydratedPaymentCodeRef = useRef<string | null>(null);
  useEffect(() => {
    if (isCreate || !payment || payment.code === hydratedPaymentCodeRef.current) return;
    hydratedPaymentCodeRef.current = payment.code;
    setPoCode(payment.poCode);
    setInvoiceNo(payment.invoiceNo ?? '');
    setAmount(formatCurrencyInput(payment.amount));
    setDueDate(payment.dueDate ? String(payment.dueDate).slice(0, 10) : '');
    setNote(payment.note ?? '');
  }, [isCreate, payment]);

  const createSeedKey = isCreate && order
    ? `${poCode}|${nextStage?.amount ?? 'none'}|${order.paymentDueDate ?? ''}`
    : null;
  const hydratedCreateSeedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!createSeedKey || createSeedKey === hydratedCreateSeedRef.current) return;
    hydratedCreateSeedRef.current = createSeedKey;
    setAmount(nextStage ? formatCurrencyInput(nextStage.amount) : '');
    setDueDate(order?.paymentDueDate ? String(order.paymentDueDate).slice(0, 10) : todayIso());
  }, [createSeedKey, nextStage, order?.paymentDueDate]);

  const amountNum = useMemo(() => {
    if (isCreate) {
      return nextStage?.amount ?? 0;
    }
    const n = parseCurrencyInput(amount);
    if (n > 0) return n;
    return payment?.amount ?? 0;
  }, [isCreate, amount, nextStage?.amount, payment?.amount]);

  const previewModel: DnttPreviewModel = useMemo(() => {
    const lines = (order?.lines ?? []).map(l => ({
      name: l.name,
      code: l.materialCode || l.sku || undefined,
      unit: l.unit,
      qty: l.ordered,
      unitPrice: l.poPrice,
      amount: l.lineAmount,
    }));
    const projectLabel = [order?.projectCode, order?.projectName].filter(Boolean).join(' - ');
    return {
      code: payment?.code,
      dateLabel: payment?.createdAt
        ? formatDateCell(payment.createdAt.slice(0, 10))
        : formatDateCell(todayIso()),
      poCode: poCode || payment?.poCode || '',
      planCode: order?.planCode,
      supplierName: order?.supplierName || payment?.supplierName || '',
      invoiceNo: invoiceNo || undefined,
      dueDate: dueDate || undefined,
      amount: amountNum,
      note: note || undefined,
      projectLabel: projectLabel || undefined,
      requesterName: payment?.createdByName || sessionUser?.name || undefined,
      lines,
    };
  }, [payment, order, poCode, invoiceNo, dueDate, amountNum, note, sessionUser?.name]);

  const canSave = isCreate && canCreate && Boolean(poCode.trim()) && Boolean(nextStage) && !docsGateBlocked && amountNum > 0;

  const onSave = async () => {
    if (!canCreate) {
      showToast('warning', 'Không có quyền tạo DNTT.');
      return;
    }
    if (!poCode.trim()) {
      showToast('warning', 'Chọn đơn hàng PO.');
      return;
    }
    if (!nextStage) {
      showToast('warning', cannotCreateReason?.detail || 'PO này không còn đợt cần tạo DNTT (chưa duyệt / đã đủ / đang chờ đợt hiện tại).');
      return;
    }
    if (amountNum <= 0) {
      showToast('warning', 'Số tiền phải > 0.');
      return;
    }
    if (!dueDate) {
      showToast('warning', 'Chọn hạn thanh toán.');
      return;
    }
    if (missingDocTypes.length > 0) {
      showToast(
        'warning',
        `Chưa đủ chứng từ bắt buộc đợt ${nextStage.stageNumber}: ${missingDocTypes.join(', ')}.`,
      );
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        poCode: poCode.trim(),
        invoiceNo: invoiceNo.trim() || null,
        amount: nextStage.amount,
        dueDate,
        note: note.trim() || null,
      });
      showToast('success', `Đã tạo ${created.code}.`);
      navigate(`/purchasing/payments/${encodeURIComponent(created.code)}`, { replace: true });
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const onSubmitPayment = async () => {
    if (!payment) return;
    try {
      await submitMutation.mutateAsync(payment.code);
      showToast('success', `Đã gửi ${payment.code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không gửi được DNTT.'));
    }
  };

  const onPayPayment = async () => {
    if (!payment) return;
    try {
      await payMutation.mutateAsync(payment.code);
      showToast('success', `Đã ghi nhận thanh toán ${payment.code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không ghi nhận được thanh toán.'));
    }
  };

  const onCancelPayment = async () => {
    if (!payment) return;
    try {
      await cancelMutation.mutateAsync(payment.code);
      showToast('success', `Đã hủy DNTT ${payment.code}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không hủy được DNTT.'));
    }
  };

  const handlePoChange = (next: string) => {
    setPoCode(next);
    setAmount('');
    setDueDate('');
  };

  const back = () => navigate('/purchasing/payments');
  const printDoc = () => window.print();
  const viewPayment = (targetCode: string) => navigate(`/purchasing/payments/${encodeURIComponent(targetCode)}`);

  return {
    code,
    isCreate,
    canCreate,
    canSubmit,
    canPay,
    canCancel,
    poCode,
    handlePoChange,
    invoiceNo,
    setInvoiceNo,
    amount,
    dueDate,
    setDueDate,
    note,
    setNote,
    orders,
    payment,
    order,
    nextStage,
    hasPoContext,
    missingDocTypes,
    docsGateBlocked,
    poHasNoApprovedImport,
    cannotCreateReason,
    amountNum,
    previewModel,
    canSave,
    paymentQuery,
    orderQuery,
    nextStageLoading: nextStageQuery.isLoading,
    createPending: createMutation.isPending,
    submitPending: submitMutation.isPending,
    payPending: payMutation.isPending,
    cancelPending: cancelMutation.isPending,
    onSave,
    onSubmitPayment,
    onPayPayment,
    onCancelPayment,
    back,
    printDoc,
    viewPayment,
  };
}
