import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { formatCurrency } from '../../../utils/formatCurrency';
import { emptyQtyPriceLine } from '../voucher/voucherFormTypes';
import { isProjectFrozen } from '../../../lib/wms/stocktakeFreeze';
import { useCanViewWmsPrices } from '../../../lib/wms/priceVisibility';
import type { ImportCreateModalProps } from './ImportCreateModal.types';
import {
  defaultPoLineDrafts,
  draftsFromExistingItems,
  poDraftsToItems,
  selectedPoItemsFromDrafts,
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
  poLocked = false,
  title,
  poLoading = false,
  poPreviewLines = [],
  editAttachments = [],
  isEvidencePending = false,
  onUploadEditAttachment,
  onDeleteEditAttachment,
  onDownloadEditAttachment,
  canApprove = false,
  onApprove,
  isApproving = false,
  allowWarehouseSourcePicker = false,
  issueFromGeneralWarehouse = false,
  onIssueFromGeneralWarehouseChange,
  getQtyCap,
}: ImportCreateModalProps) {
  const canViewPrices = useCanViewWmsPrices();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const evidenceDocInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [poLineDrafts, setPoLineDrafts] = useState<Record<number, PoLineDraft>>({});
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);
  const [evidenceDocs, setEvidenceDocs] = useState<File[]>([]);
  const [evaluationDraft, setEvaluationDraft] = useState('');
  const [showEvidenceErrors, setShowEvidenceErrors] = useState(false);
  const editPoSeedKeyRef = useRef('');
  const [modalSeedKey, setModalSeedKey] = useState('');

  // Reset / seed khi mở-đóng modal (điều chỉnh state trong render, tránh setState trong effect).
  const nextSeedKey = isOpen
    ? `open:${editVoucher?.code ?? 'new'}:${editVoucher?.receiptEvaluation ?? ''}`
    : 'closed';
  if (modalSeedKey !== nextSeedKey) {
    setModalSeedKey(nextSeedKey);
    if (!isOpen) {
      setEvidencePhotos([]);
      setEvidenceDocs([]);
      setEvaluationDraft('');
      setShowEvidenceErrors(false);
      setSelectedFileName('');
    } else {
      if (editVoucher) setEvaluationDraft(editVoucher.receiptEvaluation ?? '');
      setShowEvidenceErrors(false);
    }
  }

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
  const markEvidenceRequired = Boolean(
    canApprove && editVoucher?.status === 'pending',
  );
  const hasEvidencePhoto = isCreateMode
    ? evidencePhotos.length > 0
    : editAttachments.some(a => a.kind === 'photo');
  const hasEvidenceDocument = isCreateMode
    ? evidenceDocs.length > 0
    : editAttachments.some(a => a.kind === 'document');
  const evidenceErrors = showEvidenceErrors
    ? {
        evaluation: !evaluationDraft.trim()
          ? 'Vui lòng nhập đánh giá nhận hàng'
          : undefined,
        photo: !hasEvidencePhoto
          ? 'Vui lòng chọn ít nhất 1 ảnh nhận hàng'
          : undefined,
        document: !hasEvidenceDocument
          ? 'Vui lòng chọn ít nhất 1 file chứng từ'
          : undefined,
      }
    : undefined;

  const tryApproveFromEdit = () => {
    const evalOk = evaluationDraft.trim().length > 0;
    if (!evalOk || !hasEvidencePhoto || !hasEvidenceDocument) {
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
  const selectedPoLineCount = useMemo(
    () => Object.values(poLineDrafts).filter(d => d.selected).length,
    [poLineDrafts],
  );
  const poDraftGrandTotal = useMemo(
    () => poPreviewLines.reduce((sum, line) => {
      const draft = poLineDrafts[line.poItemId];
      if (!draft?.selected) return sum;
      const qty = Number(draft.qty) || 0;
      if (qty <= 0) return sum;
      return sum + qty * (Number(line.unitPrice) || 0);
    }, 0),
    [poPreviewLines, poLineDrafts],
  );
  const displayGrandTotal = isPoLineMode ? poDraftGrandTotal : formGrandTotal;

  // Chỉ khởi tạo lại khi đổi PO / dữ liệu preview — không phụ thuộc onItemsChange
  // (callback inline của parent sẽ re-create mỗi render → reset tick).
  const poPreviewKey = useMemo(
    () =>
      `${selectedPoCode}|${issueFromGeneralWarehouse ? 'general' : 'project'}|${poPreviewLines
        .map(l => `${l.poItemId}:${l.available}:${l.generalAvailableQty ?? ''}`)
        .join(',')}`,
    [selectedPoCode, issueFromGeneralWarehouse, poPreviewLines],
  );

  // Đồng bộ draft dòng PO khi đổi PO/preview (cần gọi onItemsChange của parent).
  /* eslint-disable react-hooks/set-state-in-effect -- sync PO line drafts from preview into parent items */
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
    const cap = issueFromGeneralWarehouse
      ? (line: (typeof poPreviewLines)[number]) => {
          if (line.generalAvailableQty == null) return 0;
          const qty = Number(line.generalAvailableQty);
          return Number.isFinite(qty) ? Math.max(0, qty) : 0;
        }
      : undefined;
    const nextDrafts = defaultPoLineDrafts(poPreviewLines, cap);
    setPoLineDrafts(nextDrafts);
    onItemsChange(poDraftsToItems(poPreviewLines, nextDrafts));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ reset khi đổi PO/preview
  }, [isCreateMode, selectedPoCode, poPreviewKey]);

  useEffect(() => {
    if (!isOpen) {
      editPoSeedKeyRef.current = '';
      return;
    }
    if (!isPoBoundEdit || !selectedPoCode || poPreviewLines.length === 0) return;
    const key = `${editVoucher!.code}|${poPreviewKey}`;
    if (editPoSeedKeyRef.current === key) return;
    editPoSeedKeyRef.current = key;
    const nextDrafts = draftsFromExistingItems(poPreviewLines, items, getQtyCap);
    setPoLineDrafts(nextDrafts);
    onItemsChange(poDraftsToItems(poPreviewLines, nextDrafts));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed một lần khi mở sửa + preview sẵn
  }, [isOpen, isPoBoundEdit, selectedPoCode, poPreviewKey, editVoucher?.code]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const toggleSelectAllPoLines = (checked: boolean) => {
    setPoLineDrafts(prev => {
      const next = { ...prev };
      for (const line of poPreviewLines) {
        const cap = getQtyCap ? getQtyCap(line) : Number(line.available) || 0;
        const knownEmpty = !(Number.isFinite(cap) && cap > 0);
        if (knownEmpty) continue;
        const fallbackQty = Number.isFinite(cap) && cap > 0 ? String(cap) : '1';
        const existing = next[line.poItemId] ?? {
          selected: false,
          qty: fallbackQty,
        };
        const qtyNum = Number(existing.qty) || 0;
        next[line.poItemId] = {
          ...existing,
          selected: checked,
          qty: checked && qtyNum <= 0 ? fallbackQty : existing.qty,
        };
      }
      onItemsChange(poDraftsToItems(poPreviewLines, next));
      return next;
    });
  };

  const submitCreate = (status: 'draft' | 'pending') => {
    const synced = poDraftsToItems(poPreviewLines, poLineDrafts);
    onItemsChange(synced);
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
      title={
        editVoucher
          ? `Sửa phiếu - ${editVoucher.code}`
          : (title ?? 'Tạo phiếu nhập kho dự án')
      }
      size="wide"
      className="md-dialog--import-create"
      footer={
        <div className="flex w-full items-center justify-between gap-4 flex-wrap">
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <div className="flex items-center gap-3 flex-wrap md-dialog__footer-actions">
            <div className="text-sm mr-1">
              {canViewPrices && !issueFromGeneralWarehouse ? (
                <>
                  <span className="text-[var(--md-on-surface-variant)]">Tổng giá trị: </span>
                  <span className="font-bold text-[var(--md-primary)] tabular-nums">{formatCurrency(displayGrandTotal)} đ</span>
                </>
              ) : (
                <span className="text-[var(--md-on-surface-variant)]">
                  {selectedPoLineCount > 0
                    ? `${selectedPoLineCount} dòng vật tư`
                    : issueFromGeneralWarehouse
                      ? 'Chỉ ghi số lượng'
                      : 'Không hiển thị giá'}
                </span>
              )}
            </div>
            {editVoucher ? (
              <>
                <button type="button" className="btn btn-filled" disabled={isPending || isApproving} onClick={() => onSave?.({ evaluation: evaluationDraft })}>
                  Lưu thay đổi
                </button>
                {canApprove && editVoucher.status === 'pending' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isPending || isApproving || submitBlocked}
                    onClick={tryApproveFromEdit}
                  >
                    Lưu SL thực nhận &amp; Duyệt
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={isPending || submitBlocked}
                  onClick={() => submitCreate('draft')}
                >
                  Lưu nháp
                </button>
                <button
                  type="button"
                  className="btn btn-filled"
                  disabled={isPending || submitBlocked}
                  onClick={() => submitCreate('pending')}
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
              formGrandTotal={displayGrandTotal}
              onSetPoLine={setPoLine}
              onToggleSelectAll={toggleSelectAllPoLines}
              qtyColumnLabel={
                canApprove && editVoucher?.status === 'pending' ? 'SL thực nhận' : 'SL dự kiến'
              }
              getQtyCap={getQtyCap}
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
              qtyColumnLabel={
                canApprove && editVoucher?.status === 'pending' ? 'SL thực nhận' : 'SL'
              }
              onMaterialLineChange={onMaterialLineChange}
              onDuplicateMaterialAttempt={onDuplicateMaterialAttempt}
            />
          )}
          {canApprove && editVoucher?.status === 'pending' ? (
            <p className="text-[11px] text-[var(--md-on-surface-variant)] text-pretty rounded-md border border-dashed border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-2.5 py-2">
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
