import { Plus, Trash2 } from 'lucide-react';
import type { Material } from '../../../types';
import type { SupplierApiDto } from '../../../services/suppliersService';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import QtyStepper from '../../../components/ui/QtyStepper';
import SupplierAutocomplete from '../../../components/ui/SupplierAutocomplete';
import MaterialAutocomplete from '../../../components/ui/MaterialAutocomplete';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';
import { emptyQtyPriceLine } from '../voucher/voucherFormTypes';
import { importLineTotal } from './importUtils';
import type { ImportFormFieldErrors } from '../../../lib/wms/importFormSchema';

interface ImportCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  projects: WarehouseProjectApiDto[];
  suppliers: SupplierApiDto[];
  materials: Material[];
  projectCode: string;
  onProjectCodeChange: (code: string) => void;
  defaultSupplier: string;
  onDefaultSupplierChange: (name: string) => void;
  referenceCode: string;
  onReferenceCodeChange: (code: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  items: MaterialQtyPriceLine[];
  onItemsChange: (items: MaterialQtyPriceLine[]) => void;
  formGrandTotal: number;
  errors?: ImportFormFieldErrors;
  onCreate: (status: 'draft' | 'pending') => void;
  onSave?: () => void;
  editVoucher?: { code: string } | null;
  materialUnit: (code: string) => string;
}

export default function ImportCreateModal({
  isOpen,
  onClose,
  isPending,
  projects,
  suppliers,
  materials,
  projectCode,
  onProjectCodeChange,
  defaultSupplier,
  onDefaultSupplierChange,
  referenceCode,
  onReferenceCodeChange,
  note,
  onNoteChange,
  items,
  onItemsChange,
  formGrandTotal,
  errors,
  onCreate,
  onSave,
  editVoucher,
  materialUnit,
}: ImportCreateModalProps) {
  const resetItems = () => onItemsChange([{ ...emptyQtyPriceLine }]);

  const addMaterialLine = () => {
    onItemsChange([...items, { ...emptyQtyPriceLine }]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editVoucher ? `Sửa phiếu nhập — ${editVoucher.code}` : 'Tạo phiếu nhập kho dự án'}
      size="full"
      footer={
        <div className="flex w-full items-center justify-between gap-4 flex-wrap">
          <div className="text-sm">
            <span className="text-[var(--md-on-surface-variant)]">Tổng giá trị: </span>
            <span className="font-bold text-[var(--md-primary)] tabular-nums">{formatCurrency(formGrandTotal)} đ</span>
          </div>
          <div className="flex items-center gap-2 md-dialog__footer-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
            {editVoucher ? (
              <button type="button" className="btn btn-filled" disabled={isPending} onClick={onSave}>
                Lưu thay đổi
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-outline" disabled={isPending} onClick={() => onCreate('draft')}>
                  Lưu nháp
                </button>
                <button type="button" className="btn btn-filled" disabled={isPending} onClick={() => onCreate('pending')}>
                  Chốt dự kiến
                </button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 modal-form-bordered">
        <FormField label="Kho dự án nhận vật tư" required error={errors?.projectCode}>
          <select
            className="form-select"
            value={projectCode}
            onChange={e => {
              onProjectCodeChange(e.target.value);
              resetItems();
            }}
          >
            <option value="">— Chọn kho dự án —</option>
            {projects.map(p => (
              <option key={p.projectCode} value={p.projectCode}>
                {p.projectCode} — {p.projectName}
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nhà cung cấp (NCC)" required error={errors?.defaultSupplier}>
            <SupplierAutocomplete
              value={defaultSupplier}
              onChange={onDefaultSupplierChange}
              suppliers={suppliers}
              placeholder="Chọn NCC từ danh mục…"
            />
            <p className="mt-1 text-[11px] text-[var(--md-on-surface-variant)] text-pretty">
              Vui lòng chọn từ danh mục. Áp dụng cho toàn bộ phiếu nhập.
            </p>
          </FormField>
          <FormField label="Mã tham chiếu / PO" required error={errors?.referenceCode}>
            <input className="form-input" value={referenceCode} onChange={e => onReferenceCodeChange(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Ghi chú">
          <textarea className="form-input" rows={2} value={note} onChange={e => onNoteChange(e.target.value)} />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Chi tiết vật tư</div>
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs"
              onClick={addMaterialLine}
              disabled={!projectCode}
            >
              <Plus size={12} /> Thêm vật tư
            </button>
          </div>
          {errors?.items && (
            <p className="text-xs text-[var(--md-error)]" role="alert">{errors.items}</p>
          )}
          {!projectCode ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">Chọn kho dự án trước khi thêm vật tư.</p>
          ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="form-table import-items-table import-items-table--import text-xs">
              <thead>
                <tr>
                  <th className="table-header-cell">Vật tư</th>
                  <th className="table-header-cell text-right">SL</th>
                  <th className="table-header-cell text-center">ĐVT</th>
                  <th className="table-header-cell text-right">Đơn giá</th>
                  <th className="table-header-cell text-right">Thành tiền</th>
                  <th className="table-header-cell text-center" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const total = importLineTotal(it);
                  return (
                    <tr key={idx} className="table-row">
                      <td className="table-cell">
                        <MaterialAutocomplete
                          compact
                          value={it.materialCode}
                          onChange={code => {
                            const next = [...items];
                            next[idx] = { ...next[idx], materialCode: code };
                            onItemsChange(next);
                          }}
                          materials={materials}
                          placeholder="— Vật tư —"
                        />
                      </td>
                      <td className="table-cell text-right">
                        <QtyStepper
                          value={it.qty}
                          onChange={qtyVal => {
                            const next = [...items];
                            next[idx] = { ...next[idx], qty: qtyVal };
                            onItemsChange(next);
                          }}
                        />
                      </td>
                      <td className="table-cell text-center text-[var(--md-on-surface-variant)]">
                        {it.materialCode ? materialUnit(it.materialCode) : '—'}
                      </td>
                      <td className="table-cell text-right">
                        <CurrencyInput
                          value={it.unitPrice}
                          onChange={(_raw, numeric) => {
                            const next = [...items];
                            next[idx] = { ...next[idx], unitPrice: numeric > 0 ? String(numeric) : '' };
                            onItemsChange(next);
                          }}
                        />
                      </td>
                      <td className="table-cell text-right tabular-nums font-semibold text-[var(--md-on-surface)]">
                        {total > 0 ? formatCurrency(total) : '—'}
                      </td>
                      <td className="table-cell text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            className="p-1 text-[var(--md-error)] opacity-80 hover:opacity-100"
                            aria-label="Xóa dòng"
                            onClick={() => onItemsChange(items.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--md-outline-variant)]">
                  <td colSpan={4} className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2">
                    Tổng cộng
                  </td>
                  <td className="table-cell text-right font-bold tabular-nums text-[var(--md-primary)] py-2">
                    {formatCurrency(formGrandTotal)} đ
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
