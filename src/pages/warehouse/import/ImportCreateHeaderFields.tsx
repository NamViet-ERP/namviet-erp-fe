import FormField from '../../../components/ui/FormField';
import SupplierAutocomplete from '../../../components/ui/SupplierAutocomplete';
import ProjectWarehouseSelect from '../../../components/warehouse/ProjectWarehouseSelect';
import type { SupplierApiDto } from '../../../services/suppliersService';
import type { PurchaseOrderApiDto } from '../../../types/api/purchasingApi';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import type { ImportFormFieldErrors } from '../../../lib/wms/importFormSchema';
import type { FrozenProjectMap } from '../../../lib/wms/stocktakeFreeze';

export interface ImportCreateHeaderFieldsProps {
  isCreateMode: boolean;
  isPoBoundEdit: boolean;
  poLocked?: boolean;
  errors?: ImportFormFieldErrors;
  poOptions: PurchaseOrderApiDto[];
  selectedPoCode: string;
  onSelectedPoCodeChange?: (code: string) => void;
  poLoading: boolean;
  projectLabel: string;
  selectedPo?: PurchaseOrderApiDto;
  defaultSupplier: string;
  projects: WarehouseProjectApiDto[];
  frozenByProjectCode: FrozenProjectMap;
  projectCode: string;
  onProjectCodeChange: (code: string) => void;
  onResetItems: () => void;
  onDefaultSupplierChange: (name: string) => void;
  suppliers: SupplierApiDto[];
  referenceCode: string;
  onReferenceCodeChange: (code: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export default function ImportCreateHeaderFields({
  isCreateMode,
  isPoBoundEdit,
  poLocked = false,
  errors,
  poOptions,
  selectedPoCode,
  onSelectedPoCodeChange,
  poLoading,
  projectLabel,
  selectedPo,
  defaultSupplier,
  projects,
  frozenByProjectCode,
  projectCode,
  onProjectCodeChange,
  onResetItems,
  onDefaultSupplierChange,
  suppliers,
  referenceCode,
  onReferenceCodeChange,
  note,
  onNoteChange,
}: ImportCreateHeaderFieldsProps) {
  return (
    <>
      {isCreateMode || isPoBoundEdit ? (
        <>
          <FormField label="Phiếu PO" required error={errors?.referenceCode}>
            {isPoBoundEdit || poLocked ? (
              <input
                className="form-input"
                value={
                  selectedPo
                    ? `${selectedPo.code} · ${selectedPo.supplierName || 'NCC'} · ${selectedPo.planCode} · ${selectedPo.projectCode}`
                    : selectedPoCode
                }
                readOnly
                aria-label="Phiếu PO"
              />
            ) : (
              <select
                className="form-input"
                value={selectedPoCode}
                disabled={poLoading}
                onChange={e => onSelectedPoCodeChange?.(e.target.value)}
              >
                <option value="">
                  {poLoading ? 'Đang tải PO…' : '— Chọn PO đã đặt NCC —'}
                </option>
                {poOptions.map(po => (
                  <option key={po.code} value={po.code}>
                    {po.code} · {po.supplierName || 'NCC'} · {po.planCode} · {po.projectCode}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Kho dự án (từ PO)" required error={errors?.projectCode}>
              <input
                className="form-input"
                value={projectLabel}
                readOnly
                placeholder="Chọn PO để tự điền kho dự án"
              />
            </FormField>
            <FormField label="Nhà cung cấp (từ PO)">
              <input
                className="form-input"
                value={selectedPo?.supplierName || defaultSupplier || ''}
                readOnly
                placeholder="Chọn PO để tự điền NCC"
              />
            </FormField>
          </div>
        </>
      ) : (
        <>
          <FormField label="Kho dự án nhận vật tư" required error={errors?.projectCode}>
            <ProjectWarehouseSelect
              projects={projects}
              frozenByProjectCode={frozenByProjectCode}
              value={projectCode}
              onChange={code => {
                onProjectCodeChange(code);
                onResetItems();
              }}
              placeholder="— Chọn kho dự án —"
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nhà cung cấp (NCC)" required error={errors?.defaultSupplier}>
              <SupplierAutocomplete
                value={defaultSupplier}
                onChange={onDefaultSupplierChange}
                suppliers={suppliers}
                placeholder="Chọn NCC từ danh mục…"
              />
            </FormField>
            <FormField label="Mã tham chiếu / PO" required error={errors?.referenceCode}>
              <input className="form-input" value={referenceCode} onChange={e => onReferenceCodeChange(e.target.value)} />
            </FormField>
          </div>
        </>
      )}
      <FormField label="Ghi chú">
        <textarea className="form-input" rows={2} value={note} onChange={e => onNoteChange(e.target.value)} />
      </FormField>

      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-3 py-2.5 text-xs leading-relaxed text-[var(--md-on-surface-variant)]">
        {isCreateMode || isPoBoundEdit ? (
          isPoBoundEdit ? (
            <>
              Vật tư theo phiếu PO — tick dòng và chỉnh <strong className="text-[var(--md-on-surface)]">SL dự kiến</strong>.
              Không thêm vật tư ngoài PO.
            </>
          ) : (
            <>
              Chọn PO trước — kho dự án và NCC lấy từ PO.
              Tick mặt hàng còn SL và nhập <strong className="text-[var(--md-on-surface)]">SL dự kiến nhập kho</strong>.
              Phiếu nháp không khóa PO; chốt dự kiến mới giữ SL trên PO.
              Khi duyệt thực tế, thủ kho chỉnh SL thành số thực nhận (tối đa phần còn lại trên PO).
            </>
          )
        ) : (
          <>
            Import Excel chỉ chấp nhận <strong className="text-[var(--md-on-surface)]">mã vật tư đã có trong danh mục</strong>.
            Hàng có mã chưa tồn tại sẽ báo lỗi từng dòng — tạo vật tư trước khi import.
          </>
        )}
      </div>
    </>
  );
}
