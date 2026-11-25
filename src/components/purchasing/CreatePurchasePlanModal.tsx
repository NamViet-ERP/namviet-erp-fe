import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Modal from '../ui/Modal';
import SelectField from '../ui/SelectField';
import PurchasePlanCreateImportBar from './PurchasePlanCreateImportBar';
import PurchasePlanCreateLinesTable from './PurchasePlanCreateLinesTable';
import { useCreatePurchasePlanForm } from './useCreatePurchasePlanForm';

interface CreatePurchasePlanModalProps {
  open: boolean;
  onClose: () => void;
  editCode?: string | null;
  onCreated?: (planCode: string) => void;
  onSaved?: (planCode: string) => void;
  /** plan = KHMH; adhoc = mua hàng phát sinh */
  kind?: 'plan' | 'adhoc';
}

/** Tạo / sửa KHMH — bảng gọn kiểu kho + mở rộng chi tiết từng dòng. */
export default function CreatePurchasePlanModal({
  open,
  onClose,
  editCode,
  onCreated,
  onSaved,
  kind = 'plan',
}: CreatePurchasePlanModalProps) {
  const vm = useCreatePurchasePlanForm({
    open,
    onClose,
    editCode,
    onCreated,
    onSaved,
    kind,
  });

  const submitLabel = vm.busy
    ? (vm.isEdit ? 'Đang lưu…' : 'Đang tạo…')
    : (vm.isEdit ? 'Lưu thay đổi' : (vm.isAdhoc ? 'Tạo phiếu' : 'Tạo KHMH'));

  return (
    <Modal
      isOpen={open}
      onClose={vm.handleClose}
      title={
        vm.isEdit
          ? `Sửa ${vm.entityLabel} ${editCode}`
          : (vm.isAdhoc ? 'Tạo mua hàng phát sinh' : 'Tạo kế hoạch mua hàng')
      }
      size="wide"
      footer={(
        <>
          <Button type="button" variant="text" onClick={vm.handleClose} disabled={vm.busy}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={() => { void vm.saveManual(); }}
            disabled={vm.busy}
          >
            {submitLabel}
          </Button>
        </>
      )}
    >
      <div className="pur-create-plan">
        <div className="pur-create-plan__header-grid">
          <FormField label="Dự án" required className="pur-create-plan__field-project">
            <SelectField
              aria-label="Dự án"
              value={vm.projectCode}
              onChange={vm.setProjectCode}
              options={vm.projectOptions}
              placeholder="Chọn dự án"
              preserveUnknownValue={vm.isEdit}
              disabled={vm.busy || vm.isEdit}
            />
          </FormField>
          <FormField label="Ghi chú" className="pur-create-plan__field-note">
            <input
              className="form-input form-input-sm"
              value={vm.note}
              disabled={vm.busy}
              onChange={e => vm.setNote(e.target.value)}
              aria-label="Ghi chú KHMH"
              placeholder="Tuỳ chọn"
            />
          </FormField>
        </div>

        {!vm.isEdit && (
          <PurchasePlanCreateImportBar
            busy={vm.busy}
            file={vm.file}
            preview={vm.preview}
            fileInputRef={vm.fileInputRef}
            templatePending={vm.templatePending}
            previewPending={vm.previewPending}
            onDownloadTemplate={() => { void vm.downloadTemplate(); }}
            onFileChange={vm.handleFileChange}
            onImport={() => { void vm.runPreview(); }}
            onClear={vm.clearFile}
          />
        )}

        {vm.missingMaterialLines.length > 0 && (
          <div className="pur-create-plan__missing-banner text-xs" role="alert">
            <AlertTriangle size={18} className="pur-create-plan__missing-icon" aria-hidden />
            <div className="pur-create-plan__missing-body">
              <div className="pur-create-plan__missing-title">
                Phát hiện {vm.missingMaterialLines.length} dòng vật tư chưa có trong danh mục hệ thống:
              </div>
              <div className="pur-create-plan__missing-list">
                {vm.missingMaterialLines.map(m => (
                  <span key={m.rowNumber} className="pur-create-plan__missing-chip">
                    <strong>Dòng {m.rowNumber}:</strong> {m.line.materialCode} ({m.line.productName || 'Chưa có tên'})
                  </span>
                ))}
              </div>
              <div className="pur-create-plan__missing-hint">
                * Vui lòng khai báo các mã vật tư này trên hệ thống trước, hoặc chọn mã vật tư đã có trong danh mục.
              </div>
            </div>
          </div>
        )}

        <PurchasePlanCreateLinesTable
          lines={vm.lines}
          expanded={vm.expanded}
          materials={vm.materials}
          serviceItems={vm.serviceItems}
          suppliers={vm.suppliers}
          linesLocked={vm.busy}
          totals={vm.totals}
          risksByLineKey={vm.risksByLineKey}
          knownMaterialCodes={vm.knownMaterialCodes}
          knownServiceCodes={vm.knownServiceCodes}
          onAddLine={vm.addLine}
          onUpdateLine={vm.updateLine}
          onRemoveLine={vm.removeLine}
          onToggleExpand={vm.toggleExpand}
        />
      </div>
    </Modal>
  );
}
