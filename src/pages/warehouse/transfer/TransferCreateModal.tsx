import { Plus, Trash2 } from 'lucide-react';
import type { Material } from '../../../types';
import type { WarehouseProjectApiDto, WarehouseProjectInventoryApiDto } from '../../../types/wms';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import QtyStepper from '../../../components/ui/QtyStepper';
import MaterialAutocomplete from '../../../components/ui/MaterialAutocomplete';
import { fmtStockQty } from '../../../lib/wms/stockQtyFormat';
import type { MaterialQtyPhaseLine } from '../voucher/voucherFormTypes';
import { availableReturnQty, type TransferMode } from './transferUtils';

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
  onCreate: (status: 'draft' | 'pending') => void;
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
  onCreate,
  materialUnit,
}: TransferCreateModalProps) {
  const resetItems = () => onItemsChange([{ materialCode: '', qty: '', constructionPhase: '' }]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo phiếu chuyển kho dự án"
      size="full"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-outline" disabled={isPending} onClick={() => onCreate('draft')}>
            Lưu nháp
          </button>
          <button type="button" className="btn btn-filled" disabled={isPending} onClick={() => onCreate('pending')}>
            Chốt phiếu
          </button>
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
            Hoàn trả kho tổng
          </button>
          <button
            type="button"
            className={`btn btn-sm ${transferMode === 'cross-project' ? 'btn-filled' : 'btn-outline'}`}
            onClick={() => onTransferModeChange('cross-project')}
          >
            Chuyển sang kho dự án khác
          </button>
        </div>
        <FormField label="Kho dự án nguồn" required>
          <select
            className="form-select"
            value={projectCode}
            onChange={e => {
              onProjectCodeChange(e.target.value);
              if (e.target.value === toProjectCode) onToProjectCodeChange('');
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
        {transferMode === 'return' ? (
          <FormField label="Đích">
            <input className="form-input bg-[var(--md-surface-variant)]" value="Kho tổng" readOnly disabled />
          </FormField>
        ) : (
          <FormField label="Kho dự án đích" required>
            <select
              className="form-select"
              value={toProjectCode}
              onChange={e => onToProjectCodeChange(e.target.value)}
              disabled={!projectCode}
            >
              <option value="">— Chọn kho dự án đích —</option>
              {targetProjects.map(p => (
                <option key={p.projectCode} value={p.projectCode}>
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
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
              onClick={() => onItemsChange([...items, { materialCode: '', qty: '1', constructionPhase: '' }])}
              disabled={!projectCode}
            >
              <Plus size={12} /> Thêm vật tư
            </button>
          </div>
          {!projectCode ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">Chọn kho dự án trước khi thêm vật tư.</p>
          ) : (
            <div className="overflow-x-auto table-scroll">
              <table className="form-table import-items-table import-items-table--transfer text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell">Vật tư</th>
                    <th className="table-header-cell text-right">SL</th>
                    <th className="table-header-cell text-center">ĐVT</th>
                    <th className="table-header-cell text-right" title="Tồn thực tế − dự kiến xuất/chuyển">Tồn TT</th>
                    <th className="table-header-cell">Công đoạn (tùy chọn)</th>
                    <th className="table-header-cell text-center" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const maxQty = it.materialCode
                      ? availableReturnQty(projectInventory, it.materialCode, items, idx)
                      : undefined;
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
                            materials={stockMaterials}
                            placeholder="— Vật tư —"
                          />
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
                          {it.materialCode ? materialUnit(it.materialCode) : '—'}
                        </td>
                        <td className="table-cell text-right tabular-nums font-semibold">
                          {it.materialCode ? fmtStockQty(maxQty ?? 0) : '—'}
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
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
