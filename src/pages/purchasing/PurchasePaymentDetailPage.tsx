import { CircleCheck, Eye, Printer, Save, Send, XCircle } from 'lucide-react';
import DnttVoucherPreview from '../../components/purchasing/DnttVoucherPreview';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import { getApiErrorMessage } from '../../lib/apiClient';
import PurchasePaymentEditorCard from './payments/PurchasePaymentEditorCard';
import { paymentDetailSubtitle } from './payments/paymentStatusHelpers';
import { usePurchasePaymentDetail } from './payments/usePurchasePaymentDetail';

/** Tạo / xem DNTT — form + xem trước phiếu (chrome khớp PO/KHMH). */
export default function PurchasePaymentDetailPage() {
  const vm = usePurchasePaymentDetail();
  const baseBreadcrumbs = [
    { label: 'Mua hàng', to: '/purchasing/dashboard' },
    { label: 'Đề nghị thanh toán', to: '/purchasing/payments' },
  ];
  const currentBreadcrumb = vm.isCreate
    ? 'Tạo mới'
    : (vm.payment?.code ?? vm.code ?? 'Chi tiết');

  if (!vm.isCreate && vm.paymentQuery.isLoading) {
    return (
      <PageShell variant="detail" className="pur-dntt">
        <div className="no-print">
          <PageHeader
            variant="detail"
            onBack={vm.back}
            breadcrumbs={[...baseBreadcrumbs, { label: currentBreadcrumb }]}
            title={vm.code ? `DNTT ${vm.code}` : 'Chi tiết DNTT'}
          />
        </div>
        <EmptyState message="Đang tải DNTT…" />
      </PageShell>
    );
  }

  if (!vm.isCreate && vm.paymentQuery.isError) {
    return (
      <PageShell variant="detail" className="pur-dntt">
        <div className="no-print">
          <PageHeader
            variant="detail"
            onBack={vm.back}
            breadcrumbs={[...baseBreadcrumbs, { label: currentBreadcrumb }]}
            title={vm.code ? `DNTT ${vm.code}` : 'Chi tiết DNTT'}
          />
        </div>
        <EmptyState
          message={getApiErrorMessage(vm.paymentQuery.error, 'Không tải được DNTT.')}
          action={(
            <Button type="button" variant="outlined" size="sm" onClick={vm.back}>
              Quay lại danh sách
            </Button>
          )}
        />
      </PageShell>
    );
  }

  const saveTooltip = !vm.poCode
    ? 'Vui lòng chọn đơn hàng PO'
    : !vm.nextStage
      ? (vm.cannotCreateReason?.title || 'Chưa có đợt thanh toán khả dụng')
      : vm.docsGateBlocked
        ? `Thiếu chứng từ: ${vm.missingDocTypes.join(', ')}`
        : undefined;

  return (
    <PageShell variant="detail" className="pur-dntt">
      <div className="no-print">
        <PageHeader
          variant="detail"
          onBack={vm.back}
          breadcrumbs={[...baseBreadcrumbs, { label: currentBreadcrumb }]}
          title={vm.isCreate ? 'Tạo đề nghị thanh toán' : `DNTT ${vm.payment?.code ?? vm.code}`}
          subtitle={
            vm.isCreate
              ? 'Chọn PO, kiểm tra phiếu bên phải, rồi lưu và in trình ký'
              : paymentDetailSubtitle(vm.payment)
          }
          actions={(
            <div className="pur-detail__actions">
              {vm.isCreate && vm.canCreate ? (
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  leftIcon={Save}
                  disabled={vm.createPending || !vm.canSave}
                  title={saveTooltip}
                  onClick={() => { void vm.onSave(); }}
                >
                  {vm.createPending ? 'Đang lưu…' : 'Lưu DNTT'}
                </Button>
              ) : null}
              {!vm.isCreate && vm.payment?.status === 'draft' && vm.canSubmit ? (
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  leftIcon={Send}
                  disabled={vm.submitPending}
                  onClick={() => { void vm.onSubmitPayment(); }}
                >
                  {vm.submitPending ? 'Đang gửi…' : 'Gửi đề nghị'}
                </Button>
              ) : null}
              {!vm.isCreate && vm.payment?.status === 'submitted' ? (
                <>
                  {vm.canCancel ? (
                    <Button
                      type="button"
                      variant="outlined"
                      size="sm"
                      leftIcon={XCircle}
                      disabled={vm.cancelPending}
                      onClick={() => { void vm.onCancelPayment(); }}
                    >
                      {vm.cancelPending ? 'Đang hủy…' : 'Hủy đề nghị'}
                    </Button>
                  ) : null}
                  {vm.canPay ? (
                    <Button
                      type="button"
                      variant="filled"
                      size="sm"
                      leftIcon={CircleCheck}
                      disabled={vm.payPending}
                      onClick={() => { void vm.onPayPayment(); }}
                    >
                      {vm.payPending ? 'Đang xử lý…' : 'Ghi nhận đã thanh toán'}
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          )}
        />
      </div>

      {vm.isCreate ? (
        <ol className="pur-dntt__steps no-print" aria-label="Các bước lập DNTT">
          <li className={vm.poCode ? 'is-done' : 'is-active'}>
            <span className="pur-dntt__step-num">1</span>
            Chọn PO
          </li>
          <li className={vm.poCode && vm.dueDate && vm.amountNum > 0 ? 'is-done' : vm.poCode ? 'is-active' : ''}>
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
        <PurchasePaymentEditorCard
          isCreate={vm.isCreate}
          poCode={vm.poCode}
          onPoChange={vm.handlePoChange}
          orders={vm.orders}
          hasPoContext={vm.hasPoContext}
          order={vm.order}
          payment={vm.payment}
          nextStage={vm.nextStage}
          nextStageLoading={vm.nextStageLoading}
          docsGateBlocked={vm.docsGateBlocked}
          missingDocTypes={vm.missingDocTypes}
          poHasNoApprovedImport={vm.poHasNoApprovedImport}
          cannotCreateReason={vm.cannotCreateReason}
          onViewPayment={vm.viewPayment}
          invoiceNo={vm.invoiceNo}
          onInvoiceNoChange={vm.setInvoiceNo}
          dueDate={vm.dueDate}
          onDueDateChange={vm.setDueDate}
          amount={vm.amount}
          amountNum={vm.amountNum}
          note={vm.note}
          onNoteChange={vm.setNote}
          orderError={vm.orderQuery.error}
          isOrderError={vm.orderQuery.isError}
          isOrderFetching={vm.orderQuery.isFetching}
        />

        <section className="pur-dntt__preview" aria-label="Xem trước phiếu">
          <div className="pur-dntt__preview-toolbar no-print">
            <div className="pur-dntt__preview-title">
              <Eye size={15} strokeWidth={1.75} aria-hidden />
              <div>
                <strong>Xem trước phiếu</strong>
                <span>Giấy đề nghị thanh toán · cập nhật theo form</span>
              </div>
            </div>
            <Button type="button" variant="outlined" size="sm" leftIcon={Printer} onClick={vm.printDoc}>
              In
            </Button>
          </div>
          <div className="pur-dntt__desk">
            <div className="pur-dntt__preview-sheet">
              <DnttVoucherPreview model={vm.previewModel} />
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
