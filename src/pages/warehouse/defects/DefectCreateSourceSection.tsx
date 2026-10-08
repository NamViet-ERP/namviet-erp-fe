import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import FormField from '../../../components/ui/FormField';
import ProjectWarehouseSelect from '../../../components/warehouse/ProjectWarehouseSelect';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type { LineDraft, SourceType } from './defectTypes';
import DefectCreatePoLinesTable from './DefectCreatePoLinesTable';
import DefectCreateStockLinesTable from './DefectCreateStockLinesTable';

type ProjectWarehouseSelectProps = ComponentProps<typeof ProjectWarehouseSelect>;
type PoLinesTableProps = ComponentProps<typeof DefectCreatePoLinesTable>;
type StockLinesTableProps = ComponentProps<typeof DefectCreateStockLinesTable>;

type PoOption = {
  poCode: string;
  projectCode?: string | null;
  supplierName?: string | null;
};

interface DefectCreateSourceSectionProps {
  sourceType: SourceType;
  onSourceTypeChange: (next: SourceType) => void;
  selectedPoCode: string;
  onSelectedPoCodeChange: (code: string) => void;
  poOptions: PoOption[];
  purchaseOrdersLoading: boolean;
  stockProjectCode: string;
  onStockProjectCodeChange: (code: string) => void;
  projects: ProjectWarehouseSelectProps['projects'];
  frozenByProjectCode: ProjectWarehouseSelectProps['frozenByProjectCode'];
  poProjectCode?: string;
  poSupplierName?: string;
  poPreviewLoading: boolean;
  poPreviewError: unknown;
  poPreviewErrorState: boolean;
  poPreviewLines: PoLinesTableProps['lines'];
  poLineDrafts: Record<number, LineDraft>;
  setPoLineDrafts: Dispatch<SetStateAction<Record<number, LineDraft>>>;
  selectablePoLines: PoLinesTableProps['selectableLines'];
  allPoLinesSelected: boolean;
  somePoLinesSelected: boolean;
  onToggleSelectAllPoLines: (checked: boolean) => void;
  stockPreviewLoading: boolean;
  stockPreviewLines: StockLinesTableProps['lines'];
  stockLineDrafts: Record<string, LineDraft>;
  setStockLineDrafts: Dispatch<SetStateAction<Record<string, LineDraft>>>;
  selectableStockLines: StockLinesTableProps['selectableLines'];
  allStockLinesSelected: boolean;
  someStockLinesSelected: boolean;
  onToggleSelectAllStockLines: (checked: boolean) => void;
}

export default function DefectCreateSourceSection({
  sourceType,
  onSourceTypeChange,
  selectedPoCode,
  onSelectedPoCodeChange,
  poOptions,
  purchaseOrdersLoading,
  stockProjectCode,
  onStockProjectCodeChange,
  projects,
  frozenByProjectCode,
  poProjectCode,
  poSupplierName,
  poPreviewLoading,
  poPreviewError,
  poPreviewErrorState,
  poPreviewLines,
  poLineDrafts,
  setPoLineDrafts,
  selectablePoLines,
  allPoLinesSelected,
  somePoLinesSelected,
  onToggleSelectAllPoLines,
  stockPreviewLoading,
  stockPreviewLines,
  stockLineDrafts,
  setStockLineDrafts,
  selectableStockLines,
  allStockLinesSelected,
  someStockLinesSelected,
  onToggleSelectAllStockLines,
}: DefectCreateSourceSectionProps) {
  return (
    <>
      <div className="defect-create-form__meta">
        <FormField label="Loại nguồn" required>
          <select
            className="form-input"
            value={sourceType}
            onChange={e => onSourceTypeChange(e.target.value as SourceType)}
          >
            <option value="po">Hàng lỗi PO</option>
            <option value="stock">Hàng lỗi nhập kho</option>
          </select>
        </FormField>

        {sourceType === 'po' ? (
          <FormField
            label="Phiếu PO"
            required
            error={
              !purchaseOrdersLoading && poOptions.length === 0
                ? 'Không có PO đã đặt NCC còn SL để ghi lỗi.'
                : undefined
            }
          >
            <select
              className="form-input"
              value={selectedPoCode}
              disabled={purchaseOrdersLoading}
              onChange={e => onSelectedPoCodeChange(e.target.value)}
            >
              <option value="">
                {purchaseOrdersLoading
                  ? 'Đang tải PO còn SL…'
                  : '— Chọn PO còn SL ghi lỗi —'}
              </option>
              {poOptions.map(po => (
                <option key={po.poCode} value={po.poCode}>
                  {po.poCode}
                </option>
              ))}
            </select>
          </FormField>
        ) : (
          <FormField label="Kho dự án" required>
            <ProjectWarehouseSelect
              projects={projects}
              frozenByProjectCode={frozenByProjectCode}
              value={stockProjectCode}
              className="form-input"
              onChange={code => onStockProjectCodeChange(code)}
              placeholder="— Chọn kho dự án —"
            />
          </FormField>
        )}

        {sourceType === 'po' ? (
          <>
            <FormField label="Kho dự án (từ PO)">
              <input
                className="form-input"
                readOnly
                value={poProjectCode || poOptions.find(p => p.poCode === selectedPoCode)?.projectCode || ''}
                placeholder="Chọn PO để tự điền kho dự án"
              />
            </FormField>
            <FormField label="Nhà cung cấp (từ PO)">
              <input
                className="form-input"
                readOnly
                value={poSupplierName || poOptions.find(p => p.poCode === selectedPoCode)?.supplierName || ''}
                placeholder="Chọn PO để tự điền NCC"
              />
            </FormField>
          </>
        ) : null}
      </div>

      {sourceType === 'po' ? (
        !selectedPoCode ? (
          <p className="text-xs text-[var(--md-on-surface-variant)]">Chọn PO để hiện mặt hàng — tick dòng cần ghi lỗi.</p>
        ) : poPreviewLoading ? (
          <p className="text-xs">Đang tải dòng PO…</p>
        ) : poPreviewErrorState ? (
          <p className="text-xs text-[var(--md-error)]">
            {getApiErrorMessage(poPreviewError, 'Không tải được danh sách dòng hàng từ đơn mua (PO). Vui lòng thử lại hoặc liên hệ quản trị viên.')}
          </p>
        ) : (
          <DefectCreatePoLinesTable
            lines={poPreviewLines}
            drafts={poLineDrafts}
            setDrafts={setPoLineDrafts}
            selectableLines={selectablePoLines}
            allSelected={allPoLinesSelected}
            someSelected={somePoLinesSelected}
            onToggleSelectAll={onToggleSelectAllPoLines}
          />
        )
      ) : !stockProjectCode ? (
        <p className="text-xs text-[var(--md-on-surface-variant)]">Chọn kho dự án để hiện mặt hàng — tick dòng cần ghi lỗi.</p>
      ) : stockPreviewLoading ? (
        <p className="text-xs">Đang tải tồn kho…</p>
      ) : (
        <DefectCreateStockLinesTable
          lines={stockPreviewLines}
          drafts={stockLineDrafts}
          setDrafts={setStockLineDrafts}
          selectableLines={selectableStockLines}
          allSelected={allStockLinesSelected}
          someSelected={someStockLinesSelected}
          onToggleSelectAll={onToggleSelectAllStockLines}
        />
      )}
    </>
  );
}
