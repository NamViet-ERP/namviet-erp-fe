import type { Dispatch, SetStateAction } from 'react';
import EmptyState from '../../../components/ui/EmptyState';
import QtyStepper from '../../../components/ui/QtyStepper';
import type { StockDefectLinePreviewApiDto } from '../../../types/api/poDefectApi';
import type { LineDraft } from './defectTypes';

interface DefectCreateStockLinesTableProps {
  lines: StockDefectLinePreviewApiDto[];
  drafts: Record<string, LineDraft>;
  setDrafts: Dispatch<SetStateAction<Record<string, LineDraft>>>;
  selectableLines: StockDefectLinePreviewApiDto[];
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
}

export default function DefectCreateStockLinesTable({
  lines,
  drafts,
  setDrafts,
  selectableLines,
  allSelected,
  someSelected,
  onToggleSelectAll,
}: DefectCreateStockLinesTableProps) {
  const selectedCount = lines.filter(l => drafts[l.materialCode]?.selected).length;

  return (
    <div className="space-y-2">
      <p className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
        {selectedCount > 0
          ? `Đã chọn ${selectedCount} dòng · tick/bỏ tick và chỉnh SL trước khi lưu`
          : 'Tick ít nhất một dòng còn tồn để ghi lỗi'}
      </p>
      <div className="overflow-x-auto table-scroll">
        <table className="form-table import-items-table import-items-table--po-select import-items-table--defect-select import-items-table--defect-stock text-xs">
          <thead>
            <tr>
              <th className="table-header-cell text-center w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={selectableLines.length === 0}
                  ref={el => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={e => onToggleSelectAll(e.target.checked)}
                  aria-label="Chọn tất cả mặt hàng"
                />
              </th>
              <th className="table-header-cell text-center">Mặt hàng</th>
              <th className="table-header-cell text-center import-po-col-unit">ĐVT</th>
              <th className="table-header-cell text-center">Tồn kho</th>
              <th className="table-header-cell text-center">Chờ xử lý HL</th>
              <th className="table-header-cell text-center">Còn lại</th>
              <th className="table-header-cell text-center defect-col-qty">SL lỗi</th>
              <th className="table-header-cell text-center defect-col-reason">Lý do dòng</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState message="Kho dự án không còn tồn để ghi lỗi." />
                </td>
              </tr>
            ) : (
              lines.map(line => {
                const draft = drafts[line.materialCode] ?? {
                  selected: false,
                  qty: '0',
                  lineReason: '',
                };
                const disabled = line.available <= 0;
                return (
                  <tr key={line.materialCode} className={disabled ? 'opacity-60' : 'table-row'}>
                    <td className="table-cell text-center">
                      <input
                        type="checkbox"
                        checked={draft.selected && !disabled}
                        disabled={disabled}
                        onChange={e => {
                          const nextSelected = e.target.checked;
                          setDrafts(prev => ({
                            ...prev,
                            [line.materialCode]: {
                              ...draft,
                              selected: nextSelected,
                              qty: nextSelected
                                ? (Number(draft.qty) > 0 ? draft.qty : String(line.available))
                                : draft.qty,
                            },
                          }));
                        }}
                        aria-label={`Chọn ${line.name}`}
                      />
                    </td>
                    <td className="table-cell">
                      <div className="import-line-item__name">{line.name}</div>
                      <div className="import-line-item__code">
                        {line.materialCode?.trim() || '-'}
                      </div>
                    </td>
                    <td className="table-cell text-center import-po-col-unit">
                      {line.unit?.trim() || '-'}
                    </td>
                    <td className="table-cell text-center tabular-nums">{line.onHand}</td>
                    <td className="table-cell text-center tabular-nums">{line.reservedPendingDefect}</td>
                    <td className="table-cell text-center tabular-nums font-semibold">{line.available}</td>
                    <td className="table-cell text-center defect-qty-cell defect-col-qty">
                      {disabled || !draft.selected ? (
                        <div className="import-cell-placeholder import-cell-placeholder--center">
                          -
                        </div>
                      ) : (
                        <div className="import-cell-placeholder import-cell-placeholder--center">
                          <QtyStepper
                            value={draft.qty}
                            max={line.available}
                            className="qty-stepper--compact"
                            onChange={qty =>
                              setDrafts(prev => ({
                                ...prev,
                                [line.materialCode]: { ...draft, qty },
                              }))
                            }
                          />
                        </div>
                      )}
                    </td>
                    <td className="table-cell defect-reason-cell defect-col-reason">
                      {draft.selected ? (
                        <textarea
                          className="form-input form-input-sm defect-line-reason"
                          rows={2}
                          value={draft.lineReason}
                          onChange={e =>
                            setDrafts(prev => ({
                              ...prev,
                              [line.materialCode]: { ...draft, lineReason: e.target.value },
                            }))
                          }
                        />
                      ) : (
                        <div className="import-cell-placeholder import-cell-placeholder--center">
                          -
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
