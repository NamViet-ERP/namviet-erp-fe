import { AlertTriangle, CheckCircle2, ClipboardList, Clock, FileText, Plus } from 'lucide-react';
import CreatePurchasePlanModal from '../../components/purchasing/CreatePurchasePlanModal';
import PurchasePlanVariancePanel from '../../components/purchasing/PurchasePlanVariancePanel';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FilterToolbar from '../../components/ui/FilterToolbar';
import KpiCard from '../../components/ui/KpiCard';
import MetricsStrip from '../../components/ui/MetricsStrip';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import type { PurchasePlanKind } from '../../types/api/purchasingApi';
import { STATUS_TABS } from './plans/planStatusHelpers';
import PurchasePlansTable from './plans/PurchasePlansTable';
import { usePurchasePlansController } from './plans/usePurchasePlansController';

type Props = {
  kind?: PurchasePlanKind;
};

/** Danh sách KHMH hoặc Mua hàng phát sinh — cùng form, lọc theo kind. */
export default function PurchasePlansPage({ kind = 'plan' }: Props) {
  const vm = usePurchasePlansController(kind);

  return (
    <PageShell className="pur-erp pur-erp--plan">
      <PageHeader
        eyebrow="Mua hàng"
        title={vm.title}
        subtitle={
          vm.isAdhoc
            ? 'Yêu cầu mua phát sinh theo dự án - duyệt 2 cấp rồi mới tạo PO'
            : 'Kế hoạch mua theo dự án - gửi duyệt Trưởng cung ứng → Sếp, rồi mới tạo PO'
        }
        actions={(
          <div className="pur-erp__head-actions">
            {!vm.isAdhoc ? (
              <Button
                type="button"
                variant={vm.showVariance ? 'tonal' : 'outlined'}
                size="sm"
                leftIcon={AlertTriangle}
                onClick={() => vm.setShowVariance(v => !v)}
              >
                {vm.showVariance ? 'Ẩn cảnh báo lệch' : 'Cảnh báo lệch KHMH'}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="filled"
              size="sm"
              leftIcon={Plus}
              onClick={() => { vm.setEditCode(null); vm.setCreateOpen(true); }}
            >
              {vm.isAdhoc ? 'Tạo phiếu phát sinh' : 'Tạo KHMH'}
            </Button>
          </div>
        )}
      />

      <MetricsStrip columns={4}>
        <KpiCard label={vm.isAdhoc ? 'Tổng phiếu' : 'Tổng KHMH'} value={vm.statsAll?.totalCount ?? '-'} icon={ClipboardList} tone="primary" />
        <KpiCard label="Nháp" value={vm.statsDraft?.totalCount ?? '-'} icon={FileText} tone="warning" />
        <KpiCard label="Chờ duyệt" value={vm.pendingCount} icon={Clock} tone="neutral" />
        <KpiCard label="Đã duyệt" value={vm.statsApproved?.totalCount ?? '-'} icon={CheckCircle2} tone="success" />
      </MetricsStrip>

      {!vm.isAdhoc && vm.showVariance ? <PurchasePlanVariancePanel /> : null}

      <SectionCard noPadding>
        <FilterToolbar
          tabs={STATUS_TABS}
          activeTab={vm.activeTab}
          onTabChange={id => { vm.setActiveTab(id); vm.setPage(1); }}
          search={vm.search}
          onSearchChange={v => { vm.setSearch(v); vm.setPage(1); }}
          searchPlaceholder={`Tìm ${vm.codeLabel.toLowerCase()}, dự án, ghi chú…`}
          hasActiveFilters={vm.hasFilters}
          onReset={vm.resetFilters}
          filters={(
            <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--dates">
              <VoucherDateFilter
                from={vm.dateFrom}
                to={vm.dateTo}
                onFromChange={v => { vm.setDateFrom(v); vm.setPage(1); }}
                onToChange={v => { vm.setDateTo(v); vm.setPage(1); }}
                onReset={() => { vm.setDateFrom(''); vm.setDateTo(''); vm.setPage(1); }}
              />
            </div>
          )}
        />

        <PurchasePlansTable
          items={vm.items}
          isLoading={vm.isLoading}
          errorMessage={vm.errorMessage}
          emptyMessage={vm.emptyMessage}
          isAdhoc={vm.isAdhoc}
          codeLabel={vm.codeLabel}
          detailBase={vm.detailBase}
          canSubmit={vm.canSubmit}
          canApproveL1={vm.canApproveL1}
          canApproveL2={vm.canApproveL2}
          canReject={vm.canReject}
          canRemake={vm.canRemake}
          onNavigateDetail={vm.navigateDetail}
          onOpenCreate={() => { vm.setEditCode(null); vm.setCreateOpen(true); }}
          onOpenEdit={code => { vm.setEditCode(code); vm.setCreateOpen(true); }}
          onRequestDelete={vm.setDeleteCode}
          onRequestClose={vm.setCloseCode}
          onRequestReject={code => { vm.setRejectCode(code); vm.setRejectReason(''); }}
          onReopen={code => { void vm.setPlanStatus(code, 'approved'); }}
          onSubmitPlan={code => {
            void vm.runAction(`Đã gửi duyệt ${code}.`, () => vm.submitMutation.mutateAsync(code));
          }}
          onApproveL1={code => {
            void vm.runAction(`Đã duyệt cấp 1 ${code}.`, () => vm.approveL1Mutation.mutateAsync(code));
          }}
          onApproveL2={code => {
            void vm.runAction(`Đã duyệt cấp 2 ${code}.`, () => vm.approveL2Mutation.mutateAsync(code));
          }}
          onRemakePlan={code => { void vm.handleRemake(code); }}
          pagination={vm.pagination}
        />
      </SectionCard>

      <CreatePurchasePlanModal
        open={vm.createOpen}
        kind={kind}
        editCode={vm.editCode}
        onClose={() => { vm.setCreateOpen(false); vm.setEditCode(null); }}
        onCreated={vm.navigateDetail}
        onSaved={vm.navigateDetail}
      />

      <ConfirmDialog
        isOpen={Boolean(vm.deleteCode)}
        title="Xóa phiếu nháp?"
        message={`Xóa ${vm.deleteCode}? Chỉ xóa được khi còn nháp và chưa có PO.`}
        confirmLabel="Xóa"
        variant="danger"
        isLoading={vm.deleteMutation.isPending}
        onConfirm={() => { void vm.confirmDelete(); }}
        onClose={() => vm.setDeleteCode(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(vm.closeCode)}
        title="Đóng phiếu?"
        message={`Đóng ${vm.closeCode}? Sau khi đóng sẽ không tạo thêm PO.`}
        confirmLabel="Đóng"
        variant="danger"
        isLoading={vm.updateMutation.isPending}
        onConfirm={() => { if (vm.closeCode) void vm.setPlanStatus(vm.closeCode, 'closed'); }}
        onClose={() => vm.setCloseCode(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(vm.rejectCode)}
        title="Từ chối duyệt?"
        message={(
          <div className="space-y-2">
            <p>Từ chối {vm.rejectCode}? Phiếu sẽ đánh dấu từ chối; cung ứng có thể Lập phiếu mới.</p>
            <textarea
              className="form-input w-full text-sm"
              rows={3}
              placeholder="Lý do từ chối (tuỳ chọn)"
              value={vm.rejectReason}
              onChange={e => vm.setRejectReason(e.target.value)}
            />
          </div>
        )}
        confirmLabel="Từ chối"
        variant="danger"
        isLoading={vm.rejectMutation.isPending}
        onConfirm={vm.confirmReject}
        onClose={() => { vm.setRejectCode(null); vm.setRejectReason(''); }}
      />
    </PageShell>
  );
}
