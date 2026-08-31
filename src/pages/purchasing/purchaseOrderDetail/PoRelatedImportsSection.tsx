import { Plus } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import PermissionGate from '../../../components/auth/PermissionGate';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateCell, formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { Import } from '../../../types';
import type { PurchaseOrderApiDto } from '../../../types/api/purchasingApi';
import ImportCreateModal from '../../warehouse/import/ImportCreateModal';
import ImportDetailModal from '../../warehouse/import/ImportDetailModal';
import { DUPLICATE_MATERIAL_MESSAGE } from '../../../lib/wms/voucherDuplicateMaterial';
import { usePoStockInFlow } from './usePoStockInFlow';
import { isIssueFromGeneralWarehouse } from '../../warehouse/import/importUtils';

function receiptDateLabel(imp: Import): string {
  if (imp.status === 'approved' && imp.approvedAt) {
    return formatDateTimeVi(imp.approvedAt) ?? formatDateCell(imp.approvedAt);
  }
  return '—';
}

type Props = {
  poCode: string;
  order: PurchaseOrderApiDto | undefined;
  /** Xuất thẳng công trường — panel riêng dưới nhập kho. */
  directDispatch?: boolean;
};

export function PoRelatedImportsSection({ poCode, order, directDispatch = false }: Props) {
  const flow = usePoStockInFlow({ poCode, order, directDispatch });
  const isDirect = directDispatch;
  const sectionTitle = isDirect ? 'Xuất thẳng công trường' : 'Phiếu nhập kho';
  const createLabel = isDirect ? 'Tạo phiếu xuất thẳng' : 'Tạo phiếu nhập';
  const createTitleHint = isDirect
    ? 'Mở form xuất thẳng từ PO này'
    : 'Mở form tạo phiếu nhập từ PO này';
  const helperText = isDirect
    ? 'Cung ứng lập phiếu và chốt dự kiến. Có thể lấy từ kho dự án (theo Còn lại) hoặc kho trung tâm (hàng dư, không đổi Đã nhận). Thủ kho duyệt ở tab Xuất kho. Tồn kho dự án không tăng.'
    : 'Bấm Tạo phiếu nhập để mở form, rồi Lưu nháp / Chốt dự kiến. Thủ kho duyệt thực tế ở màn Nhập kho.';
  const emptyMessage = isDirect
    ? 'Chưa có phiếu xuất thẳng gắn PO này.'
    : 'Chưa có phiếu NK gắn PO này.';
  const voucherColLabel = isDirect ? 'Mã phiếu' : 'Mã phiếu NK';
  const dateColLabel = isDirect ? 'Ngày xuất' : 'Ngày nhận';
  const deleteTitle = isDirect ? 'Xóa phiếu xuất thẳng' : 'Xóa phiếu nhập kho';
  const createModalTitle = isDirect ? 'Tạo phiếu xuất thẳng công trường' : undefined;

  return (
    <section
      id={isDirect ? 'po-related-direct-exports' : 'po-related-imports'}
      className="pur-detail__card"
      aria-label={sectionTitle}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <h2 className="purchasing-section-title mb-0">
          {sectionTitle}
          <span className="ml-2 text-xs font-normal text-[var(--md-on-surface-variant)]">
            ({flow.relatedImports.length})
          </span>
        </h2>
        <PermissionGate permission="wms.imports.create">
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            disabled={!flow.canPlaceImport}
            title={
              flow.canPlaceImport
                ? createTitleHint
                : flow.placeImportBlockedReason || (isDirect ? 'Không thể tạo phiếu xuất thẳng' : 'Không thể tạo phiếu nhập')
            }
            onClick={flow.openCreate}
          >
            <Plus size={14} /> {createLabel}
          </button>
        </PermissionGate>
      </div>

      <p className="text-xs text-[var(--md-on-surface-variant)] mb-3 text-pretty">
        {helperText}
      </p>
      {!flow.canPlaceImport && flow.placeImportBlockedReason ? (
        <p className="pur-detail__alert mb-3" role="status">
          {flow.placeImportBlockedReason}
          {flow.poPreviewQuery.isError ? (
            <>
              {' '}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { void flow.poPreviewQuery.refetch(); }}
              >
                Thử lại
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      {flow.importsLoading ? (
        <table className="pur-erp__table"><tbody><TableSkeletonRows rows={3} colSpan={6} /></tbody></table>
      ) : flow.relatedImports.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
          <table className="pur-erp__table">
            <thead>
              <tr>
                <th className="pur-detail__th">{voucherColLabel}</th>
                <th className="pur-detail__th">Kho dự án</th>
                <th className="pur-detail__th">Trạng thái</th>
                <th className="pur-detail__th">{dateColLabel}</th>
                {flow.canViewPrices ? (
                  <th className="pur-detail__th text-right">Tổng giá trị</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {flow.relatedImports.map(imp => (
                <tr
                  key={imp.id}
                  className="table-row cursor-pointer"
                  onClick={() => flow.openDetail(imp)}
                >
                    <td className="table-cell">
                      <EntityCodeLink
                        code={isDirect && imp.linkedTicketCode ? imp.linkedTicketCode : imp.voucherCode}
                        onClick={() => flow.openDetail(imp)}
                      />
                      {isDirect && imp.linkedTicketCode ? (
                        <span className="block font-normal text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
                          Nhận hàng {imp.voucherCode}
                        </span>
                      ) : null}
                    </td>
                    <td className="table-cell">{imp.project || '—'}</td>
                    <td className="table-cell">
                      <VoucherStatusCell
                        voucherKind={isDirect ? 'export' : 'import'}
                        status={imp.status}
                        approvedBy={imp.approvedBy}
                        approvedAt={imp.approvedAt}
                      />
                    </td>
                    <td className="table-cell tabular-nums">{receiptDateLabel(imp)}</td>
                    {flow.canViewPrices ? (
                      <td className="table-cell text-right tabular-nums">
                        {isIssueFromGeneralWarehouse(imp) ? '—' : formatCurrency(imp.totalValue)}
                      </td>
                    ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ImportCreateModal
        isOpen={flow.showCreate}
        onClose={() => { flow.setShowCreate(false); flow.resetForm(); }}
        title={createModalTitle}
        isPending={flow.isPending}
        projects={flow.projects}
        suppliers={flow.suppliers}
        materials={flow.materials}
        projectCode={flow.projectCode}
        frozenByProjectCode={flow.frozenByProjectCode}
        onProjectCodeChange={() => {
          /* Kho dự án khóa theo PO — không cho đổi từ chi tiết PO. */
        }}
        defaultSupplier={flow.defaultSupplier}
        onDefaultSupplierChange={name => {
          flow.setDefaultSupplier(name);
          flow.setCreateErrors(e => ({ ...e, defaultSupplier: undefined }));
        }}
        referenceCode={flow.referenceCode}
        onReferenceCodeChange={code => {
          flow.setReferenceCode(code);
          flow.setCreateErrors(e => ({ ...e, referenceCode: undefined }));
        }}
        note={flow.note}
        onNoteChange={flow.setNote}
        items={flow.items}
        onItemsChange={flow.setItems}
        formGrandTotal={flow.formGrandTotal}
        errors={flow.createErrors}
        onCreate={(status, evidence) => { void flow.handleCreate(status, evidence); }}
        onSave={payload => { void flow.handleUpdate(payload); }}
        editVoucher={
          flow.editing
            ? { code: flow.editing.voucherCode, receiptEvaluation: flow.editing.receiptEvaluation }
            : null
        }
        materialUnit={flow.materialUnit}
        poOptions={flow.poOptions}
        selectedPoCode={flow.selectedPoCode}
        poLocked
        poLoading={flow.poPreviewQuery.isFetching && !flow.poPreviewQuery.data}
        poPreviewLines={flow.poPreviewQuery.data?.lines ?? []}
        allowWarehouseSourcePicker={isDirect}
        issueFromGeneralWarehouse={flow.issueFromGeneralWarehouse}
        onIssueFromGeneralWarehouseChange={flow.setIssueFromGeneralWarehouse}
        getQtyCap={flow.getQtyCap}
        editAttachments={flow.editing?.attachments ?? []}
        isEvidencePending={flow.isEvidencePending}
        onUploadEditAttachment={
          flow.editing
            ? async (file, kind) => { await flow.handleUploadAttachment(flow.editing!, file, kind); }
            : undefined
        }
        onDeleteEditAttachment={
          flow.editing
            ? async attachmentId => { await flow.handleDeleteAttachment(flow.editing!, attachmentId); }
            : undefined
        }
        onDownloadEditAttachment={
          flow.editing
            ? async (attachmentId, fileName) => {
              await flow.handleDownloadAttachment(flow.editing!, attachmentId, fileName);
            }
            : undefined
        }
        onDuplicateMaterialAttempt={lineIndex => {
          flow.setCreateErrors(e => ({
            ...e,
            lineErrors: {
              ...e.lineErrors,
              [lineIndex]: { materialCode: DUPLICATE_MATERIAL_MESSAGE },
            },
          }));
        }}
      />

      <ImportDetailModal
        isOpen={flow.showDetail}
        onClose={() => flow.setShowDetail(false)}
        selected={flow.selected}
        projectName={flow.projectName}
        onEdit={flow.canUpdate ? flow.openEdit : undefined}
        onDeleteDraft={
          flow.canDelete
            ? imp => {
              flow.setShowDetail(false);
              flow.setDeleteTarget(imp);
            }
            : undefined
        }
        onConvertToDirect={
          !isDirect && flow.canUpdate
            ? imp => {
              flow.setShowDetail(false);
              flow.setConvertTarget(imp);
            }
            : undefined
        }
        onDownloadAttachment={flow.handleDownloadAttachment}
        showPrices={flow.canViewPrices && !isIssueFromGeneralWarehouse(flow.selected)}
      />

      <ConfirmDialog
        isOpen={flow.deleteTarget != null}
        onClose={() => flow.setDeleteTarget(null)}
        onConfirm={() => { void flow.handleConfirmDelete(); }}
        title={deleteTitle}
        variant="danger"
        confirmLabel="Xóa phiếu"
        isLoading={flow.deletePending}
        message={
          flow.deleteTarget
            ? `Xóa phiếu nháp ${flow.deleteTarget.voucherCode}? Thao tác không hoàn tác.`
            : ''
        }
      />
      <ConfirmDialog
        isOpen={flow.convertTarget != null}
        onClose={() => flow.setConvertTarget(null)}
        onConfirm={() => { void flow.handleConfirmConvert(); }}
        title="Chuyển sang xuất thẳng"
        confirmLabel="Chuyển phiếu"
        isLoading={flow.convertPending}
        message={
          flow.convertTarget
            ? `Chuyển ${flow.convertTarget.voucherCode} sang xuất thẳng công trường? Thủ kho duyệt ở tab Xuất kho; tồn kho dự án không tăng.`
            : ''
        }
      />
    </section>
  );
}
