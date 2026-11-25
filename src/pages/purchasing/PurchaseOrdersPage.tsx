import { Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import PurchaseOrdersFilterBar from './orders/PurchaseOrdersFilterBar';
import PurchaseOrdersTable from './orders/PurchaseOrdersTable';
import { usePurchaseOrdersController } from './orders/usePurchaseOrdersController';

/** Danh sách đơn hàng PO — cột + bộ lọc theo spec. */
export default function PurchaseOrdersPage() {
  const vm = usePurchaseOrdersController();

  return (
    <PageShell className="pur-erp pur-erp--plan pur-erp--po">
      <PageHeader
        eyebrow="Mua hàng"
        title="Đơn hàng"
        subtitle="PO theo KHMH — theo dõi đặt hàng, giao hàng và thanh toán"
        actions={(
          <Button
            type="button"
            variant="filled"
            size="sm"
            leftIcon={Plus}
            onClick={vm.navigateNewOrder}
          >
            Tạo PO
          </Button>
        )}
      />

      <SectionCard noPadding>
        <PurchaseOrdersFilterBar
          supplierName={vm.supplierName}
          onSupplierNameChange={vm.setSupplierName}
          planCode={vm.planCode}
          onPlanCodeChange={vm.setPlanCode}
          projectCode={vm.projectCode}
          onProjectCodeChange={vm.setProjectCode}
          projects={vm.projects}
          selectedProject={vm.selectedProject}
          projectBudgetRemaining={vm.projectBudgetRemaining}
          orderPlacementStatus={vm.orderPlacementStatus}
          onOrderPlacementStatusChange={vm.setOrderPlacementStatus}
          deliveryStatus={vm.deliveryStatus}
          onDeliveryStatusChange={vm.setDeliveryStatus}
          paymentStatus={vm.paymentStatus}
          onPaymentStatusChange={vm.setPaymentStatus}
          paymentWarning={vm.paymentWarning}
          onPaymentWarningChange={vm.setPaymentWarning}
          hasActiveFilters={vm.hasActiveFilters}
          onReset={vm.resetFilters}
        />

        <PurchaseOrdersTable
          items={vm.items}
          isLoading={vm.isLoading}
          errorMessage={vm.errorMessage}
          canApprove={vm.canApprove}
          approving={vm.approving}
          showActionsCol={vm.showActionsCol}
          onApprove={code => { void vm.handleApprove(code); }}
          onOpenOrder={vm.openOrder}
          rowActions={vm.rowActions}
          pagination={vm.pagination}
        />
      </SectionCard>
    </PageShell>
  );
}
