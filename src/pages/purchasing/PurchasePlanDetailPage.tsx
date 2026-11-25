import { AlertTriangle } from 'lucide-react';
import CreatePurchasePlanModal from '../../components/purchasing/CreatePurchasePlanModal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import TableShell from '../../components/ui/TableShell';
import { getApiErrorMessage } from '../../lib/apiClient';
import PurchasePlanDetailActions from './plans/PurchasePlanDetailActions';
import PurchasePlanDetailLinesTable from './plans/PurchasePlanDetailLinesTable';
import RelatedPurchaseOrdersCard from './plans/RelatedPurchaseOrdersCard';
import { usePurchasePlanDetailController } from './plans/usePurchasePlanDetailController';

/** Chi tiết KHMH — header kiểu HR + meta/tổng tiền căn chỉnh + bảng dòng. */
export default function PurchasePlanDetailPage() {
  const vm = usePurchasePlanDetailController();
  const baseBreadcrumbs = [
    { label: 'Mua hàng', to: '/purchasing/dashboard' },
    { label: vm.isAdhoc ? 'Mua hàng phát sinh' : 'Kế hoạch mua hàng', to: vm.listPath },
  ];

  if (vm.isError) {
    return (
      <PageShell variant="detail" className="w-full pur-detail">
        <PageHeader
          variant="detail"
          onBack={vm.back}
          breadcrumbs={[...baseBreadcrumbs, { label: vm.code || 'Chi tiết' }]}
          title={vm.code ? `KHMH ${vm.code}` : 'Chi tiết KHMH'}
        />
        <EmptyState
          message={getApiErrorMessage(vm.error, 'Không tải được chi tiết KHMH.')}
          action={(
            <Button type="button" variant="filled" size="sm" onClick={() => { void vm.refetch(); }}>
              Thử lại
            </Button>
          )}
        />
      </PageShell>
    );
  }

  if (vm.isLoading || !vm.plan) {
    return (
      <PageShell variant="detail" className="w-full pur-detail">
        <PageHeader
          variant="detail"
          onBack={vm.back}
          breadcrumbs={[...baseBreadcrumbs, { label: vm.code || 'Chi tiết' }]}
          title={vm.code ? `KHMH ${vm.code}` : 'Chi tiết KHMH'}
        />
        <section className="pur-detail__card">
          <TableShell loading skeletonRows={6} colSpan={4} tableClassName="pur-erp__table" />
        </section>
      </PageShell>
    );
  }

  const { plan } = vm;
  const projectSubtitle = plan.projectName || plan.projectCode || undefined;

  return (
    <PageShell variant="detail" className="w-full pur-detail">
      <PageHeader
        variant="detail"
        onBack={vm.back}
        breadcrumbs={[...baseBreadcrumbs, { label: plan.code }]}
        title={`KHMH ${plan.code}`}
        subtitle={projectSubtitle}
        actions={(
          <PurchasePlanDetailActions
            status={plan.status}
            actionBusy={vm.actionBusy}
            canSubmit={vm.canSubmit}
            canApproveL1={vm.canApproveL1}
            canApproveL2={vm.canApproveL2}
            canReject={vm.canReject}
            canRemake={vm.canRemake}
            onEdit={() => vm.setEditOpen(true)}
            onSubmit={vm.submitPlan}
            onApproveL1={vm.approveL1}
            onApproveL2={vm.approveL2}
            onOpenReject={() => { vm.setRejectReason(''); vm.setRejectOpen(true); }}
            onRemake={vm.handleRemake}
            onReopen={() => { void vm.setPlanStatus('approved'); }}
            onOpenClose={() => vm.setConfirmClose(true)}
          />
        )}
      />

      <section className="pur-detail__card" aria-label="Thông tin kế hoạch">
        <div className="pur-detail__meta">
          {vm.headerMeta.map(m => (
            <div key={m.label} className="pur-detail__field">
              <div className="pur-detail__field-label">{m.label}</div>
              <div className="pur-detail__field-value">{m.value}</div>
            </div>
          ))}
        </div>
        <div className="pur-detail__totals" aria-label="Tổng tiền">
          {vm.totals.map(t => (
            <div key={t.label} className={`pur-detail__total pur-detail__total--${t.tone}`}>
              <div className="pur-detail__total-label">{t.label}</div>
              <div className="pur-detail__total-value">{t.value}</div>
            </div>
          ))}
        </div>
      </section>

      {vm.warnRisks.length > 0 ? (
        <section className="pur-create-plan__risk-list" aria-label="Cảnh báo NCC và vật tư" role="status">
          {vm.warnRisks.map(risk => (
            <div
              key={`${risk.materialCode}|${risk.supplierId ?? ''}|${risk.supplierName ?? ''}`}
              className="pur-create-plan__risk-banner"
            >
              <AlertTriangle size={16} aria-hidden />
              <div>
                <strong>
                  Cảnh báo NCC {risk.supplierName || '—'} / {risk.materialCode}
                </strong>
                {risk.reasons.map(reason => (
                  <p key={reason}>{reason}</p>
                ))}
                <p>Chỉ cảnh báo mềm - không chặn duyệt.</p>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <RelatedPurchaseOrdersCard orders={plan.relatedOrders} />

      <PurchasePlanDetailLinesTable lines={vm.lines} />

      <p className="pur-detail__muted">Chưa có lịch sử thay đổi.</p>

      <ConfirmDialog
        isOpen={vm.confirmClose}
        onClose={() => vm.setConfirmClose(false)}
        onConfirm={() => { void vm.setPlanStatus('closed'); }}
        title="Đóng kế hoạch mua hàng"
        message={`Đóng KHMH ${plan.code}? Sau khi đóng sẽ không tạo được đơn mua hàng từ kế hoạch này.`}
        confirmLabel="Đóng"
        variant="danger"
        isLoading={vm.updatePending}
      />

      <ConfirmDialog
        isOpen={vm.rejectOpen}
        onClose={() => { vm.setRejectOpen(false); vm.setRejectReason(''); }}
        onConfirm={vm.confirmReject}
        title="Từ chối duyệt?"
        message={(
          <div className="space-y-2">
            <p>Từ chối {plan.code}? Phiếu sẽ đánh dấu từ chối; cung ứng có thể Lập phiếu mới.</p>
            <textarea
              className="form-input w-full"
              rows={3}
              placeholder="Lý do từ chối (tuỳ chọn)"
              value={vm.rejectReason}
              onChange={e => vm.setRejectReason(e.target.value)}
            />
          </div>
        )}
        confirmLabel="Từ chối"
        variant="danger"
        isLoading={vm.rejectPending}
      />

      <CreatePurchasePlanModal
        open={vm.editOpen}
        kind={vm.isAdhoc ? 'adhoc' : 'plan'}
        editCode={plan.code}
        onClose={() => vm.setEditOpen(false)}
        onSaved={() => {
          vm.setEditOpen(false);
          void vm.refetch();
        }}
      />
    </PageShell>
  );
}
