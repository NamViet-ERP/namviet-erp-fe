import { useLocation } from 'react-router-dom';
import { Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import { isIssueFromGeneralWarehouse } from './import/importUtils';
import ImportTable from './import/ImportTable';
import ImportDetailModal from './import/ImportDetailModal';
import { useImportListController } from './import/useImportListController';

export default function ImportListPageRoute() {
  const location = useLocation();
  const initialProjectCode = (location.state as { projectCode?: string } | null)?.projectCode;
  return <ImportListPageApi key={location.key} initialProjectCode={initialProjectCode} />;
}

interface ImportListPageApiProps {
  initialProjectCode?: string;
}

function ImportListPageApi({ initialProjectCode }: ImportListPageApiProps) {
  const vm = useImportListController(initialProjectCode);

  return (
    <PageShell>
      <PageHeader
        title="Nhập kho"
        subtitle="Phiếu nhập dự kiến chờ duyệt thực tế và phiếu đã nhập — tạo phiếu nháp/dự kiến trên đơn hàng PO."
        actions={
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
        }
      />

      <SectionCard noPadding>
        <FilterToolbar
          tabs={vm.tabs}
          activeTab={vm.activeTab}
          onTabChange={id => { vm.setActiveTab(id); vm.setPage(1); }}
          search={vm.search}
          onSearchChange={v => { vm.setSearch(v); vm.setPage(1); }}
          searchPlaceholder="Tìm mã chứng từ, NCC, kho dự án..."
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

        <ImportTable
          rows={vm.paginated}
          isLoading={vm.isLoading}
          isError={vm.isError}
          error={vm.error}
          projectName={vm.projectName}
          onOpenDetail={vm.openDetail}
          showPrices={vm.canViewPrices}
          pagination={
            vm.filtered.length > 0 && !vm.isLoading
              ? {
                  itemLabel: 'phiếu nhập',
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

      <ImportDetailModal
        isOpen={vm.showDetail}
        onClose={() => vm.setShowDetail(false)}
        selected={vm.selected}
        projectName={vm.projectName}
        onApprove={vm.canApproveImport ? (imp, settlement) => { void vm.handleApprove(imp, settlement); } : undefined}
        isApproving={vm.approveMutation.isPending}
        onDownloadAttachment={vm.handleDownloadAttachment}
        canUpdateEvidence={vm.canApproveImport}
        isEvidencePending={vm.isEvidencePending}
        onUploadAttachment={vm.handleUploadAttachment}
        onDeleteAttachment={vm.handleDeleteAttachment}
        onSaveEvaluation={vm.handleSaveEvaluation}
        showPrices={vm.canViewPrices && !isIssueFromGeneralWarehouse(vm.selected)}
      />

      <ConfirmDialog
        isOpen={vm.budgetConfirmImport != null && vm.budgetExceeded != null}
        onClose={() => {
          vm.setBudgetConfirmImport(null);
          vm.setBudgetExceeded(null);
        }}
        onConfirm={() => {
          if (vm.budgetConfirmImport) void vm.runApprove(vm.budgetConfirmImport, true, vm.pendingSettlement);
        }}
        title="Vượt ngân sách vật tư"
        variant="default"
        confirmLabel="Vẫn duyệt"
        isLoading={vm.approveMutation.isPending}
        message={vm.budgetExceeded ? (
          <div>
            <p className="mb-2">
              Dự án <strong>{vm.projectName(vm.budgetExceeded.projectCode)}</strong> ({vm.budgetExceeded.projectCode})
              đang vượt ngân sách kế hoạch:
            </p>
            <div className="bg-[var(--md-surface-variant)] p-3 rounded text-sm space-y-1 mb-2">
              <div className="flex justify-between">
                <span>Ngân sách kế hoạch:</span>
                <span className="font-semibold">{formatCurrencyFull(vm.budgetExceeded.materialBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span>Đã thực hiện (gồm phiếu này):</span>
                <span className="font-semibold text-[var(--md-warning)]">{formatCurrencyFull(vm.budgetExceeded.approvedImportValue + vm.budgetExceeded.importValue)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--md-outline-variant)] pt-1 text-[var(--md-error)] font-semibold">
                <span>Vượt ngân sách:</span>
                <span>+{formatCurrencyFull(vm.budgetExceeded.overflowAmount)}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--md-on-surface-variant)]">
              Bạn có quyền phê duyệt để tiếp tục duyệt phiếu nhập này.
            </p>
          </div>
        ) : ''}
      />
    </PageShell>
  );
}
