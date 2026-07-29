import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Eye, FileText, Plus, Trash2, Upload } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PermissionGate from '../../components/auth/PermissionGate';
import SearchBar from '../../components/ui/SearchBar';
import TabFilter from '../../components/ui/TabFilter';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import QtyStepper from '../../components/ui/QtyStepper';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import HrmPanel from '../../components/hr/HrmPanel';
import ProjectWarehouseSelect from '../../components/warehouse/ProjectWarehouseSelect';
import {
  PendingDocList,
  PendingPhotoGrid,
  SavedDefectDocList,
  SavedDefectPhotoGrid,
} from '../../components/warehouse/PendingLocalEvidence';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import {
  useApproveDefect,
  useCreateDefectFromPo,
  useCreateDefectFromStock,
  useDefects,
  useDeleteDefect,
  useEligibleDefectPurchaseOrders,
  usePoDefectPreview,
  useStockDefectPreview,
  useSubmitDefect,
  useUpdateDefectProcessing,
} from '../../hooks/useDefects';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { useFrozenProjects } from '../../hooks/useFrozenProjects';
import { defectsService } from '../../services/defectsService';
import type { PurchaseDefectApiDto } from '../../types/api/poDefectApi';
import type { StatusKey } from '../../types';
import type { DropdownItem } from '../../types';

type LineDraft = { selected: boolean; qty: string; lineReason: string };
type SourceType = 'po' | 'stock';
type DefectTab = 'all' | 'draft' | 'pending' | 'approved' | 'processing' | 'processed';

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function statusLabel(status: string) {
  if (status === 'draft') return 'Nháp';
  if (status === 'pending') return 'Chờ duyệt';
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'rejected') return 'Từ chối';
  return status;
}

function toStatusKey(status: string): StatusKey {
  if (
    status === 'draft'
    || status === 'pending'
    || status === 'approved'
    || status === 'rejected'
  ) {
    return status;
  }
  return 'pending';
}

/** Trạng thái phiếu — khớp hình dáng PoApprovalStatusCell (purchasing) khi đã duyệt/đang xử lý/đã xử lý. */
function DefectStatusCell({ row }: { row: PurchaseDefectApiDto }) {
  if (row.status !== 'approved') {
    return <Badge status={toStatusKey(row.status)} label={statusLabel(row.status)} />;
  }

  if (row.processingPhase === 'processing') {
    return <Badge status="pending" label="Đang xử lý" />;
  }

  if (row.processingPhase === 'processed') {
    const name = row.processedByName?.trim() || '—';
    return (
      <div className="pur-erp--po defect-status-cell">
        <div className="pur-erp__approve">
          <span className="pur-erp__pill pur-erp__pill--ok">Đã xử lý</span>
          <div className="pur-erp__approve-user">
            <span className="pur-erp__approve-avatar" title={name}>{nameInitials(name)}</span>
            <span className="pur-erp__approve-name" title={name}>{name}</span>
          </div>
        </div>
      </div>
    );
  }

  const approver = row.approvedByName?.trim() || '—';
  return (
    <div className="pur-erp--po defect-status-cell">
      <div className="pur-erp__approve">
        <span className="pur-erp__pill pur-erp__pill--ok">Đã duyệt</span>
        <div className="pur-erp__approve-user">
          <span className="pur-erp__approve-avatar" title={approver}>{nameInitials(approver)}</span>
          <span className="pur-erp__approve-name" title={approver}>{approver}</span>
        </div>
      </div>
    </div>
  );
}

function matchesTab(row: PurchaseDefectApiDto, tab: DefectTab): boolean {
  switch (tab) {
    case 'draft':
      return row.status === 'draft';
    case 'pending':
      return row.status === 'pending';
    case 'approved':
      return row.status === 'approved' && row.processingPhase === 'approved';
    case 'processing':
      return row.status === 'approved' && row.processingPhase === 'processing';
    case 'processed':
      return row.status === 'approved' && row.processingPhase === 'processed';
    default:
      return true;
  }
}

export default function DefectsPage() {
  const [activeTab, setActiveTab] = useState<DefectTab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<PurchaseDefectApiDto | null>(null);

  const [sourceType, setSourceType] = useState<SourceType>('po');
  const [selectedPoCode, setSelectedPoCode] = useState('');
  const [poLineDrafts, setPoLineDrafts] = useState<Record<number, LineDraft>>({});
  const [stockProjectCode, setStockProjectCode] = useState('');
  const [stockLineDrafts, setStockLineDrafts] = useState<Record<string, LineDraft>>({});
  const [uploading, setUploading] = useState(false);
  const [createPhotoFiles, setCreatePhotoFiles] = useState<File[]>([]);
  const [createDocFiles, setCreateDocFiles] = useState<File[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseDefectApiDto | null>(null);
  const createPhotoInputRef = useRef<HTMLInputElement>(null);
  const createDocInputRef = useRef<HTMLInputElement>(null);
  const detailPhotoInputRef = useRef<HTMLInputElement>(null);
  const detailDocInputRef = useRef<HTMLInputElement>(null);

  const [causeSource, setCauseSource] = useState('');
  const [supplierFeedback, setSupplierFeedback] = useState('');
  const [handlingMethod, setHandlingMethod] = useState('');

  const { has } = usePermission();
  const canCreate = has('wms.defects.create');
  const canApprove = has('wms.defects.approve');

  const listQuery = useDefects();
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const frozenByProjectCode = useFrozenProjects();
  const purchaseOrdersQuery = useEligibleDefectPurchaseOrders(showCreate && sourceType === 'po');
  const poPreviewQuery = usePoDefectPreview(
    selectedPoCode || undefined,
    showCreate && sourceType === 'po' && Boolean(selectedPoCode),
  );
  const stockPreviewQuery = useStockDefectPreview(
    stockProjectCode || undefined,
    showCreate && sourceType === 'stock' && Boolean(stockProjectCode),
  );
  const createFromPoMutation = useCreateDefectFromPo();
  const createFromStockMutation = useCreateDefectFromStock();
  const submitMutation = useSubmitDefect();
  const approveMutation = useApproveDefect();
  const deleteMutation = useDeleteDefect();
  const updateProcessingMutation = useUpdateDefectProcessing();

  const poOptions = purchaseOrdersQuery.data ?? [];

  const poPreviewLines = poPreviewQuery.data?.lines ?? [];
  const poPreviewKey = useMemo(
    () => `${selectedPoCode}|${poPreviewLines.map(l => `${l.poItemId}:${l.available}`).join(',')}`,
    [selectedPoCode, poPreviewLines],
  );

  const stockPreviewLines = stockPreviewQuery.data?.lines ?? [];
  const stockPreviewKey = useMemo(
    () => `${stockProjectCode}|${stockPreviewLines.map(l => `${l.materialCode}:${l.available}`).join(',')}`,
    [stockProjectCode, stockPreviewLines],
  );

  const selectablePoLines = useMemo(
    () => poPreviewLines.filter(l => l.available > 0),
    [poPreviewLines],
  );
  const allPoLinesSelected =
    selectablePoLines.length > 0
    && selectablePoLines.every(l => poLineDrafts[l.poItemId]?.selected);
  const somePoLinesSelected =
    selectablePoLines.some(l => poLineDrafts[l.poItemId]?.selected) && !allPoLinesSelected;

  const selectableStockLines = useMemo(
    () => stockPreviewLines.filter(l => l.available > 0),
    [stockPreviewLines],
  );
  const allStockLinesSelected =
    selectableStockLines.length > 0
    && selectableStockLines.every(l => stockLineDrafts[l.materialCode]?.selected);
  const someStockLinesSelected =
    selectableStockLines.some(l => stockLineDrafts[l.materialCode]?.selected) && !allStockLinesSelected;

  const toggleSelectAllPoLines = (checked: boolean) => {
    setPoLineDrafts(prev => {
      const next = { ...prev };
      for (const line of selectablePoLines) {
        const draft = next[line.poItemId] ?? {
          selected: false,
          qty: String(line.available),
          lineReason: '',
        };
        next[line.poItemId] = {
          ...draft,
          selected: checked,
          qty: checked
            ? (Number(draft.qty) > 0 ? draft.qty : String(line.available))
            : draft.qty,
        };
      }
      return next;
    });
  };

  const toggleSelectAllStockLines = (checked: boolean) => {
    setStockLineDrafts(prev => {
      const next = { ...prev };
      for (const line of selectableStockLines) {
        const draft = next[line.materialCode] ?? {
          selected: false,
          qty: String(line.available),
          lineReason: '',
        };
        next[line.materialCode] = {
          ...draft,
          selected: checked,
          qty: checked
            ? (Number(draft.qty) > 0 ? draft.qty : String(line.available))
            : draft.qty,
        };
      }
      return next;
    });
  };

  useEffect(() => {
    if (!selectedPoCode || poPreviewLines.length === 0) {
      setPoLineDrafts({});
      return;
    }
    // Chỉ khởi tạo danh sách — không tick sẵn; user tự chọn dòng.
    const next: Record<number, LineDraft> = {};
    for (const line of poPreviewLines) {
      next[line.poItemId] = {
        selected: false,
        qty: line.available > 0 ? String(line.available) : '0',
        lineReason: '',
      };
    }
    setPoLineDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ reset khi đổi PO/preview
  }, [poPreviewKey]);

  useEffect(() => {
    if (!stockProjectCode || stockPreviewLines.length === 0) {
      setStockLineDrafts({});
      return;
    }
    const next: Record<string, LineDraft> = {};
    for (const line of stockPreviewLines) {
      next[line.materialCode] = {
        selected: false,
        qty: line.available > 0 ? String(line.available) : '0',
        lineReason: '',
      };
    }
    setStockLineDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ reset khi đổi kho/preview
  }, [stockPreviewKey]);

  useEffect(() => {
    if (!selected) return;
    setCauseSource(selected.causeSource ?? '');
    setSupplierFeedback(selected.supplierFeedback ?? '');
    setHandlingMethod(selected.handlingMethod ?? '');
  }, [selected]);

  const filtered = useMemo(() => {
    let rows = listQuery.data ?? [];
    if (activeTab !== 'all') rows = rows.filter(r => matchesTab(r, activeTab));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(r =>
        [r.ticketCode, r.poCode ?? '', r.planCode, r.projectCode, r.supplierName ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
    }
    return rows;
  }, [listQuery.data, activeTab, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const tabCounts = useMemo(() => {
    const all = listQuery.data ?? [];
    return {
      all: all.length,
      draft: all.filter(r => matchesTab(r, 'draft')).length,
      pending: all.filter(r => matchesTab(r, 'pending')).length,
      approved: all.filter(r => matchesTab(r, 'approved')).length,
      processing: all.filter(r => matchesTab(r, 'processing')).length,
      processed: all.filter(r => matchesTab(r, 'processed')).length,
    };
  }, [listQuery.data]);

  const resetCreate = () => {
    setSourceType('po');
    setSelectedPoCode('');
    setPoLineDrafts({});
    setStockProjectCode('');
    setStockLineDrafts({});
    setCreatePhotoFiles([]);
    setCreateDocFiles([]);
  };

  const handleSourceTypeChange = (next: SourceType) => {
    setSourceType(next);
    setSelectedPoCode('');
    setPoLineDrafts({});
    setStockProjectCode('');
    setStockLineDrafts({});
  };

  const handleCreate = async (asPending: boolean) => {
    if (asPending && createPhotoFiles.length < 1) {
      showToast('error', 'Gửi duyệt cần ít nhất 1 ảnh hàng lỗi.');
      return;
    }

    try {
      let created: PurchaseDefectApiDto;

      if (sourceType === 'po') {
        if (!selectedPoCode) {
          showToast('error', 'Vui lòng chọn PO.');
          return;
        }
        const items = poPreviewLines
          .filter(line => poLineDrafts[line.poItemId]?.selected)
          .map(line => {
            const draft = poLineDrafts[line.poItemId]!;
            return {
              poItemId: line.poItemId,
              qty: Number(draft.qty),
              lineReason: draft.lineReason.trim() || null,
            };
          })
          .filter(x => Number.isFinite(x.qty) && x.qty > 0);

        if (items.length === 0) {
          showToast('error', 'Chọn ít nhất một dòng còn SL để ghi lỗi.');
          return;
        }
        if (items.some(x => !x.lineReason)) {
          showToast('error', 'Mỗi dòng đã chọn cần nhập lý do dòng.');
          return;
        }

        created = await createFromPoMutation.mutateAsync({
          poCode: selectedPoCode,
          request: { items, reason: null, note: null },
        });
      } else {
        if (!stockProjectCode) {
          showToast('error', 'Vui lòng chọn kho dự án.');
          return;
        }
        const items = stockPreviewLines
          .filter(line => stockLineDrafts[line.materialCode]?.selected)
          .map(line => {
            const draft = stockLineDrafts[line.materialCode]!;
            return {
              materialCode: line.materialCode,
              qty: Number(draft.qty),
              lineReason: draft.lineReason.trim() || null,
            };
          })
          .filter(x => Number.isFinite(x.qty) && x.qty > 0);

        if (items.length === 0) {
          showToast('error', 'Chọn ít nhất một dòng còn tồn để ghi lỗi.');
          return;
        }
        if (items.some(x => !x.lineReason)) {
          showToast('error', 'Mỗi dòng đã chọn cần nhập lý do dòng.');
          return;
        }

        created = await createFromStockMutation.mutateAsync({
          projectCode: stockProjectCode,
          items,
          reason: null,
          note: null,
        });
      }

      for (const file of createPhotoFiles) {
        await defectsService.uploadAttachment(created.ticketCode, file, 'photo');
      }
      for (const file of createDocFiles) {
        await defectsService.uploadAttachment(created.ticketCode, file, 'document');
      }

      if (asPending) {
        await submitMutation.mutateAsync(created.ticketCode);
        showToast('success', `Đã tạo và gửi duyệt ${created.ticketCode}.`);
      } else {
        showToast('success', `Đã lưu nháp ${created.ticketCode}.`);
      }
      setShowCreate(false);
      resetCreate();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được phiếu hàng lỗi'));
    }
  };

  const openDetail = async (row: PurchaseDefectApiDto) => {
    try {
      const fresh = await defectsService.getById(row.ticketCode);
      setSelected(fresh);
      setShowDetail(true);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được phiếu'));
    }
  };

  const reloadSelected = async () => {
    if (!selected) return;
    const fresh = await defectsService.getById(selected.ticketCode);
    setSelected(fresh);
  };

  const handleApproveRow = async (row: PurchaseDefectApiDto) => {
    try {
      await approveMutation.mutateAsync(row.ticketCode);
      showToast('success', `Đã duyệt ${row.ticketCode} — cập nhật PO/KHMH, không cộng tồn.`);
      if (selected?.ticketCode === row.ticketCode) {
        const fresh = await defectsService.getById(row.ticketCode);
        setSelected(fresh);
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không duyệt được'));
    }
  };

  const handleSaveProcessing = async () => {
    if (!selected) return;
    try {
      const updated = await updateProcessingMutation.mutateAsync({
        id: selected.ticketCode,
        request: {
          causeSource: causeSource || null,
          supplierFeedback: supplierFeedback.trim() || null,
          handlingMethod: handlingMethod || null,
        },
      });
      setSelected(updated);
      showToast('success', 'Đã lưu thông tin xử lý.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lưu được thông tin xử lý'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.ticketCode);
      showToast('success', `Đã xóa ${deleteTarget.ticketCode}.`);
      if (selected?.ticketCode === deleteTarget.ticketCode) {
        setShowDetail(false);
        setSelected(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được phiếu'));
    }
  };

  const buildRowActions = (row: PurchaseDefectApiDto): DropdownItem[] => {
    const items: DropdownItem[] = [
      { label: 'Xem chi tiết', icon: Eye, onClick: () => void openDetail(row) },
    ];
    if (canApprove && row.status === 'pending') {
      items.push({
        label: 'Duyệt',
        icon: Check,
        onClick: () => void handleApproveRow(row),
      });
    }
    if (canCreate && row.status === 'draft') {
      items.push({
        label: 'Xóa phiếu',
        icon: Trash2,
        onClick: () => setDeleteTarget(row),
        danger: true,
      });
    }
    return items;
  };

  const canEditEvidence = selected && selected.status !== 'approved';
  const canEditProcessing = Boolean(canApprove && selected && selected.status === 'approved');

  return (
    <div className="hrm-page space-y-4">
      <PageHeader
        title="Hàng lỗi và Bảo hành"
        subtitle="Ghi nhận hàng lỗi từ PO hoặc từ tồn kho — duyệt xong xử lý nguyên nhân, phản hồi NCC và hướng bảo hành."
        actions={(
          <PermissionGate permission="wms.defects.create">
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2"
              onClick={() => {
                resetCreate();
                setShowCreate(true);
              }}
            >
              <Plus size={16} aria-hidden />
              Tạo phiếu hàng lỗi
            </button>
          </PermissionGate>
        )}
      />

      <HrmPanel>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <TabFilter
            tabs={[
              { id: 'all', label: `Tất cả (${tabCounts.all})` },
              { id: 'draft', label: `Nháp (${tabCounts.draft})` },
              { id: 'pending', label: `Chờ duyệt (${tabCounts.pending})` },
              { id: 'approved', label: `Đã duyệt (${tabCounts.approved})` },
              { id: 'processing', label: `Đang xử lý (${tabCounts.processing})` },
              { id: 'processed', label: `Đã xử lý (${tabCounts.processed})` },
            ]}
            activeTab={activeTab}
            onChange={id => {
              setActiveTab(id as DefectTab);
              setPage(1);
            }}
          />
          <SearchBar
            value={search}
            onChange={v => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm mã HL, PO, KHMH, dự án…"
          />
        </div>

        <div className="overflow-x-auto table-scroll">
          <table className="form-table text-xs w-full">
            <thead>
              <tr>
                <th className="table-header-cell text-center">Mã phiếu</th>
                <th className="table-header-cell text-center">Nguồn</th>
                <th className="table-header-cell text-center">PO</th>
                <th className="table-header-cell text-center">KHMH</th>
                <th className="table-header-cell text-center">Dự án</th>
                <th className="table-header-cell text-center">NCC</th>
                <th className="table-header-cell text-center">Trạng thái</th>
                <th className="table-header-cell text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <TableSkeletonRows rows={5} colSpan={8} />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState message="Chưa có phiếu hàng lỗi." />
                  </td>
                </tr>
              ) : (
                paged.map(row => (
                  <tr key={row.ticketCode} className="table-row">
                    <td className="table-cell text-center font-semibold">{row.ticketCode}</td>
                    <td className="table-cell text-center">
                      <span className={`badge ${row.sourceType === 'stock' ? 'badge-md-neutral' : 'badge-new'}`}>
                        {row.sourceType === 'stock' ? 'Tồn kho' : 'PO'}
                      </span>
                    </td>
                    <td className="table-cell text-center">{row.poCode || '—'}</td>
                    <td className="table-cell text-center">{row.planCode || '—'}</td>
                    <td className="table-cell text-center">{row.projectCode || '—'}</td>
                    <td className="table-cell text-center">{row.supplierName || '—'}</td>
                    <td className="table-cell text-center">
                      <DefectStatusCell row={row} />
                    </td>
                    <td className="table-cell text-center">
                      <Dropdown items={buildRowActions(row)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          embedded
          itemLabel="phiếu HL"
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(filtered.length / pageSize) || 1)}
          totalItems={filtered.length}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={size => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </HrmPanel>

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          resetCreate();
        }}
        title="Tạo phiếu hàng lỗi / bảo hành"
        size="full"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Hủy</button>
            <div className="md-dialog__footer-actions">
              <button
                type="button"
                className="btn btn-outline"
                disabled={createFromPoMutation.isPending || createFromStockMutation.isPending || submitMutation.isPending}
                onClick={() => void handleCreate(false)}
              >
                Lưu nháp
              </button>
              <button
                type="button"
                className="btn btn-filled"
                disabled={createFromPoMutation.isPending || createFromStockMutation.isPending || submitMutation.isPending}
                onClick={() => void handleCreate(true)}
              >
                Lưu & gửi duyệt
              </button>
            </div>
          </>
        )}
      >
        <div className="space-y-3 modal-form-bordered defect-create-form">
          <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-3 py-2 text-xs text-[var(--md-on-surface-variant)] flex gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              Phiếu HL không cộng tồn. Với hàng lỗi PO, duyệt sẽ tăng SL lỗi trên PO/KHMH và giảm SL còn lại.
              Với hàng lỗi tồn kho, duyệt sẽ giữ chỗ trên tồn kho dự án. Gửi duyệt cần ít nhất 1 ảnh.
            </span>
          </div>

          <div className="defect-create-form__meta">
            <FormField label="Loại nguồn" required>
              <select
                className="form-input"
                value={sourceType}
                onChange={e => handleSourceTypeChange(e.target.value as SourceType)}
              >
                <option value="po">Hàng lỗi PO</option>
                <option value="stock">Hàng lỗi nhập kho</option>
              </select>
            </FormField>

            {sourceType === 'po' ? (
              <FormField
                label="Phiếu PO"
                required
                error={
                  !purchaseOrdersQuery.isLoading && poOptions.length === 0
                    ? 'Không có PO đã đặt NCC còn SL để ghi lỗi.'
                    : undefined
                }
              >
                <select
                  className="form-input"
                  value={selectedPoCode}
                  disabled={purchaseOrdersQuery.isLoading}
                  onChange={e => setSelectedPoCode(e.target.value)}
                >
                  <option value="">
                    {purchaseOrdersQuery.isLoading
                      ? 'Đang tải PO còn SL…'
                      : '— Chọn PO còn SL ghi lỗi —'}
                  </option>
                  {poOptions.map(po => (
                    <option key={po.poCode} value={po.poCode}>
                      {po.poCode}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <FormField label="Kho dự án" required>
                <ProjectWarehouseSelect
                  projects={projects}
                  frozenByProjectCode={frozenByProjectCode}
                  value={stockProjectCode}
                  className="form-input"
                  onChange={code => {
                    setStockProjectCode(code);
                    setStockLineDrafts({});
                  }}
                  placeholder="— Chọn kho dự án —"
                />
              </FormField>
            )}

            {sourceType === 'po' ? (
              <>
                <FormField label="Kho dự án (từ PO)">
                  <input
                    className="form-input"
                    readOnly
                    value={
                      poPreviewQuery.data?.projectCode
                      || poOptions.find(p => p.poCode === selectedPoCode)?.projectCode
                      || ''
                    }
                    placeholder="Chọn PO để tự điền kho dự án"
                  />
                </FormField>
                <FormField label="Nhà cung cấp (từ PO)">
                  <input
                    className="form-input"
                    readOnly
                    value={
                      poPreviewQuery.data?.supplierName
                      || poOptions.find(p => p.poCode === selectedPoCode)?.supplierName
                      || ''
                    }
                    placeholder="Chọn PO để tự điền NCC"
                  />
                </FormField>
              </>
            ) : null}
          </div>

          {sourceType === 'po' ? (
            !selectedPoCode ? (
              <p className="text-xs text-[var(--md-on-surface-variant)]">Chọn PO để hiện mặt hàng — tick dòng cần ghi lỗi.</p>
            ) : poPreviewQuery.isLoading ? (
              <p className="text-xs">Đang tải dòng PO…</p>
            ) : poPreviewQuery.isError ? (
              <p className="text-xs text-[var(--md-error)]">
                {getApiErrorMessage(poPreviewQuery.error, 'Không tải được dòng hàng từ PO. Kiểm tra API/migration.')}
              </p>
            ) : (
              <div className="overflow-x-auto table-scroll">
                <table className="form-table import-items-table import-items-table--po-select import-items-table--defect-select text-xs">
                  <thead>
                    <tr>
                      <th className="table-header-cell text-center w-10">
                        <input
                          type="checkbox"
                          checked={allPoLinesSelected}
                          disabled={selectablePoLines.length === 0}
                          ref={el => {
                            if (el) el.indeterminate = somePoLinesSelected;
                          }}
                          onChange={e => toggleSelectAllPoLines(e.target.checked)}
                          aria-label="Chọn tất cả mặt hàng"
                        />
                      </th>
                      <th className="table-header-cell text-center">Mặt hàng</th>
                      <th className="table-header-cell text-center">Đặt</th>
                      <th className="table-header-cell text-center">Đã nhận</th>
                      <th className="table-header-cell text-center">Đã lỗi</th>
                      <th className="table-header-cell text-center">Chờ NK</th>
                      <th className="table-header-cell text-center">Còn lại</th>
                      <th className="table-header-cell text-center">SL lỗi</th>
                      <th className="table-header-cell text-center">Lý do dòng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poPreviewLines.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <EmptyState message="PO không còn SL để ghi lỗi (đã trừ đã nhận / chờ NK / HL chờ duyệt)." />
                        </td>
                      </tr>
                    ) : (
                      poPreviewLines.map(line => {
                        const draft = poLineDrafts[line.poItemId] ?? {
                          selected: false,
                          qty: '0',
                          lineReason: '',
                        };
                        return (
                          <tr key={line.poItemId} className="table-row">
                            <td className="table-cell text-center">
                              <input
                                type="checkbox"
                                checked={draft.selected}
                                disabled={line.available <= 0}
                                onChange={e => {
                                  const nextSelected = e.target.checked;
                                  setPoLineDrafts(prev => ({
                                    ...prev,
                                    [line.poItemId]: {
                                      ...draft,
                                      selected: nextSelected,
                                      qty: nextSelected
                                        ? (Number(draft.qty) > 0 ? draft.qty : String(line.available))
                                        : draft.qty,
                                    },
                                  }));
                                }}
                                aria-label={`Chọn ${line.name}`}
                              />
                            </td>
                            <td className="table-cell">
                              <div className="font-medium">{line.name}</div>
                              <div className="text-[10px] text-[var(--md-on-surface-variant)]">
                                {[line.materialCode, line.unit].filter(Boolean).join(' · ') || '—'}
                              </div>
                            </td>
                            <td className="table-cell text-center tabular-nums">{line.ordered}</td>
                            <td className="table-cell text-center tabular-nums">{line.received}</td>
                            <td className="table-cell text-center tabular-nums">{line.defected}</td>
                            <td className="table-cell text-center tabular-nums">{line.reservedPendingNk}</td>
                            <td className="table-cell text-center tabular-nums font-semibold">{line.available}</td>
                            <td className="table-cell text-center defect-qty-cell">
                              {draft.selected ? (
                                <QtyStepper
                                  value={draft.qty}
                                  max={line.available}
                                  onChange={qty =>
                                    setPoLineDrafts(prev => ({
                                      ...prev,
                                      [line.poItemId]: { ...draft, qty },
                                    }))
                                  }
                                />
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="table-cell defect-reason-cell">
                              {draft.selected ? (
                                <textarea
                                  className="form-input form-input-sm defect-line-reason"
                                  rows={2}
                                  value={draft.lineReason}
                                  onChange={e =>
                                    setPoLineDrafts(prev => ({
                                      ...prev,
                                      [line.poItemId]: { ...draft, lineReason: e.target.value },
                                    }))
                                  }
                                />
                              ) : (
                                <span className="text-[var(--md-on-surface-variant)]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : !stockProjectCode ? (
            <p className="text-xs text-[var(--md-on-surface-variant)]">Chọn kho dự án để hiện mặt hàng — tick dòng cần ghi lỗi.</p>
          ) : stockPreviewQuery.isLoading ? (
            <p className="text-xs">Đang tải tồn kho…</p>
          ) : (
            <div className="overflow-x-auto table-scroll">
              <table className="form-table import-items-table import-items-table--po-select import-items-table--defect-select text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell text-center w-10">
                      <input
                        type="checkbox"
                        checked={allStockLinesSelected}
                        disabled={selectableStockLines.length === 0}
                        ref={el => {
                          if (el) el.indeterminate = someStockLinesSelected;
                        }}
                        onChange={e => toggleSelectAllStockLines(e.target.checked)}
                        aria-label="Chọn tất cả mặt hàng"
                      />
                    </th>
                    <th className="table-header-cell text-center">Mặt hàng</th>
                    <th className="table-header-cell text-center">Tồn kho</th>
                    <th className="table-header-cell text-center">Chờ xử lý HL</th>
                    <th className="table-header-cell text-center">Còn lại</th>
                    <th className="table-header-cell text-center">SL lỗi</th>
                    <th className="table-header-cell text-center">Lý do dòng</th>
                  </tr>
                </thead>
                <tbody>
                  {stockPreviewLines.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState message="Kho dự án không còn tồn để ghi lỗi." />
                      </td>
                    </tr>
                  ) : (
                    stockPreviewLines.map(line => {
                      const draft = stockLineDrafts[line.materialCode] ?? {
                        selected: false,
                        qty: '0',
                        lineReason: '',
                      };
                      return (
                        <tr key={line.materialCode} className="table-row">
                          <td className="table-cell text-center">
                            <input
                              type="checkbox"
                              checked={draft.selected}
                              disabled={line.available <= 0}
                              onChange={e => {
                                const nextSelected = e.target.checked;
                                setStockLineDrafts(prev => ({
                                  ...prev,
                                  [line.materialCode]: {
                                    ...draft,
                                    selected: nextSelected,
                                    qty: nextSelected
                                      ? (Number(draft.qty) > 0 ? draft.qty : String(line.available))
                                      : draft.qty,
                                  },
                                }));
                              }}
                              aria-label={`Chọn ${line.name}`}
                            />
                          </td>
                          <td className="table-cell">
                            <div className="font-medium">{line.name}</div>
                            <div className="text-[10px] text-[var(--md-on-surface-variant)]">
                              {[line.materialCode, line.unit].filter(Boolean).join(' · ') || '—'}
                            </div>
                          </td>
                          <td className="table-cell text-center tabular-nums">{line.onHand}</td>
                          <td className="table-cell text-center tabular-nums">{line.reservedPendingDefect}</td>
                          <td className="table-cell text-center tabular-nums font-semibold">{line.available}</td>
                          <td className="table-cell text-center defect-qty-cell">
                            {draft.selected ? (
                              <QtyStepper
                                value={draft.qty}
                                max={line.available}
                                onChange={qty =>
                                  setStockLineDrafts(prev => ({
                                    ...prev,
                                    [line.materialCode]: { ...draft, qty },
                                  }))
                                }
                              />
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="table-cell defect-reason-cell">
                            {draft.selected ? (
                              <textarea
                                className="form-input form-input-sm defect-line-reason"
                                rows={2}
                                value={draft.lineReason}
                                onChange={e =>
                                  setStockLineDrafts(prev => ({
                                    ...prev,
                                    [line.materialCode]: { ...draft, lineReason: e.target.value },
                                  }))
                                }
                              />
                            ) : (
                              <span className="text-[var(--md-on-surface-variant)]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="pending-evidence">
              <div className="pending-evidence__title">Ảnh hàng lỗi</div>
              <p className="pending-evidence__hint">Gửi duyệt bắt buộc ≥1 ảnh.</p>
              <button
                type="button"
                className="pending-evidence__zone"
                onClick={() => createPhotoInputRef.current?.click()}
              >
                <Upload size={20} aria-hidden />
                <span className="pending-evidence__zone-hint">Chọn ảnh (có thể chọn nhiều)</span>
              </button>
              <input
                ref={createPhotoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="pending-evidence__input"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) setCreatePhotoFiles(prev => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
              <PendingPhotoGrid
                files={createPhotoFiles}
                onRemove={idx => setCreatePhotoFiles(prev => prev.filter((_, i) => i !== idx))}
              />
            </div>

            <div className="pending-evidence">
              <div className="pending-evidence__title">File chứng từ</div>
              <p className="pending-evidence__hint">PDF / Word / Excel — tuỳ chọn.</p>
              <button
                type="button"
                className="pending-evidence__zone"
                onClick={() => createDocInputRef.current?.click()}
              >
                <FileText size={20} aria-hidden />
                <span className="pending-evidence__zone-hint">Chọn file PDF / Word / Excel</span>
              </button>
              <input
                ref={createDocInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                multiple
                className="pending-evidence__input"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) setCreateDocFiles(prev => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
              <PendingDocList
                files={createDocFiles}
                onRemove={idx => setCreateDocFiles(prev => prev.filter((_, i) => i !== idx))}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetail && Boolean(selected)}
        onClose={() => {
          setShowDetail(false);
          setSelected(null);
        }}
        title={selected ? `Phiếu hàng lỗi — ${selected.ticketCode}` : 'Chi tiết'}
        size="full"
        footer={selected ? (
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>
            <div className="md-dialog__footer-actions flex items-center gap-2 flex-wrap">
              <DefectStatusCell row={selected} />
              <span className="text-sm text-[var(--md-on-surface-variant)]">
                {selected.sourceType === 'stock' ? selected.projectCode : selected.poCode}
              </span>
              {selected.status === 'draft' ? (
                <PermissionGate permission="wms.defects.create">
                  <button
                    type="button"
                    className="btn btn-filled"
                    disabled={submitMutation.isPending}
                    onClick={async () => {
                      try {
                        const updated = await submitMutation.mutateAsync(selected.ticketCode);
                        setSelected(updated);
                        showToast('success', 'Đã gửi duyệt.');
                      } catch (err) {
                        showToast('error', getApiErrorMessage(err, 'Không gửi duyệt được'));
                      }
                    }}
                  >
                    Gửi duyệt
                  </button>
                </PermissionGate>
              ) : null}
              {selected.status === 'pending' ? (
                <PermissionGate permission="wms.defects.approve">
                  <button
                    type="button"
                    className="btn btn-filled"
                    disabled={approveMutation.isPending}
                    onClick={async () => {
                      try {
                        const updated = await approveMutation.mutateAsync(selected.ticketCode);
                        setSelected(updated);
                        showToast('success', 'Đã duyệt — đã cập nhật PO/KHMH, không cộng tồn.');
                      } catch (err) {
                        showToast('error', getApiErrorMessage(err, 'Không duyệt được'));
                      }
                    }}
                  >
                    Duyệt
                  </button>
                </PermissionGate>
              ) : null}
            </div>
          </>
        ) : null}
      >
        {selected ? (
          <div className="space-y-3 text-sm defect-detail-form">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Nguồn: <strong>{selected.sourceType === 'stock' ? 'Hàng lỗi nhập kho' : 'Hàng lỗi PO'}</strong></div>
              <div>Dự án: <strong>{selected.projectCode || '—'}</strong></div>
              {selected.sourceType === 'stock' ? null : (
                <>
                  <div>PO: <strong>{selected.poCode || '—'}</strong></div>
                  <div>KHMH: <strong>{selected.planCode || '—'}</strong></div>
                  <div>NCC: <strong>{selected.supplierName || '—'}</strong></div>
                </>
              )}
            </div>

            <div>
              <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)] mb-1">Dòng hàng</div>
              <table className="form-table text-xs w-full">
                <thead>
                  <tr>
                    <th className="table-header-cell">Mặt hàng</th>
                    <th className="table-header-cell text-center">SL lỗi</th>
                    <th className="table-header-cell">Lý do dòng</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map(it => (
                    <tr key={it.id}>
                      <td className="table-cell">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-[10px] text-[var(--md-on-surface-variant)]">
                          {[it.materialCode, it.unit].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </td>
                      <td className="table-cell text-center tabular-nums">{it.quantity}</td>
                      <td className="table-cell whitespace-pre-wrap">{it.lineReason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canEditProcessing ? (
              <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-3 space-y-3">
                <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Xử lý bảo hành</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Nguyên nhân">
                    <select
                      className="form-input"
                      value={causeSource}
                      onChange={e => setCauseSource(e.target.value)}
                    >
                      <option value="">— Chọn nguyên nhân —</option>
                      <option value="supplier">NCC</option>
                      <option value="customer">Khách hàng</option>
                    </select>
                  </FormField>
                  <FormField label="Hướng xử lý">
                    <select
                      className="form-input"
                      value={handlingMethod}
                      onChange={e => setHandlingMethod(e.target.value)}
                    >
                      <option value="">— Chọn hướng xử lý —</option>
                      <option value="warranty_repair">Bảo hành sửa chữa</option>
                      <option value="replace">Đổi mới</option>
                    </select>
                  </FormField>
                </div>
                <FormField label="Phản hồi của NCC">
                  <textarea
                    className="form-input"
                    rows={3}
                    value={supplierFeedback}
                    onChange={e => setSupplierFeedback(e.target.value)}
                    placeholder="Ghi nhận phản hồi từ nhà cung cấp…"
                  />
                </FormField>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn btn-filled"
                    disabled={updateProcessingMutation.isPending}
                    onClick={() => void handleSaveProcessing()}
                  >
                    Lưu xử lý
                  </button>
                </div>
              </div>
            ) : selected.status === 'approved' && selected.processingPhase !== 'approved' ? (
              <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-3 space-y-1 text-xs">
                <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)] mb-1">Xử lý bảo hành</div>
                <div>Nguyên nhân: <strong>{selected.causeSource === 'customer' ? 'Khách hàng' : selected.causeSource === 'supplier' ? 'NCC' : '—'}</strong></div>
                <div>Phản hồi của NCC: <strong className="whitespace-pre-wrap">{selected.supplierFeedback || '—'}</strong></div>
                <div>
                  Hướng xử lý: <strong>
                    {selected.handlingMethod === 'warranty_repair'
                      ? 'Bảo hành sửa chữa'
                      : selected.handlingMethod === 'replace'
                        ? 'Đổi mới'
                        : '—'}
                  </strong>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pending-evidence">
                <div className="pending-evidence__title">Ảnh hàng lỗi</div>
                {canEditEvidence ? (
                  <>
                    <button
                      type="button"
                      className={`pending-evidence__zone${uploading ? ' is-disabled' : ''}`}
                      disabled={uploading}
                      onClick={() => detailPhotoInputRef.current?.click()}
                    >
                      <Upload size={20} aria-hidden />
                      <span className="pending-evidence__zone-hint">
                        {uploading ? 'Đang tải…' : 'Chọn ảnh (có thể chọn nhiều)'}
                      </span>
                    </button>
                    <input
                      ref={detailPhotoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="pending-evidence__input"
                      disabled={uploading}
                      onChange={async e => {
                        const files = Array.from(e.target.files ?? []);
                        e.target.value = '';
                        if (files.length === 0) return;
                        setUploading(true);
                        try {
                          for (const file of files) {
                            await defectsService.uploadAttachment(selected.ticketCode, file, 'photo');
                          }
                          await reloadSelected();
                          showToast('success', 'Đã thêm ảnh.');
                        } catch (err) {
                          showToast('error', getApiErrorMessage(err, 'Upload thất bại'));
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </>
                ) : null}
                <SavedDefectPhotoGrid
                  ticketCode={selected.ticketCode}
                  attachments={selected.attachments}
                  canEdit={Boolean(canEditEvidence)}
                  onDelete={async attachmentId => {
                    try {
                      await defectsService.deleteAttachment(selected.ticketCode, attachmentId);
                      await reloadSelected();
                    } catch (err) {
                      showToast('error', getApiErrorMessage(err, 'Không xóa được'));
                    }
                  }}
                />
              </div>

              <div className="pending-evidence">
                <div className="pending-evidence__title">File chứng từ</div>
                {canEditEvidence ? (
                  <>
                    <button
                      type="button"
                      className={`pending-evidence__zone${uploading ? ' is-disabled' : ''}`}
                      disabled={uploading}
                      onClick={() => detailDocInputRef.current?.click()}
                    >
                      <FileText size={20} aria-hidden />
                      <span className="pending-evidence__zone-hint">
                        {uploading ? 'Đang tải…' : 'Chọn file PDF / Word / Excel'}
                      </span>
                    </button>
                    <input
                      ref={detailDocInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                      multiple
                      className="pending-evidence__input"
                      disabled={uploading}
                      onChange={async e => {
                        const files = Array.from(e.target.files ?? []);
                        e.target.value = '';
                        if (files.length === 0) return;
                        setUploading(true);
                        try {
                          for (const file of files) {
                            await defectsService.uploadAttachment(selected.ticketCode, file, 'document');
                          }
                          await reloadSelected();
                          showToast('success', 'Đã thêm file.');
                        } catch (err) {
                          showToast('error', getApiErrorMessage(err, 'Upload thất bại'));
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </>
                ) : null}
                <SavedDefectDocList
                  ticketCode={selected.ticketCode}
                  attachments={selected.attachments}
                  canEdit={Boolean(canEditEvidence)}
                  onDelete={async attachmentId => {
                    try {
                      await defectsService.deleteAttachment(selected.ticketCode, attachmentId);
                      await reloadSelected();
                    } catch (err) {
                      showToast('error', getApiErrorMessage(err, 'Không xóa được'));
                    }
                  }}
                />
              </div>
            </div>
            {selected.status === 'pending' ? (
              <p className="text-[11px] text-[var(--md-on-surface-variant)]">
                Duyệt cần lý do trên từng dòng + ít nhất 1 ảnh. Duyệt xong chỉ cập nhật PO/KHMH — không cộng tồn kho.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Xóa phiếu hàng lỗi"
        message={
          deleteTarget
            ? `Xóa phiếu nháp ${deleteTarget.ticketCode}? Thao tác không hoàn tác.`
            : ''
        }
        confirmLabel="Xóa phiếu"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
