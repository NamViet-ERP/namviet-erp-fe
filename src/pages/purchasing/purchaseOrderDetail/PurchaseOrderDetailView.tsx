import PoAttachmentsPanel from '../../../components/purchasing/PoAttachmentsPanel';
import PoCommentsPanel from '../../../components/purchasing/PoCommentsPanel';
import PoVoucherPreview from '../../../components/purchasing/PoVoucherPreview';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import PageShell from '../../../components/ui/PageShell';
import TableShell from '../../../components/ui/TableShell';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { PoDeliveryEvaluationsSection } from './PoDeliveryEvaluationsSection';
import { PoDetailHeaderActions } from './PoDetailHeaderActions';
import { PoDetailLinesTable } from './PoDetailLinesTable';
import { PoDetailSummaryCard } from './PoDetailSummaryCard';
import { PoInstallmentsSection } from './PoInstallmentsSection';
import { PoRelatedImportsSection } from './PoRelatedImportsSection';
import { usePurchaseOrderDetail } from './usePurchaseOrderDetail';

export function PurchaseOrderDetailView({ code }: { code: string }) {
  const d = usePurchaseOrderDetail(code);

  return (
    <PageShell variant="detail" className="w-full pur-detail">
      <div className="no-print">
        <PageHeader
          variant="detail"
          onBack={d.requestBack}
          breadcrumbs={[
            { label: 'Mua hàng', to: '/purchasing/dashboard' },
            { label: 'Đơn hàng', to: '/purchasing/orders' },
            { label: code.trim() },
          ]}
          title={/^po([\s_-]|$)/i.test(code.trim()) ? code.trim() : `PO ${code.trim()}`}
          subtitle={d.order?.supplierName || d.order?.planCode || undefined}
          actions={(
            <PoDetailHeaderActions
              order={d.order}
              editing={d.editing}
              actionBusy={d.actionBusy}
              updatePending={d.updatePending}
              canUpdate={d.canUpdate}
              canApprove={d.canApprove}
              canUnapprove={d.canUnapprove}
              canPlace={d.canPlace}
              isDraft={d.isDraft}
              isApproved={d.isApproved}
              isPlaced={d.isPlaced}
              onPrint={d.printDoc}
              onStartEdit={d.startEdit}
              onCancelEdit={d.cancelEdit}
              onSaveEdit={() => { void d.saveEdit(); }}
              onAction={kind => { void d.runAction(kind); }}
            />
          )}
        />

        {d.isError ? (
          <EmptyState
            message={getApiErrorMessage(d.error, 'Không tải được chi tiết đơn hàng.')}
            action={(
              <Button type="button" variant="filled" size="sm" onClick={() => { void d.refetch(); }}>
                Thử lại
              </Button>
            )}
          />
        ) : d.isLoading || !d.order ? (
          <section className="pur-detail__card">
            <TableShell loading skeletonRows={5} colSpan={4} tableClassName="pur-erp__table" />
          </section>
        ) : (
          <>
            <PoDetailSummaryCard
              order={d.order}
              editing={d.editing}
              editOrderDate={d.editOrderDate}
              editNote={d.editNote}
              onEditOrderDateChange={d.setEditOrderDate}
              onEditNoteChange={d.setEditNote}
              approval={d.approval}
              placement={d.placement}
              delivery={d.delivery}
              payment={d.payment}
              paymentWarning={d.paymentWarning}
            />

            <PoDetailLinesTable
              lines={d.lines}
              editing={d.editing}
              editLines={d.editLines}
              onEditLinesChange={d.setEditLines}
            />

            <PoRelatedImportsSection
              poCode={code}
              order={d.order}
            />

            <PoRelatedImportsSection
              poCode={code}
              order={d.order}
              directDispatch
            />

            <PoDeliveryEvaluationsSection poCode={code} />

            <PoInstallmentsSection
              poCode={code}
              installments={d.order.installments}
              canManage={d.canUpdate}
              onRefresh={d.refetch}
            />

            <PoAttachmentsPanel
              poCode={code}
              canUpload={d.canUpdate}
              onDirtyChange={d.setAttachDirty}
            />

            <PoCommentsPanel
              poCode={code}
              canComment
            />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={d.leaveConfirmOpen}
        onClose={() => d.setLeaveConfirmOpen(false)}
        onConfirm={d.confirmLeave}
        title="Chưa lưu hồ sơ đính kèm"
        message="Bạn đang có tệp chưa lưu. Thoát trang sẽ mất các tệp này. Bạn có chắc muốn thoát?"
        confirmLabel="Thoát không lưu"
        cancelLabel="Ở lại"
        variant="danger"
      />

      {d.printModel ? (
        <div className="po-voucher-print-sheet">
          <PoVoucherPreview model={d.printModel} />
        </div>
      ) : null}
    </PageShell>
  );
}
