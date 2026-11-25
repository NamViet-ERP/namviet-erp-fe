import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Award, Ban, Banknote, Check, ClipboardList, Eye,
  History, Pencil, Plus, Trash2, Upload, Users, X,
} from 'lucide-react';
import SupplierSourcingKpiCards from '../../components/suppliers/SupplierSourcingKpiCards';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import { usePermission } from '../../hooks/usePermission';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { formatCurrencyInput } from '../../utils/formatCurrency';
import { SUPPLIER_APPROVAL, normalizeSupplierApproval } from '../../lib/suppliers/supplierStatus';
import {
  useApproveSupplier, useCreateSupplier, useDeleteSupplier,
  useRejectSupplier, useSuppliers, useUpdateSupplier,
} from '../../hooks/useSuppliers';
import { useAddSupplierToBlacklist, useSupplierGroups } from '../../hooks/useSupplierDirectory';
import { supplierGroupsService } from '../../services/supplierDirectoryService';
import { queryKeys } from '../../services/queryKeys';
import { suppliersService } from '../../services/suppliersService';
import type { UpsertSupplierRequest } from '../../types/wms';
import type { DropdownItem } from '../../types';
import SupplierDetailModal from './suppliers/SupplierDetailModal';
import SupplierFormModal from './suppliers/SupplierFormModal';
import SupplierConfirmDialogs from './suppliers/SupplierConfirmDialogs';
import SupplierExtraModals from './suppliers/SupplierExtraModals';
import SuppliersTable, { SuppliersFilterBar } from './suppliers/SuppliersTable';
import {
  emptyForm, mapSupplierSaveErrors, validateSupplierForm,
  type FormErrors, type SupplierRow,
} from './suppliers/SupplierShared';
import type { StagedAttachment } from '../../components/suppliers/SupplierAttachmentUploader';

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
  const [page, setPage] = useState(1);
  const prevUrlSearchRef = useRef(urlSearch);

  useEffect(() => {
    if (urlSearch !== prevUrlSearchRef.current) {
      prevUrlSearchRef.current = urlSearch;
      if (urlSearch) {
        setSearch(urlSearch);
        setPage(1);
      }
    }
  }, [urlSearch]);
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
    const result = validateSupplierForm(form, items, editing?.id);
    if (!result.ok) {
      setFormErrors(result.errors);
      return;
    }
    setFormErrors({});
    const body: UpsertSupplierRequest = result.body;

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

  const openBlacklist = (s: SupplierRow) => {
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

  const openAddContact = () => setIsContactModalOpen(true);

  const rowActions = (s: SupplierRow): DropdownItem[] => [
    { label: 'Xem chi tiết', icon: Eye, onClick: () => setViewing(s) },
    { label: 'Sửa', icon: Pencil, onClick: () => void openEdit(s) },
    { label: 'Xem công nợ NCC', icon: Banknote, onClick: () => navigate(`/suppliers/debt?supplierId=${s.id}`) },
    { label: 'Xem người liên hệ', icon: Users, onClick: () => navigate(`/suppliers/contacts?supplierId=${s.id}`) },
    {
      label: 'Xem đơn mua hàng (PO)',
      icon: ClipboardList,
      onClick: () => navigate(`/purchasing/orders?search=${encodeURIComponent(s.supplierCode)}`),
    },
    { label: 'Đánh giá thăng hạng (50-20-20-10)', icon: Award, onClick: () => setEvaluatingSupplier(s) },
    { label: 'Lịch sử chuyển hạng', icon: History, onClick: () => setHistorySupplier(s) },
    ...(canApproveSupplier && normalizeSupplierApproval(s.approvalStatus) !== SUPPLIER_APPROVAL.Approved
      ? [
          { label: 'Duyệt NCC', icon: Check, onClick: () => setApproveTarget(s) },
          { label: 'Từ chối', icon: X, danger: true, onClick: () => setRejectTarget(s) },
        ]
      : []),
    { divider: true },
    { label: 'Thêm vào blacklist', icon: Ban, danger: true, onClick: () => openBlacklist(s) },
    { divider: true },
    { label: 'Xóa', icon: Trash2, danger: true, onClick: () => setDeleteTarget(s) },
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
          <SuppliersFilterBar
            ratingFilter={ratingFilter}
            onRatingFilterChange={value => {
              setRatingFilter(value);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={value => {
              setStatusFilter(value);
              setPage(1);
            }}
            groupIdFromUrl={groupIdFromUrl}
            filteredGroupName={filteredGroupName}
            onClearGroupFilter={clearGroupFilter}
          />
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
        <SuppliersTable
          items={items}
          isLoading={isLoading}
          isError={isError}
          hasActiveFilters={hasActiveFilters}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={s => {
            setPageSize(s);
            setPage(1);
          }}
          onOpenCreate={() => void openCreate()}
          onViewSupplier={setViewing}
          rowActions={rowActions}
        />
      </PurchasingListLayout>

      <SupplierDetailModal
        viewing={viewing}
        canApproveSupplier={canApproveSupplier}
        openingEdit={openingEdit}
        onClose={() => setViewing(null)}
        onOpenBlacklist={openBlacklist}
        onApprove={s => setApproveTarget(s)}
        onReject={s => setRejectTarget(s)}
        onEdit={s => void openEdit(s)}
        onAddContact={openAddContact}
        onAttachmentChanged={() => void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all })}
      />

      <SupplierFormModal
        isOpen={showForm}
        editing={editing}
        form={form}
        setForm={setForm}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        groupOptions={groupOptions}
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
        onAttachmentChanged={() => { void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all }); }}
        isSaving={isSaving}
        onClose={closeForm}
        onSubmit={e => { void handleSubmit(e); }}
        onFetchNextCode={() => { void handleFetchNextCode(); }}
      />

      <SupplierConfirmDialogs
        deleteTarget={deleteTarget}
        onCloseDelete={() => setDeleteTarget(null)}
        onConfirmDelete={() => { void handleDelete(); }}
        isDeleting={deleteMutation.isPending}
        blacklistTarget={blacklistTarget}
        blacklistReason={blacklistReason}
        onBlacklistReasonChange={setBlacklistReason}
        onCloseBlacklist={() => { setBlacklistTarget(null); setBlacklistReason(''); }}
        onConfirmBlacklist={() => { void handleAddBlacklist(); }}
        isBlacklisting={addBlacklistMutation.isPending}
        approveTarget={approveTarget}
        onCloseApprove={() => setApproveTarget(null)}
        onConfirmApprove={() => { void handleApprove(); }}
        isApproving={approveMutation.isPending}
        rejectTarget={rejectTarget}
        onCloseReject={() => setRejectTarget(null)}
        onConfirmReject={() => { void handleReject(); }}
        isRejecting={rejectMutation.isPending}
      />

      <SupplierExtraModals
        evaluatingSupplier={evaluatingSupplier}
        onCloseEvaluating={() => setEvaluatingSupplier(null)}
        historySupplier={historySupplier}
        onCloseHistory={() => setHistorySupplier(null)}
        isImportModalOpen={isImportModalOpen}
        onCloseImport={() => setIsImportModalOpen(false)}
        viewingSupplierId={viewing?.id ?? null}
        isContactModalOpen={isContactModalOpen}
        onCloseContact={() => setIsContactModalOpen(false)}
      />
    </>
  );
}
