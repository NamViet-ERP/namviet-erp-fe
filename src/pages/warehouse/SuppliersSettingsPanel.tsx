import type React from 'react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Ban,
  Check,
  Plus,
  Trash2,
  Pencil,
  Eye,
  X,
  Award,
  History,
  Upload,
  RefreshCw,
  Users,
  Star,
  ExternalLink,
  Banknote,
  ClipboardList,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import SupplierTierEvaluationModal from '../../components/suppliers/SupplierTierEvaluationModal';
import SupplierGradeHistoryModal from '../../components/suppliers/SupplierGradeHistoryModal';
import SupplierSourcingKpiCards from '../../components/suppliers/SupplierSourcingKpiCards';
import SupplierImportExcelModal from '../../components/suppliers/SupplierImportExcelModal';
import SupplierAttachmentUploader, { type StagedAttachment } from '../../components/suppliers/SupplierAttachmentUploader';
import SupplierContactFormModal from '../../components/suppliers/SupplierContactFormModal';
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
  useSupplierContacts,
  useCreateSupplierContact,
} from '../../hooks/useSupplierDirectory';
import { supplierGroupsService } from '../../services/supplierDirectoryService';
import { queryKeys } from '../../services/queryKeys';
import { suppliersService, type SupplierApiDto } from '../../services/suppliersService';
import type { UpsertSupplierRequest } from '../../types/wms';
import type { DropdownItem } from '../../types';

const RATING_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const GROUPS_VISIBLE_IN_TABLE = 3;
const COL_COUNT = 13;
type FormErrors = Partial<Record<'supplierCode' | 'supplierName' | 'taxCode' | 'contactPhone' | 'maxDebtDays' | 'creditLimit' | 'paymentTerms', string>>;
type SupplierRow = SupplierApiDto;

const emptyForm = {
  supplierCode: '',
  supplierName: '',
  taxCode: '',
  contactPhone: '',
  contactName: '',
  contactEmail: '',
  contactPosition: '',
  supplierType: 'Nhà phân phối',
  scope: 'Trong nước',
  website: '',
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
  if (!next.taxCode && (lower.includes('mã số thuế') || lower.includes('mst') || lower.includes('taxcode'))) {
    next.taxCode = message;
  }
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

function SupplierViewingContacts({
  supplierId,
  onAddContact,
}: {
  supplierId: number;
  onAddContact: () => void;
}) {
  const { data, isLoading } = useSupplierContacts({ supplierId, pageSize: 50 });
  const contacts = data?.items ?? [];

  return (
    <div className="space-y-2.5 mt-3 pt-3 border-t border-[var(--md-outline-variant)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface)] flex items-center gap-1.5">
          <Users size={15} className="text-primary-600 dark:text-primary-400" />
          Danh sách Người liên hệ ({contacts.length})
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outlined"
            size="sm"
            onClick={onAddContact}
            className="text-xs"
          >
            <Plus size={13} className="mr-1" /> Thêm liên hệ
          </Button>
          <Link
            to={`/suppliers/contacts?supplierId=${supplierId}`}
            className="text-xs text-primary-600 hover:underline flex items-center gap-1"
          >
            Quản lý <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-[var(--md-on-surface-variant)] py-3 text-center">
          Đang tải danh sách người liên hệ...
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-3 text-center text-xs text-[var(--md-on-surface-variant)] border border-dashed rounded-lg">
          Chưa có thông tin người liên hệ nào cho NCC này. Bấm &quot;Thêm liên hệ&quot; để bổ sung trực tiếp.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg border-[var(--md-outline-variant)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--md-surface-variant)]/40 text-[var(--md-on-surface-variant)]">
              <tr>
                <th className="py-2 px-3">Họ tên</th>
                <th className="py-2 px-3">Chức vụ</th>
                <th className="py-2 px-3">Điện thoại</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3 text-center">Vai trò</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-outline-variant)]">
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-[var(--md-surface-variant)]/20">
                  <td className="py-2 px-3 font-medium text-[var(--md-on-surface)]">
                    <div className="flex items-center gap-1.5">
                      {c.fullName}
                      {c.role === 'primary' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                          <Star size={10} className="fill-amber-500 text-amber-500" /> Chính
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-[var(--md-on-surface-variant)]">{c.position || '—'}</td>
                  <td className="py-2 px-3 font-mono text-[var(--md-on-surface)]">{c.phone || '—'}</td>
                  <td className="py-2 px-3 text-[var(--md-on-surface-variant)]">{c.email || '—'}</td>
                  <td className="py-2 px-3 text-center text-[var(--md-on-surface-variant)]">
                    {c.roleLabel || c.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    if (urlSearch && urlSearch !== search) {
      setSearch(urlSearch);
      setPage(1);
    }
  }, [urlSearch]);
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
  const [evaluatingSupplier, setEvaluatingSupplier] = useState<SupplierRow | null>(null);
  const [historySupplier, setHistorySupplier] = useState<SupplierRow | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedAttachment[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const createContact = useCreateSupplierContact();

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
    const next = new URLSearchParams(searchParams);
    next.delete('groupId');
    next.delete('search');
    setSearchParams(next, { replace: true });
  };

  const openCreate = async () => {
    setEditing(null);
    setForm(emptyForm);
    setStagedFiles([]);
    setFormErrors({});
    setShowForm(true);
    try {
      const { nextCode } = await suppliersService.nextCode();
      setForm(f => ({ ...f, supplierCode: nextCode }));
    } catch {
      setForm(f => ({ ...f, supplierCode: '' }));
    }
  };

  const handleFetchNextCode = async () => {
    try {
      const { nextCode } = await suppliersService.nextCode();
      setForm(f => ({ ...f, supplierCode: nextCode }));
      setFormErrors(prev => ({ ...prev, supplierCode: undefined }));
      showToast('info', `Đã lấy mã gợi ý mới nhất: ${nextCode}`);
    } catch {
      showToast('error', 'Không thể lấy mã gợi ý tự động.');
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
        taxCode: s.taxCode ?? '',
        contactPhone: s.primaryContact?.phone ?? s.contactPhone ?? '',
        contactName: s.primaryContact?.fullName ?? '',
        contactPosition: s.primaryContact?.position ?? '',
        contactEmail: s.primaryContact?.email ?? '',
        supplierType: s.supplierType ?? 'Nhà phân phối',
        scope: s.scope ?? 'Trong nước',
        website: s.website ?? '',
        maxDebtDays: String(s.maxDebtDays),
        creditLimit: s.creditLimit ? formatCurrencyInput(s.creditLimit) : '',
        paymentTerms: s.paymentTerms ?? '',
        groupIds: assigned.map(g => g.id),
      });
      setStagedFiles([]);
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
    setStagedFiles([]);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplierCode = form.supplierCode.trim();
    const supplierName = form.supplierName.trim();
    const taxCode = form.taxCode.trim();
    const paymentTerms = form.paymentTerms.trim();
    const nextErrors: FormErrors = {};

    if (supplierCode) {
      if (supplierCode.length > SUPPLIER_LIMITS.codeMax) {
        nextErrors.supplierCode = `Mã nhà cung cấp tối đa ${SUPPLIER_LIMITS.codeMax} ký tự.`;
      } else if (
        items.some(s => s.id !== editing?.id && s.supplierCode.toLowerCase() === supplierCode.toLowerCase())
      ) {
        nextErrors.supplierCode = 'Mã nhà cung cấp đã tồn tại.';
      }
    }

    if (!supplierName) nextErrors.supplierName = 'Tên nhà cung cấp là bắt buộc.';
    else if (supplierName.length > SUPPLIER_LIMITS.nameMax) {
      nextErrors.supplierName = `Tên nhà cung cấp tối đa ${SUPPLIER_LIMITS.nameMax} ký tự.`;
    } else if (
      items.some(s => s.id !== editing?.id && isSameSupplierName(s.supplierName, supplierName))
    ) {
      nextErrors.supplierName = 'Tên nhà cung cấp đã tồn tại.';
    }

    if (taxCode.length > 50) {
      nextErrors.taxCode = 'Mã số thuế tối đa 50 ký tự.';
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

    const body: UpsertSupplierRequest = {
      supplierCode: supplierCode || null,
      supplierName,
      taxCode: taxCode || null,
      contactPhone: contactPhone || null,
      contactName: form.contactName.trim() || null,
      contactPosition: form.contactPosition.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      supplierType: form.supplierType || null,
      scope: form.scope || null,
      website: form.website.trim() || null,
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
        if (stagedFiles.length > 0) {
          for (const staged of stagedFiles) {
            try {
              await suppliersService.uploadAttachment(created.id, staged.file, staged.docType);
            } catch (uploadErr) {
              console.error('Failed to upload staged attachment:', uploadErr);
            }
          }
        }
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
    {
      label: 'Xem công nợ NCC',
      icon: Banknote,
      onClick: () => navigate(`/suppliers/debt?supplierId=${s.id}`),
    },
    {
      label: 'Xem người liên hệ',
      icon: Users,
      onClick: () => navigate(`/suppliers/contacts?supplierId=${s.id}`),
    },
    {
      label: 'Xem đơn mua hàng (PO)',
      icon: ClipboardList,
      onClick: () => navigate(`/purchasing/orders?search=${encodeURIComponent(s.supplierCode)}`),
    },
    {
      label: 'Đánh giá thăng hạng (50-20-20-10)',
      icon: Award,
      onClick: () => setEvaluatingSupplier(s),
    },
    {
      label: 'Lịch sử chuyển hạng',
      icon: History,
      onClick: () => setHistorySupplier(s),
    },
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
        intro={<SupplierSourcingKpiCards onGradeFilterSelect={(g) => { setRatingFilter(g); setPage(1); }} />}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline inline-flex items-center gap-1.5"
              onClick={() => setIsImportModalOpen(true)}
              title="Nhập danh sách nhà cung cấp hàng loạt từ file Excel"
            >
              <Upload size={16} aria-hidden />
              Upload Excel NCC
            </button>
            <button type="button" className="btn btn-primary inline-flex items-center gap-1.5" onClick={() => void openCreate()}>
              <Plus size={16} aria-hidden />
              Thêm NCC
            </button>
          </div>
        )}
      >
        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table ncc-master-table">
            <thead>
              <tr>
                <th className="table-header-cell ncc-master-col-code">Mã NCC</th>
                <th className="table-header-cell ncc-master-col-name">Tên nhà cung cấp</th>
                <th className="table-header-cell ncc-master-col-phone">Người liên hệ</th>
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
                      {s.taxCode && (
                        <div className="text-[11px] text-[var(--md-on-surface-variant)] font-mono">
                          MST: {s.taxCode}
                        </div>
                      )}
                    </td>
                    <td className="table-cell ncc-master-col-phone">
                      {s.primaryContact ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-[var(--md-on-surface)] flex items-center gap-1">
                            <span className="truncate max-w-[140px]" title={s.primaryContact.fullName}>
                              {s.primaryContact.fullName}
                            </span>
                            {s.contactCount && s.contactCount > 1 ? (
                              <span
                                className="inline-flex items-center text-[10px] font-normal text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-1 py-0.2 rounded"
                                title={`${s.contactCount} liên hệ`}
                              >
                                +{s.contactCount - 1}
                              </span>
                            ) : null}
                          </span>
                          <span className="text-[11px] text-[var(--md-on-surface-variant)] tabular-nums">
                            {s.primaryContact.phone || s.contactPhone || '—'}
                          </span>
                          {s.primaryContact.position && (
                            <span
                              className="text-[10px] text-[var(--md-on-surface-variant)]/70 truncate max-w-[140px]"
                              title={s.primaryContact.position}
                            >
                              {s.primaryContact.position}
                            </span>
                          )}
                        </div>
                      ) : s.contactPhone ? (
                        <span className="tabular-nums text-xs">{s.contactPhone}</span>
                      ) : (
                        <span className="text-zinc-400 italic text-xs">Chưa có liên hệ</span>
                      )}
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
          <div>
            {/* 360° Action Hub */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 mb-4 rounded-xl bg-[var(--md-surface-variant05)] border border-[var(--md-outline-variant)]">
              <span className="text-xs font-semibold text-[var(--md-on-surface-variant)] mr-1">360° Hub:</span>
              <Link
                to={`/suppliers/debt?supplierId=${viewing.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
              >
                <Banknote size={14} className="text-emerald-600 dark:text-emerald-400" />
                Công nợ &amp; DNTT
              </Link>
              <Link
                to={`/purchasing/orders?search=${encodeURIComponent(viewing.supplierCode)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
              >
                <ClipboardList size={14} className="text-blue-600 dark:text-blue-400" />
                Đơn mua hàng PO
              </Link>
              <Link
                to={`/suppliers/evaluations?supplierId=${viewing.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
              >
                <Award size={14} className="text-amber-600 dark:text-amber-400" />
                Đánh giá &amp; Thăng hạng
              </Link>
            </div>

            <div className="ncc-master-detail-grid">
              <DetailField label="Mã NCC">{viewing.supplierCode}</DetailField>
              <DetailField label="Hạng">
                <RatingBadge rating={viewing.rating} />
              </DetailField>
              <DetailField label="Trạng thái">
                <ApprovalStatusBadge status={viewing.approvalStatus} />
              </DetailField>
              <DetailField label="Tên nhà cung cấp" span>{viewing.supplierName}</DetailField>
              <DetailField label="Loại hình đối tác">{viewing.supplierType || '—'}</DetailField>
              <DetailField label="Phạm vi">{viewing.scope || '—'}</DetailField>
              <DetailField label="Mã số thuế (MST)">{viewing.taxCode || '—'}</DetailField>
              <DetailField label="Người liên hệ chính">
                {viewing.primaryContact ? (
                  <div>
                    <div className="font-semibold text-[var(--md-on-surface)] flex items-center gap-1.5">
                      {viewing.primaryContact.fullName}
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                        <Star size={10} className="fill-amber-500 text-amber-500" /> Chính
                      </span>
                    </div>
                    <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                      {viewing.primaryContact.position ? `${viewing.primaryContact.position} · ` : ''}
                      {viewing.primaryContact.phone || viewing.contactPhone || ''}
                      {viewing.primaryContact.email ? ` · ${viewing.primaryContact.email}` : ''}
                    </div>
                  </div>
                ) : (
                  viewing.contactPhone || '—'
                )}
              </DetailField>
              <DetailField label="Website" span>
                {viewing.website ? (
                  <a
                    href={viewing.website.startsWith('http') ? viewing.website : `https://${viewing.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
                  >
                    {viewing.website}
                  </a>
                ) : (
                  '—'
                )}
              </DetailField>
              <DetailField label="Hạn công nợ">
                <div className="flex items-center justify-between gap-2">
                  <span>{viewing.maxDebtDays} ngày</span>
                  <Link
                    to={`/suppliers/debt?supplierId=${viewing.id}`}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                  >
                    Xem bảng kê công nợ <ExternalLink size={11} />
                  </Link>
                </div>
              </DetailField>
              <DetailField label="Hạn mức công nợ">
                <div className="flex items-center justify-between gap-2">
                  <span>{viewing.creditLimit ? formatCurrencyFull(viewing.creditLimit) : 'Không giới hạn'}</span>
                  <Link
                    to={`/suppliers/debt?supplierId=${viewing.id}`}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                  >
                    Xem bảng kê công nợ <ExternalLink size={11} />
                  </Link>
                </div>
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
                <div className="flex items-center justify-between gap-2">
                  <span>{formatCurrencyFull(viewing.purchasedRevenue)}</span>
                  <Link
                    to={`/purchasing/orders?search=${encodeURIComponent(viewing.supplierCode)}`}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                  >
                    Xem đơn hàng PO <ExternalLink size={11} />
                  </Link>
                </div>
              </DetailField>
              <DetailField label="Đánh giá định kỳ gần nhất">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {viewing.latestEvaluation
                      ? `${viewing.latestEvaluation.period} · ${viewing.latestEvaluation.gradeLabel || viewing.latestEvaluation.grade} · ${viewing.latestEvaluation.evaluatedAt}`
                      : '—'}
                  </span>
                  <Link
                    to={`/suppliers/evaluations?supplierId=${viewing.id}&tab=kpi`}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                  >
                    Lịch sử đánh giá <ExternalLink size={11} />
                  </Link>
                </div>
              </DetailField>
              <DetailField label="Điểm KPI gần nhất">
                {viewing.latestEvaluation ? viewing.latestEvaluation.score : '—'}
              </DetailField>

              {/* Attachments Section */}
              <div className="ncc-master-detail-span pt-3 mt-2 border-t border-[var(--md-outline-variant)]">
                <SupplierAttachmentUploader
                  supplierId={viewing.id}
                  initialAttachments={viewing.attachments ?? []}
                  onAttachmentChanged={() => {
                    void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
                  }}
                />
              </div>

              {/* Contacts Section */}
              <div className="ncc-master-detail-span">
                <SupplierViewingContacts
                  supplierId={viewing.id}
                  onAddContact={() => setIsContactModalOpen(true)}
                />
              </div>
            </div>
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
            <div className="flex items-center gap-2">
              <input
                className="form-input font-mono flex-1"
                value={form.supplierCode}
                maxLength={SUPPLIER_LIMITS.codeMax}
                disabled={Boolean(editing)}
                readOnly={Boolean(editing)}
                onChange={e => {
                  setForm(f => ({ ...f, supplierCode: e.target.value }));
                  setFormErrors(prev => ({ ...prev, supplierCode: undefined }));
                }}
                placeholder={editing ? undefined : 'Hệ thống tự cấp hoặc nhập mã quy ước'}
                aria-readonly={Boolean(editing)}
              />
              {!editing && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm shrink-0 inline-flex items-center gap-1.5 text-xs text-[var(--md-primary)] hover:bg-[var(--md-primary)]/10 cursor-pointer"
                  onClick={() => void handleFetchNextCode()}
                  title="Lấy lại mã gợi ý tiếp theo tự động từ hệ thống"
                >
                  <RefreshCw size={13} />
                  <span>Lấy mã gợi ý</span>
                </button>
              )}
            </div>
            {!editing && (
              <p className="text-[11px] text-[var(--md-on-surface-variant)] mt-1">
                Mã gợi ý tự động bởi hệ thống. Bạn có thể sửa đổi theo mã quy ước riêng của công ty (tối đa 50 ký tự).
              </p>
            )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Loại hình đối tác">
              <select
                className="form-select"
                value={form.supplierType}
                onChange={e => setForm(f => ({ ...f, supplierType: e.target.value }))}
              >
                <option value="Nhà sản xuất">Nhà sản xuất (Manufacturer)</option>
                <option value="Nhà phân phối">Nhà phân phối (Distributor)</option>
                <option value="Đại lý">Đại lý ủy quyền (Agent / Dealer)</option>
                <option value="Dịch vụ / Gia công">Dịch vụ / Gia công (Service / Fabrication)</option>
                <option value="Thương mại khác">Thương mại khác</option>
              </select>
            </FormField>

            <FormField label="Phạm vi hoạt động">
              <select
                className="form-select"
                value={form.scope}
                onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              >
                <option value="Trong nước">Trong nước (Domestic)</option>
                <option value="Quốc tế">Quốc tế (International)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Mã số thuế (MST)" error={formErrors.taxCode}>
            <input
              className="form-input font-mono"
              value={form.taxCode}
              maxLength={50}
              onChange={e => {
                setForm(f => ({ ...f, taxCode: e.target.value }));
                setFormErrors(prev => ({ ...prev, taxCode: undefined }));
              }}
              placeholder="VD: 0315986604 hoặc 0100123456-001"
            />
          </FormField>
          {/* Thông tin Người liên hệ chính */}
          <div className="rounded-xl border border-[var(--md-outline-variant)] p-3.5 bg-[var(--md-surface-variant)]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface)] flex items-center gap-1.5">
                <Users size={15} className="text-primary-600 dark:text-primary-400" />
                Người liên hệ chính (Primary Contact)
              </span>
              <span className="text-[11px] text-[var(--md-on-surface-variant)]">
                Tự động tạo/đồng bộ vào danh mục Liên hệ NCC
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Họ và tên người liên hệ">
                <input
                  className="form-input"
                  value={form.contactName}
                  maxLength={150}
                  placeholder="VD: Nguyễn Văn An"
                  onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                />
              </FormField>

              <FormField label="Chức vụ">
                <input
                  className="form-input"
                  value={form.contactPosition}
                  maxLength={150}
                  placeholder="VD: Trưởng phòng Kinh doanh"
                  onChange={e => setForm(f => ({ ...f, contactPosition: e.target.value }))}
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

              <FormField label="Email liên hệ">
                <input
                  type="email"
                  className="form-input"
                  value={form.contactEmail}
                  maxLength={255}
                  placeholder="an.nguyen@supplier.com"
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Website">
            <input
              className="form-input"
              value={form.website}
              maxLength={255}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="https://example.com"
            />
          </FormField>

          {/* Hồ sơ Onboarding đính kèm */}
          <SupplierAttachmentUploader
            supplierId={editing?.id}
            initialAttachments={editing?.attachments ?? []}
            stagedFiles={stagedFiles}
            onAddStagedFile={(docType, file) => {
              setStagedFiles(prev => [
                ...prev.filter(f => f.docType !== docType),
                { localId: `${docType}_${Date.now()}`, docType, file },
              ]);
            }}
            onRemoveStagedFile={(localId) => {
              setStagedFiles(prev => prev.filter(f => f.localId !== localId));
            }}
            onAttachmentChanged={() => {
              void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
            }}
          />
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

      {evaluatingSupplier && (
        <SupplierTierEvaluationModal
          supplier={evaluatingSupplier}
          isOpen={Boolean(evaluatingSupplier)}
          onClose={() => setEvaluatingSupplier(null)}
          onSuccess={() => {
            void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
          }}
        />
      )}

      {historySupplier && (
        <SupplierGradeHistoryModal
          supplier={historySupplier}
          isOpen={Boolean(historySupplier)}
          onClose={() => setHistorySupplier(null)}
        />
      )}

      {isImportModalOpen && (
        <SupplierImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
          }}
        />
      )}

      {viewing && (
        <SupplierContactFormModal
          isOpen={isContactModalOpen}
          editing={null}
          defaultSupplierId={viewing.id}
          isSaving={createContact.isPending}
          onClose={() => setIsContactModalOpen(false)}
          onSubmit={async (data) => {
            try {
              await createContact.mutateAsync(data);
              showToast('success', 'Thêm người liên hệ thành công');
              setIsContactModalOpen(false);
              void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
              void qc.invalidateQueries({ queryKey: queryKeys.supplierContacts.all });
            } catch (err) {
              showToast('error', getApiErrorMessage(err, 'Không thể thêm người liên hệ'));
            }
          }}
        />
      )}
    </>
  );
}
