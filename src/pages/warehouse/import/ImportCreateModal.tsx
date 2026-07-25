import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Plus, Trash2, Upload } from 'lucide-react';
import type { Material } from '../../../types';
import type { ImportParseErrorApiDto } from '../../../types/api/importParseApi';
import type { PoImportLinePreviewApiDto } from '../../../types/api/poImportApi';
import type { SupplierApiDto } from '../../../services/suppliersService';
import type { PurchaseOrderApiDto } from '../../../types/api/purchasingApi';
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
import {
  PendingDocList,
  PendingPhotoGrid,
} from '../../../components/warehouse/PendingLocalEvidence';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { usePermission } from '../../../hooks/usePermission';

type PoLineDraft = {
  selected: boolean;
  qty: string;
};

function defaultPoLineDrafts(lines: PoImportLinePreviewApiDto[]): Record<number, PoLineDraft> {
  const next: Record<number, PoLineDraft> = {};
  for (const line of lines) {
    const available = Number(line.available) || 0;
    next[line.poItemId] = {
      selected: available > 0,
      qty: available > 0 ? String(available) : '0',
    };
  }
  return next;
}

function poDraftsToItems(
  lines: PoImportLinePreviewApiDto[],
  drafts: Record<number, PoLineDraft>,
): MaterialQtyPriceLine[] {
  return lines
    .filter(line => {
      const draft = drafts[line.poItemId];
      return draft?.selected && Number(draft.qty) > 0;
    })
    .map(line => {
      const draft = drafts[line.poItemId]!;
      return {
        materialCode: line.materialCode ?? '',
        materialName: line.name ?? '',
        unit: line.unit ?? '',
        qty: draft.qty,
        unitPrice: String(line.unitPrice),
        notes: `poItem:${line.poItemId}`,
      };
    });
}

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
  onCreate: (status: 'draft' | 'pending', evidence?: { files: File[]; evaluation: string }) => void;
  onSave?: () => void;
  onDownloadTemplate?: () => Promise<void>;
  onImportFile?: (file: File) => Promise<void>;
  onMaterialLineChange?: (index: number, materialCode: string) => void;
  onDuplicateMaterialAttempt?: (lineIndex: number) => void;
  editVoucher?: { code: string } | null;
  materialUnit: (code: string) => string;
  poOptions?: PurchaseOrderApiDto[];
  selectedPoCode?: string;
  onSelectedPoCodeChange?: (code: string) => void;
  poLoading?: boolean;
  poPreviewLines?: PoImportLinePreviewApiDto[];
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
  poOptions = [],
  selectedPoCode = '',
  onSelectedPoCodeChange,
  poLoading = false,
  poPreviewLines = [],
}: ImportCreateModalProps) {
  const { has } = usePermission();
  const canViewPrices = has('wms.prices.view');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const evidenceDocInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [poLineDrafts, setPoLineDrafts] = useState<Record<number, PoLineDraft>>({});
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);
  const [evidenceDocs, setEvidenceDocs] = useState<File[]>([]);
  const [evaluationDraft, setEvaluationDraft] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEvidencePhotos([]);
      setEvidenceDocs([]);
      setEvaluationDraft('');
      setSelectedFileName('');
    }
  }, [isOpen]);

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
  const isCreateFromPoMode = !editVoucher;
  const selectedPo = poOptions.find(po => po.code === selectedPoCode);
  const projectLabel = useMemo(() => {
    const code = selectedPo?.projectCode || projectCode;
    if (!code) return '';
    const name = projects.find(p => p.projectCode === code)?.projectName;
    return name ? `${code} — ${name}` : code;
  }, [selectedPo?.projectCode, projectCode, projects]);
  const selectedPoLineCount = useMemo(
    () => Object.values(poLineDrafts).filter(d => d.selected).length,
    [poLineDrafts],
  );

  // Chỉ khởi tạo lại khi đổi PO / dữ liệu preview — không phụ thuộc onItemsChange
  // (callback inline của parent sẽ re-create mỗi render → reset tick).
  const poPreviewKey = useMemo(
    () => `${selectedPoCode}|${poPreviewLines.map(l => `${l.poItemId}:${l.available}`).join(',')}`,
    [selectedPoCode, poPreviewLines],
  );

  useEffect(() => {
    if (!isCreateFromPoMode || !selectedPoCode) {
      setPoLineDrafts({});
      return;
    }
    if (poPreviewLines.length === 0) {
      setPoLineDrafts({});
      onItemsChange([]);
      return;
    }
    const nextDrafts = defaultPoLineDrafts(poPreviewLines);
    setPoLineDrafts(nextDrafts);
    onItemsChange(poDraftsToItems(poPreviewLines, nextDrafts));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ reset khi đổi PO/preview
  }, [isCreateFromPoMode, selectedPoCode, poPreviewKey]);

  const setPoLine = (poItemId: number, patch: Partial<PoLineDraft>) => {
    setPoLineDrafts(prev => {
      const next = {
        ...prev,
        [poItemId]: { ...(prev[poItemId] ?? { selected: false, qty: '0' }), ...patch },
      };
      onItemsChange(poDraftsToItems(poPreviewLines, next));
      return next;
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editVoucher ? `Sửa phiếu nhập — ${editVoucher.code}` : 'Tạo phiếu nhập kho dự án'}
      size="full"
      footer={
        <div className="flex w-full items-center justify-between gap-4 flex-wrap">
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <div className="flex items-center gap-3 flex-wrap md-dialog__footer-actions">
            <div className="text-sm mr-1">
              <span className="text-[var(--md-on-surface-variant)]">Tổng giá trị: </span>
              <span className="font-bold text-[var(--md-primary)] tabular-nums">{formatCurrency(formGrandTotal)} đ</span>
            </div>
            {editVoucher ? (
              <button type="button" className="btn btn-filled" disabled={isPending} onClick={onSave}>
                Lưu thay đổi
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={isPending || submitBlocked}
                  onClick={() => onCreate('draft', {
                    files: [...evidencePhotos, ...evidenceDocs],
                    evaluation: evaluationDraft,
                  })}
                >
                  Lưu nháp
                </button>
                <button
                  type="button"
                  className="btn btn-filled"
                  disabled={isPending || submitBlocked}
                  onClick={() => onCreate('pending', {
                    files: [...evidencePhotos, ...evidenceDocs],
                    evaluation: evaluationDraft,
                  })}
                >
                  Chốt dự kiến
                </button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 modal-form-bordered import-create-form">
        {isCreateFromPoMode ? (
          <>
            <FormField label="Phiếu PO" required error={errors?.referenceCode}>
              <select
                className="form-input"
                value={selectedPoCode}
                disabled={poLoading}
                onChange={e => onSelectedPoCodeChange?.(e.target.value)}
              >
                <option value="">
                  {poLoading ? 'Đang tải PO…' : '— Chọn PO đã đặt NCC —'}
                </option>
                {poOptions.map(po => (
                  <option key={po.code} value={po.code}>
                    {po.code} · {po.supplierName || 'NCC'} · {po.planCode} · {po.projectCode}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Kho dự án (từ PO)" required error={errors?.projectCode}>
                <input
                  className="form-input"
                  value={projectLabel}
                  readOnly
                  placeholder="Chọn PO để tự điền kho dự án"
                />
              </FormField>
              <FormField label="Nhà cung cấp (từ PO)">
                <input
                  className="form-input"
                  value={selectedPo?.supplierName || defaultSupplier || ''}
                  readOnly
                  placeholder="Chọn PO để tự điền NCC"
                />
              </FormField>
            </div>
          </>
        ) : (
          <>
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
              </FormField>
              <FormField label="Mã tham chiếu / PO" required error={errors?.referenceCode}>
                <input className="form-input" value={referenceCode} onChange={e => onReferenceCodeChange(e.target.value)} />
              </FormField>
            </div>
          </>
        )}
        <FormField label="Ghi chú">
          <textarea className="form-input" rows={2} value={note} onChange={e => onNoteChange(e.target.value)} />
        </FormField>

        <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-3 py-2.5 text-xs leading-relaxed text-[var(--md-on-surface-variant)]">
          {isCreateFromPoMode ? (
            <>
              Chọn PO trước — kho dự án và NCC lấy từ PO.
              Tick mặt hàng còn SL và nhập <strong className="text-[var(--md-on-surface)]">SL dự kiến nhập kho</strong>.
              Phiếu nháp không khóa PO; chốt dự kiến mới giữ SL trên PO.
            </>
          ) : (
            <>
              Import Excel chỉ chấp nhận <strong className="text-[var(--md-on-surface)]">mã vật tư đã có trong danh mục</strong>.
              Hàng có mã chưa tồn tại sẽ báo lỗi từng dòng — tạo vật tư trước khi import.
            </>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">
                {isCreateFromPoMode ? 'Chọn vật tư dự kiến nhập' : 'Chi tiết vật tư'}
              </div>
              {isCreateFromPoMode && selectedPoCode ? (
                <p className="mt-0.5 text-[11px] text-[var(--md-on-surface-variant)]">
                  {selectedPoLineCount > 0
                    ? `Đã chọn ${selectedPoLineCount} dòng · tick/bỏ tick và chỉnh SL trước khi lưu`
                    : 'Tick ít nhất một dòng còn SL trên PO'}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!isCreateFromPoMode && onDownloadTemplate && onImportFile ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm text-xs"
                    disabled={isDownloadingTemplate || isPending}
                    onClick={() => void handleDownloadTemplate()}
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
                  {selectedFileName ? (
                    <span className="text-[11px] text-[var(--md-on-surface-variant)] max-w-[140px] truncate" title={selectedFileName}>
                      {selectedFileName}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-filled btn-sm text-xs"
                    disabled={importDisabled || !selectedFileName}
                    onClick={() => void handleImport()}
                  >
                    {isImportParsing ? 'Đang import…' : 'Import mặt hàng'}
                  </button>
                </>
              ) : null}
              {!isCreateFromPoMode ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm text-xs"
                  onClick={addMaterialLine}
                  disabled={!projectCode}
                >
                  <Plus size={12} /> Thêm vật tư
                </button>
              ) : null}
            </div>
          </div>
          {errors?.items && (
            <p className="text-xs text-[var(--md-error)]" role="alert">{errors.items}</p>
          )}
          {importErrors.length > 0 ? (
            <ul className="rounded-lg border border-[var(--md-error)]/30 bg-[color-mix(in_srgb,var(--md-error)_6%,transparent)] px-3 py-2 text-[11px] text-[var(--md-error)] space-y-0.5 max-h-28 overflow-y-auto">
              {importErrors.slice(0, 20).map((err, i) => (
                <li key={`${err.rowNumber}-${err.field}-${i}`}>
                  Dòng {err.rowNumber} · {err.field}: {err.message}
                </li>
              ))}
              {importErrors.length > 20 ? <li>…và {importErrors.length - 20} lỗi khác</li> : null}
            </ul>
          ) : null}
          {isCreateFromPoMode && !selectedPoCode ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">Chọn PO để hiển thị danh sách hàng còn lại.</p>
          ) : isCreateFromPoMode ? (
            <div className="overflow-x-auto table-scroll">
              <table className="form-table import-items-table import-items-table--po-select text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell w-10 text-center" />
                    <th className="table-header-cell text-center">Mặt hàng</th>
                    <th className="table-header-cell text-center">Đặt</th>
                    <th className="table-header-cell text-center">Đã nhận</th>
                    <th className="table-header-cell text-center">Chờ NK</th>
                    <th className="table-header-cell text-center">Còn lại</th>
                    {canViewPrices && <th className="table-header-cell text-center">Đơn giá</th>}
                    <th className="table-header-cell text-center">SL dự kiến</th>
                    {canViewPrices && <th className="table-header-cell text-center">Thành tiền</th>}
                  </tr>
                </thead>
                <tbody>
                  {poLoading ? (
                    <TableSkeletonRows rows={4} colSpan={canViewPrices ? 9 : 7} />
                  ) : poPreviewLines.length === 0 ? (
                    <tr>
                      <td colSpan={canViewPrices ? 9 : 7}>
                        <EmptyState message="PO không còn dòng hàng để nhập." />
                      </td>
                    </tr>
                  ) : (
                    poPreviewLines.map(line => {
                      const draft = poLineDrafts[line.poItemId] ?? { selected: false, qty: '0' };
                      const disabled = line.available <= 0;
                      const qty = Number(draft.qty) || 0;
                      const lineTotal = draft.selected && qty > 0 ? qty * line.unitPrice : 0;
                      return (
                        <tr key={line.poItemId} className={disabled ? 'opacity-60' : 'table-row'}>
                          <td className="table-cell text-center">
                            <input
                              type="checkbox"
                              checked={draft.selected && !disabled}
                              disabled={disabled || isPending}
                              onChange={e => setPoLine(line.poItemId, { selected: e.target.checked })}
                              aria-label={`Chọn ${line.name}`}
                            />
                          </td>
                          <td className="table-cell">
                            <div className="font-medium text-[var(--md-on-surface)] leading-snug">{line.name}</div>
                            <div className="mt-0.5 text-[10px] text-[var(--md-on-surface-variant)] leading-snug">
                              {[line.materialCode, line.unit].filter(Boolean).join(' · ') || '—'}
                            </div>
                          </td>
                          <td className="table-cell text-center tabular-nums">{line.ordered}</td>
                          <td className="table-cell text-center tabular-nums">{line.received}</td>
                          <td className="table-cell text-center tabular-nums">{line.reservedPending}</td>
                          <td className="table-cell text-center tabular-nums font-semibold">{line.available}</td>
                          {canViewPrices && (
                            <td className="table-cell text-center tabular-nums">{formatCurrency(line.unitPrice)}</td>
                          )}
                          <td className="table-cell text-center">
                            {disabled || !draft.selected ? (
                              <div className="import-cell-placeholder import-cell-placeholder--center text-[var(--md-on-surface-variant)]">
                                —
                              </div>
                            ) : (
                              <div className="import-cell-placeholder import-cell-placeholder--center">
                                <QtyStepper
                                  value={draft.qty}
                                  max={line.available}
                                  className="qty-stepper--compact"
                                  onChange={qtyVal => setPoLine(line.poItemId, { qty: qtyVal })}
                                />
                              </div>
                            )}
                          </td>
                          {canViewPrices && (
                            <td className="table-cell text-center tabular-nums font-semibold text-[var(--md-on-surface)]">
                              {lineTotal > 0 ? formatCurrency(lineTotal) : '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {canViewPrices && (
                  <tfoot>
                    <tr className="border-t border-[var(--md-outline-variant)]">
                      <td colSpan={8} className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2">
                        Tổng cộng (đã chọn)
                      </td>
                      <td className="table-cell text-center font-bold tabular-nums text-[var(--md-primary)] py-2">
                        {formatCurrency(formGrandTotal)} đ
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : !projectCode ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">Chọn kho dự án trước khi thêm vật tư.</p>
          ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="form-table import-items-table import-items-table--import text-xs">
              <thead>
                <tr>
                  <th className="table-header-cell">Vật tư</th>
                  <th className="table-header-cell text-right">SL</th>
                  <th className="table-header-cell text-center">ĐVT</th>
                  {canViewPrices && <th className="table-header-cell text-right">Đơn giá</th>}
                  {canViewPrices && <th className="table-header-cell text-right">Thành tiền</th>}
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
                        {isCreateFromPoMode ? (
                          <div className="min-w-[10rem] py-1">
                            <div className="text-xs font-medium text-[var(--md-on-surface)] leading-snug">
                              {it.materialName?.trim() || it.materialCode || '—'}
                            </div>
                            {it.materialName?.trim() && it.materialCode?.trim() ? (
                              <div className="mt-0.5 text-[10px] text-[var(--md-on-surface-variant)] truncate" title={it.materialCode}>
                                {it.materialCode}
                              </div>
                            ) : null}
                          </div>
                        ) : (
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
                        )}
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
                          {it.unit?.trim()
                            || (it.materialCode ? materialUnit(it.materialCode) : '—')}
                        </div>
                      </td>
                      {canViewPrices && (
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
                      )}
                      {canViewPrices && (
                        <td className="table-cell text-right tabular-nums font-semibold text-[var(--md-on-surface)]">
                          <div className="import-cell-placeholder import-cell-placeholder--end font-semibold">
                            {total > 0 ? formatCurrency(total) : '—'}
                          </div>
                        </td>
                      )}
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
              {canViewPrices && (
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
              )}
            </table>
          </div>
          )}
        </div>

        {isCreateFromPoMode ? (
          <div className="space-y-3">
            <FormField label="Đánh giá nhận hàng">
              <textarea
                className="form-input pending-evidence-note"
                rows={3}
                value={evaluationDraft}
                onChange={e => setEvaluationDraft(e.target.value)}
                placeholder="Mô tả tình trạng hàng khi nhận…"
              />
            </FormField>
            <p className="text-[11px] text-[var(--md-on-surface-variant)] -mt-1">
              Có thể đính kèm ngay khi tạo. Duyệt thực tế bắt buộc có đánh giá + ảnh + file chứng từ.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pending-evidence">
                <div className="pending-evidence__title">Ảnh nhận hàng</div>
                <button
                  type="button"
                  className="pending-evidence__zone"
                  onClick={() => evidenceInputRef.current?.click()}
                >
                  <Upload size={20} aria-hidden />
                  <span className="pending-evidence__zone-hint">Chọn ảnh (có thể chọn nhiều)</span>
                </button>
                <input
                  ref={evidenceInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="pending-evidence__input"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length) setEvidencePhotos(prev => [...prev, ...files]);
                    e.target.value = '';
                  }}
                />
                <PendingPhotoGrid
                  files={evidencePhotos}
                  onRemove={idx => setEvidencePhotos(prev => prev.filter((_, i) => i !== idx))}
                />
              </div>
              <div className="pending-evidence">
                <div className="pending-evidence__title">File chứng từ</div>
                <button
                  type="button"
                  className="pending-evidence__zone"
                  onClick={() => evidenceDocInputRef.current?.click()}
                >
                  <FileText size={20} aria-hidden />
                  <span className="pending-evidence__zone-hint">Chọn file PDF / Word / Excel</span>
                </button>
                <input
                  ref={evidenceDocInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                  multiple
                  className="pending-evidence__input"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length) setEvidenceDocs(prev => [...prev, ...files]);
                    e.target.value = '';
                  }}
                />
                <PendingDocList
                  files={evidenceDocs}
                  onRemove={idx => setEvidenceDocs(prev => prev.filter((_, i) => i !== idx))}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
