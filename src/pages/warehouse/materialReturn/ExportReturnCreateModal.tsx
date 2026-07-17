import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import QtyStepper from '../../../components/ui/QtyStepper';
import { fmtStockQty } from '../../../lib/wms/stockQtyFormat';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import type { ExportReturnableExport } from '../../../types';
import type { ExportReturnFormLine } from './exportReturnFormTypes';
import type { ExportReturnFormFieldErrors } from '../../../lib/wms/exportReturnFormSchema';
import { isProjectFrozen, type FrozenProjectMap } from '../../../lib/wms/stocktakeFreeze';
import ProjectWarehouseSelect from '../../../components/warehouse/ProjectWarehouseSelect';

interface ExportReturnCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  projects: WarehouseProjectApiDto[];
  returnableExports: ExportReturnableExport[];
  exportsLoading: boolean;
  projectCode: string;
  onProjectCodeChange: (code: string) => void;
  sourceExportId: string;
  onSourceExportIdChange: (id: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  lines: ExportReturnFormLine[];
  onLinesChange: (lines: ExportReturnFormLine[]) => void;
  linesLoading: boolean;
  errors?: ExportReturnFormFieldErrors;
  frozenByProjectCode: FrozenProjectMap;
  onCreate: (status: 'draft' | 'pending') => void;
  onSave?: () => void;
  editVoucher?: { code: string } | null;
}

export default function ExportReturnCreateModal({
  isOpen,
  onClose,
  isPending,
  projects,
  returnableExports,
  exportsLoading,
  projectCode,
  onProjectCodeChange,
  sourceExportId,
  onSourceExportIdChange,
  note,
  onNoteChange,
  lines,
  onLinesChange,
  linesLoading,
  errors,
  frozenByProjectCode,
  onCreate,
  onSave,
  editVoucher,
}: ExportReturnCreateModalProps) {
  const selectedExport = returnableExports.find(e => e.id === sourceExportId);
  const isEditing = Boolean(editVoucher);
  const submitBlocked = isProjectFrozen(frozenByProjectCode, projectCode);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editVoucher ? `Sửa phiếu hoàn trả — ${editVoucher.code}` : 'Tạo phiếu hoàn trả vật tư'}
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
                  Chốt hoàn trả dự kiến
                </button>
              </>
            )}
          </div>
        </>
      }
    >
      <div className="space-y-4 modal-form-bordered">
        <FormField label="Kho dự án" required error={errors?.projectCode}>
          <ProjectWarehouseSelect
            projects={projects}
            frozenByProjectCode={frozenByProjectCode}
            value={projectCode}
            ariaLabel="Kho dự án"
            disabled={isEditing}
            onChange={code => {
              onProjectCodeChange(code);
              onSourceExportIdChange('');
              onLinesChange([]);
            }}
          />
        </FormField>

        <FormField label="Phiếu xuất nguồn" required error={errors?.sourceExportId}>
          <select
            className="form-select"
            value={sourceExportId}
            aria-label="Phiếu xuất nguồn"
            disabled={isEditing || !projectCode || exportsLoading}
            onChange={e => onSourceExportIdChange(e.target.value)}
          >
            <option value="">
              {!projectCode
                ? '— Chọn kho dự án trước —'
                : exportsLoading
                  ? 'Đang tải phiếu xuất…'
                  : returnableExports.length === 0
                    ? '— Không có phiếu xuất còn hoàn trả —'
                    : '— Chọn phiếu xuất —'}
            </option>
            {returnableExports.map(exp => (
              <option key={exp.id} value={exp.id}>
                {exp.voucherCode} — {exp.date}
                {exp.soCode ? ` · ${exp.soCode}` : ''}
                {` · còn ${fmtStockQty(exp.totalRemainingQty)}`}
              </option>
            ))}
          </select>
          {selectedExport && (
            <p className="mt-1 text-[11px] text-[var(--md-on-surface-variant)]">
              {selectedExport.returnableLineCount} dòng vật tư còn có thể hoàn trả.
            </p>
          )}
        </FormField>

        <FormField label="Ghi chú">
          <textarea className="form-input" rows={2} value={note} onChange={e => onNoteChange(e.target.value)} />
        </FormField>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">
            Chi tiết vật tư hoàn trả
          </div>
          {errors?.lines && (
            <p className="text-xs text-[var(--md-error)]" role="alert">{errors.lines}</p>
          )}
          {!sourceExportId ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">
              Chọn phiếu xuất nguồn để hiển thị vật tư và nhập số lượng hoàn trả.
            </p>
          ) : linesLoading ? (
            <p className="text-sm text-[var(--md-on-surface-variant)]">Đang tải vật tư…</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-[var(--md-on-surface-variant)]">
              Phiếu xuất đã hoàn trả đủ — không còn vật tư để trả.
            </p>
          ) : (
            <div className="overflow-x-auto table-scroll">
              <table className="form-table import-items-table import-items-table--exportReturn text-xs">
                <colgroup>
                  <col className="export-return-col-code" />
                  <col className="export-return-col-name" />
                  <col className="export-return-col-qty" />
                  <col className="export-return-col-qty" />
                  <col className="export-return-col-qty" />
                  <col className="export-return-col-return" />
                  <col className="export-return-col-unit" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Mã VT</th>
                    <th>Tên vật tư</th>
                    <th className="text-right">Đã xuất</th>
                    <th className="text-right">Đã hoàn trả</th>
                    <th className="text-right">Còn lại</th>
                    <th className="text-right">SL hoàn trả</th>
                    <th className="text-center">ĐVT</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={`${line.sku}-${idx}`}>
                      <td className="font-mono">{line.sku}</td>
                      <td>{line.name}</td>
                      <td className="text-right">
                        <div className="import-cell-placeholder import-cell-placeholder--end tabular-nums">
                          {fmtStockQty(line.exportedQty)}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="import-cell-placeholder import-cell-placeholder--end tabular-nums">
                          {fmtStockQty(line.returnedQty)}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="import-cell-placeholder import-cell-placeholder--end tabular-nums font-semibold">
                          {fmtStockQty(line.remainingQty)}
                        </div>
                      </td>
                      <td className="text-right export-return-qty-cell">
                        <QtyStepper
                          value={line.returnQty}
                          min={0}
                          max={line.remainingQty}
                          ariaLabel={`Số lượng hoàn trả cho ${line.sku}`}
                          onChange={qtyVal => {
                            const next = [...lines];
                            next[idx] = { ...next[idx], returnQty: qtyVal };
                            onLinesChange(next);
                          }}
                        />
                      </td>
                      <td className="text-center text-[var(--md-on-surface-variant)]">
                        <div className="import-cell-placeholder import-cell-placeholder--center">
                          {line.unit || '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
