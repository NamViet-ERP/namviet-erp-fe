import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PermissionGate from '../../components/auth/PermissionGate';
import Button from '../../components/ui/Button';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import ExportReturnCreateModal from './materialReturn/ExportReturnCreateModal';
import ExportReturnDetailModal from './materialReturn/ExportReturnDetailModal';
import ExportReturnTable from './materialReturn/ExportReturnTable';
import { useMaterialReturnController } from './materialReturn/useMaterialReturnController';

export default function MaterialReturnPageRoute() {
  const location = useLocation();
  const initialProjectCode = (location.state as { projectCode?: string } | null)?.projectCode;
  return <MaterialReturnPage key={location.key} initialProjectCode={initialProjectCode} />;
}

interface MaterialReturnPageProps {
  initialProjectCode?: string;
}

function MaterialReturnPage({ initialProjectCode }: MaterialReturnPageProps) {
  const vm = useMaterialReturnController(initialProjectCode);

  return (
    <PageShell>
      <PageHeader
        title="Hoàn trả vật tư"
        subtitle="Hoàn trả vật tư chưa dùng hết về kho dự án theo phiếu xuất nguồn."
        actions={
          <PermissionGate permission="wms.export_returns.create">
            <Button
              type="button"
              variant="filled"
              leftIcon={Plus}
              onClick={() => { vm.resetForm(); vm.setShowCreate(true); }}
            >
              Tạo phiếu hoàn trả
            </Button>
          </PermissionGate>
        }
      />

      <SectionCard noPadding>
        <FilterToolbar
          tabs={vm.tabs}
          activeTab={vm.activeTab}
          onTabChange={id => { vm.setActiveTab(id); vm.setPage(1); }}
          search={vm.search}
          onSearchChange={v => { vm.setSearch(v); vm.setPage(1); }}
          searchPlaceholder="Tìm mã HT, phiếu xuất, kho dự án..."
          filters={
            <VoucherDateFilter
              from={vm.dateFrom}
              to={vm.dateTo}
              onFromChange={v => { vm.setDateFrom(v); vm.setPage(1); }}
              onToChange={v => { vm.setDateTo(v); vm.setPage(1); }}
              onReset={() => { vm.setDateFrom(''); vm.setDateTo(''); vm.setPage(1); }}
            />
          }
        />

        <ExportReturnTable
          rows={vm.paginated}
          isLoading={vm.returnsLoading}
          isError={vm.returnsError}
          error={vm.returnsQueryError}
          onOpenDetail={row => { void vm.openDetail(row); }}
          onEdit={vm.openEdit}
          onSubmit={row => void vm.handleSubmit(row)}
          onApprove={row => void vm.handleApprove(row)}
          pagination={
            vm.filtered.length > 0 && !vm.returnsLoading
              ? {
                  itemLabel: 'phiếu hoàn trả',
                  currentPage: vm.page,
                  totalPages: vm.totalPages,
                  onPageChange: vm.setPage,
                  pageSize: vm.pageSize,
                  onPageSizeChange: s => { vm.setPageSize(s); vm.setPage(1); },
                  totalItems: vm.filtered.length,
                }
              : undefined
          }
        />
      </SectionCard>

      <ExportReturnCreateModal
        isOpen={vm.showCreate}
        onClose={() => { vm.setShowCreate(false); vm.resetForm(); }}
        isPending={vm.createMutation.isPending || vm.updateMutation.isPending}
        projects={vm.projects}
        returnableExports={vm.returnableExports}
        exportsLoading={vm.exportsLoading}
        projectCode={vm.projectCode}
        frozenByProjectCode={vm.frozenByProjectCode}
        onProjectCodeChange={vm.handleProjectCodeChange}
        sourceExportId={vm.sourceExportId}
        onSourceExportIdChange={vm.setSourceExportId}
        note={vm.note}
        onNoteChange={vm.setNote}
        lines={vm.formLines}
        onLinesChange={vm.setFormLines}
        linesLoading={vm.linesLoading}
        errors={vm.createErrors}
        photoFiles={vm.createPhotoFiles}
        onPhotoFilesChange={vm.setCreatePhotoFiles}
        onCreate={status => void vm.handleCreate(status)}
        onSave={() => void vm.handleUpdate()}
        editVoucher={vm.editing ? { code: vm.editing.voucherCode } : null}
      />

      <ExportReturnDetailModal
        isOpen={vm.showDetail}
        onClose={() => vm.setShowDetail(false)}
        selected={vm.selected}
        isSubmitPending={vm.submitMutation.isPending}
        isApprovePending={vm.approveMutation.isPending}
        onSubmit={row => void vm.handleSubmit(row)}
        onApprove={row => void vm.handleApprove(row)}
        onReload={vm.reloadSelected}
      />
    </PageShell>
  );
}
