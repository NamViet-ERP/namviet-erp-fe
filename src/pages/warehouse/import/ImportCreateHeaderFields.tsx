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
  /** Xuất thẳng trên PO: mở chọn nguồn kho dự án / kho trung tâm. */
  allowWarehouseSourcePicker?: boolean;
  issueFromGeneralWarehouse?: boolean;
  onIssueFromGeneralWarehouseChange?: (value: boolean) => void;
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
  allowWarehouseSourcePicker = false,
  issueFromGeneralWarehouse = false,
  onIssueFromGeneralWarehouseChange,
}: ImportCreateHeaderFieldsProps) {
  return (
    <>
      {isCreateMode || isPoBoundEdit ? (
        <>
          <FormField label="Mã đơn hàng" required error={errors?.referenceCode}>
            {isPoBoundEdit || poLocked ? (
              <input
                className="form-input"
                value={
                  selectedPo
                    ? issueFromGeneralWarehouse
                      ? `${selectedPo.code} · ${selectedPo.planCode} · ${selectedPo.projectCode}`
                      : `${selectedPo.code} · ${selectedPo.supplierName || 'NCC'} · ${selectedPo.planCode} · ${selectedPo.projectCode}`
                    : selectedPoCode
                }
                readOnly
                aria-label="Mã đơn hàng"
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
            {allowWarehouseSourcePicker ? (
              <FormField label="Nguồn hàng" required error={errors?.projectCode}>
                <select
                  className="form-input"
                  value={issueFromGeneralWarehouse ? 'general' : 'project'}
                  onChange={e => onIssueFromGeneralWarehouseChange?.(e.target.value === 'general')}
                  aria-label="Nguồn hàng"
                >
                  <option value="project">
                    {projectLabel ? `Kho dự án (từ PO) - ${projectLabel}` : 'Kho dự án (từ PO)'}
                  </option>
                  <option value="general">Kho trung tâm</option>
                </select>
              </FormField>
            ) : (
              <FormField label="Kho dự án (từ PO)" required error={errors?.projectCode}>
                <input
                  className="form-input"
                  value={projectLabel}
                  readOnly
                  placeholder="Chọn PO để tự điền kho dự án"
                />
              </FormField>
            )}
            {issueFromGeneralWarehouse ? null : (
              <FormField label="Nhà cung cấp (từ PO)">
                <input
                  className="form-input"
                  value={selectedPo?.supplierName || defaultSupplier || ''}
                  readOnly
                  placeholder="Chọn PO để tự điền NCC"
                />
              </FormField>
            )}
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
            <FormField label="Mã đơn hàng" required error={errors?.referenceCode}>
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
          ) : allowWarehouseSourcePicker ? (
            issueFromGeneralWarehouse ? (
              <>
                Nguồn <strong className="text-[var(--md-on-surface)]">kho trung tâm</strong>: SL theo tồn khả dụng trung tâm.
                Khả dụng trung tâm = 0 là hết hàng - không chọn và không tăng SL.
                Tạm thời chỉ ghi số lượng, chưa lấy đơn giá.
                Duyệt trừ kho trung tâm, không đổi Đã nhận / Còn lại trên PO.
              </>
            ) : (
              <>
                Nguồn <strong className="text-[var(--md-on-surface)]">kho dự án (từ PO)</strong>: SL theo Còn lại.
                Duyệt tăng Đã nhận như nhập kho.
              </>
            )
          ) : (
            <>
              Chọn PO trước — kho dự án và NCC lấy từ PO.
              Tick mặt hàng còn SL và nhập <strong className="text-[var(--md-on-surface)]">SL dự kiến nhập kho</strong>.
              Phiếu nháp không khóa PO; chốt dự kiến mới giữ SL trên PO.
              Thủ kho nhận hàng trên màn Nhập kho: xem chi tiết, cập nhật đánh giá / ảnh / file, rồi duyệt thực tế.
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
