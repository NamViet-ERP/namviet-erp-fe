import { useEffect, useMemo, useRef, useState } from 'react';
import type { Import } from '../../../types';
import { ArrowRightLeft, FileText, Pencil, Trash2 } from 'lucide-react';
import { formatCurrencyVnd } from '../../../utils/formatCurrency';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import { displayValue } from '../../../components/warehouse/voucherDetailUtils';
import FormField from '../../../components/ui/FormField';
import QtyStepper from '../../../components/ui/QtyStepper';
import {
  SavedImportDocList,
  SavedImportPhotoGrid,
} from '../../../components/warehouse/PendingLocalEvidence';
import { importStatusHint, isIssueFromGeneralWarehouse } from './importUtils';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../../lib/wms/voucherDateUtils';
import { printVoucherWithFeedback } from '../../../lib/wms/printVoucher';
import { buildImportPrintPayload } from '../../../lib/wms/voucherPrintBuilders';
import ImportCreateEvidenceSection from './ImportCreateEvidenceSection';
import {
  buildReceiveLineDrafts,
  hasPoReference,
  lineNeedsReason,
  missingReasonLineIds,
  recomputeShortage,
  settlementTotals,
  toApproveSettlementPayload,
  validateReceiveSettlement,
  type ImportApproveSettlementPayload,
  type ReceiveLineDraft,
} from './importReceiveSettlement';

interface ImportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: Import | null;
  projectName: (code?: string) => string;
  /** Chỉ dùng cho phiếu nháp: mở form sửa header / dòng hàng. */
  onEdit?: (imp: Import) => void;
  /** Xóa phiếu nháp (chi tiết PO không còn cột Tác vụ). */
  onDeleteDraft?: (imp: Import) => void;
  /** Chuyển phiếu nhập kho sang xuất thẳng. */
  onConvertToDirect?: (imp: Import) => void;
  /** Thủ kho duyệt thực tế từ chi tiết (phiếu pending) sau khi đủ 3 mục chứng từ. */
  onApprove?: (imp: Import, payload: ImportApproveSettlementPayload) => void;
  onDownloadAttachment?: (imp: Import, attachmentId: string, fileName: string) => Promise<void>;
  /** Thủ kho được cập nhật đánh giá / ảnh / file trên phiếu pending. */
  canUpdateEvidence?: boolean;
  isEvidencePending?: boolean;
  onUploadAttachment?: (
    imp: Import,
    file: File,
    kind: 'document' | 'photo' | 'defect_photo',
  ) => Promise<void>;
  onDeleteAttachment?: (imp: Import, attachmentId: string) => Promise<void>;
  onSaveEvaluation?: (imp: Import, evaluation: string) => Promise<void>;
  /** Ẩn đơn giá / thành tiền / tổng khi không có wms.prices.view */
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
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const evidenceDocInputRef = useRef<HTMLInputElement>(null);
  const defectPhotoInputRef = useRef<HTMLInputElement>(null);
  const reasonInputRefs = useRef<Map<number, HTMLInputElement | null>>(new Map());
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !selected) {
      setShowEvidenceErrors(false);
      setSettlementError(null);
      return;
    }
    setEvaluationDraft(selected.receiptEvaluation ?? '');
    setShortageReport(selected.shortageReport ?? '');
    setDefectReason('');
    setLineDrafts(buildReceiveLineDrafts(selected.items));
    setShowEvidenceErrors(false);
    setSettlementError(null);
    setReasonErrorLineIds([]);
    // Chỉ seed lại khi đổi phiếu / mở modal — tránh reset khi upload ảnh reload selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: seed by voucher id
  }, [isOpen, selected?.id]);

  const totals = useMemo(() => settlementTotals(lineDrafts), [lineDrafts]);

  if (!selected) return null;

  const isDirect = Boolean(selected.isDirectProcurement);
  const displayPrices = showPrices && !isIssueFromGeneralWarehouse(selected);
  const canEditDraft = Boolean(onEdit) && selected.status === 'draft';
  const canDeleteDraft = Boolean(onDeleteDraft) && selected.status === 'draft';
  const canConvertToDirect = Boolean(onConvertToDirect)
    && !isDirect
    && (selected.status === 'draft' || selected.status === 'pending');
  const canReceiveHere = Boolean(onApprove) && selected.status === 'pending';
  const evidenceEditable = canUpdateEvidence && selected.status === 'pending';
  const attachments = selected.attachments ?? [];
  const evaluation = (selected.receiptEvaluation ?? '').trim();
  const hasPhoto = attachments.some(a => a.kind === 'photo');
  const hasDocument = attachments.some(a => a.kind === 'document');
  const hasDefectPhoto = attachments.some(a => a.kind === 'defect_photo');
  const defectPhotos = attachments.filter(a => a.kind === 'defect_photo');
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
    const err = validateReceiveSettlement(
      lineDrafts,
      shortageReport,
      hasDefectPhoto,
      hasPoReference(selected),
    );
    if (err) {
      setSettlementError(err);
      const missing = missingReasonLineIds(lineDrafts);
      setReasonErrorLineIds(missing);
      if (missing.length > 0) {
        requestAnimationFrame(() => {
          const el = reasonInputRefs.current.get(missing[0]);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el?.focus();
        });
      } else {
        requestAnimationFrame(() => {
          tableScrollRef.current
            ?.closest('.md-dialog__body')
            ?.querySelector('[data-settlement-error]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
      return;
    }
    setSettlementError(null);
    setReasonErrorLineIds([]);
    onApprove?.(
      selected,
      toApproveSettlementPayload(lineDrafts, evaluationDraft, shortageReport, defectReason),
    );
  };

  const persistEvaluation = () => {
    if (!onSaveEvaluation) return;
    const next = evaluationDraft.trim();
    if (next === (selected.receiptEvaluation ?? '').trim()) return;
    void onSaveEvaluation(selected, evaluationDraft);
  };

  const patchLine = (lineId: number, patch: Partial<ReceiveLineDraft>) => {
    setLineDrafts(prev =>
      prev.map(d => {
        if (d.lineId !== lineId) return d;
        let next = { ...d, ...patch };
        if (patch.accepted !== undefined) next = recomputeShortage(next, 'accepted', patch.accepted);
        if (patch.defect !== undefined) next = recomputeShortage(next, 'defect', patch.defect);
        return next;
      }),
    );
    setSettlementError(null);
    if (patch.lineReason !== undefined) {
      setReasonErrorLineIds(prev => prev.filter(id => id !== lineId));
    }
  };

  const statusHint = evidenceEditable
    ? (isDirect
      ? 'Xuất thẳng: kiểm nhận SL, đủ chứng từ rồi duyệt. Tồn kho không tăng.'
      : 'Kiểm nhận SL thực tế / Lỗi / Thiếu, đủ chứng từ rồi duyệt')
    : importStatusHint(selected.status, isDirect);

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
      fields={[
        ...(isDirect
          ? [{ label: 'Loại', value: 'Xuất thẳng công trường' }]
          : []),
        {
          label: 'Kho dự án',
          value: selected.project ? projectName(selected.project) : displayValue(),
        },
        { label: 'Nhà cung cấp', value: displayValue(selected.supplier) },
        { label: 'Mã đơn hàng', value: displayValue(selected.referenceCode) },
        { label: 'KHMH', value: displayValue(selected.planCode) },
        {
          label: 'Tạo lúc',
          value: displayValue(formatDateTimeVi(getVoucherCreatedAt(selected)?.toISOString())),
        },
        { label: 'Người lập', value: displayValue(selected.createdBy) },
        ...(isDirect && selected.linkedTicketCode
          ? [{ label: 'Phiếu xuất', value: displayValue(selected.linkedTicketCode) }]
          : []),
        ...(selected.linkedDefectTicketCode
          ? [{ label: 'HL liên kết', value: displayValue(selected.linkedDefectTicketCode) }]
          : []),
        { label: 'Ghi chú', value: displayValue(selected.note), wide: true },
      ]}
      itemsTitle={`Danh sách vật tư (${selected.items.length})`}
      footer={
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              printVoucherWithFeedback(
                buildImportPrintPayload(
                  selected,
                  selected.project ? projectName(selected.project) : '-',
                  { showPrices: displayPrices },
                ),
              )
            }
          >
            <FileText size={14} /> In phiếu
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {canDeleteDraft ? (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onDeleteDraft?.(selected)}
              >
                <Trash2 size={14} /> Xóa nháp
              </button>
            ) : null}
            {canConvertToDirect ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onConvertToDirect?.(selected)}
              >
                <ArrowRightLeft size={14} /> Chuyển sang xuất thẳng
              </button>
            ) : null}
            {canEditDraft ? (
              <button type="button" className="btn btn-filled" onClick={() => onEdit?.(selected)}>
                <Pencil size={14} /> Sửa phiếu
              </button>
            ) : null}
            {canReceiveHere ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isApproving || isEvidencePending}
                onClick={handleApproveClick}
              >
                Duyệt thực tế
              </button>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto table-scroll" ref={tableScrollRef}>
        <table
          className={`form-table import-items-table import-items-table--import-detail text-xs${
            showSettlement ? ' import-items-table--import-receive' : ''
          }`}
        >
          <thead>
            <tr>
              <th className="table-header-cell text-center import-line-item-col">Mặt hàng</th>
              {showSettlement ? (
                <>
                  <th className="table-header-cell text-center import-receive-col-qty">SL tạo phiếu</th>
                  <th className="table-header-cell text-center import-receive-col-qty">SL thực tế</th>
                  <th className="table-header-cell text-center import-receive-col-qty">Lỗi</th>
                  <th className="table-header-cell text-center import-receive-col-qty">Thiếu</th>
                </>
              ) : (
                <th className="table-header-cell text-center import-manual-col-qty">SL</th>
              )}
              <th className="table-header-cell text-center import-po-col-unit">ĐVT</th>
              {displayPrices ? (
                <>
                  <th className="table-header-cell text-center import-po-col-amount">Đơn giá</th>
                  <th className="table-header-cell text-center import-po-col-amount">Thành tiền</th>
                </>
              ) : null}
              {showSettlement ? (
                <th className="table-header-cell text-center defect-col-reason">Lý do</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {selected.items.map((it, i) => {
              const code = (it.sku || it.productId || '').trim();
              const draft = lineDrafts.find(d => d.lineId === Number(it.lineId));
              const planned = Number(it.plannedQty) > 0 ? Number(it.plannedQty) : Number(it.qty) || 0;
              return (
                <tr key={`${code}-${i}`} className="table-row">
                  <td className="table-cell import-line-item-col">
                    <div className="import-line-item__name">{it.name}</div>
                    <div className="import-line-item__code">{code || '-'}</div>
                  </td>
                  {showSettlement ? (
                    settlementEditable && draft ? (
                      <>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty font-semibold">
                          {draft.planned}
                        </td>
                        <td className="table-cell text-center import-receive-col-qty">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            <QtyStepper
                              value={draft.accepted}
                              min={0}
                              max={draft.planned}
                              className="qty-stepper--compact"
                              ariaLabel={`SL thực tế ${code}`}
                              onChange={qtyVal => patchLine(draft.lineId, { accepted: qtyVal })}
                            />
                          </div>
                        </td>
                        <td className="table-cell text-center import-receive-col-qty">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            <QtyStepper
                              value={draft.defect}
                              min={0}
                              max={draft.planned}
                              className="qty-stepper--compact"
                              ariaLabel={`Lỗi ${code}`}
                              onChange={qtyVal => patchLine(draft.lineId, { defect: qtyVal })}
                            />
                          </div>
                        </td>
                        <td className="table-cell text-center import-receive-col-qty">
                          <div className="import-cell-placeholder import-cell-placeholder--center">
                            <QtyStepper
                              value={draft.shortage}
                              min={0}
                              max={draft.planned}
                              className="qty-stepper--compact"
                              ariaLabel={`Thiếu ${code}`}
                              onChange={qtyVal => patchLine(draft.lineId, { shortage: qtyVal })}
                            />
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty">{planned}</td>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty">{it.acceptedQty ?? it.qty}</td>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty">{it.defectQty ?? 0}</td>
                        <td className="table-cell text-center tabular-nums import-receive-col-qty">{it.shortageQty ?? 0}</td>
                      </>
                    )
                  ) : (
                    <td className="table-cell text-center tabular-nums import-manual-col-qty font-semibold">
                      {it.qty}
                    </td>
                  )}
                  <td className="table-cell text-center import-po-col-unit">
                    <div className="import-cell-placeholder import-cell-placeholder--center">
                      {it.unit?.trim() || '-'}
                    </div>
                  </td>
                  {displayPrices ? (
                    <>
                      <td className="table-cell text-center tabular-nums import-po-col-amount">
                        {formatCurrencyVnd(it.unitPrice)}
                      </td>
                      <td className="table-cell text-center tabular-nums font-semibold text-[var(--md-primary)] import-po-col-amount">
                        {formatCurrencyVnd((Number(draft?.accepted ?? it.acceptedQty ?? it.qty) || 0) * it.unitPrice)}
                      </td>
                    </>
                  ) : null}
                  {showSettlement ? (
                    settlementEditable && draft ? (
                      <td className="table-cell defect-col-reason">
                        {lineNeedsReason(draft) ? (
                          <input
                            ref={el => {
                              reasonInputRefs.current.set(draft.lineId, el);
                            }}
                            className={`form-input min-h-9${
                              reasonErrorLineIds.includes(draft.lineId) ? ' form-input--error' : ''
                            }`}
                            value={draft.lineReason}
                            onChange={e => patchLine(draft.lineId, { lineReason: e.target.value })}
                            placeholder="Lý do"
                            aria-invalid={reasonErrorLineIds.includes(draft.lineId)}
                            aria-label={`Lý do ${code}`}
                            required
                          />
                        ) : (
                          <div className="import-cell-placeholder import-cell-placeholder--center">-</div>
                        )}
                      </td>
                    ) : (
                      <td className="table-cell defect-col-reason whitespace-pre-wrap">
                        {(it.defectLineReason || it.shortageLineReason || '-').toString()}
                      </td>
                    )
                  ) : null}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[var(--md-outline-variant)]">
              <td className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2">
                Tổng cộng ({selected.items.length} dòng)
              </td>
              {showSettlement ? (
                <>
                  <td className="table-cell text-center tabular-nums font-bold py-2 import-receive-col-qty">
                    {lineDrafts.reduce((s, d) => s + d.planned, 0)
                      || selected.items.reduce((s, it) => s + (Number(it.plannedQty) || Number(it.qty) || 0), 0)}
                  </td>
                  <td className="table-cell text-center tabular-nums font-bold py-2 import-receive-col-qty">{totals.accepted}</td>
                  <td className="table-cell text-center tabular-nums font-bold py-2 import-receive-col-qty">{totals.defect}</td>
                  <td className="table-cell text-center tabular-nums font-bold py-2 import-receive-col-qty">{totals.shortage}</td>
                </>
              ) : (
                <td className="table-cell text-center tabular-nums font-bold py-2 import-manual-col-qty">
                  {selected.items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)}
                </td>
              )}
              <td className="table-cell py-2" />
              {displayPrices ? (
                <>
                  <td className="table-cell py-2" />
                  <td className="table-cell text-center tabular-nums font-bold text-[var(--md-primary)] py-2 import-po-col-amount">
                    {formatCurrencyVnd(
                      settlementEditable
                        ? lineDrafts.reduce((sum, d, idx) => {
                            const price = selected.items[idx]?.unitPrice ?? 0;
                            return sum + (Number(d.accepted) || 0) * price;
                          }, 0)
                        : selected.totalValue,
                    )}
                  </td>
                </>
              ) : null}
              {showSettlement ? <td className="table-cell py-2" /> : null}
            </tr>
          </tfoot>
        </table>
      </div>

      {settlementEditable ? (
        <p
          className={`mt-2 text-[length:var(--fs-micro)] text-pretty${
            reasonErrorLineIds.length > 0
              ? ' text-[var(--md-error)] font-semibold'
              : ' text-[var(--md-on-surface-variant)]'
          }`}
        >
          SL thực tế + Lỗi + Thiếu = SL tạo phiếu. Có Lỗi/Thiếu thì nhập Lý do trên dòng.
        </p>
      ) : null}

      {settlementEditable && totals.defect > 0 ? (
        <div className="mt-3 space-y-2 rounded-[var(--radius-md)] border border-[var(--md-outline)] bg-[var(--md-surface-container-low)] p-3">
          <p className="text-[length:var(--fs-sm)] font-semibold text-[var(--md-on-surface)]">Hàng lỗi - ảnh</p>
          <FormField label="Lý do chung phiếu HL (tuỳ chọn)">
            <input
              className="form-input"
              value={defectReason}
              onChange={e => setDefectReason(e.target.value)}
              placeholder="Ghi chú chung cho phiếu HL"
            />
          </FormField>
          <div>
            <p className="mb-1 text-[length:var(--fs-xs)] font-medium text-[var(--md-on-surface-variant)]">
              Ảnh hàng lỗi <span className="text-[var(--md-error)]">*</span>
            </p>
            <input
              ref={defectPhotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              multiple
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                files.forEach(file => {
                  void onUploadAttachment?.(selected, file, 'defect_photo');
                });
              }}
            />
            <button
              type="button"
              className="btn btn-outlined"
              disabled={isEvidencePending || !onUploadAttachment}
              onClick={() => defectPhotoInputRef.current?.click()}
            >
              Chọn ảnh hàng lỗi
            </button>
            {defectPhotos.length > 0 ? (
              <div className="mt-2">
                <SavedImportPhotoGrid
                  importId={selected.id}
                  attachments={defectPhotos}
                  kinds={['defect_photo']}
                  canEdit={Boolean(onDeleteAttachment)}
                  onDelete={id => {
                    void onDeleteAttachment?.(selected, id);
                  }}
                  onDownload={
                    onDownloadAttachment
                      ? (id, name) => {
                          void onDownloadAttachment(selected, id, name);
                        }
                      : undefined
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {settlementEditable && totals.shortage > 0 ? (
        <div className="mt-3">
          <FormField label="Báo cáo thiếu hàng" required>
            <textarea
              className="form-input min-h-[4.5rem]"
              value={shortageReport}
              onChange={e => {
                setShortageReport(e.target.value);
                setSettlementError(null);
              }}
              placeholder="NCC giao thiếu bao nhiêu, lý do, hạn giao bù..."
            />
          </FormField>
          <p className="mt-1 text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
            Cung ứng dùng báo cáo này để tạo phiếu nhập lần sau từ PO.
          </p>
        </div>
      ) : null}

      {!settlementEditable && selected.shortageReport ? (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--md-outline)] bg-[var(--md-surface-container-low)] p-3">
          <p className="text-[length:var(--fs-xs)] font-medium text-[var(--md-on-surface-variant)]">Báo cáo thiếu hàng</p>
          <p className="mt-1 whitespace-pre-wrap text-[length:var(--fs-sm)] text-[var(--md-on-surface)]">
            {selected.shortageReport}
          </p>
        </div>
      ) : null}

      {settlementError ? (
        <p
          data-settlement-error
          className="mt-2 text-[length:var(--fs-sm)] text-[var(--md-error)] font-semibold"
          role="alert"
        >
          {settlementError}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {evidenceEditable ? (
          <ImportCreateEvidenceSection
            isCreateMode={false}
            markRequired
            evidenceErrors={evidenceErrors}
            evaluationDraft={evaluationDraft}
            onEvaluationChange={value => {
              setEvaluationDraft(value);
              if (showEvidenceErrors) setShowEvidenceErrors(false);
            }}
            onEvaluationBlur={persistEvaluation}
            evidencePhotos={[]}
            evidenceDocs={[]}
            onEvidencePhotosChange={() => {}}
            onEvidenceDocsChange={() => {}}
            evidenceInputRef={evidenceInputRef}
            evidenceDocInputRef={evidenceDocInputRef}
            editVoucherCode={selected.id}
            editAttachments={attachments.filter(a => a.kind === 'photo' || a.kind === 'document')}
            isEvidencePending={isEvidencePending}
            hint="Cần đánh giá, ảnh nhận hàng và file chứng từ trước khi duyệt."
            onUploadEditAttachment={
              onUploadAttachment
                ? (file, kind) => onUploadAttachment(selected, file, kind)
                : undefined
            }
            onDeleteEditAttachment={
              onDeleteAttachment
                ? attachmentId => onDeleteAttachment(selected, attachmentId)
                : undefined
            }
            onDownloadEditAttachment={
              onDownloadAttachment
                ? (attachmentId, fileName) => onDownloadAttachment(selected, attachmentId, fileName)
                : undefined
            }
          />
        ) : (
          <>
            <FormField label="Đánh giá nhận hàng">
              <div className="form-input pending-evidence-note min-h-[4.5rem] whitespace-pre-wrap text-pretty bg-[var(--md-surface-container-low)]">
                {evaluation || '-'}
              </div>
            </FormField>
            {selected.status === 'approved' ? (
              <p className="text-xs text-[var(--md-on-surface-variant)] -mt-1 text-pretty">
                Phiếu đã duyệt - chỉ xem chứng từ và ảnh.
              </p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Ảnh nhận hàng">
                <div className="pending-evidence">
                  <SavedImportPhotoGrid
                    importId={selected.id}
                    attachments={attachments}
                    canEdit={false}
                    onDownload={(attachmentId, fileName) => {
                      if (!onDownloadAttachment) return;
                      void onDownloadAttachment(selected, attachmentId, fileName);
                    }}
                  />
                </div>
              </FormField>

              <FormField label="File chứng từ">
                <div className="pending-evidence">
                  <SavedImportDocList
                    attachments={attachments}
                    canEdit={false}
                    onDownload={(attachmentId, fileName) => {
                      if (!onDownloadAttachment) return;
                      void onDownloadAttachment(selected, attachmentId, fileName);
                    }}
                  />
                </div>
              </FormField>
            </div>
          </>
        )}
      </div>
    </VoucherDetailModal>
  );
}
