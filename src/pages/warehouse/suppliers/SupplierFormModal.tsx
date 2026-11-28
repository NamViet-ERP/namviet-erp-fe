import type React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import Button from '../../../components/ui/Button';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import FormField from '../../../components/ui/FormField';
import Modal from '../../../components/ui/Modal';
import SelectField from '../../../components/ui/SelectField';
import SupplierAttachmentUploader, { type StagedAttachment } from '../../../components/suppliers/SupplierAttachmentUploader';
import SupplierGroupTreePicker from '../../../components/suppliers/SupplierGroupTreePicker';
import {
  parseCreditLimit,
  parseMaxDebtDays,
  restrictVnPhoneInput,
  SUPPLIER_APPROVAL,
  SUPPLIER_LIMITS,
  validateOptionalVietnamPhone,
} from '../../../lib/suppliers/supplierStatus';
import type { SupplierGroupApiDto } from '../../../types/api/supplierDirectoryApi';
import {
  ApprovalStatusBadge,
  RatingBadge,
  type FormErrors,
  type SupplierFormState,
  type SupplierRow,
} from './SupplierShared';

const SUPPLIER_TYPE_OPTIONS = [
  { value: 'Nhà sản xuất', label: 'Nhà sản xuất (Manufacturer)' },
  { value: 'Nhà phân phối', label: 'Nhà phân phối (Distributor)' },
  { value: 'Đại lý', label: 'Đại lý ủy quyền (Agent / Dealer)' },
  { value: 'Dịch vụ / Gia công', label: 'Dịch vụ / Gia công (Service / Fabrication)' },
  { value: 'Thương mại khác', label: 'Thương mại khác' },
] as const;

const SUPPLIER_SCOPE_OPTIONS = [
  { value: 'Trong nước', label: 'Trong nước (Domestic)' },
  { value: 'Quốc tế', label: 'Quốc tế (International)' },
] as const;

interface SupplierFormModalProps {
  isOpen: boolean;
  editing: SupplierRow | null;
  form: SupplierFormState;
  setForm: React.Dispatch<React.SetStateAction<SupplierFormState>>;
  formErrors: FormErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  groupOptions: SupplierGroupApiDto[];
  stagedFiles: StagedAttachment[];
  onAddStagedFile: (docType: string, file: File) => void;
  onRemoveStagedFile: (localId: string) => void;
  onAttachmentChanged: () => void;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFetchNextCode: () => void;
}

export default function SupplierFormModal({
  isOpen,
  editing,
  form,
  setForm,
  formErrors,
  setFormErrors,
  groupOptions,
  stagedFiles,
  onAddStagedFile,
  onRemoveStagedFile,
  onAttachmentChanged,
  isSaving,
  onClose,
  onSubmit,
  onFetchNextCode,
}: SupplierFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
      size="xl"
      footer={
        <>
          <Button type="button" variant="outlined" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="supplier-settings-form"
            variant="filled"
            size="sm"
            disabled={isSaving}
            loading={isSaving}
          >
            Lưu
          </Button>
        </>
      }
    >
      <form id="supplier-settings-form" className="space-y-3 modal-form-bordered" onSubmit={onSubmit}>
        <FormField label="Mã NCC" error={formErrors.supplierCode}>
          <div className="flex items-center gap-2">
            <input
              className="form-input font-mono flex-1"
              value={form.supplierCode}
              maxLength={SUPPLIER_LIMITS.codeMax}
              disabled={Boolean(editing)}
              readOnly={Boolean(editing)}
              onChange={e => {
                setForm(f => ({ ...f, supplierCode: e.target.value }));
                setFormErrors(prev => ({ ...prev, supplierCode: undefined }));
              }}
              placeholder={editing ? undefined : 'Hệ thống tự cấp hoặc nhập mã quy ước'}
              aria-readonly={Boolean(editing)}
            />
            {!editing && (
              <Button
                type="button"
                variant="outlined"
                size="sm"
                leftIcon={RefreshCw}
                className="shrink-0"
                onClick={onFetchNextCode}
                title="Lấy lại mã gợi ý tiếp theo tự động từ hệ thống"
              >
                Lấy mã gợi ý
              </Button>
            )}
          </div>
          {!editing && (
            <p className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)] mt-1">
              Mã gợi ý tự động bởi hệ thống. Bạn có thể sửa đổi theo mã quy ước riêng của công ty (tối đa 50 ký tự).
            </p>
          )}
        </FormField>
        <FormField label="Tên nhà cung cấp" required error={formErrors.supplierName}>
          <input
            className="form-input"
            value={form.supplierName}
            maxLength={SUPPLIER_LIMITS.nameMax}
            onChange={e => {
              setForm(f => ({ ...f, supplierName: e.target.value }));
              setFormErrors(prev => ({ ...prev, supplierName: undefined }));
            }}
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Loại hình đối tác"
            value={form.supplierType}
            onChange={supplierType => setForm(f => ({ ...f, supplierType }))}
            options={SUPPLIER_TYPE_OPTIONS}
          />
          <SelectField
            label="Phạm vi hoạt động"
            value={form.scope}
            onChange={scope => setForm(f => ({ ...f, scope }))}
            options={SUPPLIER_SCOPE_OPTIONS}
          />
        </div>

        <FormField label="Mã số thuế (MST)" error={formErrors.taxCode}>
          <input
            className="form-input font-mono"
            value={form.taxCode}
            maxLength={50}
            onChange={e => {
              setForm(f => ({ ...f, taxCode: e.target.value }));
              setFormErrors(prev => ({ ...prev, taxCode: undefined }));
            }}
            placeholder="VD: 0315986604 hoặc 0100123456-001"
          />
        </FormField>
        {/* Thông tin Người liên hệ chính */}
        <div className="rounded-xl border border-[var(--md-outline-variant)] p-3.5 bg-[var(--md-surface-container-low)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--fs-xs)] font-bold uppercase tracking-wider text-[var(--md-on-surface)] flex items-center gap-1.5">
              <Users size={15} className="text-[var(--md-primary)]" />
              Người liên hệ chính (Primary Contact)
            </span>
            <span className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
              Tự động tạo/đồng bộ vào danh mục Liên hệ NCC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Họ và tên người liên hệ">
              <input
                className="form-input"
                value={form.contactName}
                maxLength={150}
                placeholder="VD: Nguyễn Văn An"
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
              />
            </FormField>

            <FormField label="Chức vụ">
              <input
                className="form-input"
                value={form.contactPosition}
                maxLength={150}
                placeholder="VD: Trưởng phòng Kinh doanh"
                onChange={e => setForm(f => ({ ...f, contactPosition: e.target.value }))}
              />
            </FormField>

            <FormField label="Điện thoại liên hệ" error={formErrors.contactPhone}>
              <input
                className="form-input"
                value={form.contactPhone}
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
                onChange={e => {
                  const contactPhone = restrictVnPhoneInput(e.target.value);
                  setForm(f => ({ ...f, contactPhone }));
                  setFormErrors(prev => ({ ...prev, contactPhone: undefined }));
                }}
                onBlur={() => {
                  setFormErrors(prev => ({
                    ...prev,
                    contactPhone: validateOptionalVietnamPhone(form.contactPhone) ?? undefined,
                  }));
                }}
                placeholder="0912345678"
              />
            </FormField>

            <FormField label="Email liên hệ">
              <input
                type="email"
                className="form-input"
                value={form.contactEmail}
                maxLength={255}
                placeholder="an.nguyen@supplier.com"
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
              />
            </FormField>
          </div>
        </div>

        <FormField label="Website">
          <input
            className="form-input"
            value={form.website}
            maxLength={255}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            placeholder="https://example.com"
          />
        </FormField>

        {/* Hồ sơ Onboarding đính kèm */}
        <SupplierAttachmentUploader
          supplierId={editing?.id}
          initialAttachments={editing?.attachments ?? []}
          stagedFiles={stagedFiles}
          onAddStagedFile={onAddStagedFile}
          onRemoveStagedFile={onRemoveStagedFile}
          onAttachmentChanged={onAttachmentChanged}
        />
        <FormField label="Hạn công nợ (ngày)" required error={formErrors.maxDebtDays}>
          <input
            type="text"
            inputMode="numeric"
            className="form-input"
            value={form.maxDebtDays}
            onChange={e => {
              const maxDebtDays = e.target.value;
              setForm(f => ({ ...f, maxDebtDays }));
              const parsed = parseMaxDebtDays(maxDebtDays);
              setFormErrors(prev => ({
                ...prev,
                maxDebtDays: parsed.ok ? undefined : parsed.error,
              }));
            }}
            placeholder="0 - 3650"
          />
        </FormField>
        <FormField
          label="Hạn mức công nợ (tiền, trống = không giới hạn)"
          error={formErrors.creditLimit}
        >
          <CurrencyInput
            value={form.creditLimit}
            onChange={creditLimit => {
              setForm(f => ({ ...f, creditLimit }));
              const parsed = parseCreditLimit(creditLimit);
              setFormErrors(prev => ({
                ...prev,
                creditLimit: parsed.ok ? undefined : parsed.error,
              }));
            }}
            placeholder="Không giới hạn"
          />
        </FormField>
        <FormField label="Trạng thái">
          <div className="flex flex-wrap items-center gap-2">
            <ApprovalStatusBadge status={editing?.approvalStatus ?? SUPPLIER_APPROVAL.New} />
            <span className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] text-pretty">
              {editing
                ? 'Chỉ sếp duyệt mới đổi trạng thái. Chưa duyệt thì chưa đặt PO được.'
                : 'NCC mới ở trạng thái Mới. Sếp duyệt xong mới đặt hàng được.'}
            </span>
          </div>
        </FormField>
        <FormField label="Hạng">
          <div className="flex flex-wrap items-center gap-2">
            <RatingBadge rating={editing?.rating ?? 'D'} />
            <span className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] text-pretty">
              Mặc định Hạng D khi tạo. Sau duyệt, hạng tăng/giảm theo phiếu đánh giá PO.
            </span>
          </div>
        </FormField>
        <FormField label="Điều khoản thanh toán" error={formErrors.paymentTerms}>
          <input
            className="form-input"
            value={form.paymentTerms}
            maxLength={SUPPLIER_LIMITS.paymentTermsMax}
            onChange={e => {
              setForm(f => ({ ...f, paymentTerms: e.target.value }));
              setFormErrors(prev => ({ ...prev, paymentTerms: undefined }));
            }}
            placeholder="VD: Thanh toán 30 ngày kể từ ngày nhận đủ chứng từ"
          />
        </FormField>
        <FormField label={`Nhóm ngành hàng (chọn nhiều · đã chọn ${form.groupIds.length})`}>
          <SupplierGroupTreePicker
            groups={groupOptions}
            selectedIds={form.groupIds}
            onChange={groupIds => setForm(prev => ({ ...prev, groupIds }))}
            emptyMessage="Chưa có nhóm ngành hàng. Vào “Nhóm nhà cung cấp” để tạo trước."
          />
        </FormField>
      </form>
    </Modal>
  );
}
