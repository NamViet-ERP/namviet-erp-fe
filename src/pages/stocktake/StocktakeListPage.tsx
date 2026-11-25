import { useMemo, useState } from 'react';
import { Check, Download, Eye, FileText, Lock, Plus, Unlock, XCircle } from 'lucide-react';
import PermissionGate from '../../components/auth/PermissionGate';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import StatusBadge from '../../components/ui/StatusBadge';
import TableShell from '../../components/ui/TableShell';
import { showToast } from '../../components/ui/Toast';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects } from '../../hooks/useProjects';
import {
  useApproveStocktake,
  useStocktakes,
  useUpdateStocktake,
} from '../../hooks/useStocktakes';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { printVoucherWithFeedback } from '../../lib/wms/printVoucher';
import { buildStocktakePrintPayload } from '../../lib/wms/voucherPrintBuilders';
import type { DropdownItem, Stocktake } from '../../types';
import StocktakeCreateModal from './StocktakeCreateModal';
import StocktakeDetailModal from './StocktakeDetailModal';
import {
  buildStocktakeTabs,
  exportStocktakesCsv,
  filterStocktakes,
  toStocktakeUpdateDto,
} from './stocktakeHelpers';

export default function StocktakeListPage() {
  const { data: list = [], isLoading, isError, error } = useStocktakes();
  const { data: projectsPage } = useProjects({ pageSize: 200, status: 'Active' });
  const { data: materialsPage } = useMaterials({ pageSize: 500 });
  const updateMutation = useUpdateStocktake();
  const approveMutation = useApproveStocktake();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Stocktake | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Stocktake | null>(null);

  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const tabs = useMemo(() => buildStocktakeTabs(list), [list]);
  const filtered = useMemo(() => filterStocktakes(list, activeTab, search), [list, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openDetail = (item: Stocktake) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleApprove = async (item: Stocktake) => {
    try {
      await approveMutation.mutateAsync(item.id);
      showToast('success', `Đã duyệt phiếu ${item.voucherCode}. Tồn dự án đã được điều chỉnh theo chênh lệch.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu kiểm kê'));
    }
  };

  const handleToggleFreeze = async (item: Stocktake) => {
    const newFrozen = !item.isFrozen;
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        dto: toStocktakeUpdateDto(item, { isFrozen: newFrozen }),
      });
      showToast(
        newFrozen ? 'warning' : 'success',
        newFrozen
          ? `Vật tư phiếu ${item.voucherCode} đã đóng băng.`
          : `Vật tư phiếu ${item.voucherCode} đã mở băng.`,
      );
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật trạng thái đóng băng'));
    }
  };

  const handleRequestCancel = (item: Stocktake) => {
    if (item.status === 'approved') {
      showToast('error', 'Không thể hủy phiếu đã duyệt');
      return;
    }
    if (item.status === 'cancelled') {
      showToast('error', 'Phiếu đã được hủy');
      return;
    }
    setCancelTarget(item);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const target = cancelTarget;
    try {
      await updateMutation.mutateAsync({
        id: target.id,
        dto: toStocktakeUpdateDto(target, { status: 'cancelled', isFrozen: false }),
      });
      if (selectedItem?.id === target.id) setShowDetail(false);
      setCancelTarget(null);
      showToast('warning', `Đã hủy phiếu ${target.voucherCode} — vẫn tra cứu được ở tab Đã hủy.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể hủy phiếu kiểm kê'));
    }
  };

  const getActions = (item: Stocktake): DropdownItem[] => {
    const actions: DropdownItem[] = [
      { label: 'Xem chi tiết', icon: Eye, onClick: () => openDetail(item) },
    ];
    if (item.status === 'pending') {
      actions.push({ label: 'Duyệt phiếu', icon: Check, onClick: () => void handleApprove(item) });
      actions.push({
        label: item.isFrozen ? 'Mở băng' : 'Đóng băng',
        icon: item.isFrozen ? Unlock : Lock,
        onClick: () => void handleToggleFreeze(item),
      });
      actions.push({ divider: true });
      actions.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleRequestCancel(item), danger: true });
    }
    actions.push({ label: 'In phiếu', icon: FileText, onClick: () => printVoucherWithFeedback(buildStocktakePrintPayload(item)) });
    return actions;
  };

  return (
    <PageShell variant="list">
      <PageHeader
        eyebrow="Kiểm kê"
        title="Kiểm kê kho dự án"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outlined" leftIcon={Download} onClick={() => void exportStocktakesCsv(filtered)} disabled={isLoading}>
              Xuất Excel
            </Button>
            <PermissionGate permission="wms.stocktakes.create">
              <Button type="button" variant="filled" leftIcon={Plus} onClick={() => setShowCreate(true)}>
                Tạo phiếu kiểm kê
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <SectionCard noPadding>
        <FilterToolbar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={id => { setActiveTab(id); setPage(1); }}
          search={search}
          onSearchChange={val => { setSearch(val); setPage(1); }}
          searchPlaceholder="Tìm mã phiếu, kho dự án..."
          hasActiveFilters={activeTab !== 'all' || search.trim() !== ''}
          onReset={() => { setActiveTab('all'); setSearch(''); setPage(1); }}
        />

        <TableShell
          flushTop
          colSpan={9}
          loading={isLoading}
          error={isError ? getApiErrorMessage(error, UI_ERROR.loadStocktakes) : null}
          isEmpty={paginated.length === 0}
          emptyMessage="Không tìm thấy phiếu kiểm kê nào."
          pagination={
            !isLoading && filtered.length > 0
              ? {
                  currentPage,
                  totalPages,
                  onPageChange: setPage,
                  pageSize,
                  onPageSizeChange: s => { setPageSize(s); setPage(1); },
                  totalItems: filtered.length,
                }
              : undefined
          }
          header={
            <tr>
              <th className="table-header-cell">Ngày chứng từ</th>
              <th className="table-header-cell">Mã chứng từ</th>
              <th className="table-header-cell">Người tạo</th>
              <th className="table-header-cell">Trạng thái</th>
              <th className="table-header-cell">Kho dự án</th>
              <th className="table-header-cell">Tình trạng</th>
              <th className="table-header-cell text-center w-28 min-w-[7rem]">Đóng băng</th>
              <th className="table-header-cell">Ghi chú</th>
              <th className="table-header-cell text-center">Tác vụ</th>
            </tr>
          }
        >
          {paginated.map(st => (
            <tr key={st.id} className="table-row wms-inventory-row--interactive" onClick={() => openDetail(st)}>
              <td className="table-cell">{st.date}</td>
              <td className="table-cell"><EntityCodeLink code={st.voucherCode} onClick={() => openDetail(st)} /></td>
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  <div className="table-user-avatar">
                    <span>{st.createdBy.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                  </div>
                  <span>{st.createdBy}</span>
                </div>
              </td>
              <td className="table-cell"><Badge status={st.status} /></td>
              <td className="table-cell font-medium">
                <div>{st.warehouseName}</div>
                {st.warehouseId ? <span className="entity-code">{st.warehouseId}</span> : null}
              </td>
              <td className="table-cell"><Badge status={st.condition} /></td>
              <td className="table-cell text-center w-28 min-w-[7rem]">
                {st.status !== 'pending' ? (
                  <span className="text-xs text-[var(--md-on-surface-variant)]">—</span>
                ) : (
                  <StatusBadge
                    tone={st.isFrozen ? 'error' : 'success'}
                    icon={st.isFrozen ? Lock : Unlock}
                    label={st.isFrozen ? 'Đóng băng' : 'Mở băng'}
                    className="inline-flex h-6 min-w-[6.75rem] shrink-0 items-center justify-center gap-1"
                  />
                )}
              </td>
              <td className="table-cell text-[var(--md-on-surface-variant)] max-w-[180px] truncate">{st.note || '—'}</td>
              <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                <Dropdown items={getActions(st)} />
              </td>
            </tr>
          ))}
        </TableShell>
      </SectionCard>

      <StocktakeCreateModal isOpen={showCreate} onClose={() => setShowCreate(false)} projects={projects} materials={materials} />
      <StocktakeDetailModal isOpen={showDetail} stocktake={selectedItem} onClose={() => setShowDetail(false)} />

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void handleConfirmCancel()}
        title="Hủy phiếu kiểm kê"
        message={
          cancelTarget
            ? `Bạn có chắc muốn hủy phiếu kiểm kê ${cancelTarget.voucherCode} (${cancelTarget.warehouseName})? Phiếu đã hủy vẫn tra cứu được ở tab Đã hủy.`
            : ''
        }
        confirmLabel="Hủy phiếu"
        cancelLabel="Đóng"
        variant="danger"
        isLoading={updateMutation.isPending}
      />
    </PageShell>
  );
}
