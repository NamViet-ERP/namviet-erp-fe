import { useMemo, useState } from 'react';
import { Check, Plus, Trash2, XCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PermissionGate from '../../components/auth/PermissionGate';
import SearchBar from '../../components/ui/SearchBar';
import TabFilter from '../../components/ui/TabFilter';
import Pagination from '../../components/ui/Pagination';
import HrmPanel from '../../components/hr/HrmPanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import {
  useApproveDefect,
  useCancelDefect,
  useDefects,
  useDeleteDefect,
} from '../../hooks/useDefects';
import { usePermission } from '../../hooks/usePermission';
import { defectsService } from '../../services/defectsService';
import type { PurchaseDefectApiDto } from '../../types/api/poDefectApi';
import type { DropdownItem } from '../../types';
import type { DefectTab } from './defects/defectTypes';
import { matchesTab } from './defects/defectUtils';
import DefectsTable from './defects/DefectsTable';
import DefectCreateModal from './defects/DefectCreateModal';
import DefectDetailModal from './defects/DefectDetailModal';

export default function DefectsPage() {
  const [activeTab, setActiveTab] = useState<DefectTab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(false);
  const [createEpoch, setCreateEpoch] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<PurchaseDefectApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseDefectApiDto | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseDefectApiDto | null>(null);

  const { has } = usePermission();
  const canCreate = has('wms.defects.create');
  const canApprove = has('wms.defects.approve');

  const listQuery = useDefects();
  const approveMutation = useApproveDefect();
  const deleteMutation = useDeleteDefect();
  const cancelMutation = useCancelDefect();

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
      rejected: all.filter(r => matchesTab(r, 'rejected')).length,
    };
  }, [listQuery.data]);

  const openDetail = async (row: PurchaseDefectApiDto) => {
    try {
      const fresh = await defectsService.getById(row.ticketCode);
      setSelected(fresh);
      setShowDetail(true);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được phiếu'));
    }
  };

  const handleApproveRow = async (row: PurchaseDefectApiDto) => {
    try {
      await approveMutation.mutateAsync(row.ticketCode);
      showToast('success', `Đã duyệt ${row.ticketCode} - cập nhật PO/KHMH, không cộng tồn.`);
      if (selected?.ticketCode === row.ticketCode) {
        const fresh = await defectsService.getById(row.ticketCode);
        setSelected(fresh);
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không duyệt được'));
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

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      const updated = await cancelMutation.mutateAsync(cancelTarget.ticketCode);
      showToast('success', `Đã hủy ${cancelTarget.ticketCode}.`);
      if (selected?.ticketCode === cancelTarget.ticketCode) {
        setSelected(updated);
      }
      setCancelTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không hủy được phiếu'));
    }
  };

  const buildRowActions = (row: PurchaseDefectApiDto): DropdownItem[] => {
    const items: DropdownItem[] = [];
    if (canApprove && row.status === 'pending') {
      items.push({
        label: 'Duyệt',
        icon: Check,
        onClick: () => void handleApproveRow(row),
      });
    }
    if (canCreate && row.status === 'pending') {
      items.push({
        label: 'Hủy phiếu',
        icon: XCircle,
        onClick: () => setCancelTarget(row),
        danger: true,
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
                setCreateEpoch(e => e + 1);
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
              { id: 'rejected', label: `Đã hủy (${tabCounts.rejected})` },
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

        <DefectsTable
          isLoading={listQuery.isLoading}
          rows={paged}
          buildRowActions={buildRowActions}
          onOpenDetail={row => { void openDetail(row); }}
        />

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

      <DefectCreateModal
        key={createEpoch}
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <DefectDetailModal
        isOpen={showDetail}
        selected={selected}
        onClose={() => {
          setShowDetail(false);
          setSelected(null);
        }}
        onHide={() => setShowDetail(false)}
        onSelectedChange={setSelected}
        onRequestCancel={row => setCancelTarget(row)}
      />

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

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void handleConfirmCancel()}
        title="Hủy phiếu hàng lỗi"
        message={
          cancelTarget
            ? `Hủy phiếu chờ duyệt ${cancelTarget.ticketCode}? Phiếu chuyển sang Đã hủy, không trừ tồn.`
            : ''
        }
        confirmLabel="Hủy phiếu"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
