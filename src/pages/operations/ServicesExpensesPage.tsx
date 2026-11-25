import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Briefcase, Coins, RotateCcw, Upload } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import CurrencyInput from '../../components/ui/CurrencyInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import IOSSwitch from '../../components/ui/IOSSwitch';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import type { ListPageSize } from '../../constants/pagination';
import SectionCard from '../../components/ui/SectionCard';
import MaterialUnitSelect from '../../components/warehouse/MaterialUnitSelect';
import ServiceExpenseImportModal from './ServiceExpenseImportModal';
import {
  useServiceExpenseItems,
  useCreateServiceExpenseItem,
  useUpdateServiceExpenseItem,
  useToggleServiceExpenseItemActive,
  useDeleteServiceExpenseItem,
} from '../../hooks/useServiceExpenseItems';
import type {
  CreateServiceExpenseItemRequest,
  ServiceExpenseItemApiDto,
  ServiceExpenseType,
} from '../../types/api/serviceExpenseItem';

interface FormState {
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const initialFormState: FormState = {
  code: '',
  name: '',
  type: 'service',
  unit: '',
  referencePrice: '',
  description: '',
  isActive: true,
  sortOrder: 0,
};

export default function ServicesExpensesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'service' | 'expense'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(15);

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceExpenseItemApiDto | null>(null);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [deleteTarget, setDeleteTarget] = useState<ServiceExpenseItemApiDto | null>(null);

  const queryParams = useMemo(() => ({
    page,
    pageSize,
    search: search.trim() || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    isActive: showInactive ? undefined : true,
  }), [page, pageSize, search, typeFilter, showInactive]);

  const { data, isLoading, isError, refetch } = useServiceExpenseItems(queryParams);
  const createMutation = useCreateServiceExpenseItem();
  const updateMutation = useUpdateServiceExpenseItem();
  const toggleMutation = useToggleServiceExpenseItemActive();
  const deleteMutation = useDeleteServiceExpenseItem();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      ...initialFormState,
      type: typeFilter === 'expense' ? 'expense' : 'service',
      unit: '',
      sortOrder: total + 1,
    });
    setModalOpen(true);
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setShowInactive(false);
    setPage(1);
  };

  const openEditModal = (item: ServiceExpenseItemApiDto) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
      unit: item.unit,
      referencePrice: item.referencePrice != null ? String(item.referencePrice) : '',
      description: item.description ?? '',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setModalOpen(true);
  };

  const handleToggle = async (item: ServiceExpenseItemApiDto) => {
    try {
      await toggleMutation.mutateAsync(item.id);
      showToast('success', `Đã ${item.isActive ? 'tắt' : 'bật'} kích hoạt "${item.code}".`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đổi trạng thái hoạt động.'));
    }
  };

  const handleSave = async () => {
    const code = formData.code.trim().toUpperCase();
    const name = formData.name.trim();
    const unit = formData.unit.trim();

    if (!code) {
      showToast('warning', 'Vui lòng nhập mã dịch vụ / chi phí.');
      return;
    }
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên dịch vụ / chi phí.');
      return;
    }
    if (!unit) {
      showToast('warning', 'Vui lòng chọn đơn vị tính.');
      return;
    }

    const refPriceNum = formData.referencePrice ? Number(formData.referencePrice) : null;
    if (refPriceNum != null && (isNaN(refPriceNum) || refPriceNum < 0)) {
      showToast('warning', 'Đơn giá tham chiếu không hợp lệ.');
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: {
            code,
            name,
            type: formData.type,
            unit,
            referencePrice: refPriceNum,
            description: formData.description.trim() || null,
            isActive: formData.isActive,
            sortOrder: formData.sortOrder,
          },
        });
        showToast('success', `Đã cập nhật "${code}".`);
      } else {
        const createPayload: CreateServiceExpenseItemRequest = {
          code,
          name,
          type: formData.type,
          unit,
          referencePrice: refPriceNum,
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder,
        };
        await createMutation.mutateAsync(createPayload);
        showToast('success', `Đã tạo mới "${code}".`);
      }
      setModalOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, editingItem ? 'Không thể cập nhật.' : 'Không thể tạo mới.'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa "${deleteTarget.code}".`);
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa mục này.'));
    }
  };

  return (
    <div className="page-container" aria-label="Danh mục Dịch vụ & Chi phí">
      <PageHeader
        eyebrow="Dự án EPC · Master Data"
        title="Danh mục Dịch vụ & Chi phí"
        subtitle="Mã định danh chuẩn cho dịch vụ thi công, thầu phụ và chi phí ngoài dự án (dùng trong KHMH, PO và DNTT)"
        actions={(
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline flex items-center gap-1.5"
              onClick={() => setImportModalOpen(true)}
            >
              <Upload size={16} aria-hidden />
              <span>Nhập Excel</span>
            </button>
            <button
              type="button"
              className="btn btn-primary flex items-center gap-1.5"
              onClick={openCreateModal}
            >
              <Plus size={16} aria-hidden />
              <span>Thêm dịch vụ / chi phí</span>
            </button>
          </div>
        )}
      />

      <SectionCard noPadding className="mat-catalog-board">
        <div className="mat-catalog-board__head">
          <h2 className="mat-catalog-board__title">Danh sách dịch vụ & chi phí dự án</h2>
          <p className="mat-catalog-board__desc">
            Mã định danh chuẩn cho dịch vụ thi công và chi phí ngoài dự án (dùng trong KHMH, PO và DNTT).
          </p>
        </div>

        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <div className="mat-catalog__toolbar">
              <SearchBar
                value={search}
                onChange={val => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Tìm theo mã, tên hoặc ghi chú…"
              />

              {/* Pill Switcher: Phân loại */}
              <div
                className="inline-flex items-center gap-1 p-1 bg-[var(--md-surface-variant)]/40 rounded-lg border border-[var(--md-outline-variant02)] text-xs"
                role="group"
                aria-label="Lọc theo phân loại"
              >
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    typeFilter === 'all'
                      ? 'bg-[var(--md-surface)] text-[var(--md-primary)] shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => { setTypeFilter('all'); setPage(1); }}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md font-medium transition-all inline-flex items-center gap-1.5 ${
                    typeFilter === 'service'
                      ? 'bg-[var(--md-surface)] text-amber-700 dark:text-amber-400 shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => { setTypeFilter('service'); setPage(1); }}
                >
                  <Briefcase size={13} aria-hidden />
                  <span>Dịch vụ</span>
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md font-medium transition-all inline-flex items-center gap-1.5 ${
                    typeFilter === 'expense'
                      ? 'bg-[var(--md-surface)] text-purple-700 dark:text-purple-400 shadow-sm font-semibold'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                  onClick={() => { setTypeFilter('expense'); setPage(1); }}
                >
                  <Coins size={13} aria-hidden />
                  <span>Chi phí ngoài</span>
                </button>
              </div>

              {/* Trạng thái nút bấm giống MaterialsPage */}
              <button
                type="button"
                onClick={() => { setShowInactive(v => !v); setPage(1); }}
                className={`mat-catalog__status${showInactive ? ' is-on' : ''}`}
                aria-pressed={showInactive}
              >
                {showInactive ? 'Hiện cả ngừng SD' : 'Chỉ đang dùng'}
              </button>

              {(search || typeFilter !== 'all' || showInactive) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-text"
                  title="Đặt lại bộ lọc"
                >
                  <RotateCcw size={14} aria-hidden />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
          <table className="wms-inventory-table mat-catalog-table">
            <thead>
              <tr>
                <th className="table-header-cell text-center w-12">#</th>
                <th className="table-header-cell text-left w-36">Mã định danh</th>
                <th className="table-header-cell text-left">Tên dịch vụ / chi phí</th>
                <th className="table-header-cell text-center w-36">Phân loại</th>
                <th className="table-header-cell text-center w-24">ĐVT</th>
                <th className="table-header-cell text-right w-44">Đơn giá tham chiếu</th>
                <th className="table-header-cell text-left">Ghi chú</th>
                <th className="table-header-cell text-center w-28">Trạng thái</th>
                <th className="table-header-cell text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={9} rows={8} />
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="table-cell text-center py-10 text-red-600">
                    <p className="font-medium">Không thể tải danh mục dịch vụ & chi phí.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mt-2"
                      onClick={() => void refetch()}
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-cell text-center py-12">
                    <EmptyState
                      message={
                        search || typeFilter !== 'all' || showInactive
                          ? 'Không tìm thấy mục phù hợp với bộ lọc hiện tại.'
                          : 'Chưa có dịch vụ hoặc chi phí nào trong danh mục.'
                      }
                      action={
                        <button type="button" className="btn btn-secondary btn-sm" onClick={openCreateModal}>
                          <Plus size={14} aria-hidden />
                          <span>Thêm mới ngay</span>
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const isExpense = item.type === 'expense';
                  return (
                    <tr
                      key={item.id}
                      className={`table-row transition-colors hover:bg-[var(--md-surface-variant)]/30 ${
                        !item.isActive ? 'opacity-60 bg-[var(--md-surface-variant)]/10' : ''
                      }`}
                    >
                      <td className="table-cell text-center text-xs text-[var(--md-on-surface-variant)] tabular-nums">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="table-cell font-mono font-semibold text-xs">
                        <span className="px-2 py-0.5 rounded bg-[var(--md-primary)]/10 text-[var(--md-primary)] border border-[var(--md-primary)]/20">
                          {item.code}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-[var(--md-on-surface)]">
                        {item.name}
                      </td>
                      <td className="table-cell text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            isExpense
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {isExpense ? 'Chi phí ngoài' : 'Dịch vụ'}
                        </span>
                      </td>
                      <td className="table-cell text-center font-medium">
                        {item.unit}
                      </td>
                      <td className="table-cell text-right font-medium tabular-nums">
                        {item.referencePrice != null ? (
                          <span className="text-[var(--md-on-surface)]">
                            {formatCurrency(item.referencePrice)}
                          </span>
                        ) : (
                          <span className="text-[var(--md-on-surface-variant)] opacity-40">—</span>
                        )}
                      </td>
                      <td className="table-cell text-xs text-[var(--md-on-surface-variant)] max-w-xs truncate" title={item.description ?? ''}>
                        {item.description || <span className="opacity-40">—</span>}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center">
                          <IOSSwitch
                            checked={item.isActive}
                            disabled={toggleMutation.isPending}
                            onChange={() => void handleToggle(item)}
                            title={item.isActive ? 'Đang kích hoạt — Bấm để tắt' : 'Đã tắt — Bấm để kích hoạt'}
                          />
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] hover:bg-[var(--md-surface-variant)]/60 rounded"
                            title="Sửa thông tin"
                            aria-label={`Sửa ${item.code}`}
                            onClick={() => openEditModal(item)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                            title="Xóa mục này"
                            aria-label={`Xóa ${item.code}`}
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        {total > 0 && !isLoading && (
          <Pagination
            embedded
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={total}
            itemLabel="mục"
            onPageChange={setPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </SectionCard>

      {/* Modal Thêm / Sửa */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Sửa dịch vụ / chi phí: ${editingItem.code}` : 'Thêm dịch vụ / chi phí mới'}
        size="md"
        footer={(
          <>
            <button
              type="button"
              className="btn btn-text"
              onClick={() => setModalOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { void handleSave(); }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Đang lưu…'
                : (editingItem ? 'Lưu thay đổi' : 'Tạo mới')}
            </button>
          </>
        )}
      >
        <div className="space-y-4 py-2">
          {/* Phân loại Segmented */}
          <FormField label="Phân loại" required>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.type === 'service'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-medium ring-1 ring-amber-500'
                    : 'border-[var(--md-outline-variant02)] hover:bg-[var(--md-surface-variant)]/30'
                }`}
              >
                <input
                  type="radio"
                  name="itemType"
                  value="service"
                  checked={formData.type === 'service'}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    type: 'service',
                  }))}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <Briefcase size={16} className="text-amber-600" />
                <div className="text-xs">
                  <div className="font-semibold">Dịch vụ thi công</div>
                  <div className="text-[11px] opacity-80">Nhân công, cẩu, xe, kiểm định...</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.type === 'expense'
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-medium ring-1 ring-purple-500'
                    : 'border-[var(--md-outline-variant02)] hover:bg-[var(--md-surface-variant)]/30'
                }`}
              >
                <input
                  type="radio"
                  name="itemType"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    type: 'expense',
                  }))}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <Coins size={16} className="text-purple-600" />
                <div className="text-xs">
                  <div className="font-semibold">Chi phí ngoài</div>
                  <div className="text-[11px] opacity-80">Tiếp khách, lưu trú, thuê máy...</div>
                </div>
              </label>
            </div>
          </FormField>

          {/* Mã và ĐVT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Mã định danh" required>
              <input
                className="form-input form-input-md font-mono uppercase"
                value={formData.code}
                placeholder={formData.type === 'service' ? 'DV-VC-01' : 'CP-TK-01'}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                aria-label="Mã định danh"
              />
              <p className="mt-1 text-[11px] text-[var(--md-on-surface-variant)]">
                VD: DV-VC-01, CP-TK-01 (Duy nhất cho KHMH/PO/DNTT)
              </p>
            </FormField>

            <MaterialUnitSelect
              value={formData.unit}
              onChange={val => setFormData(prev => ({ ...prev, unit: val }))}
              required
              preserveUnknownValue
            />
          </div>

          {/* Tên dịch vụ / chi phí */}
          <FormField label="Tên dịch vụ / chi phí" required>
            <input
              className="form-input form-input-md"
              value={formData.name}
              placeholder={
                formData.type === 'service'
                  ? 'VD: Chi phí cẩu tháp, vận chuyển vật tư'
                  : 'VD: Chi phí tiếp khách & quan hệ đối tác'
              }
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              aria-label="Tên dịch vụ / chi phí"
            />
          </FormField>

          {/* Đơn giá tham chiếu */}
          <FormField label="Đơn giá tham chiếu (VNĐ)">
            <CurrencyInput
              value={formData.referencePrice}
              onChange={val => setFormData(prev => ({ ...prev, referencePrice: val }))}
              placeholder="VD: 3,500,000"
              aria-label="Đơn giá tham chiếu"
            />
            <p className="mt-1 text-[11px] text-[var(--md-on-surface-variant)]">
              Dùng làm mức giá dự kiến tham khảo khi lập KHMH
            </p>
          </FormField>

          {/* Ghi chú */}
          <FormField label="Ghi chú / Diễn giải mục đích">
            <textarea
              className="form-input form-input-md w-full min-h-[72px]"
              value={formData.description}
              placeholder="Mô tả phạm vi công việc, yêu cầu kỹ thuật hoặc lưu ý đối chiếu kế toán…"
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              aria-label="Ghi chú"
            />
          </FormField>

          {/* Trạng thái hoạt động */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--md-outline-variant02)]">
            <div>
              <div className="text-sm font-medium text-[var(--md-on-surface)]">Kích hoạt sử dụng</div>
              <div className="text-xs text-[var(--md-on-surface-variant)]">
                Cho phép chọn trong Autocomplete khi lập KHMH & Đề nghị mua
              </div>
            </div>
            <IOSSwitch
              checked={formData.isActive}
              onChange={val => setFormData(prev => ({ ...prev, isActive: val }))}
              title={formData.isActive ? 'Đang kích hoạt' : 'Đã tắt'}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Nhập Excel */}
      <ServiceExpenseImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          void refetch();
        }}
      />

      {/* Confirm Dialog Xóa */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa mục "${deleteTarget?.code} — ${deleteTarget?.name}"? Nếu mục này đã được sử dụng trong KHMH, hệ thống sẽ từ chối xóa để đảm bảo toàn vẹn dữ liệu.`}
        confirmLabel="Xóa mục này"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => { void handleDeleteConfirm(); }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
