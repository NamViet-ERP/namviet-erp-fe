import { Plus, Trash2 } from 'lucide-react';
import type { Material } from '../../../types';
import type { WarehouseProjectApiDto, WarehouseProjectInventoryApiDto } from '../../../types/wms';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import QtyStepper from '../../../components/ui/QtyStepper';
import MaterialAutocomplete from '../../../components/ui/MaterialAutocomplete';
import { fmtStockQty } from '../../../lib/wms/stockQtyFormat';
import type { MaterialQtyLine } from '../voucher/voucherFormTypes';
import { emptyQtyLine } from '../voucher/voucherFormTypes';
import { availableExportQty } from './exportUtils';
import type { ExportFormFieldErrors } from '../../../lib/wms/exportFormSchema';
import { findDuplicateMaterialLineIndex } from '../../../lib/wms/voucherDuplicateMaterial';
import { isProjectFrozen, type FrozenProjectMap } from '../../../lib/wms/stocktakeFreeze';
import ProjectWarehouseSelect from '../../../components/warehouse/ProjectWarehouseSelect';

interface ExportCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  projects: WarehouseProjectApiDto[];
  stockMaterials: Material[];
  projectInventory: WarehouseProjectInventoryApiDto[];
  projectCode: string;
  onProjectCodeChange: (code: string) => void;
  referenceCode: string;
  onReferenceCodeChange: (code: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  items: MaterialQtyLine[];
  onItemsChange: (items: MaterialQtyLine[]) => void;
  onDuplicateMaterialAttempt?: (lineIndex: number) => void;
  errors?: ExportFormFieldErrors;
  frozenByProjectCode: FrozenProjectMap;
  onCreate: (status: 'draft' | 'pending') => void;
  onSave?: () => void;
  editVoucher?: { code: string } | null;
  materialUnit: (code: string) => string;
}

export default function ExportCreateModal({
  isOpen,
  onClose,
  isPending,
  projects,
  stockMaterials,
  projectInventory,
  projectCode,
  onProjectCodeChange,
  referenceCode,
  onReferenceCodeChange,
  note,
  onNoteChange,
  items,
  onItemsChange,
  onDuplicateMaterialAttempt,
  errors,
  frozenByProjectCode,
  onCreate,
  onSave,
  editVoucher,
  materialUnit,
}: ExportCreateModalProps) {
  const resetItems = () => onItemsChange([{ materialCode: '', qty: '' }]);
  const submitBlocked = isProjectFrozen(frozenByProjectCode, projectCode);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editVoucher ? `Sửa phiếu xuất — ${editVoucher.code}` : 'Tạo phiếu xuất kho dự án'}
      size="full"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <div className="md-dialog__footer-actions">
            {editVoucher ? (
              <button type="button" className="btn btn-filled" disabled={isPending} onClick={onSave}>
                Lưu thay đổi
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-outline" disabled={isPending || submitBlocked} onClick={() => onCreate('draft')}>
                  Lưu nháp
                </button>
                <button type="button" className="btn btn-filled" disabled={isPending || submitBlocked} onClick={() => onCreate('pending')}>
                  Chốt dự kiến
                </button>
              </>
            )}
          </div>
        </>
      }
    >
      <div className="space-y-4 modal-form-bordered">
        <FormField label="Kho dự án xuất vật tư" required error={errors?.projectCode}>
          <ProjectWarehouseSelect
            projects={projects}
            frozenByProjectCode={frozenByProjectCode}
            value={projectCode}
            onChange={code => {
              onProjectCodeChange(code);
              resetItems();
            }}
          />
        </FormField>
        <FormField label="Mã tham chiếu / lý do xuất">
          <input className="form-input" value={referenceCode} onChange={e => onReferenceCodeChange(e.target.value)} />
        </FormField>
        <FormField label="Ghi chú">
          <textarea className="form-input" rows={2} value={note} onChange={e => onNoteChange(e.target.value)} />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Chi tiết vật tư</div>
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs"
              onClick={() => onItemsChange([...items, { ...emptyQtyLine }])}
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
              <table className="form-table import-items-table import-items-table--export text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell">Vật tư</th>
                    <th className="table-header-cell text-right">SL</th>
                    <th className="table-header-cell text-center">ĐVT</th>
                    <th className="table-header-cell text-right" title="Tồn thực tế − dự kiến xuất">Tồn TT</th>
                    <th className="table-header-cell text-center" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const maxQty = it.materialCode
                      ? availableExportQty(projectInventory, it.materialCode, items, idx)
                      : undefined;
                    const lineErr = errors?.lineErrors?.[idx];
                    return (
                      <tr key={idx} className="table-row">
                        <td className="table-cell align-top">
                          <MaterialAutocomplete
                            compact
                            value={it.materialCode}
                            onChange={code => {
                              if (code.trim()) {
                                const dupIdx = findDuplicateMaterialLineIndex(items, code, idx);
                                if (dupIdx !== null) {
                                  onDuplicateMaterialAttempt?.(idx);
                                  return;
                                }
                              }
                              const next = [...items];
                              next[idx] = { ...next[idx], materialCode: code };
                              onItemsChange(next);
                            }}
                            materials={stockMaterials}
                            placeholder="— Vật tư —"
                          />
                          {lineErr?.materialCode && (
                            <p className="mt-0.5 text-[10px] text-[var(--md-error)]">{lineErr.materialCode}</p>
                          )}
                        </td>
                        <td className="table-cell text-right">
                          <QtyStepper
                            value={it.qty}
                            max={maxQty}
                            onChange={qtyVal => {
                              const next = [...items];
                              next[idx] = { ...next[idx], qty: qtyVal };
                              onItemsChange(next);
                            }}
                          />
                        </td>
                        <td className="table-cell text-center text-[var(--md-on-surface-variant)]">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            {it.materialCode ? materialUnit(it.materialCode) : '—'}
                          </div>
                        </td>
                        <td className="table-cell text-right tabular-nums font-semibold">
                          <div className="import-cell-placeholder import-cell-placeholder--end font-semibold">
                            {it.materialCode ? fmtStockQty(maxQty ?? 0) : '—'}
                          </div>
                        </td>
                        <td className="table-cell text-center">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
