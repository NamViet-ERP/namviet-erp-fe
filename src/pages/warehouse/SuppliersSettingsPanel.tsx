import { useNavigate } from 'react-router-dom';
import {
  Award, Ban, Banknote, Check, ClipboardList, Eye,
  History, Pencil, Plus, Trash2, Upload, Users, X,
} from 'lucide-react';
import SupplierSourcingKpiCards from '../../components/suppliers/SupplierSourcingKpiCards';
import Button from '../../components/ui/Button';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import { SUPPLIER_APPROVAL, normalizeSupplierApproval } from '../../lib/suppliers/supplierStatus';
import type { DropdownItem } from '../../types';
import SupplierConfirmDialogs from './suppliers/SupplierConfirmDialogs';
import SupplierDetailModal from './suppliers/SupplierDetailModal';
import SupplierExtraModals from './suppliers/SupplierExtraModals';
import SupplierFormModal from './suppliers/SupplierFormModal';
import type { SupplierRow } from './suppliers/SupplierShared';
import SuppliersTable, { SuppliersFilterBar } from './suppliers/SuppliersTable';
import { useSuppliersSettingsController } from './suppliers/useSuppliersSettingsController';

type PanelProps = {
  subtitle?: string;
};

export default function SuppliersSettingsPanel({
  subtitle = 'NCC mới là Hạng D, trạng thái Mới. Sếp duyệt xong mới đặt PO được.',
}: PanelProps) {
  const navigate = useNavigate();
  const c = useSuppliersSettingsController();

  const rowActions = (s: SupplierRow): DropdownItem[] => [
    { label: 'Xem chi tiết', icon: Eye, onClick: () => c.setViewing(s) },
    { label: 'Sửa', icon: Pencil, onClick: () => void c.openEdit(s) },
    { label: 'Xem công nợ NCC', icon: Banknote, onClick: () => navigate(`/suppliers/debt?supplierId=${s.id}`) },
    { label: 'Xem người liên hệ', icon: Users, onClick: () => navigate(`/suppliers/contacts?supplierId=${s.id}`) },
    {
      label: 'Xem đơn mua hàng (PO)',
      icon: ClipboardList,
      onClick: () => navigate(`/purchasing/orders?search=${encodeURIComponent(s.supplierCode)}`),
    },
    { label: 'Đánh giá thăng hạng (50-20-20-10)', icon: Award, onClick: () => c.setEvaluatingSupplier(s) },
    { label: 'Lịch sử chuyển hạng', icon: History, onClick: () => c.setHistorySupplier(s) },
    ...(c.canApproveSupplier && normalizeSupplierApproval(s.approvalStatus) !== SUPPLIER_APPROVAL.Approved
      ? [
          { label: 'Duyệt NCC', icon: Check, onClick: () => c.setApproveTarget(s) },
          { label: 'Từ chối', icon: X, danger: true, onClick: () => c.setRejectTarget(s) },
        ]
      : []),
    { divider: true },
    { label: 'Thêm vào blacklist', icon: Ban, danger: true, onClick: () => c.openBlacklist(s) },
    { divider: true },
    { label: 'Xóa', icon: Trash2, danger: true, onClick: () => c.setDeleteTarget(s) },
  ];

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow="Nhà cung cấp"
          title="Nhà cung cấp"
          subtitle={subtitle}
          actions={(
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outlined"
                size="sm"
                leftIcon={Upload}
                onClick={() => c.setIsImportModalOpen(true)}
                title="Nhập danh sách nhà cung cấp hàng loạt từ file Excel"
              >
                Upload Excel NCC
              </Button>
              <Button
                type="button"
                variant="filled"
                size="sm"
                leftIcon={Plus}
                onClick={() => void c.openCreate()}
              >
                Thêm NCC
              </Button>
            </div>
          )}
        />
        <SupplierSourcingKpiCards
          onGradeFilterSelect={g => {
            c.setRatingFilter(g);
            c.setPage(1);
          }}
        />
        <SectionCard noPadding>
          <FilterToolbar
            search={c.search}
            onSearchChange={value => {
              c.setSearch(value);
              c.setPage(1);
            }}
            searchPlaceholder="Tìm mã NCC, tên nhà cung cấp…"
            filters={(
              <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
                <SuppliersFilterBar
                  ratingFilter={c.ratingFilter}
                  onRatingFilterChange={value => {
                    c.setRatingFilter(value);
                    c.setPage(1);
                  }}
                  statusFilter={c.statusFilter}
                  onStatusFilterChange={value => {
                    c.setStatusFilter(value);
                    c.setPage(1);
                  }}
                  groupIdFromUrl={c.groupIdFromUrl}
                  filteredGroupName={c.filteredGroupName}
                  onClearGroupFilter={c.clearGroupFilter}
                />
              </div>
            )}
            hasActiveFilters={c.hasActiveFilters}
            onReset={c.resetFilters}
          />
          <SuppliersTable
            items={c.items}
            isLoading={c.isLoading}
            isError={c.isError}
            hasActiveFilters={c.hasActiveFilters}
            page={c.page}
            pageSize={c.pageSize}
            totalCount={c.totalCount}
            totalPages={c.totalPages}
            onPageChange={c.setPage}
            onPageSizeChange={s => {
              c.setPageSize(s);
              c.setPage(1);
            }}
            onOpenCreate={() => void c.openCreate()}
            onViewSupplier={c.setViewing}
            rowActions={rowActions}
          />
        </SectionCard>
      </PageShell>

      <SupplierDetailModal
        viewing={c.viewing}
        canApproveSupplier={c.canApproveSupplier}
        openingEdit={c.openingEdit}
        onClose={() => c.setViewing(null)}
        onOpenBlacklist={c.openBlacklist}
        onApprove={s => c.setApproveTarget(s)}
        onReject={s => c.setRejectTarget(s)}
        onEdit={s => void c.openEdit(s)}
        onAddContact={() => c.setIsContactModalOpen(true)}
        onAttachmentChanged={c.invalidateSuppliers}
      />

      <SupplierFormModal
        isOpen={c.showForm}
        editing={c.editing}
        form={c.form}
        setForm={c.setForm}
        formErrors={c.formErrors}
        setFormErrors={c.setFormErrors}
        groupOptions={c.groupOptions}
        stagedFiles={c.stagedFiles}
        onAddStagedFile={c.addStagedFile}
        onRemoveStagedFile={c.removeStagedFile}
        onAttachmentChanged={c.invalidateSuppliers}
        isSaving={c.isSaving}
        onClose={c.closeForm}
        onSubmit={e => { void c.handleSubmit(e); }}
        onFetchNextCode={() => { void c.handleFetchNextCode(); }}
      />

      <SupplierConfirmDialogs
        deleteTarget={c.deleteTarget}
        onCloseDelete={() => c.setDeleteTarget(null)}
        onConfirmDelete={() => { void c.handleDelete(); }}
        isDeleting={c.isDeleting}
        blacklistTarget={c.blacklistTarget}
        blacklistReason={c.blacklistReason}
        onBlacklistReasonChange={c.setBlacklistReason}
        onCloseBlacklist={() => { c.setBlacklistTarget(null); c.setBlacklistReason(''); }}
        onConfirmBlacklist={() => { void c.handleAddBlacklist(); }}
        isBlacklisting={c.isBlacklisting}
        approveTarget={c.approveTarget}
        onCloseApprove={() => c.setApproveTarget(null)}
        onConfirmApprove={() => { void c.handleApprove(); }}
        isApproving={c.isApproving}
        rejectTarget={c.rejectTarget}
        onCloseReject={() => c.setRejectTarget(null)}
        onConfirmReject={() => { void c.handleReject(); }}
        isRejecting={c.isRejecting}
      />

      <SupplierExtraModals
        evaluatingSupplier={c.evaluatingSupplier}
        onCloseEvaluating={() => c.setEvaluatingSupplier(null)}
        historySupplier={c.historySupplier}
        onCloseHistory={() => c.setHistorySupplier(null)}
        isImportModalOpen={c.isImportModalOpen}
        onCloseImport={() => c.setIsImportModalOpen(false)}
        viewingSupplierId={c.viewing?.id ?? null}
        isContactModalOpen={c.isContactModalOpen}
        onCloseContact={() => c.setIsContactModalOpen(false)}
      />
    </>
  );
}
