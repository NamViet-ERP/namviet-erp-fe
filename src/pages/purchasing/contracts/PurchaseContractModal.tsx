import type { RefObject } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import HrmDatePicker from '../../../components/hr/HrmDatePicker';
import PoAutocomplete from '../../../components/purchasing/PoAutocomplete';
import ProjectAutocomplete from '../../../components/purchasing/ProjectAutocomplete';
import Button from '../../../components/ui/Button';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import EmptyState from '../../../components/ui/EmptyState';
import FormField from '../../../components/ui/FormField';
import Modal from '../../../components/ui/Modal';
import SelectField from '../../../components/ui/SelectField';
import SupplierAutocomplete from '../../../components/ui/SupplierAutocomplete';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { SupplierApiDto } from '../../../services/suppliersService';
import type { PurchaseContractApiDto, PurchaseOrderApiDto } from '../../../types/api/purchasingApi';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import { CONTRACT_STATUS_OPTIONS, type ContractFormState } from './usePurchaseContractsController';

const MODAL_STATUS_OPTIONS = CONTRACT_STATUS_OPTIONS.filter(o => o.value !== '');

interface PurchaseContractModalProps {
  isOpen: boolean;
  title: string;
  creating: boolean;
  selectedId: string | null;
  detailLoading: boolean;
  detailData?: PurchaseContractApiDto;
  form: ContractFormState;
  busy: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  projects: WarehouseProjectApiDto[];
  suppliers: SupplierApiDto[];
  orders: PurchaseOrderApiDto[];
  selectableOrders: PurchaseOrderApiDto[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onPatchForm: (patch: Partial<ContractFormState>) => void;
  onSave: () => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onDownload: (row: PurchaseContractApiDto) => Promise<void>;
  onRequestDelete: (id: string) => void;
}

export default function PurchaseContractModal({
  isOpen,
  title,
  creating,
  selectedId,
  detailLoading,
  detailData,
  form,
  busy,
  canCreate,
  canUpdate,
  projects,
  suppliers,
  orders,
  selectableOrders,
  fileInputRef,
  onClose,
  onPatchForm,
  onSave,
  onUpload,
  onDownload,
  onRequestDelete,
}: PurchaseContractModalProps) {
  const readOnly = busy || (!canCreate && !canUpdate);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {!creating && detailLoading ? (
        <EmptyState message="Đang tải…" />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Số hợp đồng *">
              <input
                className="form-input"
                value={form.contractNo}
                disabled={readOnly}
                onChange={e => onPatchForm({ contractNo: e.target.value })}
              />
            </FormField>
            <FormField label="Trạng thái">
              <SelectField
                value={form.status}
                onChange={status => onPatchForm({ status })}
                options={MODAL_STATUS_OPTIONS}
                disabled={readOnly}
                aria-label="Trạng thái hợp đồng"
              />
            </FormField>
            <FormField label="Tiêu đề *" className="md:col-span-2">
              <input
                className="form-input"
                value={form.title}
                disabled={readOnly}
                onChange={e => onPatchForm({ title: e.target.value })}
              />
            </FormField>
            <FormField label="NCC">
              <SupplierAutocomplete
                value={form.supplierName}
                suppliers={suppliers}
                disabled={readOnly}
                onChange={supplierName => onPatchForm({ supplierName })}
              />
            </FormField>
            <FormField label="Dự án">
              <ProjectAutocomplete
                value={form.projectCode}
                projects={projects}
                disabled={readOnly}
                onChange={projectCode => onPatchForm({ projectCode })}
              />
            </FormField>
            <FormField label="Mã PO">
              <PoAutocomplete
                value={form.poCode}
                orders={selectableOrders}
                disabled={readOnly}
                placeholder="Chọn đơn hàng PO (tùy chọn)…"
                allowClear
                onChange={code => {
                  if (!code) {
                    onPatchForm({ poCode: '' });
                    return;
                  }
                  const selectedPo = orders.find(o => o.code === code);
                  if (selectedPo) {
                    onPatchForm({
                      poCode: code,
                      supplierName: selectedPo.supplierName || form.supplierName,
                      projectCode: selectedPo.projectCode || form.projectCode,
                      amount: selectedPo.totalAmount ? String(selectedPo.totalAmount) : form.amount,
                    });
                  }
                }}
              />
            </FormField>
            <FormField label="Giá trị">
              <CurrencyInput
                suffix="VNĐ"
                disabled={readOnly}
                value={form.amount}
                onChange={(_raw, numeric) => onPatchForm({ amount: numeric > 0 ? String(numeric) : '' })}
              />
            </FormField>
            <FormField label="Ngày ký">
              <HrmDatePicker value={form.signedDate} disabled={readOnly} onChange={signedDate => onPatchForm({ signedDate })} />
            </FormField>
            <FormField label="Hiệu lực từ">
              <HrmDatePicker value={form.effectiveFrom} disabled={readOnly} onChange={effectiveFrom => onPatchForm({ effectiveFrom })} />
            </FormField>
            <FormField label="Hiệu lực đến">
              <HrmDatePicker value={form.effectiveTo} disabled={readOnly} onChange={effectiveTo => onPatchForm({ effectiveTo })} />
            </FormField>
            <FormField label="Ghi chú" className="md:col-span-2">
              <textarea
                className="form-input"
                rows={2}
                value={form.note}
                disabled={readOnly}
                onChange={e => onPatchForm({ note: e.target.value })}
              />
            </FormField>
          </div>

          {!creating && selectedId ? (
            <div className="border-t border-[var(--md-outline-variant)] pt-3 space-y-2">
              <div className="text-sm text-[var(--md-on-surface-variant)]">
                File:{' '}
                <strong>
                  {detailData?.fileName || (form && detailData?.hasFile ? 'Đã có file' : 'Chưa có')}
                </strong>
                {detailData?.uploadedAt ? ` · ${formatDateTimeVi(detailData.uploadedAt) ?? ''}` : ''}
              </div>
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <>
                    <Button
                      type="button"
                      variant="outlined"
                      size="sm"
                      leftIcon={Upload}
                      disabled={busy}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Tải file lên
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.rtf,.xls,.xlsx,.xlsm,.xlsb,.csv,.ppt,.pptx,.txt"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void onUpload(file);
                      }}
                    />
                  </>
                ) : null}
                {detailData?.hasFile && detailData.fileName ? (
                  <Button
                    type="button"
                    variant="text"
                    size="sm"
                    leftIcon={Download}
                    disabled={busy}
                    onClick={() => { void onDownload(detailData); }}
                  >
                    Tải xuống
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {(canCreate || canUpdate) ? (
            <div className="flex items-center justify-between gap-2 border-t border-[var(--md-outline-variant)] pt-3">
              <div>
                {!creating && selectedId && canUpdate ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    leftIcon={Trash2}
                    disabled={busy}
                    onClick={() => onRequestDelete(selectedId)}
                  >
                    Xóa hợp đồng
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outlined" size="sm" disabled={busy} onClick={onClose}>
                  Đóng
                </Button>
                <Button type="button" variant="filled" size="sm" disabled={busy} onClick={() => { void onSave(); }}>
                  {busy ? 'Đang lưu…' : creating ? 'Tạo' : 'Lưu'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
