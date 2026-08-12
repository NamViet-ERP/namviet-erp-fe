import { useMemo, useState } from 'react';
import { Eye, Plus, RefreshCw } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import {
  useCloseWarrantyClaim,
  useCreateWarrantyClaim,
  usePurchaseWarranty,
  usePurchaseWarranties,
  useSyncPurchaseWarranties,
  useUpdatePurchaseWarranty,
} from '../../hooks/usePurchaseWarranties';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import type { PurchaseWarrantyApiDto } from '../../services/purchaseWarrantiesService';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending_anchor', label: 'Chờ mốc' },
  { value: 'active', label: 'Còn hạn' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'void', label: 'Đã hủy' },
];

const COL_COUNT = 10;

function statusTone(status: string): 'ok' | 'warn' | 'danger' | 'neutral' {
  switch (status) {
    case 'active':
      return 'ok';
    case 'pending_anchor':
      return 'warn';
    case 'expired':
    case 'void':
      return 'danger';
    default:
      return 'neutral';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending_anchor':
      return 'Chờ mốc';
    case 'active':
      return 'Còn hạn';
    case 'expired':
      return 'Hết hạn';
    case 'void':
      return 'Đã hủy';
    default:
      return status;
  }
}

function claimStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Nháp';
    case 'submitted':
      return 'Đã gửi';
    case 'closed':
      return 'Đã đóng';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

function anchorLabel(anchor: string): string {
  return anchor === 'acceptance' ? 'Nghiệm thu' : 'Giao hàng';
}

export default function PurchaseWarrantiesPage() {
  const { has } = usePermission();
  const canCreate = has('purchasing.warranties.create');
  const canUpdate = has('purchasing.warranties.update');
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const projects = projectsPage?.items ?? [];

  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [claimReason, setClaimReason] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [acceptanceDate, setAcceptanceDate] = useState('');
  const [anchorType, setAnchorType] = useState('delivery');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [closeClaimId, setCloseClaimId] = useState<string | null>(null);
  const [serviceRating, setServiceRating] = useState('5');
  const [serviceNote, setServiceNote] = useState('');

  const listParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      projectCode: projectCode.trim() || undefined,
      materialCode: materialCode.trim() || undefined,
      status: status || undefined,
    }),
    [search, projectCode, materialCode, status],
  );

  const { data = [], isLoading, isError, error } = usePurchaseWarranties(listParams);
  const detailQuery = usePurchaseWarranty(selectedId ?? undefined);
  const syncMutation = useSyncPurchaseWarranties();
  const updateMutation = useUpdatePurchaseWarranty();
  const createClaimMutation = useCreateWarrantyClaim();
  const closeClaimMutation = useCloseWarrantyClaim();

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const hasFilters = Boolean(search.trim() || projectCode.trim() || materialCode.trim() || status);

  const openDetail = (row: PurchaseWarrantyApiDto) => {
    setSelectedId(row.id);
    setClaimReason('');
    setClaimNote('');
    setAcceptanceDate(row.acceptanceDate?.slice(0, 10) ?? '');
    setAnchorType(row.anchorType || 'delivery');
    setWarrantyMonths(String(row.warrantyMonths || 12));
  };

  const onSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      showToast(
        'success',
        `Đã đồng bộ: tạo ${result.created}, cập nhật ${result.updated} hồ sơ BH.`,
      );
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không đồng bộ được bảo hành'));
    }
  };

  const onSaveMeta = async () => {
    if (!selectedId) return;
    const months = Number(warrantyMonths);
    if (!Number.isFinite(months) || months < 0 || months > 120) {
      showToast('error', 'Số tháng BH phải từ 0 đến 120.');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        body: {
          warrantyMonths: months,
          anchorType,
          acceptanceDate: acceptanceDate || null,
        },
      });
      showToast('success', 'Đã cập nhật hồ sơ bảo hành.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không cập nhật được hồ sơ BH'));
    }
  };

  const onCreateClaim = async () => {
    if (!selectedId) return;
    if (claimReason.trim().length < 3) {
      showToast('error', 'Nhập nguyên nhân (tối thiểu 3 ký tự).');
      return;
    }
    try {
      await createClaimMutation.mutateAsync({
        id: selectedId,
        body: { reason: claimReason.trim(), note: claimNote.trim() || undefined, submit: true },
      });
      setClaimReason('');
      setClaimNote('');
      showToast('success', 'Đã tạo phiếu bảo hành.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được phiếu BH'));
    }
  };

  const onConfirmCloseClaim = async () => {
    if (!closeClaimId) return;
    const rating = Number(serviceRating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      showToast('error', 'Đánh giá dịch vụ BH phải từ 1 đến 5.');
      return;
    }
    try {
      await closeClaimMutation.mutateAsync({
        claimId: closeClaimId,
        body: {
          serviceRating: rating,
          serviceNote: serviceNote.trim() || null,
        },
      });
      setCloseClaimId(null);
      setServiceRating('5');
      setServiceNote('');
      showToast('success', 'Đã đóng phiếu BH và lưu đánh giá dịch vụ.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không đóng được phiếu'));
    }
  };

  return (
    <>
      <PurchasingListLayout
        title="Quản lý bảo hành"
        subtitle="Theo dõi hạn BH theo giao hàng / nghiệm thu · lọc dự án · mặt hàng · NCC · tạo phiếu BH."
        search={search}
        onSearchChange={v => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Tìm mã BH, PO, vật tư, NCC…"
        hasFilters={hasFilters}
        onResetFilters={() => {
          setSearch('');
          setProjectCode('');
          setMaterialCode('');
          setStatus('');
          setPage(1);
        }}
        actions={
          canUpdate ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={syncMutation.isPending}
              onClick={() => {
                void onSync();
              }}
            >
              <RefreshCw size={14} aria-hidden />
              {syncMutation.isPending ? 'Đang đồng bộ…' : 'Đồng bộ từ PO đã nhận'}
            </button>
          ) : null
        }
        filters={
          <>
            <ProjectAutocomplete
              value={projectCode}
              onChange={code => {
                setProjectCode(code);
                setPage(1);
              }}
              projects={projects}
              placeholder="Lọc dự án"
              compact
            />
            <input
              className="form-input"
              value={materialCode}
              onChange={e => {
                setMaterialCode(e.target.value);
                setPage(1);
              }}
              placeholder="Mã vật tư"
              aria-label="Lọc mã vật tư"
            />
            <select
              className="form-input"
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc trạng thái"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        }
      >
        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell">Mã BH</th>
                <th className="table-header-cell">PO</th>
                <th className="table-header-cell">Vật tư</th>
                <th className="table-header-cell">Dự án</th>
                <th className="table-header-cell">NCC</th>
                <th className="table-header-cell text-right">SL</th>
                <th className="table-header-cell">Mốc</th>
                <th className="table-header-cell">Hạn BH</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell text-center w-16">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={COL_COUNT} />
              ) : isError ? (
                <tr>
                  <td colSpan={COL_COUNT}>
                    <EmptyState message={getApiErrorMessage(error, 'Không tải được danh sách BH.')} />
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={COL_COUNT}>
                    <EmptyState message="Chưa có hồ sơ bảo hành. Set tháng BH trên dòng PO rồi nhập kho / Đồng bộ." />
                  </td>
                </tr>
              ) : (
                pageRows.map(row => (
                  <tr
                    key={row.id}
                    className="table-row wms-inventory-row--interactive"
                    onClick={() => openDetail(row)}
                  >
                    <td className="table-cell font-mono text-sm">{row.code}</td>
                    <td className="table-cell font-mono text-sm">{row.poCode}</td>
                    <td className="table-cell">
                      <div className="font-semibold">{row.materialName}</div>
                      <div className="text-xs text-[var(--md-on-surface-variant)] font-mono">
                        {row.materialCode || '—'}
                      </div>
                    </td>
                    <td className="table-cell font-mono text-sm">{row.projectCode || '—'}</td>
                    <td className="table-cell">{row.supplierName || '—'}</td>
                    <td className="table-cell text-right tabular-nums">
                      {row.quantity} {row.unit}
                    </td>
                    <td className="table-cell">{anchorLabel(row.anchorType)}</td>
                    <td className="table-cell tabular-nums">
                      {formatDateCell(row.warrantyEndDate ?? undefined)}
                    </td>
                    <td className="table-cell">
                      <span className={`pur-erp__pill pur-erp__pill--${statusTone(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                      {row.claimCount > 0 ? (
                        <span className="pur-erp__pill pur-erp__pill--info ml-2">
                          {row.claimCount} phiếu
                        </span>
                      ) : null}
                    </td>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={`Xem ${row.code}`}
                        onClick={() => openDetail(row)}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.length > 0 && !isLoading ? (
          <Pagination
            embedded
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(data.length / pageSize))}
            pageSize={pageSize}
            totalItems={data.length}
            onPageChange={setPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setPage(1);
            }}
          />
        ) : null}
      </PurchasingListLayout>

      <Modal
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detailQuery.data ? `Bảo hành ${detailQuery.data.code}` : 'Chi tiết bảo hành'}
        size="lg"
      >
        {detailQuery.isLoading || !detailQuery.data ? (
          <EmptyState message={detailQuery.isLoading ? 'Đang tải…' : 'Không tìm thấy hồ sơ.'} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[var(--md-on-surface-variant)]">PO / VT</div>
                <div className="font-semibold">
                  {detailQuery.data.poCode} · {detailQuery.data.materialName}
                </div>
              </div>
              <div>
                <div className="text-[var(--md-on-surface-variant)]">NCC / Dự án</div>
                <div className="font-semibold">
                  {detailQuery.data.supplierName || '—'} · {detailQuery.data.projectCode || '—'}
                </div>
              </div>
              <div>
                <div className="text-[var(--md-on-surface-variant)]">Ngày giao / Hạn BH</div>
                <div className="font-semibold tabular-nums">
                  {formatDateCell(detailQuery.data.deliveryDate ?? undefined)} →{' '}
                  {formatDateCell(detailQuery.data.warrantyEndDate ?? undefined)}
                </div>
              </div>
              <div>
                <div className="text-[var(--md-on-surface-variant)]">Trạng thái</div>
                <div className="font-semibold">{statusLabel(detailQuery.data.status)}</div>
              </div>
            </div>

            {canUpdate ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-[var(--md-outline-variant)] pt-3">
                <FormField label="Số tháng BH">
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={120}
                    value={warrantyMonths}
                    onChange={e => setWarrantyMonths(e.target.value)}
                  />
                </FormField>
                <FormField label="Mốc tính hạn">
                  <select
                    className="form-input"
                    value={anchorType}
                    onChange={e => setAnchorType(e.target.value)}
                  >
                    <option value="delivery">Giao hàng</option>
                    <option value="acceptance">Nghiệm thu</option>
                  </select>
                </FormField>
                <FormField label="Ngày nghiệm thu">
                  <input
                    className="form-input"
                    type="date"
                    value={acceptanceDate}
                    onChange={e => setAcceptanceDate(e.target.value)}
                  />
                </FormField>
                <div className="md:col-span-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      void onSaveMeta();
                    }}
                  >
                    Lưu mốc / tháng BH
                  </button>
                </div>
              </div>
            ) : null}

            <div className="border-t border-[var(--md-outline-variant)] pt-3">
              <h3 className="purchasing-section-title">Lịch sử phiếu bảo hành</h3>
              {detailQuery.data.claims.length === 0 ? (
                <p className="text-sm text-[var(--md-on-surface-variant)]">Chưa có phiếu BH.</p>
              ) : (
                <ul className="space-y-2">
                  {detailQuery.data.claims.map(c => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-[var(--md-outline-variant)] px-3 py-2"
                    >
                      <div>
                        <div className="font-mono text-sm font-semibold">{c.ticketCode}</div>
                        <div className="text-sm">{c.reason}</div>
                        <div className="text-xs text-[var(--md-on-surface-variant)]">
                          {claimStatusLabel(c.status)} · {c.createdByName} ·{' '}
                          {formatDateTimeVi(c.createdAt)}
                          {c.serviceRating != null
                            ? ` · Đánh giá DV: ${c.serviceRating}/5`
                            : ''}
                        </div>
                        {c.serviceNote ? (
                          <div className="text-xs text-[var(--md-on-surface-variant)]">
                            Ghi chú đánh giá: {c.serviceNote}
                          </div>
                        ) : null}
                      </div>
                      {canUpdate && c.status === 'submitted' ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={closeClaimMutation.isPending}
                          onClick={() => {
                            setCloseClaimId(c.id);
                            setServiceRating('5');
                            setServiceNote('');
                          }}
                        >
                          Đóng phiếu
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canCreate ? (
              <div className="border-t border-[var(--md-outline-variant)] pt-3 space-y-3">
                <h3 className="purchasing-section-title">Tạo phiếu bảo hành</h3>
                <FormField label="Nguyên nhân (nhập tay)" required>
                  <textarea
                    className="form-input min-h-[4rem]"
                    value={claimReason}
                    onChange={e => setClaimReason(e.target.value)}
                    placeholder="Mô tả lỗi / lý do bảo hành…"
                  />
                </FormField>
                <FormField label="Ghi chú">
                  <input
                    className="form-input"
                    value={claimNote}
                    onChange={e => setClaimNote(e.target.value)}
                  />
                </FormField>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={createClaimMutation.isPending}
                  onClick={() => {
                    void onCreateClaim();
                  }}
                >
                  <Plus size={14} aria-hidden />
                  Tạo phiếu BH
                </button>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(closeClaimId)}
        onClose={() => {
          if (!closeClaimMutation.isPending) setCloseClaimId(null);
        }}
        title="Đóng phiếu & đánh giá dịch vụ BH"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            Đánh giá dịch vụ bảo hành nhà cung cấp trước khi đóng phiếu.
          </p>
          <FormField label="Điểm dịch vụ BH (1-5)" required>
            <select
              className="form-input"
              value={serviceRating}
              onChange={e => setServiceRating(e.target.value)}
            >
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Ghi chú đánh giá">
            <textarea
              className="form-input min-h-[3.5rem]"
              value={serviceNote}
              onChange={e => setServiceNote(e.target.value)}
              placeholder="Thời gian phản hồi, chất lượng sửa chữa…"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={closeClaimMutation.isPending}
              onClick={() => setCloseClaimId(null)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={closeClaimMutation.isPending}
              onClick={() => {
                void onConfirmCloseClaim();
              }}
            >
              {closeClaimMutation.isPending ? 'Đang lưu…' : 'Đóng phiếu'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
