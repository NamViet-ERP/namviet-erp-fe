import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, RotateCcw, Eye } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import Dropdown from '../../components/ui/Dropdown';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '../../hooks/useSuppliers';
import { useSupplierGroups } from '../../hooks/useSupplierDirectory';
import { supplierGroupsService } from '../../services/supplierDirectoryService';
import { queryKeys } from '../../services/queryKeys';
import type { SupplierApiDto } from '../../services/suppliersService';
import type { DropdownItem } from '../../types';

const RATING_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const GROUPS_VISIBLE_IN_TABLE = 3;
const COL_COUNT = 13;

const emptyForm = {
  supplierCode: '',
  supplierName: '',
  contactPhone: '',
  maxDebtDays: '30',
  paymentTerms: '',
  rating: 'A',
  groupIds: [] as number[],
};

function IndustryGroupsCell({ groups }: { groups: string[] }) {
  if (groups.length === 0) return <span>—</span>;

  const visible = groups.slice(0, GROUPS_VISIBLE_IN_TABLE);
  const hidden = groups.slice(GROUPS_VISIBLE_IN_TABLE);
  const allTitle = groups.join(', ');

  return (
    <div className="ncc-master-groups" title={allTitle} aria-label={`Nhóm ngành hàng: ${allTitle}`}>
      {visible.map(group => (
        <span key={group} className="ncc-master-groups__chip">
          {group}
        </span>
      ))}
      {hidden.length > 0 ? (
        <span className="ncc-master-groups__more" title={hidden.join(', ')}>
          +{hidden.length}
        </span>
      ) : null}
    </div>
  );
}

function DetailField({
  label,
  children,
  span = false,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? 'ncc-master-detail-span' : undefined}>
      <span className="ncc-master-detail-label">{label}</span>
      <div className="ncc-master-detail-value">{children}</div>
    </div>
  );
}

export default function SuppliersSettingsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierApiDto | null>(null);
  const [viewing, setViewing] = useState<SupplierApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierApiDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [openingEdit, setOpeningEdit] = useState(false);

  const { data, isLoading, isError } = useSuppliers({
    page,
    pageSize,
    search: search || undefined,
    rating: ratingFilter || undefined,
  });
  const { data: groupPage } = useSupplierGroups({ page: 1, pageSize: 500 });
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const groupOptions = groupPage?.items ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending || openingEdit;

  const resetFilters = () => {
    setSearch('');
    setRatingFilter('');
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = async (s: SupplierApiDto) => {
    setOpeningEdit(true);
    try {
      const assigned = await supplierGroupsService.groupsOfSupplier(s.id);
      setViewing(null);
      setEditing(s);
      setForm({
        supplierCode: s.supplierCode,
        supplierName: s.supplierName,
        contactPhone: s.contactPhone ?? '',
        maxDebtDays: String(s.maxDebtDays),
        paymentTerms: s.paymentTerms ?? '',
        rating: s.rating || 'A',
        groupIds: assigned.map(g => g.id),
      });
      setShowForm(true);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải nhóm ngành hàng của NCC'));
    } finally {
      setOpeningEdit(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplierCode = form.supplierCode.trim();
    const supplierName = form.supplierName.trim();
    if (!supplierCode || !supplierName) {
      showToast('warning', 'Mã NCC và tên nhà cung cấp là bắt buộc');
      return;
    }
    const body = {
      supplierCode,
      supplierName,
      contactPhone: form.contactPhone.trim() || null,
      maxDebtDays: Number(form.maxDebtDays) || 30,
      paymentTerms: form.paymentTerms.trim() || null,
      rating: form.rating || 'A',
    };

    try {
      let supplierId = editing?.id;
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        supplierId = editing.id;
        showToast('success', 'Đã cập nhật nhà cung cấp');
      } else {
        const created = await createMutation.mutateAsync(body);
        supplierId = created.id;
        showToast('success', 'Đã thêm nhà cung cấp');
      }
      if (supplierId) {
        await supplierGroupsService.setGroupsOfSupplier(supplierId, { groupIds: form.groupIds });
        await qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      }
      closeForm();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu nhà cung cấp'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa ${deleteTarget.supplierName}`);
      setDeleteTarget(null);
      if (viewing?.id === deleteTarget.id) setViewing(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa nhà cung cấp'));
    }
  };

  const rowActions = (s: SupplierApiDto): DropdownItem[] => [
    { label: 'Xem chi tiết', icon: Eye, onClick: () => setViewing(s) },
    { label: 'Sửa', icon: Pencil, onClick: () => void openEdit(s) },
    { divider: true },
    {
      label: 'Xóa',
      icon: Trash2,
      danger: true,
      onClick: () => setDeleteTarget(s),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="surface-panel surface-panel--rounded-xl p-4 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty max-w-2xl">
            Chỉ các NCC đã khai báo mới xuất hiện khi lập phiếu nhập kho.
          </p>
          <button type="button" className="btn btn-primary flex items-center gap-2 shrink-0" onClick={openCreate}>
            <Plus size={16} aria-hidden />
            Thêm NCC
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="font-semibold text-[var(--md-on-surface-variant)]">Phân loại</span>
            <select
              className="form-select w-full text-sm"
              value={ratingFilter}
              onChange={e => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">— Tất cả —</option>
              {RATING_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="hrm-filter-bar">
          <div className="hrm-filter-bar__search flex-1 min-w-[220px]">
            <SearchBar
              value={search}
              onChange={v => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm mã NCC, tên nhà cung cấp…"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-clear-filters"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={15} aria-hidden />
            <span className="hidden sm:inline">XÓA BỘ LỌC</span>
          </button>
        </div>
      </div>

      <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-xs ncc-master-table">
            <thead>
              <tr>
                <th className="table-header-cell text-left" rowSpan={2}>Mã NCC</th>
                <th className="table-header-cell text-left" rowSpan={2}>Tên nhà cung cấp</th>
                <th className="table-header-cell text-left" rowSpan={2}>Điện thoại</th>
                <th className="table-header-cell text-right" rowSpan={2}>Hạn công nợ</th>
                <th className="table-header-cell text-left" rowSpan={2}>Điều khoản thanh toán</th>
                <th className="table-header-cell text-left" rowSpan={2}>Nhóm ngành hàng</th>
                <th className="table-header-cell text-center" rowSpan={2}>Phân loại</th>
                <th className="table-header-cell text-right" rowSpan={2}>Doanh số đã mua</th>
                <th className="table-header-cell text-left" rowSpan={2}>Đánh giá định kỳ gần nhất</th>
                <th className="table-header-cell text-center" colSpan={3}>Đánh giá nhà cung cấp</th>
                <th className="table-header-cell text-center hrm-table-col-actions" rowSpan={2}>Tác vụ</th>
              </tr>
              <tr>
                <th className="table-header-cell text-right">Tỷ lệ giao đúng hạn</th>
                <th className="table-header-cell text-right">Tỷ lệ hàng lỗi</th>
                <th className="table-header-cell text-right">Tỷ lệ BH hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={COL_COUNT} />
              ) : isError ? (
                <tr>
                  <td colSpan={COL_COUNT}>
                    <EmptyState message={WMS_ERROR.loadSuppliers} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={COL_COUNT}>
                    <EmptyState message={search || ratingFilter ? 'Không tìm thấy NCC phù hợp.' : 'Chưa có nhà cung cấp nào.'} />
                  </td>
                </tr>
              ) : (
                items.map(s => (
                  <tr
                    key={s.id}
                    className="table-row border-b border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)]"
                  >
                    <td className="table-cell font-mono font-semibold">{s.supplierCode}</td>
                    <td className="table-cell font-medium">{s.supplierName}</td>
                    <td className="table-cell">{s.contactPhone || '—'}</td>
                    <td className="table-cell text-right tabular-nums">{s.maxDebtDays} ngày</td>
                    <td className="table-cell">{s.paymentTerms || '—'}</td>
                    <td className="table-cell">
                      <IndustryGroupsCell groups={s.industryGroups ?? []} />
                    </td>
                    <td className="table-cell text-center">
                      <span className="inline-block min-w-[1.5rem] px-2 py-0.5 rounded bg-[var(--md-surface-container-high)] font-semibold">
                        {s.rating}
                      </span>
                    </td>
                    <td className="table-cell text-right tabular-nums">{formatCurrencyFull(s.purchasedRevenue)}</td>
                    <td className="table-cell">
                      {s.latestEvaluation
                        ? `${s.latestEvaluation.period} · ${s.latestEvaluation.grade} · ${s.latestEvaluation.evaluatedAt}`
                        : '—'}
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {s.latestEvaluation ? `${s.latestEvaluation.onTimeDeliveryRate}%` : '—'}
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {s.latestEvaluation ? `${s.latestEvaluation.defectRate}%` : '—'}
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {s.latestEvaluation ? `${s.latestEvaluation.warrantyCompletionRate}%` : '—'}
                    </td>
                    <td className="table-cell text-center hrm-table-col-actions">
                      <Dropdown trigger="Tác vụ" items={rowActions(s)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && !isLoading && (
          <div className="surface-panel__footer px-4 pb-4">
            <Pagination
              embedded
              itemLabel="NCC"
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={s => {
                setPageSize(s);
                setPage(1);
              }}
              totalItems={totalCount}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? `Chi tiết · ${viewing.supplierCode}` : 'Chi tiết nhà cung cấp'}
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setViewing(null)}>
              Đóng
            </button>
            {viewing ? (
              <button
                type="button"
                className="btn btn-filled"
                disabled={openingEdit}
                onClick={() => void openEdit(viewing)}
              >
                Sửa
              </button>
            ) : null}
          </>
        }
      >
        {viewing ? (
          <div className="ncc-master-detail-grid">
            <DetailField label="Mã NCC">{viewing.supplierCode}</DetailField>
            <DetailField label="Phân loại">{viewing.rating}</DetailField>
            <DetailField label="Tên nhà cung cấp" span>{viewing.supplierName}</DetailField>
            <DetailField label="Điện thoại">{viewing.contactPhone || '—'}</DetailField>
            <DetailField label="Hạn công nợ">{viewing.maxDebtDays} ngày</DetailField>
            <DetailField label="Điều khoản thanh toán" span>
              {viewing.paymentTerms || '—'}
            </DetailField>
            <DetailField label={`Nhóm ngành hàng (${viewing.industryGroups?.length ?? 0})`} span>
              {(viewing.industryGroups?.length ?? 0) > 0 ? (
                <div className="ncc-master-groups" style={{ maxWidth: '100%' }}>
                  {viewing.industryGroups.map(group => (
                    <span key={group} className="ncc-master-groups__chip">{group}</span>
                  ))}
                </div>
              ) : (
                '—'
              )}
            </DetailField>
            <DetailField label="Doanh số đã mua">
              {formatCurrencyFull(viewing.purchasedRevenue)}
            </DetailField>
            <DetailField label="Đánh giá định kỳ gần nhất">
              {viewing.latestEvaluation
                ? `${viewing.latestEvaluation.period} · ${viewing.latestEvaluation.grade} · ${viewing.latestEvaluation.evaluatedAt}`
                : '—'}
            </DetailField>
            <DetailField label="Tỷ lệ giao đúng hạn">
              {viewing.latestEvaluation ? `${viewing.latestEvaluation.onTimeDeliveryRate}%` : '—'}
            </DetailField>
            <DetailField label="Tỷ lệ hàng lỗi">
              {viewing.latestEvaluation ? `${viewing.latestEvaluation.defectRate}%` : '—'}
            </DetailField>
            <DetailField label="Tỷ lệ BH hoàn thành">
              {viewing.latestEvaluation ? `${viewing.latestEvaluation.warrantyCompletionRate}%` : '—'}
            </DetailField>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={closeForm}>Hủy</button>
            <button
              type="submit"
              form="supplier-settings-form"
              className="btn btn-filled"
              disabled={isSaving}
            >
              Lưu
            </button>
          </>
        }
      >
        <form id="supplier-settings-form" className="space-y-3 modal-form-bordered" onSubmit={handleSubmit}>
          <FormField label="Mã NCC" required>
            <input
              className="form-input"
              value={form.supplierCode}
              disabled={Boolean(editing)}
              onChange={e => setForm(f => ({ ...f, supplierCode: e.target.value }))}
              placeholder="VD: NCC-HP-01"
            />
          </FormField>
          <FormField label="Tên nhà cung cấp" required>
            <input
              className="form-input"
              value={form.supplierName}
              onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
            />
          </FormField>
          <FormField label="Điện thoại liên hệ">
            <input
              className="form-input"
              value={form.contactPhone}
              onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Hạn công nợ (ngày)">
              <input
                type="number"
                min={0}
                className="form-input"
                value={form.maxDebtDays}
                onChange={e => setForm(f => ({ ...f, maxDebtDays: e.target.value }))}
              />
            </FormField>
            <FormField label="Phân loại">
              <select
                className="form-select"
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
              >
                {RATING_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Điều khoản thanh toán">
            <input
              className="form-input"
              value={form.paymentTerms}
              onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}
              placeholder="VD: Thanh toán 30 ngày kể từ ngày nhận đủ chứng từ"
            />
          </FormField>
          <FormField label={`Nhóm ngành hàng (chọn nhiều · đã chọn ${form.groupIds.length})`}>
            {groupOptions.length === 0 ? (
              <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty">
                Chưa có nhóm ngành hàng. Vào “Nhóm nhà cung cấp” để tạo trước.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-[var(--md-outline-variant)] p-3">
                {groupOptions.map(group => {
                  const checked = form.groupIds.includes(group.id);
                  return (
                    <label key={group.id} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          setForm(prev => ({
                            ...prev,
                            groupIds: e.target.checked
                              ? [...prev.groupIds, group.id]
                              : prev.groupIds.filter(id => id !== group.id),
                          }));
                        }}
                      />
                      <span>{group.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa nhà cung cấp?"
        message={
          deleteTarget ? (
            <p>
              Xóa <strong>{deleteTarget.supplierName}</strong> khỏi danh mục?
              Phiếu cũ vẫn giữ tên đã lưu.
            </p>
          ) : null
        }
        confirmLabel="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
