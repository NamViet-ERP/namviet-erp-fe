import { Plus, RefreshCw } from 'lucide-react';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import SelectField from '../../components/ui/SelectField';
import PurchaseContractModal from './contracts/PurchaseContractModal';
import PurchaseContractsTable from './contracts/PurchaseContractsTable';
import {
  CONTRACT_STATUS_OPTIONS,
  usePurchaseContractsController,
} from './contracts/usePurchaseContractsController';

export default function PurchaseContractsPage() {
  const vm = usePurchaseContractsController();

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow="Mua hàng"
          title="Hợp đồng"
          subtitle="Quản lý hợp đồng mua hàng độc lập - gắn PO / NCC / dự án"
          actions={(
            <div className="flex flex-wrap gap-2">
              {vm.canCreate ? (
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  leftIcon={RefreshCw}
                  disabled={vm.busy}
                  onClick={vm.onImportFromPo}
                >
                  {vm.importPending ? 'Đang nhập…' : 'Nhập từ đính kèm PO'}
                </Button>
              ) : null}
              {vm.canCreate ? (
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  leftIcon={Plus}
                  onClick={vm.openCreate}
                >
                  Tạo hợp đồng
                </Button>
              ) : null}
            </div>
          )}
        />

        <SectionCard noPadding>
          <FilterToolbar
            search={vm.search}
            onSearchChange={value => {
              vm.setSearch(value);
              vm.setPage(1);
            }}
            searchPlaceholder="Tìm số HĐ, tiêu đề, PO, NCC…"
            hasActiveFilters={vm.hasFilters}
            onReset={vm.handleResetFilters}
            filters={(
              <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
                <ProjectAutocomplete
                  value={vm.projectCode}
                  onChange={code => {
                    vm.setProjectCode(code);
                    vm.setPage(1);
                  }}
                  projects={vm.projects}
                  placeholder="Lọc dự án"
                  compact
                />
                <SelectField
                  value={vm.status}
                  onChange={next => {
                    vm.setStatus(next);
                    vm.setPage(1);
                  }}
                  options={CONTRACT_STATUS_OPTIONS}
                  aria-label="Lọc trạng thái"
                  selectClassName="form-input w-full"
                />
              </div>
            )}
          />

          <PurchaseContractsTable
            items={vm.items}
            isLoading={vm.isLoading}
            errorMessage={vm.errorMessage}
            onOpenEdit={vm.openEdit}
            onDownload={vm.onDownload}
            pagination={vm.pagination}
          />
        </SectionCard>
      </PageShell>

      <PurchaseContractModal
        isOpen={vm.modalOpen}
        title={vm.modalTitle}
        creating={vm.creating}
        selectedId={vm.selectedId}
        detailLoading={vm.detailQuery.isLoading}
        detailData={vm.detailQuery.data}
        form={vm.form}
        busy={vm.busy}
        canCreate={vm.canCreate}
        canUpdate={vm.canUpdate}
        projects={vm.projects}
        suppliers={vm.suppliers}
        orders={vm.orders}
        selectableOrders={vm.selectableOrders}
        fileInputRef={vm.fileInputRef}
        onClose={vm.closeModal}
        onPatchForm={vm.patchForm}
        onSave={vm.onSave}
        onUpload={vm.onUpload}
        onDownload={vm.onDownload}
        onRequestDelete={vm.setDeleteId}
      />

      <ConfirmDialog
        isOpen={Boolean(vm.deleteId)}
        onClose={() => vm.setDeleteId(null)}
        onConfirm={() => { void vm.onConfirmDelete(); }}
        title="Xóa hợp đồng"
        message={(
          <span>
            Bạn có chắc chắn muốn xóa hợp đồng{' '}
            <strong>
              {vm.detailQuery.data?.contractNo
                ? `${vm.detailQuery.data.contractNo} (${vm.detailQuery.data.code})`
                : vm.form.contractNo || vm.detailQuery.data?.code || 'này'}
            </strong>
            ? Thao tác này không thể hoàn tác.
          </span>
        )}
        confirmLabel="Xóa"
        variant="danger"
        isLoading={vm.deletePending}
      />
    </>
  );
}
