import { useNavigate } from 'react-router-dom';
import { HrmDetailHeader } from '../../../components/hr/HrmPageChrome';
import { CreatePoFormFields } from './CreatePoFormFields';
import { CreatePoLinePicker } from './CreatePoLinePicker';
import { PoInstallmentCreatePanels } from './PoInstallmentCreatePanels';
import { useCreatePurchaseOrderForm } from './useCreatePurchaseOrderForm';

export function CreatePurchaseOrderForm({ onCreated }: { onCreated: (code: string) => void }) {
  const navigate = useNavigate();
  const f = useCreatePurchaseOrderForm(onCreated);

  return (
    <div className="hrm-page w-full pur-detail">
      <HrmDetailHeader
        onBack={() => navigate('/purchasing/orders')}
        title="Tạo đơn hàng"
        subtitle="Chọn nguồn (KHMH hoặc phát sinh đã duyệt) → NCC → mặt hàng còn lại"
        actions={(
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={f.createPending}
            onClick={() => { void f.submit(); }}
          >
            {f.createPending ? 'Đang lưu…' : 'Tạo Đơn Hàng'}
          </button>
        )}
      />

      <CreatePoFormFields
        plans={f.plans}
        plansLoading={f.plansLoading}
        plan={f.plan}
        planLoading={f.planLoading}
        planError={f.planError}
        planErr={f.planErr}
        sourceKind={f.sourceKind}
        onSelectSourceKind={f.selectSourceKind}
        planCode={f.planCode}
        supplierName={f.supplierName}
        suppliers={f.suppliers}
        note={f.note}
        onNoteChange={f.setNote}
        onSelectPlan={f.selectPlan}
        onSelectSupplier={f.selectSupplier}
        matchedSupplier={f.matchedSupplier}
        dueDatePreview={f.dueDatePreview}
      />

      <CreatePoLinePicker
        planCode={f.planCode}
        planLoading={f.planLoading}
        supplierName={f.supplierName}
        supplierLines={f.supplierLines}
        visibleSupplierLines={f.visibleSupplierLines}
        productSearch={f.productSearch}
        onProductSearchChange={f.setProductSearch}
        selectedLineIds={f.selectedLineIds}
        qtyByLine={f.qtyByLine}
        onQtyChange={f.setQtyByLine}
        allVisibleSelected={f.allVisibleSelected}
        someVisibleSelected={f.someVisibleSelected}
        onToggleLine={f.toggleLine}
        onToggleSelectAllVisible={f.toggleSelectAllVisible}
      />

      <PoInstallmentCreatePanels
        installmentCount={f.installmentCount}
        installments={f.installments}
        onCountChange={f.changeInstallmentCount}
        onPercentChange={f.changeInstallmentPercent}
        onAddDocType={f.addInstallmentDocType}
        onDocTypeChange={f.changeInstallmentDocType}
        onRemoveDocType={f.removeInstallmentDocType}
      />
    </div>
  );
}
