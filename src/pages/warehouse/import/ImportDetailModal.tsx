import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, FileText, Pencil, Trash2 } from 'lucide-react';
import type { Import } from '../../../types';
import Button from '../../../components/ui/Button';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import { printVoucherWithFeedback } from '../../../lib/wms/printVoucher';
import { buildImportPrintPayload } from '../../../lib/wms/voucherPrintBuilders';
import {
  buildImportDetailFields,
  importDetailStatusHint,
  isIssueFromGeneralWarehouse,
} from './importUtils';
import {
  applyReceiveLinePatch,
  buildReceiveLineDrafts,
  hasPoReference,
  missingReasonLineIds,
  settlementTotals,
  toApproveSettlementPayload,
  validateReceiveSettlement,
  type ImportApproveSettlementPayload,
  type ReceiveLineDraft,
} from './importReceiveSettlement';
import ImportDetailSettlementTable from './ImportDetailSettlementTable';
import ImportDetailEvidenceBlock from './ImportDetailEvidenceBlock';

interface ImportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: Import | null;
  projectName: (code?: string) => string;
  onEdit?: (imp: Import) => void;
  onDeleteDraft?: (imp: Import) => void;
  onConvertToDirect?: (imp: Import) => void;
  onApprove?: (imp: Import, payload: ImportApproveSettlementPayload) => void;
  onDownloadAttachment?: (imp: Import, attachmentId: string, fileName: string) => Promise<void>;
  canUpdateEvidence?: boolean;
  isEvidencePending?: boolean;
  onUploadAttachment?: (
    imp: Import,
    file: File,
    kind: 'document' | 'photo' | 'defect_photo',
  ) => Promise<void>;
  onDeleteAttachment?: (imp: Import, attachmentId: string) => Promise<void>;
  onSaveEvaluation?: (imp: Import, evaluation: string) => Promise<void>;
  showPrices?: boolean;
  isApproving?: boolean;
}

export default function ImportDetailModal({
  isOpen,
  onClose,
  selected,
  projectName,
  onEdit,
  onDeleteDraft,
  onConvertToDirect,
  onApprove,
  onDownloadAttachment,
  canUpdateEvidence = false,
  isEvidencePending = false,
  onUploadAttachment,
  onDeleteAttachment,
  onSaveEvaluation,
  showPrices = true,
  isApproving = false,
}: ImportDetailModalProps) {
  const [evaluationDraft, setEvaluationDraft] = useState('');
  const [shortageReport, setShortageReport] = useState('');
  const [defectReason, setDefectReason] = useState('');
  const [lineDrafts, setLineDrafts] = useState<ReceiveLineDraft[]>([]);
  const [showEvidenceErrors, setShowEvidenceErrors] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [reasonErrorLineIds, setReasonErrorLineIds] = useState<number[]>([]);
  const reasonInputRefs = useRef<Map<number, HTMLInputElement | null>>(new Map());
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);

  useEffect(() => {
    selectedRef.current = selected;
  });

  const selectedId = selected?.id ?? null;
  useEffect(() => {
    const current = selectedRef.current;
    if (!isOpen || !current) {
      setShowEvidenceErrors(false);
      setSettlementError(null);
      return;
    }
    setEvaluationDraft(current.receiptEvaluation ?? '');
    setShortageReport(current.shortageReport ?? '');
    setDefectReason('');
    setLineDrafts(buildReceiveLineDrafts(current.items));
    setShowEvidenceErrors(false);
    setSettlementError(null);
    setReasonErrorLineIds([]);
  }, [isOpen, selectedId]);

  const totals = useMemo(() => settlementTotals(lineDrafts), [lineDrafts]);

  if (!selected) return null;

  const isDirect = Boolean(selected.isDirectProcurement);
  const displayPrices = showPrices && !isIssueFromGeneralWarehouse(selected);
  const canEditDraft = Boolean(onEdit) && selected.status === 'draft';
  const canDeleteDraft = Boolean(onDeleteDraft) && selected.status === 'draft';
  const canConvertToDirect =
    Boolean(onConvertToDirect)
    && !isDirect
    && (selected.status === 'draft' || selected.status === 'pending');
  const canReceiveHere = Boolean(onApprove) && selected.status === 'pending';
  const evidenceEditable = canUpdateEvidence && selected.status === 'pending';
  const attachments = selected.attachments ?? [];
  const hasPhoto = attachments.some(a => a.kind === 'photo');
  const hasDocument = attachments.some(a => a.kind === 'document');
  const hasDefectPhoto = attachments.some(a => a.kind === 'defect_photo');
  const evidenceErrors = showEvidenceErrors
    ? {
        evaluation: !evaluationDraft.trim() ? 'Vui lòng nhập đánh giá nhận hàng' : undefined,
        photo: !hasPhoto ? 'Vui lòng chọn ít nhất 1 ảnh nhận hàng' : undefined,
        document: !hasDocument ? 'Vui lòng chọn ít nhất 1 file chứng từ' : undefined,
      }
    : undefined;

  const showSettlement = canReceiveHere || selected.status === 'approved';
  const settlementEditable = canReceiveHere;

  const handleApproveClick = () => {
    if (!evaluationDraft.trim() || !hasPhoto || !hasDocument) {
      setShowEvidenceErrors(true);
      return;
    }
    const err = validateReceiveSettlement(lineDrafts, shortageReport, hasDefectPhoto, hasPoReference(selected));
    if (err) {
      setSettlementError(err);
      const missing = missingReasonLineIds(lineDrafts);
      setReasonErrorLineIds(missing);
      requestAnimationFrame(() => {
        if (missing.length > 0) {
          const el = reasonInputRefs.current.get(missing[0]);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el?.focus();
        } else {
          tableScrollRef.current
            ?.closest('.md-dialog__body')
            ?.querySelector('[data-settlement-error]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
      return;
    }
    setSettlementError(null);
    setReasonErrorLineIds([]);
    onApprove?.(selected, toApproveSettlementPayload(lineDrafts, evaluationDraft, shortageReport, defectReason));
  };

  const persistEvaluation = () => {
    if (!onSaveEvaluation) return;
    if (evaluationDraft.trim() === (selected.receiptEvaluation ?? '').trim()) return;
    void onSaveEvaluation(selected, evaluationDraft);
  };

  const patchLine = (lineId: number, patch: Partial<ReceiveLineDraft>) => {
    setLineDrafts(prev => applyReceiveLinePatch(prev, lineId, patch));
    setSettlementError(null);
    if (patch.lineReason !== undefined) {
      setReasonErrorLineIds(prev => prev.filter(id => id !== lineId));
    }
  };

  const statusHint = importDetailStatusHint(selected.status, isDirect, evidenceEditable);

  const handlePrint = () => {
    const projectLabel = selected.project ? projectName(selected.project) : '-';
    printVoucherWithFeedback(buildImportPrintPayload(selected, projectLabel, { showPrices: displayPrices }));
  };

  return (
    <VoucherDetailModal
      isOpen={isOpen}
      onClose={onClose}
      voucherCode={selected.voucherCode}
      status={selected.status}
      voucherKind={isDirect ? 'export' : 'import'}
      size={showSettlement ? 'wide' : 'full'}
      className={showSettlement ? 'wms-voucher-detail--receive' : 'wms-voucher-detail--lines'}
      statusHint={statusHint}
      approvedBy={selected.approvedBy}
      approvedAt={selected.approvedAt}
      fields={buildImportDetailFields(selected, projectName)}
      itemsTitle={`Danh sách vật tư (${selected.items.length})`}
      footer={
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <Button type="button" variant="outlined" size="sm" leftIcon={FileText} onClick={handlePrint}>
            In phiếu
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            {canDeleteDraft && (
              <Button type="button" variant="danger" size="sm" leftIcon={Trash2} onClick={() => onDeleteDraft?.(selected)}>
                Xóa nháp
              </Button>
            )}
            {canConvertToDirect && (
              <Button type="button" variant="outlined" size="sm" leftIcon={ArrowRightLeft} onClick={() => onConvertToDirect?.(selected)}>
                Chuyển sang xuất thẳng
              </Button>
            )}
            {canEditDraft && (
              <Button type="button" variant="filled" leftIcon={Pencil} onClick={() => onEdit?.(selected)}>
                Sửa phiếu
              </Button>
            )}
            {canReceiveHere && (
              <Button type="button" variant="filled" disabled={isApproving || isEvidencePending} onClick={handleApproveClick}>
                Duyệt thực tế
              </Button>
            )}
          </div>
        </div>
      }
    >
      <ImportDetailSettlementTable
        items={selected.items}
        totalValue={selected.totalValue}
        lineDrafts={lineDrafts}
        totals={totals}
        showSettlement={showSettlement}
        settlementEditable={settlementEditable}
        displayPrices={displayPrices}
        reasonErrorLineIds={reasonErrorLineIds}
        reasonInputRefs={reasonInputRefs}
        tableScrollRef={tableScrollRef}
        onPatchLine={patchLine}
      />
      <ImportDetailEvidenceBlock
        selected={selected}
        totals={totals}
        settlementEditable={settlementEditable}
        evidenceEditable={evidenceEditable}
        isEvidencePending={isEvidencePending}
        evaluationDraft={evaluationDraft}
        onEvaluationChange={value => {
          setEvaluationDraft(value);
          if (showEvidenceErrors) setShowEvidenceErrors(false);
        }}
        onEvaluationBlur={persistEvaluation}
        evidenceErrors={evidenceErrors}
        defectReason={defectReason}
        onDefectReasonChange={setDefectReason}
        shortageReport={shortageReport}
        onShortageReportChange={value => {
          setShortageReport(value);
          setSettlementError(null);
        }}
        settlementError={settlementError}
        onUploadAttachment={onUploadAttachment}
        onDeleteAttachment={onDeleteAttachment}
        onDownloadAttachment={onDownloadAttachment}
      />
    </VoucherDetailModal>
  );
}
