import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Banknote,
  Building2,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Eye,
  FileText,
  FolderKanban,
  AlertTriangle,
  Printer,
  Save,
  Send,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import DnttVoucherPreview, { type DnttPreviewModel } from '../../components/purchasing/DnttVoucherPreview';
import PoAutocomplete from '../../components/purchasing/PoAutocomplete';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import { showToast } from '../../components/ui/Toast';
import {
  useCancelPurchasePayment,
  useCreatePurchasePayment,
  usePayPurchasePayment,
  usePurchasePayment,
  useSubmitPurchasePayment,
} from '../../hooks/usePurchasePayments';
import { usePurchasePaymentNextStage } from '../../hooks/usePurchasePaymentPlans';
import { usePurchaseOrder, usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { usePermission } from '../../hooks/usePermission';
import { getApiErrorMessage } from '../../lib/apiClient';
import { getSessionUser } from '../../constants/systemUsers';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { formatCurrency, formatCurrencyFull, formatCurrencyInput, parseCurrencyInput } from '../../utils/formatCurrency';
import { amountToVietnameseWords } from '../../utils/amountToVietnameseWords';

function todayIso(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function paymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'submitted': return 'Đã gửi';
    case 'paid': return 'Đã thanh toán';
    case 'cancelled': return 'Đã hủy';
    default: return status || '-';
  }
}

function paymentDetailSubtitle(payment: {
  status?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
  paidByName?: string | null;
} | undefined) {
  if (!payment) return '';
  if (payment.status === 'paid') {
    return [
      paymentStatusLabel(payment.status),
      formatDateTimeVi(payment.paidAt ?? undefined),
      payment.paidByName?.trim() || undefined,
    ].filter(Boolean).join(' · ');
  }
  return `${paymentStatusLabel(payment.status)}${payment.createdAt ? ` · ${formatDateTimeVi(payment.createdAt)}` : ''}`;
}

/** Tạo / xem DNTT — form + xem trước phiếu (chrome khớp PO/KHMH). */
export default function PurchasePaymentDetailPage() {
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

  const [hydratedPaymentCode, setHydratedPaymentCode] = useState<string | null>(null);
  if (!isCreate && payment && payment.code !== hydratedPaymentCode) {
    setHydratedPaymentCode(payment.code);
    setPoCode(payment.poCode);
    setInvoiceNo(payment.invoiceNo ?? '');
    setAmount(formatCurrencyInput(payment.amount));
    setDueDate(payment.dueDate ? String(payment.dueDate).slice(0, 10) : '');
    setNote(payment.note ?? '');
  }

  const createSeedKey = isCreate && order
    ? `${poCode}|${nextStage?.amount ?? 'full'}|${order.paymentDueDate ?? ''}`
    : null;
  const [hydratedCreateSeed, setHydratedCreateSeed] = useState<string | null>(null);
  if (createSeedKey && createSeedKey !== hydratedCreateSeed) {
    setHydratedCreateSeed(createSeedKey);
    if (nextStage) {
      setAmount(formatCurrencyInput(nextStage.amount));
    } else {
      setAmount(formatCurrencyInput(order!.totalAmount ?? 0));
    }
    setDueDate(order!.paymentDueDate ? String(order!.paymentDueDate).slice(0, 10) : todayIso());
  }

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

  const onSave = async () => {
    if (!canCreate) {
      showToast('warning', 'Không có quyền tạo DNTT.');
      return;
    }
    if (!poCode.trim()) {
      showToast('warning', 'Chọn đơn hàng PO.');
      return;
    }
    if (!dueDate) {
      showToast('warning', 'Chọn hạn thanh toán.');
      return;
    }
    if (amountNum <= 0) {
      showToast('warning', 'Số tiền phải > 0.');
      return;
    }
    if (!nextStage) {
      showToast('warning', 'PO này không còn đợt cần tạo DNTT (chưa duyệt / đã đủ / đang chờ đợt hiện tại).');
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

  const back = () => navigate('/purchasing/payments');
  const printDoc = () => window.print();

  if (!isCreate && paymentQuery.isLoading) {
    return (
      <div className="page-shell pur-dntt">
        <div className="no-print">
          <HrmDetailHeader onBack={back} title={code ? `DNTT ${code}` : 'Chi tiết DNTT'} />
        </div>
        <EmptyState message="Đang tải DNTT…" />
      </div>
    );
  }

  if (!isCreate && paymentQuery.isError) {
    return (
      <div className="page-shell pur-dntt">
        <div className="no-print">
          <HrmDetailHeader onBack={back} title={code ? `DNTT ${code}` : 'Chi tiết DNTT'} />
        </div>
        <EmptyState
          message={getApiErrorMessage(paymentQuery.error, 'Không tải được DNTT.')}
          action={(
            <button type="button" className="btn btn-secondary btn-sm" onClick={back}>
              Quay lại danh sách
            </button>
          )}
        />
      </div>
    );
  }

  return (
    <div className="page-shell pur-dntt">
      <div className="no-print">
        <HrmDetailHeader
          onBack={back}
          title={isCreate ? 'Tạo đề nghị thanh toán' : `DNTT ${payment?.code ?? code}`}
          subtitle={
            isCreate
              ? 'Chọn PO, kiểm tra phiếu bên phải, rồi lưu và in trình ký'
              : paymentDetailSubtitle(payment)
          }
          actions={(
            <div className="pur-detail__actions">
              {isCreate && canCreate ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={createMutation.isPending || docsGateBlocked}
                  title={
                    docsGateBlocked
                      ? `Thiếu chứng từ: ${missingDocTypes.join(', ')}`
                      : undefined
                  }
                  onClick={() => { void onSave(); }}
                >
                  <Save size={15} strokeWidth={1.75} aria-hidden />
                  {createMutation.isPending ? 'Đang lưu…' : 'Lưu DNTT'}
                </button>
              ) : null}
              {!isCreate && payment?.status === 'draft' && canSubmit ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={submitMutation.isPending}
                  onClick={() => { void onSubmitPayment(); }}
                >
                  <Send size={15} strokeWidth={1.75} aria-hidden />
                  {submitMutation.isPending ? 'Đang gửi…' : 'Gửi đề nghị'}
                </button>
              ) : null}
              {!isCreate && payment?.status === 'submitted' ? (
                <>
                  {canCancel ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={cancelMutation.isPending}
                      onClick={() => { void onCancelPayment(); }}
                    >
                      <XCircle size={15} strokeWidth={1.75} aria-hidden />
                      {cancelMutation.isPending ? 'Đang hủy…' : 'Hủy đề nghị'}
                    </button>
                  ) : null}
                  {canPay ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={payMutation.isPending}
                      onClick={() => { void onPayPayment(); }}
                    >
                      <CircleCheck size={15} strokeWidth={1.75} aria-hidden />
                      {payMutation.isPending ? 'Đang xử lý…' : 'Ghi nhận đã thanh toán'}
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          )}
        />
      </div>

      {isCreate ? (
        <ol className="pur-dntt__steps no-print" aria-label="Các bước lập DNTT">
          <li className={poCode ? 'is-done' : 'is-active'}>
            <span className="pur-dntt__step-num">1</span>
            Chọn PO
          </li>
          <li className={poCode && dueDate && amountNum > 0 ? 'is-done' : poCode ? 'is-active' : ''}>
            <span className="pur-dntt__step-num">2</span>
            Điền thông tin
          </li>
          <li>
            <span className="pur-dntt__step-num">3</span>
            Lưu &amp; in
          </li>
        </ol>
      ) : null}

      <div className="pur-dntt__split">
        <aside className="pur-dntt__editor no-print">
          <section className="pur-dntt__card" aria-label="Thông tin đề nghị">
            <header className="pur-dntt__card-head">
              <div className="pur-dntt__card-head-main">
                <span className="pur-dntt__card-icon" aria-hidden>
                  <ClipboardList size={16} strokeWidth={1.75} />
                </span>
                <div>
                  <h2>Thông tin đề nghị</h2>
                  <p>Chi nhà cung cấp theo đơn hàng PO</p>
                </div>
              </div>
              <span className="pur-dntt__chip">Mẫu 05-TT</span>
            </header>

            <div className="pur-dntt__card-body">
              <FormField label="Đơn hàng PO" required className="pur-dntt__ff">
                <PoAutocomplete
                  value={poCode}
                  onChange={next => {
                    setPoCode(next);
                    setAmount('');
                    setDueDate('');
                  }}
                  orders={orders}
                  disabled={!isCreate}
                  placeholder="Tìm mã PO, NCC hoặc KHMH…"
                />
              </FormField>

              {hasPoContext ? (
                <div className="pur-dntt__po-card" aria-label="Tóm tắt PO">
                  <div className="pur-dntt__po-tile">
                    <Building2 size={14} strokeWidth={1.75} aria-hidden />
                    <div>
                      <span>Nhà cung cấp</span>
                      <strong>{order?.supplierName || payment?.supplierName || '—'}</strong>
                    </div>
                  </div>
                  <div className="pur-dntt__po-tile">
                    <FolderKanban size={14} strokeWidth={1.75} aria-hidden />
                    <div>
                      <span>KHMH</span>
                      <strong>{order?.planCode || '—'}</strong>
                    </div>
                  </div>
                  <div className="pur-dntt__po-tile">
                    <ShoppingCart size={14} strokeWidth={1.75} aria-hidden />
                    <div>
                      <span>Dự án</span>
                      <strong>
                        {[order?.projectCode, order?.projectName].filter(Boolean).join(' — ') || '—'}
                      </strong>
                    </div>
                  </div>
                  <div className="pur-dntt__po-tile pur-dntt__po-tile--money">
                    <Banknote size={14} strokeWidth={1.75} aria-hidden />
                    <div>
                      <span>Tổng PO</span>
                      <strong>{formatCurrencyFull(order?.totalAmount ?? payment?.amount)}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pur-dntt__empty-po" role="status">
                  <FileText size={18} strokeWidth={1.75} aria-hidden />
                  <div>
                    <strong>Chưa chọn đơn hàng</strong>
                    <p>Chọn PO để tự điền NCC, số tiền và nội dung trên giấy.</p>
                  </div>
                </div>
              )}

              {isCreate && poCode && nextStage ? (
                <div className="pur-dntt__stage-banner" role="status">
                  <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
                  <div>
                    <strong>
                      Đợt {nextStage.stageNumber}/{nextStage.totalStages}
                    </strong>
                    <p>
                      DNTT tuần tự — số tiền đề xuất {formatCurrencyFull(nextStage.amount)}
                      {' '}({nextStage.percent}% giá trị PO).
                    </p>
                  </div>
                </div>
              ) : null}
              {docsGateBlocked ? (
                <div className="pur-dntt__stage-banner pur-dntt__stage-banner--warn" role="alert">
                  <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
                  <div>
                    <strong>Chưa đủ chứng từ đợt {nextStage?.stageNumber}</strong>
                    <p>
                      Thiếu: {missingDocTypes.join(', ')}. Tải đủ file trên chi tiết PO trước khi tạo DNTT.
                    </p>
                  </div>
                </div>
              ) : null}
              {poHasNoApprovedImport ? (
                <div className="pur-dntt__stage-banner pur-dntt__stage-banner--warn" role="status">
                  <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
                  <div>
                    <strong>PO chưa có phiếu nhập đã duyệt</strong>
                    <p>
                      DNTT vẫn tạo được nếu là tạm ứng theo đợt. Số tiền chưa gắn với hàng đã nhận kho.
                    </p>
                  </div>
                </div>
              ) : null}
              {isCreate && poCode && order && !nextStageQuery.isLoading && !nextStage ? (
                <div className="pur-dntt__stage-banner pur-dntt__stage-banner--warn" role="status">
                  <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
                  <div>
                    <strong>Không còn đợt cần tạo DNTT</strong>
                    <p>
                      PO chưa duyệt, chưa có đợt, đã đủ DNTT, hoặc đang chờ thanh toán đợt hiện tại.
                    </p>
                  </div>
                </div>
              ) : null}
              {!isCreate && payment ? (
                <div className="pur-dntt__stage-banner" role="status">
                  <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
                  <div>
                    <strong>Đợt {payment.stageNumber}</strong>
                    <p>DNTT gắn đợt thanh toán số {payment.stageNumber} của {payment.poCode}.</p>
                  </div>
                </div>
              ) : null}

              <div className="pur-dntt__grid2">
                <FormField label="Số hóa đơn NCC" className="pur-dntt__ff">
                  <input
                    className="form-input form-input-md"
                    value={invoiceNo}
                    readOnly={!isCreate}
                    onChange={e => setInvoiceNo(e.target.value)}
                    placeholder="VD: HD-2607-012"
                    aria-label="Số hóa đơn NCC"
                  />
                </FormField>
                <FormField label="Hạn thanh toán" required className="pur-dntt__ff">
                  {isCreate ? (
                    <HrmDatePicker value={dueDate} onChange={setDueDate} placeholder="dd/mm/yyyy" />
                  ) : (
                    <div className="pur-dntt__readonly">
                      <CalendarDays size={14} strokeWidth={1.75} aria-hidden />
                      <input className="form-input form-input-md" readOnly value={formatDateCell(dueDate)} />
                    </div>
                  )}
                </FormField>
              </div>

              <FormField label="Số tiền đề nghị" className="pur-dntt__ff">
                <div className="pur-dntt__amount-wrap">
                  <Banknote size={15} strokeWidth={1.75} className="pur-dntt__amount-icon" aria-hidden />
                  <input
                    className="form-input form-input-md pur-dntt__amount"
                    value={amount}
                    readOnly
                    placeholder={order ? formatCurrency(order.totalAmount) : '0'}
                    inputMode="numeric"
                    aria-label="Số tiền đề nghị"
                  />
                  <span className="pur-dntt__amount-suffix">VNĐ</span>
                </div>
                {amountNum > 0 ? (
                  <p className="pur-dntt__words-live">{amountToVietnameseWords(amountNum)}</p>
                ) : null}
              </FormField>

              <FormField label="Nội dung / ghi chú trên giấy" className="pur-dntt__ff pur-dntt__ff--last">
                <textarea
                  className="form-input form-input-md pur-dntt__note"
                  rows={4}
                  value={note}
                  readOnly={!isCreate}
                  onChange={e => setNote(e.target.value)}
                  placeholder="VD: Thanh toán đợt 1 theo hợp đồng…"
                  aria-label="Nội dung ghi chú trên giấy"
                />
              </FormField>

              {poCode && orderQuery.isError ? (
                <p className="pur-dntt__error">{getApiErrorMessage(orderQuery.error)}</p>
              ) : null}
              {poCode && orderQuery.isFetching ? (
                <p className="pur-dntt__hint">Đang tải chi tiết PO…</p>
              ) : null}
            </div>
          </section>
        </aside>

        <section className="pur-dntt__preview" aria-label="Xem trước phiếu">
          <div className="pur-dntt__preview-toolbar no-print">
            <div className="pur-dntt__preview-title">
              <Eye size={15} strokeWidth={1.75} aria-hidden />
              <div>
                <strong>Xem trước phiếu</strong>
                <span>Giấy đề nghị thanh toán · cập nhật theo form</span>
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={printDoc}>
              <Printer size={14} strokeWidth={1.75} aria-hidden />
              In
            </button>
          </div>
          <div className="pur-dntt__desk">
            <div className="pur-dntt__preview-sheet">
              <DnttVoucherPreview model={previewModel} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
