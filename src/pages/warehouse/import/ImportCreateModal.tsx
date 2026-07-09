import { useRef, useState } from 'react';
import { Download, Plus, Trash2, Upload } from 'lucide-react';
import type { Material } from '../../../types';
import type { ImportParseErrorApiDto } from '../../../types/api/importParseApi';
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
import { findDuplicateMaterialLineIndex } from '../../../lib/wms/voucherDuplicateMaterial';
import { isProjectFrozen, type FrozenProjectMap } from '../../../lib/wms/stocktakeFreeze';
import ProjectWarehouseSelect from '../../../components/warehouse/ProjectWarehouseSelect';

interface ImportCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  isImportParsing?: boolean;
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
  frozenByProjectCode: FrozenProjectMap;
  importErrors?: ImportParseErrorApiDto[];
  onCreate: (status: 'draft' | 'pending') => void;
  onSave?: () => void;
  onDownloadTemplate?: () => Promise<void>;
  onImportFile?: (file: File) => Promise<void>;
  onMaterialLineChange?: (index: number, materialCode: string) => void;
  onDuplicateMaterialAttempt?: (lineIndex: number) => void;
  editVoucher?: { code: string } | null;
  materialUnit: (code: string) => string;
}

export default function ImportCreateModal({
  isOpen,
  onClose,
  isPending,
  isImportParsing = false,
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
  frozenByProjectCode,
  importErrors = [],
  onCreate,
  onSave,
  onDownloadTemplate,
  onImportFile,
  onMaterialLineChange,
  onDuplicateMaterialAttempt,
  editVoucher,
  materialUnit,
}: ImportCreateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const resetItems = () => onItemsChange([{ ...emptyQtyPriceLine }]);

  const addMaterialLine = () => {
    onItemsChange([...items, { ...emptyQtyPriceLine }]);
  };

  const handleDownloadTemplate = async () => {
    if (!onDownloadTemplate) return;
    setIsDownloadingTemplate(true);
    try {
      await onDownloadTemplate();
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFileName(file?.name ?? '');
  };

  const handleImport = async () => {
    if (!onImportFile || !fileInputRef.current?.files?.[0]) return;
    await onImportFile(fileInputRef.current.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedFileName('');
  };

  const importDisabled = !projectCode || isImportParsing || isPending;
  const submitBlocked = isProjectFrozen(frozenByProjectCode, projectCode);

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
                <button type="button" className="btn btn-outline" disabled={isPending || submitBlocked} onClick={() => onCreate('draft')}>
                  Lưu nháp
                </button>
                <button type="button" className="btn btn-filled" disabled={isPending || submitBlocked} onClick={() => onCreate('pending')}>
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
          <ProjectWarehouseSelect
            projects={projects}
            frozenByProjectCode={frozenByProjectCode}
            value={projectCode}
            onChange={code => {
              onProjectCodeChange(code);
              resetItems();
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

        <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-3 py-2.5 text-xs leading-relaxed text-[var(--md-on-surface-variant)]">
          Import Excel chỉ chấp nhận <strong className="text-[var(--md-on-surface)]">mã vật tư đã có trong danh mục</strong>.
          Hàng có mã chưa tồn tại sẽ báo lỗi từng dòng — vui lòng tạo vật tư trong danh mục trước khi import.
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Chi tiết vật tư</div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {onDownloadTemplate && onImportFile && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm text-xs"
                    disabled={isDownloadingTemplate || isPending}
                    onClick={handleDownloadTemplate}
                  >
                    <Download size={12} />
                    {isDownloadingTemplate ? 'Đang tải…' : 'Tải mẫu import'}
                  </button>
                  <label className={`btn btn-outline btn-sm text-xs ${importDisabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                    <Upload size={12} />
                    Chọn file
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="sr-only"
                      disabled={importDisabled}
                      onChange={handleFileChange}
                    />
                  </label>
                  {selectedFileName && (
                    <span className="text-[11px] text-[var(--md-on-surface-variant)] max-w-[140px] truncate" title={selectedFileName}>
                      {selectedFileName}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-filled btn-sm text-xs"
                    disabled={importDisabled || !selectedFileName}
                    onClick={handleImport}
                  >
                    {isImportParsing ? 'Đang import…' : 'Import mặt hàng'}
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-outline btn-sm text-xs"
                onClick={addMaterialLine}
                disabled={!projectCode}
              >
                <Plus size={12} /> Thêm vật tư
              </button>
            </div>
          </div>
          {errors?.items && (
            <p className="text-xs text-[var(--md-error)]" role="alert">{errors.items}</p>
          )}
          {importErrors.length > 0 && (
            <div className="rounded border border-[var(--md-error)]/30 bg-[var(--md-error-container)]/20 p-2 text-xs text-[var(--md-on-surface)]" role="alert">
              <p className="font-semibold text-[var(--md-error)] mb-1">Một số dòng import không hợp lệ:</p>
              <ul className="space-y-0.5 list-disc pl-4">
                {importErrors.slice(0, 8).map((err, idx) => (
                  <li key={`${err.rowNumber}-${err.field}-${idx}`}>
                    Dòng {err.rowNumber}: {err.message}
                  </li>
                ))}
                {importErrors.length > 8 && (
                  <li>…và {importErrors.length - 8} lỗi khác</li>
                )}
              </ul>
            </div>
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
                            onMaterialLineChange?.(idx, code);
                          }}
                          materials={materials}
                          placeholder="— Vật tư —"
                        />
                        {lineErr?.materialCode && (
                          <p className="mt-0.5 text-[10px] text-[var(--md-error)]">{lineErr.materialCode}</p>
                        )}
                      </td>
                      <td className="table-cell text-right align-top">
                        <QtyStepper
                          value={it.qty}
                          className={lineErr?.qty ? 'qty-stepper--error' : ''}
                          onChange={qtyVal => {
                            const next = [...items];
                            next[idx] = { ...next[idx], qty: qtyVal };
                            onItemsChange(next);
                          }}
                        />
                        {lineErr?.qty && (
                          <p className="mt-0.5 text-[10px] text-[var(--md-error)] text-right">{lineErr.qty}</p>
                        )}
                      </td>
                      <td className="table-cell text-center text-[var(--md-on-surface-variant)]">
                        <div className="import-cell-placeholder import-cell-placeholder--center">
                          {it.materialCode ? materialUnit(it.materialCode) : '—'}
                        </div>
                      </td>
                      <td className="table-cell text-right align-top">
                        <CurrencyInput
                          className={`form-input text-xs text-right input-no-spinner${lineErr?.unitPrice ? ' form-input--error' : ''}`}
                          value={it.unitPrice}
                          onChange={(_raw, numeric) => {
                            const next = [...items];
                            next[idx] = { ...next[idx], unitPrice: numeric > 0 ? String(numeric) : '' };
                            onItemsChange(next);
                          }}
                        />
                        {lineErr?.unitPrice && (
                          <p className="mt-0.5 text-[10px] text-[var(--md-error)] text-right">{lineErr.unitPrice}</p>
                        )}
                      </td>
                      <td className="table-cell text-right tabular-nums font-semibold text-[var(--md-on-surface)]">
                        <div className="import-cell-placeholder import-cell-placeholder--end font-semibold">
                          {total > 0 ? formatCurrency(total) : '—'}
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
