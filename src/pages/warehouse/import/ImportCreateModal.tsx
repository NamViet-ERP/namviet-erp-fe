import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { emptyQtyPriceLine } from '../voucher/voucherFormTypes';
import { isProjectFrozen } from '../../../lib/wms/stocktakeFreeze';
import { useCanViewWmsPrices } from '../../../lib/wms/priceVisibility';
import type { ImportCreateModalProps } from './ImportCreateModal.types';
import { poDraftsToItems, selectedPoItemsFromDrafts } from './importCreatePoDrafts';
import ImportCreateHeaderFields from './ImportCreateHeaderFields';
import ImportCreateExcelImportBar, {
  ImportCreateItemsToolbar,
  ImportParseErrorsList,
} from './ImportCreateExcelImportBar';
import ImportCreatePoItemsTable from './ImportCreatePoItemsTable';
import ImportCreateManualItemsTable from './ImportCreateManualItemsTable';
import ImportCreateEvidenceSection from './ImportCreateEvidenceSection';
import ImportCreateModalFooter from './ImportCreateModalFooter';
import { useImportPoDrafts } from './useImportPoDrafts';

export default function ImportCreateModal(props: ImportCreateModalProps) {
  const {
    isOpen, onClose, isPending, isImportParsing = false, projects, suppliers, materials,
    projectCode, onProjectCodeChange, defaultSupplier, onDefaultSupplierChange,
    referenceCode, onReferenceCodeChange, note, onNoteChange, items, onItemsChange,
    formGrandTotal, errors, frozenByProjectCode, importErrors = [], onCreate, onSave,
    onDownloadTemplate, onImportFile, onMaterialLineChange, onDuplicateMaterialAttempt,
    editVoucher, materialUnit, poOptions = [], selectedPoCode = '', onSelectedPoCodeChange,
    poLocked = false, title, poLoading = false, poPreviewLines = [], editAttachments = [],
    isEvidencePending = false, onUploadEditAttachment, onDeleteEditAttachment,
    onDownloadEditAttachment, canApprove = false, onApprove, isApproving = false,
    allowWarehouseSourcePicker = false, issueFromGeneralWarehouse = false,
    onIssueFromGeneralWarehouseChange, getQtyCap,
  } = props;
  const canViewPrices = useCanViewWmsPrices();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const evidenceDocInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);
  const [evidenceDocs, setEvidenceDocs] = useState<File[]>([]);
  const [evaluationDraft, setEvaluationDraft] = useState('');
  const [showEvidenceErrors, setShowEvidenceErrors] = useState(false);

  const editVoucherCode = editVoucher?.code;
  const editReceiptEvaluation = editVoucher?.receiptEvaluation;

  useEffect(() => {
    if (!isOpen) {
      setEvidencePhotos([]);
      setEvidenceDocs([]);
      setEvaluationDraft('');
      setShowEvidenceErrors(false);
      setSelectedFileName('');
      return;
    }
    if (editVoucherCode !== undefined) {
      setEvaluationDraft(editReceiptEvaluation ?? '');
    }
    setShowEvidenceErrors(false);
  }, [isOpen, editVoucherCode, editReceiptEvaluation]);

  const isCreateMode = !editVoucher;
  const isPoBoundEdit = Boolean(editVoucher && selectedPoCode);
  const isPoLineMode = isCreateMode || isPoBoundEdit;
  const selectedPo = poOptions.find(po => po.code === selectedPoCode);

  const {
    poLineDrafts,
    selectedPoLineCount,
    poDraftGrandTotal,
    setPoLine,
    toggleSelectAllPoLines,
  } = useImportPoDrafts({
    isOpen,
    isCreateMode,
    isPoBoundEdit,
    selectedPoCode,
    issueFromGeneralWarehouse,
    poPreviewLines,
    items,
    editVoucherCode,
    onItemsChange,
    getQtyCap,
  });

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
  const markEvidenceRequired = Boolean(canApprove && editVoucher?.status === 'pending');
  const hasEvidencePhoto = isCreateMode
    ? evidencePhotos.length > 0
    : editAttachments.some(a => a.kind === 'photo');
  const hasEvidenceDocument = isCreateMode
    ? evidenceDocs.length > 0
    : editAttachments.some(a => a.kind === 'document');
  const evidenceErrors = showEvidenceErrors
    ? {
        evaluation: !evaluationDraft.trim() ? 'Vui lòng nhập đánh giá nhận hàng' : undefined,
        photo: !hasEvidencePhoto ? 'Vui lòng chọn ít nhất 1 ảnh nhận hàng' : undefined,
        document: !hasEvidenceDocument ? 'Vui lòng chọn ít nhất 1 file chứng từ' : undefined,
      }
    : undefined;

  const tryApproveFromEdit = () => {
    if (!evaluationDraft.trim() || !hasEvidencePhoto || !hasEvidenceDocument) {
      setShowEvidenceErrors(true);
      return;
    }
    onApprove?.({ evaluation: evaluationDraft });
  };

  const projectLabel = useMemo(() => {
    const code = selectedPo?.projectCode || projectCode;
    if (!code) return '';
    const name = projects.find(p => p.projectCode === code)?.projectName;
    return name ? `${code} - ${name}` : code;
  }, [selectedPo?.projectCode, projectCode, projects]);

  const displayGrandTotal = isPoLineMode ? poDraftGrandTotal : formGrandTotal;

  const submitCreate = (status: 'draft' | 'pending') => {
    onItemsChange(poDraftsToItems(poPreviewLines, poLineDrafts));
    onCreate(status, {
      files: [...evidencePhotos, ...evidenceDocs],
      evaluation: evaluationDraft,
      poItems: selectedPoItemsFromDrafts(poPreviewLines, poLineDrafts, getQtyCap),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editVoucher ? `Sửa phiếu - ${editVoucher.code}` : (title ?? 'Tạo phiếu nhập kho dự án')}
      size="wide"
      className="md-dialog--import-create"
      footer={
        <ImportCreateModalFooter
          onClose={onClose}
          canViewPrices={canViewPrices}
          issueFromGeneralWarehouse={issueFromGeneralWarehouse}
          displayGrandTotal={displayGrandTotal}
          selectedPoLineCount={selectedPoLineCount}
          isEditMode={Boolean(editVoucher)}
          isPendingVoucher={editVoucher?.status === 'pending'}
          canApprove={canApprove}
          isPending={isPending}
          isApproving={isApproving}
          submitBlocked={submitBlocked}
          onSave={() => onSave?.({ evaluation: evaluationDraft })}
          onTryApproveFromEdit={tryApproveFromEdit}
          onSubmitCreate={submitCreate}
        />
      }
    >
      <div className="space-y-4 modal-form-bordered import-create-form">
        <ImportCreateHeaderFields
          isCreateMode={isCreateMode}
          isPoBoundEdit={isPoBoundEdit}
          poLocked={poLocked}
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
          allowWarehouseSourcePicker={allowWarehouseSourcePicker}
          issueFromGeneralWarehouse={issueFromGeneralWarehouse}
          onIssueFromGeneralWarehouseChange={onIssueFromGeneralWarehouseChange}
        />

        <div className="space-y-2">
          <ImportCreateItemsToolbar
            isPoLineMode={isPoLineMode}
            selectedPoCode={selectedPoCode}
            selectedPoLineCount={selectedPoLineCount}
            issueFromGeneralWarehouse={issueFromGeneralWarehouse}
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
          {errors?.items && <p className="text-xs text-[var(--md-error)]" role="alert">{errors.items}</p>}
          {importErrors.length > 0 ? <ImportParseErrorsList importErrors={importErrors} /> : null}
          {isPoLineMode && !selectedPoCode ? (
            <p className="text-xs text-[var(--md-on-surface-variant)]">Chọn PO để hiển thị danh sách hàng còn lại.</p>
          ) : isPoLineMode ? (
            <ImportCreatePoItemsTable
              canViewPrices={canViewPrices}
              poLoading={poLoading}
              poPreviewLines={poPreviewLines}
              poLineDrafts={poLineDrafts}
              isPending={isPending}
              formGrandTotal={displayGrandTotal}
              onSetPoLine={setPoLine}
              onToggleSelectAll={toggleSelectAllPoLines}
              qtyColumnLabel={canApprove && editVoucher?.status === 'pending' ? 'SL thực nhận' : 'SL dự kiến'}
              getQtyCap={getQtyCap}
            />
          ) : !projectCode ? (
            <p className="text-xs text-[var(--md-on-surface-variant)]">Chọn kho dự án trước khi thêm vật tư.</p>
          ) : (
            <ImportCreateManualItemsTable
              items={items}
              onItemsChange={onItemsChange}
              materials={materials}
              canViewPrices={canViewPrices}
              formGrandTotal={formGrandTotal}
              errors={errors}
              materialUnit={materialUnit}
              qtyColumnLabel={canApprove && editVoucher?.status === 'pending' ? 'SL thực nhận' : 'SL'}
              onMaterialLineChange={onMaterialLineChange}
              onDuplicateMaterialAttempt={onDuplicateMaterialAttempt}
            />
          )}
          {canApprove && editVoucher?.status === 'pending' ? (
            <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty rounded-md border border-dashed border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-2.5 py-2">
              Chỉnh <strong>SL thực nhận</strong> nếu khác dự kiến (tối đa phần còn lại trên PO).
              Phần thiếu nhập lần sau; hàng lỗi/thiếu nghiêm trọng → <strong>Hàng lỗi và Bảo hành</strong>.
            </p>
          ) : null}
        </div>

        <ImportCreateEvidenceSection
          isCreateMode={isCreateMode}
          markRequired={markEvidenceRequired}
          evidenceErrors={evidenceErrors}
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
