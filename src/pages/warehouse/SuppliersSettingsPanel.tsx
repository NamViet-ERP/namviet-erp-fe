import type React from 'react';
import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Ban, Check, Plus, Trash2, Pencil, Eye, X } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import Dropdown from '../../components/ui/Dropdown';
import { usePermission } from '../../hooks/usePermission';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage, getApiFieldErrors } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { formatCurrencyFull, formatCurrencyInput } from '../../utils/formatCurrency';
import CurrencyInput from '../../components/ui/CurrencyInput';
import {
  normalizeSupplierApproval,
  isSameSupplierName,
  parseCreditLimit,
  parseMaxDebtDays,
  restrictVnPhoneInput,
  supplierGradeLabel,
  SUPPLIER_APPROVAL,
  SUPPLIER_LIMITS,
  validateOptionalVietnamPhone,
} from '../../lib/suppliers/supplierStatus';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useApproveSupplier,
  useRejectSupplier,
} from '../../hooks/useSuppliers';
import {
  useAddSupplierToBlacklist,
  useSupplierGroups,
} from '../../hooks/useSupplierDirectory';
import { supplierGroupsService } from '../../services/supplierDirectoryService';
import { queryKeys } from '../../services/queryKeys';
import { suppliersService, type SupplierApiDto } from '../../services/suppliersService';
import type { DropdownItem } from '../../types';

const RATING_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const GROUPS_VISIBLE_IN_TABLE = 3;
const COL_COUNT = 13;
type FormErrors = Partial<Record<'supplierCode' | 'supplierName' | 'contactPhone' | 'maxDebtDays' | 'creditLimit' | 'paymentTerms', string>>;
type SupplierRow = SupplierApiDto;

const emptyForm = {
  supplierCode: '',
  supplierName: '',
  contactPhone: '',
  maxDebtDays: '30',
  creditLimit: '',
  paymentTerms: '',
  groupIds: [] as number[],
};

function mapSupplierSaveErrors(err: unknown): FormErrors {
  const fromApi = getApiFieldErrors(err);
  const next: FormErrors = {};
  for (const [key, message] of Object.entries(fromApi)) {
    if (key in emptyForm || key === 'supplierCode') next[key as keyof FormErrors] = message;
  }

  const message = getApiErrorMessage(err, '');
  const lower = message.toLowerCase();
  if (!next.contactPhone && (lower.includes('điện thoại') || lower.includes('sđt'))) {
    next.contactPhone = message;
  }
  if (!next.supplierName && (lower.includes('tên nhà cung cấp') || lower.includes('đã tồn tại'))) {
    next.supplierName = message;
  }
  if (!next.maxDebtDays && lower.includes('hạn công nợ')) {
    next.maxDebtDays = message;
  }
  if (!next.creditLimit && lower.includes('hạn mức')) {
    next.creditLimit = message;
  }
  return next;
}

function RatingBadge({ rating }: { rating?: string | null }) {
  return (
    <span className="hrm-badge hrm-badge--neutral">Hạng {supplierGradeLabel(rating)}</span>
  );
}

function ApprovalStatusBadge({ status }: { status?: string | null }) {
  const value = normalizeSupplierApproval(status);
  if (value === SUPPLIER_APPROVAL.New) {
    return <span className="hrm-badge hrm-badge--warning">Mới - chờ duyệt</span>;
  }
  if (value === SUPPLIER_APPROVAL.Rejected) {
    return <span className="hrm-badge hrm-badge--danger">Từ chối</span>;
  }
  return <span className="hrm-badge hrm-badge--success">Đã duyệt</span>;
}

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

type PanelProps = {
  subtitle?: string;
};

export default function SuppliersSettingsPanel({
  subtitle = 'NCC mới là Hạng D, trạng thái Mới. Sếp duyệt xong mới đặt PO được.',
}: PanelProps) {
  const qc = useQueryClient();
  const { has } = usePermission();
  const canApproveSupplier = has('wms.suppliers.approve');
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [viewing, setViewing] = useState<SupplierRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierRow | null>(null);
  const [blacklistTarget, setBlacklistTarget] = useState<SupplierRow | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [openingEdit, setOpeningEdit] = useState(false);
  const [approveTarget, setApproveTarget] = useState<SupplierRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SupplierRow | null>(null);

  const groupIdFromUrl = useMemo(() => {
    const raw = searchParams.get('groupId');
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [searchParams]);

  const { data, isLoading, isError } = useSuppliers({
    page,
    pageSize,
    search: search || undefined,
    rating: ratingFilter || undefined,
    approvalStatus: statusFilter || undefined,
    groupId: groupIdFromUrl,
    isBlacklisted: false,
  });
  const { data: groupPage } = useSupplierGroups({ page: 1, pageSize: 500 });
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();
  const addBlacklistMutation = useAddSupplierToBlacklist();
  const approveMutation = useApproveSupplier();
  const rejectMutation = useRejectSupplier();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const groupOptions = groupPage?.items ?? [];
  const filteredGroupName = groupIdFromUrl
    ? groupOptions.find(g => g.id === groupIdFromUrl)?.name
    : undefined;
  const isSaving = createMutation.isPending || updateMutation.isPending || openingEdit;

  const clearGroupFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('groupId');
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setRatingFilter('');
    setStatusFilter('');
    setPage(1);
    if (groupIdFromUrl) clearGroupFilter();
  };

  const openCreate = async () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
    try {
      const { nextCode } = await suppliersService.nextCode();
      setForm(f => ({ ...f, supplierCode: nextCode }));
    } catch {
      setForm(f => ({ ...f, supplierCode: '' }));
    }
  };

  const openEdit = async (s: SupplierRow) => {
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
        creditLimit: s.creditLimit ? formatCurrencyInput(s.creditLimit) : '',
        paymentTerms: s.paymentTerms ?? '',
        groupIds: assigned.map(g => g.id),
      });
      setFormErrors({});
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
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplierCode = form.supplierCode.trim();
    const supplierName = form.supplierName.trim();
    const paymentTerms = form.paymentTerms.trim();
    const nextErrors: FormErrors = {};

    if (!supplierName) nextErrors.supplierName = 'Tên nhà cung cấp là bắt buộc.';
    else if (supplierName.length > SUPPLIER_LIMITS.nameMax) {
      nextErrors.supplierName = `Tên nhà cung cấp tối đa ${SUPPLIER_LIMITS.nameMax} ký tự.`;
    } else if (
      items.some(s => s.id !== editing?.id && isSameSupplierName(s.supplierName, supplierName))
    ) {
      nextErrors.supplierName = 'Tên nhà cung cấp đã tồn tại.';
    }

    const contactPhone = restrictVnPhoneInput(form.contactPhone);
    const phoneError = validateOptionalVietnamPhone(contactPhone);
    if (phoneError) nextErrors.contactPhone = phoneError;

    const debt = parseMaxDebtDays(form.maxDebtDays);
    if (!debt.ok) nextErrors.maxDebtDays = debt.error;

    const limit = parseCreditLimit(form.creditLimit);
    if (!limit.ok) nextErrors.creditLimit = limit.error;

    if (paymentTerms.length > SUPPLIER_LIMITS.paymentTermsMax) {
      nextErrors.paymentTerms = `Điều khoản thanh toán tối đa ${SUPPLIER_LIMITS.paymentTermsMax} ký tự.`;
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !debt.ok || !limit.ok) return;

    const body = {
      supplierCode,
      supplierName,
      contactPhone: contactPhone || null,
      maxDebtDays: debt.value,
      creditLimit: limit.value,
      paymentTerms: paymentTerms || null,
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
        showToast('success', 'Đã thêm nhà cung cấp. Hạng D, chờ sếp duyệt mới đặt hàng được.');
      }
      if (supplierId) {
        await supplierGroupsService.setGroupsOfSupplier(supplierId, { groupIds: form.groupIds });
        await qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      }
      closeForm();
    } catch (err: unknown) {
      const fieldErrors = mapSupplierSaveErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setFormErrors(prev => ({ ...prev, ...fieldErrors }));
        return;
      }
      showToast('error', getApiErrorMessage(err, 'Không thể lưu nhà cung cấp'));
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      const updated = await approveMutation.mutateAsync(approveTarget.id);
      showToast('success', `Đã duyệt ${approveTarget.supplierName}. Có thể đặt hàng.`);
      setApproveTarget(null);
      if (viewing?.id === updated.id) setViewing(updated);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt nhà cung cấp'));
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      const updated = await rejectMutation.mutateAsync(rejectTarget.id);
      showToast('success', `Đã từ chối ${rejectTarget.supplierName}.`);
      setRejectTarget(null);
      if (viewing?.id === updated.id) setViewing(updated);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể từ chối nhà cung cấp'));
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

  const openBlacklist = (s: SupplierApiDto) => {
    setBlacklistReason('');
    setBlacklistTarget(s);
  };

  const handleAddBlacklist = async () => {
    if (!blacklistTarget) return;
    const reason = blacklistReason.trim();
    if (!reason) {
      showToast('warning', 'Vui lòng nhập lý do blacklist');
      return;
    }
    try {
      await addBlacklistMutation.mutateAsync({
        id: blacklistTarget.id,
        body: { reason },
      });
      showToast('success', `Đã chuyển ${blacklistTarget.supplierName} sang mục Danh sách blacklist`);
      setBlacklistTarget(null);
      setBlacklistReason('');
      if (viewing?.id === blacklistTarget.id) setViewing(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm vào blacklist'));
    }
  };

  const rowActions = (s: SupplierRow): DropdownItem[] => [
    { label: 'Xem chi tiết', icon: Eye, onClick: () => setViewing(s) },
    { label: 'Sửa', icon: Pencil, onClick: () => void openEdit(s) },
    ...(canApproveSupplier && normalizeSupplierApproval(s.approvalStatus) !== SUPPLIER_APPROVAL.Approved
      ? [
          {
            label: 'Duyệt NCC',
            icon: Check,
            onClick: () => setApproveTarget(s),
          },
          {
            label: 'Từ chối',
            icon: X,
            danger: true,
            onClick: () => setRejectTarget(s),
          },
        ]
      : []),
    { divider: true },
    {
      label: 'Thêm vào blacklist',
      icon: Ban,
      danger: true,
      onClick: () => openBlacklist(s),
    },
    { divider: true },
    {
      label: 'Xóa',
      icon: Trash2,
      danger: true,
      onClick: () => setDeleteTarget(s),
    },
  ];

  const hasActiveFilters = Boolean(search || ratingFilter || statusFilter || groupIdFromUrl);

  return (
    <>
      <PurchasingListLayout
        eyebrow="Nhà cung cấp"
        title="Nhà cung cấp"
        subtitle={subtitle}
        search={search}
        onSearchChange={value => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Tìm mã NCC, tên nhà cung cấp…"
        filters={(
          <>
            <div className="ncc-master-filters">
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={ratingFilter}
                  aria-label="Hạng"
                  onChange={e => {
                    setRatingFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả hạng</option>
                  {RATING_OPTIONS.map(r => (
                    <option key={r} value={r}>Hạng {r}</option>
                  ))}
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={statusFilter}
                  aria-label="Trạng thái"
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value={SUPPLIER_APPROVAL.New}>Mới - chờ duyệt</option>
                  <option value={SUPPLIER_APPROVAL.Approved}>Đã duyệt</option>
                  <option value={SUPPLIER_APPROVAL.Rejected}>Từ chối</option>
                </select>
              </div>
              {groupIdFromUrl ? (
                <button
                  type="button"
                  className="hrm-filter-reset"
                  onClick={clearGroupFilter}
                >
                  Nhóm: {filteredGroupName ?? `#${groupIdFromUrl}`}
                </button>
              ) : null}
            </div>
          </>
        )}
        hasFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        actions={(
          <button type="button" className="btn btn-primary" onClick={() => void openCreate()}>
            <Plus size={16} aria-hidden />
            Thêm NCC
          </button>
        )}
      >
        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table ncc-master-table">
            <thead>
              <tr>
                <th className="table-header-cell ncc-master-col-code">Mã NCC</th>
                <th className="table-header-cell ncc-master-col-name">Tên nhà cung cấp</th>
                <th className="table-header-cell ncc-master-col-phone">Điện thoại</th>
                <th className="table-header-cell text-right ncc-master-col-debt">Hạn công nợ</th>
                <th className="table-header-cell text-right ncc-master-col-limit">Hạn mức</th>
                <th className="table-header-cell ncc-master-col-terms">Điều khoản thanh toán</th>
                <th className="table-header-cell ncc-master-col-groups">Nhóm ngành hàng</th>
                <th className="table-header-cell text-center ncc-master-col-grade">Hạng</th>
                <th className="table-header-cell text-center ncc-master-col-status">Trạng thái</th>
                <th className="table-header-cell text-right ncc-master-col-revenue">Doanh số đã mua</th>
                <th className="table-header-cell ncc-master-col-eval">Đánh giá gần nhất</th>
                <th className="table-header-cell text-right ncc-master-col-kpi">Điểm KPI</th>
                <th className="table-header-cell text-center hrm-table-col-actions">Tác vụ</th>
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
                    <EmptyState
                      message={hasActiveFilters ? 'Không tìm thấy NCC phù hợp.' : 'Chưa có nhà cung cấp nào.'}
                      action={
                        hasActiveFilters ? null : (
                          <button type="button" className="btn btn-primary" onClick={() => void openCreate()}>
                            <Plus size={16} aria-hidden />
                            Thêm NCC đầu tiên
                          </button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell font-mono whitespace-nowrap ncc-master-col-code">
                      {s.supplierCode}
                    </td>
                    <td className="table-cell ncc-master-col-name">
                      <button
                        type="button"
                        className="ncc-master-name"
                        onClick={() => setViewing(s)}
                      >
                        {s.supplierName}
                      </button>
                    </td>
                    <td className="table-cell whitespace-nowrap tabular-nums ncc-master-col-phone">
                      {s.contactPhone || '—'}
                    </td>
                    <td className="table-cell text-right tabular-nums whitespace-nowrap ncc-master-col-debt">
                      {s.maxDebtDays} ngày
                    </td>
                    <td className="table-cell text-right tabular-nums whitespace-nowrap ncc-master-col-limit">
                      {s.creditLimit ? formatCurrencyFull(s.creditLimit) : 'Không giới hạn'}
                    </td>
                    <td className="table-cell ncc-master-col-terms">
                      <span className="line-clamp-2" title={s.paymentTerms || undefined}>
                        {s.paymentTerms || '—'}
                      </span>
                    </td>
                    <td className="table-cell ncc-master-col-groups">
                      <IndustryGroupsCell groups={s.industryGroups ?? []} />
                    </td>
                    <td className="table-cell text-center ncc-master-col-grade">
                      <RatingBadge rating={s.rating} />
                    </td>
                    <td className="table-cell text-center ncc-master-col-status">
                      <ApprovalStatusBadge status={s.approvalStatus} />
                    </td>
                    <td className="table-cell text-right tabular-nums whitespace-nowrap ncc-master-col-revenue">
                      {formatCurrencyFull(s.purchasedRevenue)}
                    </td>
                    <td className="table-cell ncc-master-col-eval">
                      {s.latestEvaluation ? (
                        <span
                          className="line-clamp-2"
                          title={`${s.latestEvaluation.period} - ${s.latestEvaluation.gradeLabel || s.latestEvaluation.grade} - ${s.latestEvaluation.evaluatedAt}`}
                        >
                          {s.latestEvaluation.period} - {s.latestEvaluation.gradeLabel || s.latestEvaluation.grade}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="table-cell text-right tabular-nums ncc-master-col-kpi">
                      {s.latestEvaluation ? s.latestEvaluation.score : '—'}
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
        )}
      </PurchasingListLayout>

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
                className="btn btn-danger"
                onClick={() => openBlacklist(viewing)}
              >
                Thêm vào blacklist
              </button>
            ) : null}
            {viewing && canApproveSupplier
            && normalizeSupplierApproval(viewing.approvalStatus) !== SUPPLIER_APPROVAL.Approved ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRejectTarget(viewing)}
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  className="btn btn-filled"
                  onClick={() => setApproveTarget(viewing)}
                >
                  Duyệt NCC
                </button>
              </>
            ) : null}
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
            <DetailField label="Hạng">
              <RatingBadge rating={viewing.rating} />
            </DetailField>
            <DetailField label="Trạng thái">
              <ApprovalStatusBadge status={viewing.approvalStatus} />
            </DetailField>
            <DetailField label="Tên nhà cung cấp" span>{viewing.supplierName}</DetailField>
            <DetailField label="Điện thoại">{viewing.contactPhone || '—'}</DetailField>
            <DetailField label="Hạn công nợ">{viewing.maxDebtDays} ngày</DetailField>
            <DetailField label="Hạn mức công nợ">
              {viewing.creditLimit ? formatCurrencyFull(viewing.creditLimit) : 'Không giới hạn'}
            </DetailField>
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
                ? `${viewing.latestEvaluation.period} · ${viewing.latestEvaluation.gradeLabel || viewing.latestEvaluation.grade} · ${viewing.latestEvaluation.evaluatedAt}`
                : '—'}
            </DetailField>
            <DetailField label="Điểm KPI gần nhất">
              {viewing.latestEvaluation ? viewing.latestEvaluation.score : '—'}
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
          <FormField label="Mã NCC" error={formErrors.supplierCode}>
            <input
              className="form-input font-mono"
              value={form.supplierCode}
              disabled
              readOnly
              placeholder={editing ? undefined : 'Hệ thống tự cấp khi lưu'}
              aria-readonly="true"
            />
          </FormField>
          <FormField label="Tên nhà cung cấp" required error={formErrors.supplierName}>
            <input
              className="form-input"
              value={form.supplierName}
              maxLength={SUPPLIER_LIMITS.nameMax}
              onChange={e => {
                setForm(f => ({ ...f, supplierName: e.target.value }));
                setFormErrors(prev => ({ ...prev, supplierName: undefined }));
              }}
            />
          </FormField>
          <FormField label="Điện thoại liên hệ" error={formErrors.contactPhone}>
            <input
              className="form-input"
              value={form.contactPhone}
              maxLength={10}
              inputMode="numeric"
              autoComplete="tel"
              onChange={e => {
                const contactPhone = restrictVnPhoneInput(e.target.value);
                setForm(f => ({ ...f, contactPhone }));
                setFormErrors(prev => ({ ...prev, contactPhone: undefined }));
              }}
              onBlur={() => {
                setFormErrors(prev => ({
                  ...prev,
                  contactPhone: validateOptionalVietnamPhone(form.contactPhone) ?? undefined,
                }));
              }}
              placeholder="0912345678"
            />
          </FormField>
          <FormField label="Hạn công nợ (ngày)" required error={formErrors.maxDebtDays}>
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              value={form.maxDebtDays}
              onChange={e => {
                const maxDebtDays = e.target.value;
                setForm(f => ({ ...f, maxDebtDays }));
                const parsed = parseMaxDebtDays(maxDebtDays);
                setFormErrors(prev => ({
                  ...prev,
                  maxDebtDays: parsed.ok ? undefined : parsed.error,
                }));
              }}
              placeholder="0 - 3650"
            />
          </FormField>
          <FormField
            label="Hạn mức công nợ (tiền, trống = không giới hạn)"
            error={formErrors.creditLimit}
          >
            <CurrencyInput
              value={form.creditLimit}
              onChange={creditLimit => {
                setForm(f => ({ ...f, creditLimit }));
                const parsed = parseCreditLimit(creditLimit);
                setFormErrors(prev => ({
                  ...prev,
                  creditLimit: parsed.ok ? undefined : parsed.error,
                }));
              }}
              placeholder="Không giới hạn"
            />
          </FormField>
          <FormField label="Trạng thái">
            <div className="flex flex-wrap items-center gap-2">
              <ApprovalStatusBadge status={editing?.approvalStatus ?? SUPPLIER_APPROVAL.New} />
              <span className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] text-pretty">
                {editing
                  ? 'Chỉ sếp duyệt mới đổi trạng thái. Chưa duyệt thì chưa đặt PO được.'
                  : 'NCC mới ở trạng thái Mới. Sếp duyệt xong mới đặt hàng được.'}
              </span>
            </div>
          </FormField>
          <FormField label="Hạng">
            <div className="flex flex-wrap items-center gap-2">
              <RatingBadge rating={editing?.rating ?? 'D'} />
              <span className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] text-pretty">
                Mặc định Hạng D khi tạo. Sau duyệt, hạng tăng/giảm theo phiếu đánh giá PO.
              </span>
            </div>
          </FormField>
          <FormField label="Điều khoản thanh toán" error={formErrors.paymentTerms}>
            <input
              className="form-input"
              value={form.paymentTerms}
              maxLength={SUPPLIER_LIMITS.paymentTermsMax}
              onChange={e => {
                setForm(f => ({ ...f, paymentTerms: e.target.value }));
                setFormErrors(prev => ({ ...prev, paymentTerms: undefined }));
              }}
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

      <ConfirmDialog
        isOpen={blacklistTarget !== null}
        onClose={() => {
          setBlacklistTarget(null);
          setBlacklistReason('');
        }}
        onConfirm={() => void handleAddBlacklist()}
        title="Thêm vào blacklist?"
        message={
          blacklistTarget ? (
            <div className="space-y-3 text-left">
              <p>
                Chuyển <strong>{blacklistTarget.supplierName}</strong> ({blacklistTarget.supplierCode}) sang
                mục Danh sách blacklist? NCC này sẽ không còn hiện ở danh mục nhà cung cấp.
              </p>
              <label className="block space-y-1 text-sm">
                <span className="font-semibold">
                  Lý do <span className="text-[var(--md-error)]">*</span>
                </span>
                <textarea
                  className="form-input w-full min-h-[80px] text-sm"
                  value={blacklistReason}
                  onChange={e => setBlacklistReason(e.target.value)}
                  placeholder="Nhập lý do bắt buộc…"
                  autoFocus
                />
              </label>
            </div>
          ) : null
        }
        confirmLabel="Thêm vào blacklist"
        variant="danger"
        isLoading={addBlacklistMutation.isPending}
      />

      <ConfirmDialog
        isOpen={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => void handleApprove()}
        title="Duyệt nhà cung cấp?"
        message={
          approveTarget ? (
            <p>
              Duyệt <strong>{approveTarget.supplierName}</strong> ({approveTarget.supplierCode})?
              Sau khi duyệt có thể chọn NCC này khi tạo PO.
            </p>
          ) : null
        }
        confirmLabel="Duyệt"
        variant="default"
        isLoading={approveMutation.isPending}
      />

      <ConfirmDialog
        isOpen={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => void handleReject()}
        title="Từ chối nhà cung cấp?"
        message={
          rejectTarget ? (
            <p>
              Từ chối <strong>{rejectTarget.supplierName}</strong>? NCC này chưa đặt hàng được.
            </p>
          ) : null
        }
        confirmLabel="Từ chối"
        variant="danger"
        isLoading={rejectMutation.isPending}
      />
    </>
  );
}
