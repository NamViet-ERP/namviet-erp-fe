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
import { GENERAL_WAREHOUSE_LABEL_LOWER } from '../../lib/wms/stockTerminology';
import TransferCreateModal from './transfer/TransferCreateModal';
import TransferDetailModal from './transfer/TransferDetailModal';
import TransferTable from './transfer/TransferTable';
import { useTransferListController } from './transfer/useTransferListController';

export default function TransferListPageRoute() {
  const location = useLocation();
  const initialProjectCode = (location.state as { projectCode?: string } | null)?.projectCode;
  return <TransferListPageApi key={location.key} initialProjectCode={initialProjectCode} />;
}

interface TransferListPageApiProps {
  initialProjectCode?: string;
}

function TransferListPageApi({ initialProjectCode }: TransferListPageApiProps) {
  const vm = useTransferListController(initialProjectCode);

  return (
    <PageShell>
      <PageHeader
        title="Chuyển kho"
        subtitle={`Hàng vào ${GENERAL_WAREHOUSE_LABEL_LOWER} chỉ khi hoàn trả và thủ kho duyệt. Nhập/xuất thực tế không cộng kho tổng.`}
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
            <PermissionGate permission="wms.transfers.create">
              <Button
                type="button"
                variant="filled"
                leftIcon={Plus}
                onClick={() => { vm.resetForm(); vm.setShowCreate(true); }}
              >
                Tạo phiếu chuyển
              </Button>
            </PermissionGate>
          </>
        }
      />

      <SectionCard noPadding>
        <div className="erp-filter-toolbar__tabs">
          <TabFilter
            tabs={vm.typeTabs}
            activeTab={vm.transferTypeTab}
            onChange={id => {
              vm.setTransferTypeTab(id as 'all' | 'return' | 'cross-project');
              vm.setPage(1);
            }}
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

        <TransferTable
          rows={vm.paginated}
          isLoading={vm.isLoading}
          isError={vm.isError}
          error={vm.error}
          onOpenDetail={vm.openDetail}
          onEdit={vm.openEdit}
          onSubmit={vm.handleSubmit}
          onApprove={vm.handleApprove}
          pagination={
            vm.filtered.length > 0 && !vm.isLoading
              ? {
                  itemLabel: 'phiếu chuyển',
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

      <TransferCreateModal
        isOpen={vm.showCreate}
        onClose={() => { vm.setShowCreate(false); vm.resetForm(); }}
        isPending={vm.createMutation.isPending || vm.updateMutation.isPending}
        projects={vm.projects}
        targetProjects={vm.targetProjects}
        stockMaterials={vm.stockMaterials}
        projectInventory={vm.projectInventory}
        frozenByProjectCode={vm.frozenByProjectCode}
        transferMode={vm.transferMode}
        onTransferModeChange={vm.setTransferMode}
        projectCode={vm.projectCode}
        onProjectCodeChange={vm.handleProjectCodeChange}
        toProjectCode={vm.toProjectCode}
        onToProjectCodeChange={vm.handleToProjectCodeChange}
        note={vm.note}
        onNoteChange={vm.setNote}
        items={vm.items}
        onItemsChange={vm.handleItemsChange}
        onDuplicateMaterialAttempt={vm.handleDuplicateMaterialAttempt}
        errors={vm.createErrors}
        onCreate={vm.handleCreate}
        onSave={vm.handleUpdate}
        editVoucher={vm.editing ? { code: vm.editing.voucherCode } : null}
        materialUnit={vm.materialUnit}
      />

      <TransferDetailModal
        isOpen={vm.showDetail}
        onClose={() => vm.setShowDetail(false)}
        selected={vm.selected}
        isSubmitPending={vm.submitMutation.isPending}
        isApprovePending={vm.approveMutation.isPending}
        onSubmit={vm.handleSubmit}
        onApprove={vm.handleApprove}
      />
    </PageShell>
  );
}
