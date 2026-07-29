import type { Dispatch, SetStateAction } from 'react';
import EmptyState from '../../../components/ui/EmptyState';
import QtyStepper from '../../../components/ui/QtyStepper';
import type { PoDefectLinePreviewApiDto } from '../../../types/api/poDefectApi';
import type { LineDraft } from './defectTypes';

interface DefectCreatePoLinesTableProps {
  lines: PoDefectLinePreviewApiDto[];
  drafts: Record<number, LineDraft>;
  setDrafts: Dispatch<SetStateAction<Record<number, LineDraft>>>;
  selectableLines: PoDefectLinePreviewApiDto[];
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
}

export default function DefectCreatePoLinesTable({
  lines,
  drafts,
  setDrafts,
  selectableLines,
  allSelected,
  someSelected,
  onToggleSelectAll,
}: DefectCreatePoLinesTableProps) {
  return (
    <div className="overflow-x-auto table-scroll">
      <table className="form-table import-items-table import-items-table--po-select import-items-table--defect-select text-xs">
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
            <th className="table-header-cell text-center">Đặt</th>
            <th className="table-header-cell text-center">Đã nhận</th>
            <th className="table-header-cell text-center">Đã lỗi</th>
            <th className="table-header-cell text-center">Chờ NK</th>
            <th className="table-header-cell text-center">Còn lại</th>
            <th className="table-header-cell text-center">SL lỗi</th>
            <th className="table-header-cell text-center">Lý do dòng</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={9}>
                <EmptyState message="PO không còn SL để ghi lỗi (đã trừ đã nhận / chờ NK / HL chờ duyệt)." />
              </td>
            </tr>
          ) : (
            lines.map(line => {
              const draft = drafts[line.poItemId] ?? {
                selected: false,
                qty: '0',
                lineReason: '',
              };
              return (
                <tr key={line.poItemId} className="table-row">
                  <td className="table-cell text-center">
                    <input
                      type="checkbox"
                      checked={draft.selected}
                      disabled={line.available <= 0}
                      onChange={e => {
                        const nextSelected = e.target.checked;
                        setDrafts(prev => ({
                          ...prev,
                          [line.poItemId]: {
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
                    <div className="font-medium">{line.name}</div>
                    <div className="text-[10px] text-[var(--md-on-surface-variant)]">
                      {[line.materialCode, line.unit].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </td>
                  <td className="table-cell text-center tabular-nums">{line.ordered}</td>
                  <td className="table-cell text-center tabular-nums">{line.received}</td>
                  <td className="table-cell text-center tabular-nums">{line.defected}</td>
                  <td className="table-cell text-center tabular-nums">{line.reservedPendingNk}</td>
                  <td className="table-cell text-center tabular-nums font-semibold">{line.available}</td>
                  <td className="table-cell text-center defect-qty-cell">
                    {draft.selected ? (
                      <QtyStepper
                        value={draft.qty}
                        max={line.available}
                        onChange={qty =>
                          setDrafts(prev => ({
                            ...prev,
                            [line.poItemId]: { ...draft, qty },
                          }))
                        }
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="table-cell defect-reason-cell">
                    {draft.selected ? (
                      <textarea
                        className="form-input form-input-sm defect-line-reason"
                        rows={2}
                        value={draft.lineReason}
                        onChange={e =>
                          setDrafts(prev => ({
                            ...prev,
                            [line.poItemId]: { ...draft, lineReason: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      <span className="text-[var(--md-on-surface-variant)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
