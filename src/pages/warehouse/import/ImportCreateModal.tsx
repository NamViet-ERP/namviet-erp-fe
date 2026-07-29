import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { formatCurrency } from '../../../utils/formatCurrency';
import { emptyQtyPriceLine } from '../voucher/voucherFormTypes';
import { isProjectFrozen } from '../../../lib/wms/stocktakeFreeze';
import { usePermission } from '../../../hooks/usePermission';
import type { ImportCreateModalProps } from './ImportCreateModal.types';
import {
  defaultPoLineDrafts,
  draftsFromExistingItems,
  poDraftsToItems,
  type PoLineDraft,
} from './importCreatePoDrafts';
import ImportCreateHeaderFields from './ImportCreateHeaderFields';
import ImportCreateExcelImportBar, {
  ImportCreateItemsToolbar,
  ImportParseErrorsList,
} from './ImportCreateExcelImportBar';
import ImportCreatePoItemsTable from './ImportCreatePoItemsTable';
import ImportCreateManualItemsTable from './ImportCreateManualItemsTable';
import ImportCreateEvidenceSection from './ImportCreateEvidenceSection';

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
  editAttachments = [],
  isEvidencePending = false,
  onUploadEditAttachment,
  onDeleteEditAttachment,
  onDownloadEditAttachment,
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
  const editPoSeedKeyRef = useRef('');

  useEffect(() => {
    if (!isOpen) {
      setEvidencePhotos([]);
      setEvidenceDocs([]);
      setEvaluationDraft('');
      setSelectedFileName('');
      editPoSeedKeyRef.current = '';
      return;
    }
    if (editVoucher) setEvaluationDraft(editVoucher.receiptEvaluation ?? '');
  }, [isOpen, editVoucher?.code, editVoucher?.receiptEvaluation]);

  const resetItems = () => onItemsChange([{ ...emptyQtyPriceLine }]);
  const addMaterialLine = () => onItemsChange([...items, { ...emptyQtyPriceLine }]);

  const handleDownloadTemplate = async () => {
    if (!onDownloadTemplate) return;
    setIsDownloadingTemplate(true);
    try { await onDownloadTemplate(); }
    finally { setIsDownloadingTemplate(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFileName(e.target.files?.[0]?.name ?? '');
  };

  const handleImport = async () => {
    if (!onImportFile || !fileInputRef.current?.files?.[0]) return;
    await onImportFile(fileInputRef.current.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedFileName('');
  };

  const importDisabled = !projectCode || isImportParsing || isPending;
  const submitBlocked = isProjectFrozen(frozenByProjectCode, projectCode);
  const isCreateMode = !editVoucher;
  /** Tạo từ PO (luôn) hoặc sửa phiếu đã gắn PO — chọn dòng theo PO, không chọn VT tự do. */
  const isPoBoundEdit = Boolean(editVoucher && selectedPoCode);
  const isPoLineMode = isCreateMode || isPoBoundEdit;
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
    if (!isCreateMode || !selectedPoCode) {
      if (isCreateMode) setPoLineDrafts({});
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
  }, [isCreateMode, selectedPoCode, poPreviewKey]);

  useEffect(() => {
    if (!isPoBoundEdit || !selectedPoCode || poPreviewLines.length === 0) return;
    const key = `${editVoucher!.code}|${poPreviewKey}`;
    if (editPoSeedKeyRef.current === key) return;
    editPoSeedKeyRef.current = key;
    const nextDrafts = draftsFromExistingItems(poPreviewLines, items);
    setPoLineDrafts(nextDrafts);
    onItemsChange(poDraftsToItems(poPreviewLines, nextDrafts));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed một lần khi mở sửa + preview sẵn
  }, [isPoBoundEdit, selectedPoCode, poPreviewKey, editVoucher?.code]);

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
              <button type="button" className="btn btn-filled" disabled={isPending} onClick={() => onSave?.({ evaluation: evaluationDraft })}>
                Lưu thay đổi
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={isPending || submitBlocked}
                  onClick={() => onCreate('draft', { files: [...evidencePhotos, ...evidenceDocs], evaluation: evaluationDraft })}
                >
                  Lưu nháp
                </button>
                <button
                  type="button"
                  className="btn btn-filled"
                  disabled={isPending || submitBlocked}
                  onClick={() => onCreate('pending', { files: [...evidencePhotos, ...evidenceDocs], evaluation: evaluationDraft })}
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
        <ImportCreateHeaderFields
          isCreateMode={isCreateMode}
          isPoBoundEdit={isPoBoundEdit}
          errors={errors}
          poOptions={poOptions}
          selectedPoCode={selectedPoCode}
          onSelectedPoCodeChange={onSelectedPoCodeChange}
          poLoading={poLoading}
          projectLabel={projectLabel}
          selectedPo={selectedPo}
          defaultSupplier={defaultSupplier}
          projects={projects}
          frozenByProjectCode={frozenByProjectCode}
          projectCode={projectCode}
          onProjectCodeChange={onProjectCodeChange}
          onResetItems={resetItems}
          onDefaultSupplierChange={onDefaultSupplierChange}
          suppliers={suppliers}
          referenceCode={referenceCode}
          onReferenceCodeChange={onReferenceCodeChange}
          note={note}
          onNoteChange={onNoteChange}
        />

        <div className="space-y-2">
          <ImportCreateItemsToolbar
            isPoLineMode={isPoLineMode}
            selectedPoCode={selectedPoCode}
            selectedPoLineCount={selectedPoLineCount}
            showExcelBar={Boolean(!isPoLineMode && onDownloadTemplate && onImportFile)}
            projectCode={projectCode}
            onAddMaterialLine={addMaterialLine}
            excelBar={(
              <ImportCreateExcelImportBar
                isDownloadingTemplate={isDownloadingTemplate}
                isPending={isPending}
                importDisabled={importDisabled}
                selectedFileName={selectedFileName}
                isImportParsing={isImportParsing}
                fileInputRef={fileInputRef}
                onDownloadTemplate={() => void handleDownloadTemplate()}
                onFileChange={handleFileChange}
                onImport={() => void handleImport()}
              />
            )}
          />
          {errors?.items && (
            <p className="text-xs text-[var(--md-error)]" role="alert">{errors.items}</p>
          )}
          {importErrors.length > 0 ? <ImportParseErrorsList importErrors={importErrors} /> : null}
          {isPoLineMode && !selectedPoCode ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">Chọn PO để hiển thị danh sách hàng còn lại.</p>
          ) : isPoLineMode ? (
            <ImportCreatePoItemsTable
              canViewPrices={canViewPrices}
              poLoading={poLoading}
              poPreviewLines={poPreviewLines}
              poLineDrafts={poLineDrafts}
              isPending={isPending}
              formGrandTotal={formGrandTotal}
              onSetPoLine={setPoLine}
            />
          ) : !projectCode ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">Chọn kho dự án trước khi thêm vật tư.</p>
          ) : (
            <ImportCreateManualItemsTable
              items={items}
              onItemsChange={onItemsChange}
              materials={materials}
              canViewPrices={canViewPrices}
              formGrandTotal={formGrandTotal}
              errors={errors}
              materialUnit={materialUnit}
              onMaterialLineChange={onMaterialLineChange}
              onDuplicateMaterialAttempt={onDuplicateMaterialAttempt}
            />
          )}
        </div>

        <ImportCreateEvidenceSection
          isCreateMode={isCreateMode}
          evaluationDraft={evaluationDraft}
          onEvaluationChange={setEvaluationDraft}
          evidencePhotos={evidencePhotos}
          evidenceDocs={evidenceDocs}
          onEvidencePhotosChange={setEvidencePhotos}
          onEvidenceDocsChange={setEvidenceDocs}
          evidenceInputRef={evidenceInputRef}
          evidenceDocInputRef={evidenceDocInputRef}
          editVoucherCode={editVoucher?.code}
          editAttachments={editAttachments}
          isEvidencePending={isEvidencePending}
          onUploadEditAttachment={onUploadEditAttachment}
          onDeleteEditAttachment={onDeleteEditAttachment}
          onDownloadEditAttachment={onDownloadEditAttachment}
        />

      </div>
    </Modal>
  );
}
