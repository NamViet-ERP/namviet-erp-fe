import { Pencil, Plus, Send, Trash2 } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Dropdown from '../../../components/ui/Dropdown';
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

function receiptDateLabel(imp: Import): string {
  if (imp.status === 'approved' && imp.approvedAt) {
    return formatDateTimeVi(imp.approvedAt) ?? formatDateCell(imp.approvedAt);
  }
  return imp.date ? formatDateCell(imp.date) : '—';
}

type Props = {
  poCode: string;
  order: PurchaseOrderApiDto | undefined;
};

export function PoRelatedImportsSection({ poCode, order }: Props) {
  const flow = usePoStockInFlow({ poCode, order });

  const actionItems = (imp: Import) => {
    const items: Array<
      | { label: string; icon: typeof Pencil; onClick: () => void; danger?: boolean; divider?: never }
      | { divider: true; label?: never; icon?: never; onClick?: never; danger?: never }
    > = [];
    if (flow.canUpdate && imp.status === 'draft') {
      items.push({ label: 'Sửa phiếu', icon: Pencil, onClick: () => flow.openEdit(imp) });
    }
    if (flow.canSubmit && imp.status === 'draft') {
      items.push({ label: 'Chốt dự kiến', icon: Send, onClick: () => { void flow.handleSubmit(imp); } });
    }
    if (flow.canDelete && imp.status === 'draft') {
      if (items.length > 0) items.push({ divider: true });
      items.push({
        label: 'Xóa phiếu',
        icon: Trash2,
        danger: true,
        onClick: () => flow.setDeleteTarget(imp),
      });
    }
    return items;
  };

  const showActionsCol = flow.relatedImports.some(imp => actionItems(imp).length > 0);

  return (
    <section
      id="po-related-imports"
      className="pur-detail__card"
      aria-label="Phiếu nhập kho liên quan"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <h2 className="purchasing-section-title mb-0">
          Phiếu nhập kho
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
                ? 'Mở form tạo phiếu nhập từ PO này'
                : flow.placeImportBlockedReason || 'Không thể tạo phiếu nhập'
            }
            onClick={flow.openCreate}
          >
            <Plus size={14} /> Tạo phiếu nhập
          </button>
        </PermissionGate>
      </div>

      <p className="text-xs text-[var(--md-on-surface-variant)] mb-3 text-pretty">
        Bấm Tạo phiếu nhập để mở form, rồi Lưu nháp / Chốt dự kiến. Thủ kho duyệt thực tế ở màn Nhập kho.
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
        <EmptyState message="Chưa có phiếu NK gắn PO này." />
      ) : (
        <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
          <table className="pur-erp__table">
            <thead>
              <tr>
                <th className="pur-detail__th">Mã phiếu NK</th>
                <th className="pur-detail__th">Kho dự án</th>
                <th className="pur-detail__th">Trạng thái</th>
                <th className="pur-detail__th">Ngày nhận</th>
                {flow.canViewPrices ? (
                  <th className="pur-detail__th text-right">Tổng giá trị</th>
                ) : null}
                {showActionsCol ? (
                  <th className="pur-detail__th text-center w-14">Tác vụ</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {flow.relatedImports.map(imp => {
                const actions = showActionsCol ? actionItems(imp) : [];
                return (
                  <tr
                    key={imp.id}
                    className="table-row cursor-pointer"
                    onClick={() => flow.openDetail(imp)}
                  >
                    <td className="table-cell font-semibold">{imp.voucherCode}</td>
                    <td className="table-cell">{imp.project || '—'}</td>
                    <td className="table-cell">
                      <VoucherStatusCell
                        voucherKind="import"
                        status={imp.status}
                        approvedBy={imp.approvedBy}
                        approvedAt={imp.approvedAt}
                      />
                    </td>
                    <td className="table-cell tabular-nums">{receiptDateLabel(imp)}</td>
                    {flow.canViewPrices ? (
                      <td className="table-cell text-right tabular-nums">
                        {formatCurrency(imp.totalValue)}
                      </td>
                    ) : null}
                    {showActionsCol ? (
                      <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                        {actions.length > 0 ? <Dropdown items={actions} /> : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ImportCreateModal
        isOpen={flow.showCreate}
        onClose={() => { flow.setShowCreate(false); flow.resetForm(); }}
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
        onDownloadAttachment={flow.handleDownloadAttachment}
        showPrices={flow.canViewPrices}
      />

      <ConfirmDialog
        isOpen={flow.deleteTarget != null}
        onClose={() => flow.setDeleteTarget(null)}
        onConfirm={() => { void flow.handleConfirmDelete(); }}
        title="Xóa phiếu nhập kho"
        variant="danger"
        confirmLabel="Xóa phiếu"
        isLoading={flow.deletePending}
        message={
          flow.deleteTarget
            ? `Xóa phiếu nháp ${flow.deleteTarget.voucherCode}? Thao tác không hoàn tác.`
            : ''
        }
      />
    </section>
  );
}
