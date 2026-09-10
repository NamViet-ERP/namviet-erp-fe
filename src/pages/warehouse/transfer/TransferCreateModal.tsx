import { Plus, Trash2 } from 'lucide-react';
import type { Material } from '../../../types';
import type { WarehouseProjectApiDto, WarehouseProjectInventoryApiDto } from '../../../types/wms';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import QtyStepper from '../../../components/ui/QtyStepper';
import MaterialAutocomplete from '../../../components/ui/MaterialAutocomplete';
import { fmtStockQty } from '../../../lib/wms/stockQtyFormat';
import { GENERAL_WAREHOUSE_LABEL, GENERAL_WAREHOUSE_LABEL_LOWER } from '../../../lib/wms/stockTerminology';
import type { MaterialQtyPhaseLine } from '../voucher/voucherFormTypes';
import { emptyQtyPhaseLine } from '../voucher/voucherFormTypes';
import { availableReturnQty, type TransferMode } from './transferUtils';
import type { TransferFormFieldErrors } from '../../../lib/wms/transferFormSchema';
import { isProjectFrozen, type FrozenProjectMap } from '../../../lib/wms/stocktakeFreeze';
import ProjectWarehouseSelect from '../../../components/warehouse/ProjectWarehouseSelect';
import { findDuplicateMaterialLineIndex } from '../../../lib/wms/voucherDuplicateMaterial';

interface TransferCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  projects: WarehouseProjectApiDto[];
  targetProjects: WarehouseProjectApiDto[];
  stockMaterials: Material[];
  projectInventory: WarehouseProjectInventoryApiDto[];
  transferMode: TransferMode;
  onTransferModeChange: (mode: TransferMode) => void;
  projectCode: string;
  onProjectCodeChange: (code: string) => void;
  toProjectCode: string;
  onToProjectCodeChange: (code: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  items: MaterialQtyPhaseLine[];
  onItemsChange: (items: MaterialQtyPhaseLine[]) => void;
  onDuplicateMaterialAttempt?: (lineIndex: number) => void;
  errors?: TransferFormFieldErrors;
  frozenByProjectCode: FrozenProjectMap;
  onCreate: (status: 'draft' | 'pending') => void;
  onSave?: () => void;
  editVoucher?: { code: string } | null;
  materialUnit: (code: string) => string;
}

export default function TransferCreateModal({
  isOpen,
  onClose,
  isPending,
  projects,
  targetProjects,
  stockMaterials,
  projectInventory,
  transferMode,
  onTransferModeChange,
  projectCode,
  onProjectCodeChange,
  toProjectCode,
  onToProjectCodeChange,
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
}: TransferCreateModalProps) {
  const resetItems = () => onItemsChange([{ materialCode: '', qty: '', constructionPhase: '' }]);
  const submitBlocked =
    isProjectFrozen(frozenByProjectCode, projectCode)
    || (transferMode === 'cross-project' && isProjectFrozen(frozenByProjectCode, toProjectCode));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editVoucher ? `Sửa phiếu chuyển — ${editVoucher.code}` : 'Tạo phiếu chuyển kho dự án'}
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn btn-sm ${transferMode === 'return' ? 'btn-filled' : 'btn-outline'}`}
            onClick={() => { onTransferModeChange('return'); onToProjectCodeChange(''); }}
          >
            Hoàn trả {GENERAL_WAREHOUSE_LABEL_LOWER}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${transferMode === 'cross-project' ? 'btn-filled' : 'btn-outline'}`}
            onClick={() => onTransferModeChange('cross-project')}
          >
            Chuyển sang kho dự án khác
          </button>
        </div>
        <FormField label="Kho dự án nguồn" required error={errors?.projectCode}>
          <ProjectWarehouseSelect
            projects={projects}
            frozenByProjectCode={frozenByProjectCode}
            value={projectCode}
            onChange={code => {
              onProjectCodeChange(code);
              if (code === toProjectCode) onToProjectCodeChange('');
              resetItems();
            }}
            placeholder="— Chọn kho dự án —"
          />
        </FormField>
        {transferMode === 'return' ? (
          <FormField label="Đích">
            <input className="form-input bg-[var(--md-surface-variant)]" value={GENERAL_WAREHOUSE_LABEL} readOnly disabled />
            <p className="mt-2 text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
              Duyệt phiếu này mới trừ kho dự án và cộng {GENERAL_WAREHOUSE_LABEL_LOWER}. Nhập/xuất không đi đường này.
            </p>
          </FormField>
        ) : (
          <FormField label="Kho dự án đích" required error={errors?.toProjectCode}>
            <ProjectWarehouseSelect
              projects={targetProjects}
              frozenByProjectCode={frozenByProjectCode}
              value={toProjectCode}
              onChange={onToProjectCodeChange}
              placeholder="— Chọn kho dự án đích —"
              disabled={!projectCode}
            />
          </FormField>
        )}
        <FormField label="Ghi chú">
          <textarea className="form-input" rows={2} value={note} onChange={e => onNoteChange(e.target.value)} />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Chi tiết vật tư</div>
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs"
              onClick={() => onItemsChange([...items, { ...emptyQtyPhaseLine }])}
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
              <table className="form-table import-items-table import-items-table--transfer import-items-table--manual text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell text-center">Mặt hàng</th>
                    <th className="table-header-cell text-center import-manual-col-qty">SL</th>
                    <th className="table-header-cell text-center import-po-col-unit">ĐVT</th>
                    <th className="table-header-cell text-center" title="Tồn thực tế - dự kiến xuất/chuyển">Tồn TT</th>
                    <th className="table-header-cell text-center">Công đoạn (tùy chọn)</th>
                    <th className="table-header-cell text-center import-manual-col-action" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const maxQty = it.materialCode
                      ? availableReturnQty(projectInventory, it.materialCode, items, idx)
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
                            placeholder="- Vật tư -"
                          />
                          {lineErr?.materialCode && (
                            <p className="mt-0.5 text-[length:var(--fs-micro)] text-[var(--md-error)]">
                              {lineErr.materialCode}
                            </p>
                          )}
                        </td>
                        <td className="table-cell text-center import-manual-col-qty">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            <QtyStepper
                              value={it.qty}
                              max={maxQty}
                              className="qty-stepper--compact"
                              onChange={qtyVal => {
                                const next = [...items];
                                next[idx] = { ...next[idx], qty: qtyVal };
                                onItemsChange(next);
                              }}
                            />
                          </div>
                        </td>
                        <td className="table-cell text-center import-po-col-unit">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            {it.materialCode ? materialUnit(it.materialCode) : '-'}
                          </div>
                        </td>
                        <td className="table-cell text-center tabular-nums font-semibold">
                          <div className="import-cell-placeholder import-cell-placeholder--center font-semibold">
                            {it.materialCode ? fmtStockQty(maxQty ?? 0) : '-'}
                          </div>
                        </td>
                        <td className="table-cell">
                          <input
                            className="form-input text-xs"
                            placeholder="VD: Móng, Thân..."
                            value={it.constructionPhase}
                            onChange={e => {
                              const next = [...items];
                              next[idx] = { ...next[idx], constructionPhase: e.target.value };
                              onItemsChange(next);
                            }}
                          />
                        </td>
                        <td className="table-cell text-center import-manual-col-action">
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
