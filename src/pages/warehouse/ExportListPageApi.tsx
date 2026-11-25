import { useLocation } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import PermissionGate from '../../components/auth/PermissionGate';
import Button from '../../components/ui/Button';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import TabFilter from '../../components/ui/TabFilter';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import ExportCreateModal from './export/ExportCreateModal';
import ExportDetailModal from './export/ExportDetailModal';
import ExportTable from './export/ExportTable';
import { useExportListController } from './export/useExportListController';
import ImportDetailModal from './import/ImportDetailModal';
import { isIssueFromGeneralWarehouse } from './import/importUtils';

export default function ExportListPageRoute() {
  const location = useLocation();
  const state = location.state as { projectCode?: string; openVoucherCode?: string } | null;
  return (
    <ExportListPageApi
      key={location.key}
      initialProjectCode={state?.projectCode}
      openVoucherCode={state?.openVoucherCode}
    />
  );
}

interface ExportListPageApiProps {
  initialProjectCode?: string;
  openVoucherCode?: string;
}

function ExportListPageApi({ initialProjectCode, openVoucherCode }: ExportListPageApiProps) {
  const vm = useExportListController(initialProjectCode, openVoucherCode);

  return (
    <PageShell>
      <PageHeader
        title="Xuất kho"
        subtitle="Xuất từ kho trừ tồn sau khi duyệt. Xuất thẳng công trường do cung ứng lập từ PO - thủ kho duyệt thực tế, tồn không tăng."
        actions={
          <>
            <Button
              type="button"
              variant="outlined"
              size="sm"
              leftIcon={Download}
              onClick={() => void vm.handleExportExcel()}
              disabled={vm.isExporting}
            >
              {vm.isExporting ? 'Đang xuất…' : 'Xuất Excel'}
            </Button>
            <PermissionGate permission="wms.exports.create">
              <Button
                type="button"
                variant="filled"
                leftIcon={Plus}
                onClick={() => { vm.resetForm(); vm.setShowCreate(true); }}
              >
                Tạo phiếu xuất
              </Button>
            </PermissionGate>
          </>
        }
      />

      <SectionCard noPadding>
        <div className="erp-filter-toolbar__tabs">
          <TabFilter
            tabs={vm.kindTabs}
            activeTab={vm.kindTab}
            onChange={id => { vm.setKindTab(id); vm.setPage(1); }}
          />
        </div>
        <FilterToolbar
          tabs={vm.tabs}
          activeTab={vm.activeTab}
          onTabChange={id => { vm.setActiveTab(id); vm.setPage(1); }}
          search={vm.search}
          onSearchChange={v => { vm.setSearch(v); vm.setPage(1); }}
          searchPlaceholder="Tìm mã chứng từ, kho dự án..."
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

        <ExportTable
          rows={vm.paginated}
          isLoading={vm.isLoading}
          isError={vm.isError}
          error={vm.error}
          onOpenDetail={exp => { void vm.openDetail(exp); }}
          onEdit={vm.openEdit}
          onSubmit={vm.handleSubmit}
          onApprove={vm.handleApprove}
          pagination={
            vm.filtered.length > 0 && !vm.isLoading
              ? {
                  itemLabel: 'phiếu xuất',
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

      <ExportCreateModal
        isOpen={vm.showCreate}
        onClose={() => { vm.setShowCreate(false); vm.resetForm(); }}
        isPending={vm.createMutation.isPending || vm.updateMutation.isPending}
        projects={vm.projects}
        stockMaterials={vm.stockMaterials}
        projectInventory={vm.projectInventory}
        projectCode={vm.projectCode}
        frozenByProjectCode={vm.frozenByProjectCode}
        onProjectCodeChange={vm.handleProjectCodeChange}
        note={vm.note}
        onNoteChange={vm.setNote}
        items={vm.items}
        onItemsChange={vm.handleItemsChange}
        onDuplicateMaterialAttempt={vm.handleDuplicateMaterialAttempt}
        errors={vm.createErrors}
        onCreate={vm.handleCreate}
        onSave={vm.handleUpdate}
        editVoucher={vm.editing ? { code: vm.editing.voucherCode } : null}
        originalItems={vm.editing && vm.editing.project === vm.projectCode ? vm.editing.items : undefined}
        materialUnit={vm.materialUnit}
      />

      <ExportDetailModal
        isOpen={vm.showDetail}
        onClose={() => vm.setShowDetail(false)}
        selected={vm.selected}
        isSubmitPending={vm.submitMutation.isPending}
        isApprovePending={vm.approveMutation.isPending}
        onSubmit={vm.handleSubmit}
        onApprove={vm.handleApprove}
      />

      <ImportDetailModal
        isOpen={vm.showDirectDetail}
        onClose={() => {
          vm.setShowDirectDetail(false);
          vm.setDirectImport(null);
        }}
        selected={vm.directImport}
        projectName={vm.projectName}
        onApprove={vm.canApproveImport ? (imp, settlement) => { void vm.handleDirectApprove(imp, settlement); } : undefined}
        isApproving={vm.approveImportMutation.isPending}
        onDownloadAttachment={vm.handleDirectDownload}
        canUpdateEvidence={vm.canApproveImport}
        isEvidencePending={vm.isEvidencePending}
        onUploadAttachment={vm.handleDirectUpload}
        onDeleteAttachment={vm.handleDirectDeleteAttachment}
        onSaveEvaluation={vm.handleDirectSaveEvaluation}
        showPrices={vm.canViewPrices && !isIssueFromGeneralWarehouse(vm.directImport)}
      />
    </PageShell>
  );
}
