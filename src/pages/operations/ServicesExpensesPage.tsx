import { useState } from 'react';
import { Briefcase, Coins, Plus, RotateCcw, Upload } from 'lucide-react';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SearchBar from '../../components/ui/SearchBar';
import SectionCard from '../../components/ui/SectionCard';
import ServiceExpenseImportModal from './ServiceExpenseImportModal';
import ServiceExpenseFormModal from './services/ServiceExpenseFormModal';
import ServicesExpensesTable from './services/ServicesExpensesTable';
import { useServicesExpensesController } from './services/useServicesExpensesController';

export default function ServicesExpensesPage() {
  const vm = useServicesExpensesController();
  const [importModalOpen, setImportModalOpen] = useState(false);

  return (
    <PageShell variant="list">
      <PageHeader
        eyebrow="Dự án EPC · Master Data"
        title="Danh mục Dịch vụ & Chi phí"
        subtitle="Mã định danh chuẩn cho dịch vụ thi công, thầu phụ và chi phí ngoài dự án (dùng trong KHMH, PO và DNTT)"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outlined"
              onClick={() => setImportModalOpen(true)}
            >
              <Upload size={16} aria-hidden />
              <span>Nhập Excel</span>
            </Button>
            <Button
              type="button"
              variant="filled"
              leftIcon={Plus}
              onClick={vm.openCreateModal}
            >
              Thêm dịch vụ / chi phí
            </Button>
          </div>
        )}
      />

      <SectionCard noPadding className="mat-catalog-board">
        <div className="mat-catalog-board__head">
          <h2 className="mat-catalog-board__title">Danh sách dịch vụ &amp; chi phí dự án</h2>
          <p className="mat-catalog-board__desc">
            Mã định danh chuẩn cho dịch vụ thi công và chi phí ngoài dự án (dùng trong KHMH, PO và DNTT).
          </p>
        </div>

        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <div className="mat-catalog__toolbar">
              <SearchBar
                value={vm.search}
                onChange={vm.handleSearchChange}
                placeholder="Tìm theo mã, tên hoặc ghi chú…"
              />

              <div
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-[var(--md-surface-container-highest)] rounded-lg border border-[var(--md-outline-variant)] text-xs"
                role="group"
                aria-label="Lọc theo phân loại"
              >
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                    vm.typeFilter === 'all'
                      ? 'bg-[var(--md-surface-container)] text-[var(--md-primary)] shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => vm.handleTypeFilterChange('all')}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all inline-flex items-center gap-1.5 ${
                    vm.typeFilter === 'service'
                      ? 'bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => vm.handleTypeFilterChange('service')}
                >
                  <Briefcase size={13} aria-hidden />
                  <span>Dịch vụ</span>
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all inline-flex items-center gap-1.5 ${
                    vm.typeFilter === 'expense'
                      ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => vm.handleTypeFilterChange('expense')}
                >
                  <Coins size={13} aria-hidden />
                  <span>Chi phí ngoài</span>
                </button>
              </div>

              <button
                type="button"
                onClick={vm.toggleShowInactive}
                className={`mat-catalog__status${vm.showInactive ? ' is-on' : ''}`}
                aria-pressed={vm.showInactive}
              >
                {vm.showInactive ? 'Hiện cả ngừng SD' : 'Chỉ đang dùng'}
              </button>

              {vm.hasActiveFilters && (
                <Button
                  type="button"
                  variant="text"
                  leftIcon={RotateCcw}
                  onClick={vm.resetFilters}
                  title="Đặt lại bộ lọc"
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          </div>
        </div>

        <ServicesExpensesTable
          items={vm.items}
          isLoading={vm.isLoading}
          isError={vm.isError}
          isToggling={vm.isToggling}
          hasActiveFilters={vm.hasActiveFilters}
          page={vm.page}
          pageSize={vm.pageSize}
          total={vm.total}
          totalPages={vm.totalPages}
          onPageChange={vm.setPage}
          onPageSizeChange={vm.handlePageSizeChange}
          onRetry={() => { void vm.refetch(); }}
          onOpenCreate={vm.openCreateModal}
          onEdit={vm.openEditModal}
          onDelete={vm.setDeleteTarget}
          onToggle={item => { void vm.handleToggle(item); }}
        />
      </SectionCard>

      <ServiceExpenseFormModal
        isOpen={vm.modalOpen}
        editingItem={vm.editingItem}
        formData={vm.formData}
        isSaving={vm.isSaving}
        onChange={vm.setFormData}
        onClose={() => vm.setModalOpen(false)}
        onSave={() => { void vm.handleSave(); }}
      />

      <ServiceExpenseImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          void vm.refetch();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(vm.deleteTarget)}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa mục "${vm.deleteTarget?.code} — ${vm.deleteTarget?.name}"? Nếu mục này đã được sử dụng trong KHMH, hệ thống sẽ từ chối xóa để đảm bảo toàn vẹn dữ liệu.`}
        confirmLabel="Xóa mục này"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={vm.isDeleting}
        onConfirm={() => { void vm.handleDeleteConfirm(); }}
        onClose={() => vm.setDeleteTarget(null)}
      />
    </PageShell>
  );
}
