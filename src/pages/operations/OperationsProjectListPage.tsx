import {
  Archive,
  ArrowLeftRight,
  CheckCircle2,
  FolderKanban,
  Plus,
  RotateCcw,
} from 'lucide-react';
import PermissionGate from '../../components/auth/PermissionGate';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SearchBar from '../../components/ui/SearchBar';
import SectionCard from '../../components/ui/SectionCard';
import OperationsProjectFormModal from './projects/OperationsProjectFormModal';
import OperationsProjectsTable from './projects/OperationsProjectsTable';
import {
  PROJECT_STATUS_FILTERS,
  useOperationsProjectListController,
} from './projects/useOperationsProjectListController';

export default function OperationsProjectListPage() {
  const vm = useOperationsProjectListController();

  return (
    <PageShell variant="list" className="operations-dashboard ops-projects">
      <PageHeader
        eyebrow="Dự án EPC"
        title="Danh sách dự án"
        subtitle="Quản lý hợp đồng, chỉ huy trưởng, ngày bàn giao và thông tin các công trình EPC."
        actions={(
          <PermissionGate permission="wms.projects.create">
            <Button type="button" variant="filled" leftIcon={Plus} onClick={vm.openCreate}>
              Thêm dự án
            </Button>
          </PermissionGate>
        )}
      />

      <div className="dashboard-kpi-grid dashboard-kpi-grid--4 ops-projects-kpis" role="list" aria-label="Thống kê dự án">
        <Card
          title="Tổng dự án"
          value={vm.stats.all ?? '-'}
          accent="info"
          icon={FolderKanban}
          selected={vm.statusFilter === 'all'}
          onClick={() => vm.handleStatusFilterChange('all')}
        />
        <Card
          title="Đang triển khai"
          value={vm.stats.active ?? '-'}
          accent="success"
          icon={CheckCircle2}
          selected={vm.statusFilter === 'Active'}
          onClick={() => vm.handleStatusFilterChange('Active')}
        />
        <Card
          title="Đang chuyển giao"
          value={vm.stats.transferring ?? '-'}
          accent="amber"
          icon={ArrowLeftRight}
          selected={vm.statusFilter === 'Transferring'}
          onClick={() => vm.handleStatusFilterChange('Transferring')}
        />
        <Card
          title="Đã đóng"
          value={vm.stats.closed ?? '-'}
          accent="neutral"
          icon={Archive}
          selected={vm.statusFilter === 'Closed'}
          onClick={() => vm.handleStatusFilterChange('Closed')}
        />
      </div>

      <SectionCard noPadding className="ops-projects-board">
        <div className="ops-projects-board__head">
          <h2 className="ops-projects-board__title">Danh mục Master Dự Án</h2>
          <p className="ops-projects-board__desc">
            Quản lý tập trung các công trình EPC. Cập nhật thông tin hợp đồng, chỉ huy trưởng và thành viên điều hành.
          </p>
        </div>
        <div className="hrm-list-toolbar">
          <div className="ops-projects__toolbar">
            <SearchBar
              value={vm.search}
              onChange={vm.handleSearchChange}
              placeholder="Tìm mã DA, tên dự án..."
            />
            <div className="ops-projects-tabs" role="tablist" aria-label="Lọc trạng thái">
              {PROJECT_STATUS_FILTERS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={vm.statusFilter === item.id}
                  className={`ops-projects-tabs__btn${vm.statusFilter === item.id ? ' is-active' : ''}`}
                  onClick={() => vm.handleStatusFilterChange(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {vm.hasFilters ? (
              <Button
                type="button"
                variant="text"
                leftIcon={RotateCcw}
                onClick={vm.resetFilters}
                title="Đặt lại bộ lọc"
              >
                Xóa lọc
              </Button>
            ) : null}
          </div>
        </div>

        <OperationsProjectsTable
          items={vm.items}
          isLoading={vm.isLoading}
          hasFilters={vm.hasFilters}
          page={vm.page}
          pageSize={vm.pageSize}
          totalCount={vm.totalCount}
          totalPages={vm.totalPages}
          onPageChange={vm.setPage}
          onPageSizeChange={vm.handlePageSizeChange}
          onEdit={vm.openEdit}
        />
      </SectionCard>

      <OperationsProjectFormModal
        isOpen={vm.showForm}
        editing={vm.editing}
        form={vm.form}
        errors={vm.errors}
        pending={vm.pending}
        onChange={vm.setForm}
        onClose={() => vm.setShowForm(false)}
        onSave={() => { void vm.handleSave(); }}
      />
    </PageShell>
  );
}
