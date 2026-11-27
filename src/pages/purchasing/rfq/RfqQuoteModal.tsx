import HrmDatePicker from '../../../components/hr/HrmDatePicker';
import MaterialByGroupFields from '../../../components/purchasing/MaterialByGroupFields';
import ProjectAutocomplete from '../../../components/purchasing/ProjectAutocomplete';
import Button from '../../../components/ui/Button';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import FormField from '../../../components/ui/FormField';
import Modal from '../../../components/ui/Modal';
import SupplierAutocomplete from '../../../components/ui/SupplierAutocomplete';
import type { MaterialApiDto } from '../../../services/materialsService';
import type { SupplierApiDto } from '../../../services/suppliersService';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import type { RfqForm, RfqFormErrorField, RfqFormErrors } from './useRfqQuotesController';

interface RfqQuoteModalProps {
  isOpen: boolean;
  isEditing: boolean;
  busy: boolean;
  categoryId: number | '';
  form: RfqForm;
  formErrors: RfqFormErrors;
  rootCategories: Array<{ id: number; code: string; name: string }>;
  materials: MaterialApiDto[];
  suppliers: SupplierApiDto[];
  projects: WarehouseProjectApiDto[];
  onCategoryChange: (id: number | '') => void;
  onPatchForm: (patch: Partial<RfqForm>) => void;
  onClearError: (field: RfqFormErrorField) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
}

export default function RfqQuoteModal({
  isOpen,
  isEditing,
  busy,
  categoryId,
  form,
  formErrors,
  rootCategories,
  materials,
  suppliers,
  projects,
  onCategoryChange,
  onPatchForm,
  onClearError,
  onClose,
  onSave,
}: RfqQuoteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Sửa báo giá' : 'Ghi nhận báo giá mới'}
      size="xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 modal-form-bordered">
        <MaterialByGroupFields
          categoryId={categoryId}
          onCategoryChange={id => {
            onCategoryChange(id);
            onPatchForm({ materialCode: '' });
            onClearError('categoryId');
            onClearError('materialCode');
          }}
          materialCode={form.materialCode}
          onMaterialChange={materialCode => {
            onPatchForm({ materialCode });
            onClearError('materialCode');
          }}
          groups={rootCategories}
          materials={materials}
          categoryError={formErrors.categoryId}
          materialError={formErrors.materialCode}
        />
        <FormField label="Nhà cung cấp" required error={formErrors.supplierName}>
          <SupplierAutocomplete
            value={form.supplierName}
            onChange={supplierName => {
              onPatchForm({ supplierName });
              onClearError('supplierName');
            }}
            suppliers={suppliers}
          />
        </FormField>
        <FormField label="Dự án">
          <ProjectAutocomplete
            value={form.projectCode}
            onChange={projectCode => onPatchForm({ projectCode })}
            projects={projects}
          />
        </FormField>
        <FormField label="Ngày báo giá" required error={formErrors.quoteDate} htmlFor="rfq-quote-date">
          <HrmDatePicker
            id="rfq-quote-date"
            value={form.quoteDate}
            onChange={quoteDate => {
              onPatchForm({ quoteDate });
              onClearError('quoteDate');
            }}
            error={Boolean(formErrors.quoteDate)}
            placeholder="dd/mm/yyyy"
          />
        </FormField>
        <FormField label="Đơn báo giá" required error={formErrors.unitPrice}>
          <CurrencyInput
            value={form.unitPrice}
            onChange={unitPrice => {
              onPatchForm({ unitPrice });
              onClearError('unitPrice');
            }}
          />
        </FormField>
        <FormField label="Hạn giữ giá" required error={formErrors.validUntil} htmlFor="rfq-valid-until">
          <HrmDatePicker
            id="rfq-valid-until"
            value={form.validUntil}
            onChange={validUntil => {
              onPatchForm({ validUntil });
              onClearError('validUntil');
            }}
            error={Boolean(formErrors.validUntil)}
            placeholder="dd/mm/yyyy"
          />
        </FormField>
        <FormField label="Thời gian giao hàng (ngày)">
          <input
            className="form-input"
            type="number"
            min={0}
            value={form.leadTimeDays}
            onChange={e => onPatchForm({ leadTimeDays: e.target.value })}
          />
        </FormField>
        <FormField label="Điều khoản thanh toán">
          <input
            className="form-input"
            value={form.paymentTerm}
            onChange={e => onPatchForm({ paymentTerm: e.target.value })}
          />
        </FormField>
        <FormField label="Ghi chú" className="sm:col-span-2">
          <textarea
            className="form-input"
            value={form.note}
            onChange={e => onPatchForm({ note: e.target.value })}
          />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Button type="button" variant="outlined" size="sm" disabled={busy} onClick={onClose}>
          Hủy
        </Button>
        <Button type="button" variant="filled" size="sm" disabled={busy} onClick={() => void onSave()}>
          {busy ? 'Đang lưu…' : 'Lưu'}
        </Button>
      </div>
    </Modal>
  );
}
