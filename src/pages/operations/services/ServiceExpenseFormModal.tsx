import type { Dispatch, SetStateAction } from 'react';
import { Briefcase, Coins } from 'lucide-react';
import Button from '../../../components/ui/Button';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import FormField from '../../../components/ui/FormField';
import IOSSwitch from '../../../components/ui/IOSSwitch';
import Modal from '../../../components/ui/Modal';
import MaterialUnitSelect from '../../../components/warehouse/MaterialUnitSelect';
import type { ServiceExpenseItemApiDto } from '../../../types/api/serviceExpenseItem';
import type { ServiceExpenseFormState } from './useServicesExpensesController';

interface ServiceExpenseFormModalProps {
  isOpen: boolean;
  editingItem: ServiceExpenseItemApiDto | null;
  formData: ServiceExpenseFormState;
  isSaving: boolean;
  onChange: Dispatch<SetStateAction<ServiceExpenseFormState>>;
  onClose: () => void;
  onSave: () => void;
}

export default function ServiceExpenseFormModal({
  isOpen,
  editingItem,
  formData,
  isSaving,
  onChange,
  onClose,
  onSave,
}: ServiceExpenseFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? `Sửa dịch vụ / chi phí: ${editingItem.code}` : 'Thêm dịch vụ / chi phí mới'}
      size="md"
      footer={(
        <>
          <Button
            type="button"
            variant="text"
            onClick={onClose}
            disabled={isSaving}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="filled"
            loading={isSaving}
            onClick={onSave}
          >
            {isSaving ? 'Đang lưu…' : (editingItem ? 'Lưu thay đổi' : 'Tạo mới')}
          </Button>
        </>
      )}
    >
      <div className="space-y-4 py-2">
        <FormField label="Phân loại" required>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.type === 'service'
                  ? 'border-[var(--md-warning)] bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] font-medium ring-1 ring-[var(--md-warning)]'
                  : 'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant05)]'
              }`}
            >
              <input
                type="radio"
                name="itemType"
                value="service"
                checked={formData.type === 'service'}
                onChange={() => onChange(prev => ({ ...prev, type: 'service' }))}
                className="shrink-0 accent-[var(--md-warning)]"
              />
              <Briefcase
                size={16}
                className={`shrink-0 ${formData.type === 'service' ? 'text-[var(--md-on-warning-container)]' : 'text-[var(--md-on-surface-variant)]'}`}
                aria-hidden
              />
              <div className="min-w-0 text-xs">
                <div className="font-semibold whitespace-nowrap">Dịch vụ thi công</div>
                <div className="text-xs opacity-80">Nhân công, cẩu, xe, kiểm định...</div>
              </div>
            </label>

            <label
              className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.type === 'expense'
                  ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] font-medium ring-1 ring-[var(--md-primary)]'
                  : 'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant05)]'
              }`}
            >
              <input
                type="radio"
                name="itemType"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={() => onChange(prev => ({ ...prev, type: 'expense' }))}
                className="shrink-0 accent-[var(--md-primary)]"
              />
              <Coins
                size={16}
                className={`shrink-0 ${formData.type === 'expense' ? 'text-[var(--md-on-primary-container)]' : 'text-[var(--md-on-surface-variant)]'}`}
                aria-hidden
              />
              <div className="min-w-0 text-xs">
                <div className="font-semibold whitespace-nowrap">Chi phí ngoài</div>
                <div className="text-xs opacity-80">Tiếp khách, lưu trú, thuê máy...</div>
              </div>
            </label>
          </div>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Mã định danh" required>
            <input
              className="form-input form-input-md font-mono uppercase"
              value={formData.code}
              placeholder={formData.type === 'service' ? 'DV-VC-01' : 'CP-TK-01'}
              onChange={e => onChange(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              aria-label="Mã định danh"
            />
            <p className="mt-1 text-xs text-[var(--md-on-surface-variant)]">
              VD: DV-VC-01, CP-TK-01 (Duy nhất cho KHMH/PO/DNTT)
            </p>
          </FormField>

          <MaterialUnitSelect
            value={formData.unit}
            onChange={val => onChange(prev => ({ ...prev, unit: val }))}
            required
            preserveUnknownValue
          />
        </div>

        <FormField label="Tên dịch vụ / chi phí" required>
          <input
            className="form-input form-input-md"
            value={formData.name}
            placeholder={
              formData.type === 'service'
                ? 'VD: Chi phí cẩu tháp, vận chuyển vật tư'
                : 'VD: Chi phí tiếp khách & quan hệ đối tác'
            }
            onChange={e => onChange(prev => ({ ...prev, name: e.target.value }))}
            aria-label="Tên dịch vụ / chi phí"
          />
        </FormField>

        <FormField label="Đơn giá tham chiếu (VNĐ)">
          <CurrencyInput
            value={formData.referencePrice}
            onChange={val => onChange(prev => ({ ...prev, referencePrice: val }))}
            placeholder="VD: 3,500,000"
            aria-label="Đơn giá tham chiếu"
          />
          <p className="mt-1 text-xs text-[var(--md-on-surface-variant)]">
            Dùng làm mức giá dự kiến tham khảo khi lập KHMH
          </p>
        </FormField>

        <FormField label="Ghi chú / Diễn giải mục đích">
          <textarea
            className="form-input form-input-md w-full"
            rows={3}
            value={formData.description}
            placeholder="Mô tả phạm vi công việc, yêu cầu kỹ thuật hoặc lưu ý đối chiếu kế toán…"
            onChange={e => onChange(prev => ({ ...prev, description: e.target.value }))}
            aria-label="Ghi chú"
          />
        </FormField>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--md-outline-variant)]">
          <div>
            <div className="text-sm font-medium text-[var(--md-on-surface)]">Kích hoạt sử dụng</div>
            <div className="text-xs text-[var(--md-on-surface-variant)]">
              Cho phép chọn trong Autocomplete khi lập KHMH &amp; Đề nghị mua
            </div>
          </div>
          <IOSSwitch
            checked={formData.isActive}
            onChange={val => onChange(prev => ({ ...prev, isActive: val }))}
            title={formData.isActive ? 'Đang kích hoạt' : 'Đã tắt'}
          />
        </div>
      </div>
    </Modal>
  );
}
