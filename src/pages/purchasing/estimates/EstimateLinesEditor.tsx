import { Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import FormField from '../../../components/ui/FormField';
import MaterialAutocomplete from '../../../components/ui/MaterialAutocomplete';
import TableShell from '../../../components/ui/TableShell';
import type { MaterialApiDto } from '../../../services/materialsService';
import type { EstimateDraftLine } from './useEstimateDetailController';

interface EstimateLinesEditorProps {
  title: string;
  draftLines: EstimateDraftLine[];
  materials: MaterialApiDto[];
  saving: boolean;
  onTitleChange: (value: string) => void;
  onAddLine: () => void;
  onUpdateLine: (key: string, patch: Partial<EstimateDraftLine>) => void;
  onRemoveLine: (key: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function EstimateLinesEditor({
  title,
  draftLines,
  materials,
  saving,
  onTitleChange,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onCancel,
  onSave,
}: EstimateLinesEditorProps) {
  return (
    <div className="space-y-3 pur-estimate-edit">
      <FormField label="Tiêu đề (tên dự án)">
        <input className="form-input" value={title} onChange={e => onTitleChange(e.target.value)} />
      </FormField>

      <div className="pur-create-plan__section-head">
        <div>
          <h3 className="pur-create-plan__section-title">Dòng vật tư</h3>
          <p className="pur-create-plan__section-hint">
            {draftLines.filter(l => l.materialCode).length} dòng đã chọn
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="tonal" size="sm" leftIcon={Plus} onClick={onAddLine}>
            Thêm vật tư
          </Button>
          <Button type="button" variant="outlined" size="sm" disabled={saving} onClick={onCancel}>
            Hủy
          </Button>
          <Button type="button" variant="filled" size="sm" disabled={saving} onClick={onSave}>
            {saving ? 'Đang lưu…' : 'Lưu chỉnh sửa'}
          </Button>
        </div>
      </div>

      <TableShell
        className="pur-create-plan__table-shell"
        tableClassName="form-table import-items-table wms-inventory-table pur-estimate-edit__table"
        colSpan={4}
        header={(
          <tr>
            <th className="table-header-cell">Vật tư *</th>
            <th className="table-header-cell text-center">SL *</th>
            <th className="table-header-cell text-right">Giá dự toán</th>
            <th className="table-header-cell text-center" aria-label="Xóa" />
          </tr>
        )}
      >
        {draftLines.map((line, index) => (
          <tr key={line.key} className="table-row">
            <td className="table-cell">
              <MaterialAutocomplete
                value={line.materialCode}
                onChange={materialCode => onUpdateLine(line.key, { materialCode })}
                materials={materials}
              />
            </td>
            <td className="table-cell">
              <input
                className="form-input text-center tabular-nums"
                inputMode="decimal"
                value={line.newQty}
                onChange={e => onUpdateLine(line.key, { newQty: e.target.value })}
                aria-label={`Số lượng dòng ${index + 1}`}
              />
            </td>
            <td className="table-cell">
              <CurrencyInput
                value={line.estimateUnitPrice}
                onChange={estimateUnitPrice => onUpdateLine(line.key, { estimateUnitPrice })}
              />
            </td>
            <td className="table-cell text-center">
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                aria-label={`Xóa dòng ${index + 1}`}
                onMouseDown={e => e.preventDefault()}
                onClick={e => {
                  /* blur trước khi unmount — tránh browser kéo scroll theo focus */
                  (e.currentTarget as HTMLButtonElement).blur();
                  const y = window.scrollY;
                  onRemoveLine(line.key);
                  requestAnimationFrame(() => {
                    if (window.scrollY !== y) window.scrollTo(0, y);
                  });
                }}
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}
