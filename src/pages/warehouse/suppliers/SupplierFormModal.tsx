import type React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import SupplierAttachmentUploader, { type StagedAttachment } from '../../../components/suppliers/SupplierAttachmentUploader';
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
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <button
            type="submit"
            form="supplier-settings-form"
            className="btn btn-filled"
            disabled={isSaving}
          >
            Lưu
          </button>
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
              <button
                type="button"
                className="btn btn-outline btn-sm shrink-0 inline-flex items-center gap-1.5 text-xs text-[var(--md-primary)] hover:bg-[var(--md-primary)]/10 cursor-pointer"
                onClick={onFetchNextCode}
                title="Lấy lại mã gợi ý tiếp theo tự động từ hệ thống"
              >
                <RefreshCw size={13} />
                <span>Lấy mã gợi ý</span>
              </button>
            )}
          </div>
          {!editing && (
            <p className="text-[11px] text-[var(--md-on-surface-variant)] mt-1">
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
          <FormField label="Loại hình đối tác">
            <select
              className="form-select"
              value={form.supplierType}
              onChange={e => setForm(f => ({ ...f, supplierType: e.target.value }))}
            >
              <option value="Nhà sản xuất">Nhà sản xuất (Manufacturer)</option>
              <option value="Nhà phân phối">Nhà phân phối (Distributor)</option>
              <option value="Đại lý">Đại lý ủy quyền (Agent / Dealer)</option>
              <option value="Dịch vụ / Gia công">Dịch vụ / Gia công (Service / Fabrication)</option>
              <option value="Thương mại khác">Thương mại khác</option>
            </select>
          </FormField>

          <FormField label="Phạm vi hoạt động">
            <select
              className="form-select"
              value={form.scope}
              onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
            >
              <option value="Trong nước">Trong nước (Domestic)</option>
              <option value="Quốc tế">Quốc tế (International)</option>
            </select>
          </FormField>
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
        <div className="rounded-xl border border-[var(--md-outline-variant)] p-3.5 bg-[var(--md-surface-variant)]/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface)] flex items-center gap-1.5">
              <Users size={15} className="text-primary-600 dark:text-primary-400" />
              Người liên hệ chính (Primary Contact)
            </span>
            <span className="text-[11px] text-[var(--md-on-surface-variant)]">
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
          {groupOptions.length === 0 ? (
            <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty">
              Chưa có nhóm ngành hàng. Vào “Nhóm nhà cung cấp” để tạo trước.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-[var(--md-outline-variant)] p-3">
              {groupOptions.map(group => {
                const checked = form.groupIds.includes(group.id);
                return (
                  <label key={group.id} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        setForm(prev => ({
                          ...prev,
                          groupIds: e.target.checked
                            ? [...prev.groupIds, group.id]
                            : prev.groupIds.filter(id => id !== group.id),
                        }));
                      }}
                    />
                    <span>{group.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </FormField>
      </form>
    </Modal>
  );
}
