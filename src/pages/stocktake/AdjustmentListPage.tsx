import { useState } from 'react';
import { Eye, FileText, Download, Check, XCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { adjustmentTypeConfig } from '../../constants/statusConfig';
import { useAdjustments, useUpdateAdjustment } from '../../hooks/useAdjustments';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Modal from '../../components/ui/Modal';
import type { Adjustment, DropdownItem } from '../../types';

export default function AdjustmentListPage() {
  const { data: list = [], isLoading, isError, error } = useAdjustments();
  const updateMutation = useUpdateAdjustment();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Adjustment | null>(null);

  const tabs = [
    { id: 'all', label: 'Tất cả', count: list.length },
    { id: 'increase', label: 'Điều chỉnh tăng', count: list.filter(a => a.type === 'increase').length },
    { id: 'decrease', label: 'Điều chỉnh giảm', count: list.filter(a => a.type === 'decrease').length },
  ];

  let filtered = list;
  if (activeTab !== 'all') filtered = filtered.filter(a => a.type === activeTab);
  if (search) filtered = filtered.filter(a =>
    a.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
    a.stocktakeCode.toLowerCase().includes(search.toLowerCase()) ||
    a.createdBy.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleApproveAdjustment = async (item: Adjustment): Promise<void> => {
    try {
      if (item.condition === 'warehouse_approved') {
        await updateMutation.mutateAsync({ id: item.id, dto: { condition: 'exported' } });
        showToast('success', `Đã xuất kho điều chỉnh ${item.voucherCode}. Tồn kho đã cập nhật.`, 'Xuất kho điều chỉnh');
      } else {
        await updateMutation.mutateAsync({ id: item.id, dto: { condition: 'warehouse_approved' } });
        showToast('success', `Đã duyệt điều chỉnh ${item.voucherCode}`, 'Duyệt thành công');
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật phiếu điều chỉnh'));
    }
  };

  const handleReject = async (item: Adjustment): Promise<void> => {
    if (item.condition === 'exported') { showToast('error', 'Không thể hủy phiếu đã xuất kho'); return; }
    try {
      await updateMutation.mutateAsync({ id: item.id, dto: { condition: 'rejected' } });
      showToast('warning', `Đã từ chối điều chỉnh ${item.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể từ chối phiếu điều chỉnh'));
    }
  };

  const getActions = (item: Adjustment): DropdownItem[] => {
    const a: DropdownItem[] = [{ label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } }];
    if (item.condition === 'warehouse_approved') {
      a.push({ label: 'Xuất kho điều chỉnh', icon: Check, onClick: () => handleApproveAdjustment(item) });
    }
    if (item.condition !== 'exported' && item.condition !== 'rejected') {
      if (item.condition !== 'warehouse_approved') {
        a.push({ label: 'Duyệt điều chỉnh', icon: Check, onClick: () => handleApproveAdjustment(item) });
      }
      a.push({ divider: true });
      a.push({ label: 'Từ chối', icon: XCircle, onClick: () => handleReject(item), danger: true });
    }
    a.push({ label: 'In phiếu', icon: FileText, onClick: () => showToast('info', 'Đang chuẩn bị in...') });
    return a;
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="KIỂM KÊ"
        title="ĐIỀU CHỈNH KHO"
        actions={
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
        }
      />

      <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card">
        <div className="px-4 pt-4"><TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} /></div>
        <div className="surface-panel__filter-bar px-4 pb-3 page-filter-bar">
          <div className="flex items-center gap-2">
            <select className="form-select w-20 text-xs py-1.5" value={pageSize} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(Number(e.target.value))}>
              {[10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm kiếm..." />
        </div>

        <div className="overflow-x-auto table-scroll">
          <table className="w-full">
            <thead><tr>
              <th className="table-header-cell">Ngày chứng từ</th>
              <th className="table-header-cell">Mã chứng từ</th>
              <th className="table-header-cell">Mã phiếu kiểm kê</th>
              <th className="table-header-cell">Loại điều chỉnh</th>
              <th className="table-header-cell">Người tạo</th>
              <th className="table-header-cell">Tình trạng</th>
              <th className="table-header-cell">Kho hàng</th>
              <th className="table-header-cell">Ghi chú</th>
              <th className="table-header-cell text-center">Tác vụ</th>
            </tr></thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={9} />
              ) : isError ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState message={getApiErrorMessage(error, UI_ERROR.loadAdjustments)} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState message="Không tìm thấy phiếu điều chỉnh nào." />
                  </td>
                </tr>
              ) : (
                paginated.map((adj) => (
                  <tr key={adj.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        {adj.date}
                        {adj.isNew && <span className="wms-badge-new">Mới</span>}
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-[var(--md-primary)] cursor-pointer hover:underline"
                      onClick={() => { setSelectedItem(adj); setShowDetail(true); }}>{adj.voucherCode}</td>
                    <td className="table-cell">
                      <span className="wms-token-chip wms-token-chip--info">{adj.stocktakeCode}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`wms-token-chip ${adj.type === 'increase' ? 'wms-token-chip--increase' : 'wms-token-chip--decrease'}`}>
                        {adjustmentTypeConfig[adj.type]?.label || adj.type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="table-user-avatar table-user-avatar--warm">
                          <span>{adj.createdBy.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                        </div>
                        <span>{adj.createdBy}</span>
                      </div>
                    </td>
                    <td className="table-cell"><Badge status={adj.condition} /></td>
                    <td className="table-cell font-medium">{adj.warehouseName}</td>
                    <td className="table-cell text-[var(--md-on-surface-variant)] max-w-[150px] truncate">{adj.note || '—'}</td>
                    <td className="table-cell text-center"><Dropdown items={getActions(adj)} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={filtered.length} />
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`PHIẾU ĐIỀU CHỈNH — ${selectedItem?.voucherCode || ''}`} size="xl"
        footer={<>
          {selectedItem && selectedItem.condition !== 'exported' && selectedItem.condition !== 'rejected' && (
            <button className="btn btn-filled" onClick={() => { handleApproveAdjustment(selectedItem); setShowDetail(false); }}>
              <Check size={14} /> Duyệt điều chỉnh
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>
        </>}
      >
        {selectedItem && (
          <>
            <div className="wms-detail-summary">
              <div><span className="wms-detail-tile__label">Mã chứng từ</span><p className="font-semibold text-[var(--md-primary)]">{selectedItem.voucherCode}</p></div>
              <div><span className="wms-detail-tile__label">Mã phiếu kiểm kê</span>
                <span className="wms-token-chip wms-token-chip--info">{selectedItem.stocktakeCode}</span></div>
              <div><span className="wms-detail-tile__label">Loại</span>
                <p className={`font-medium text-sm ${selectedItem.type === 'increase' ? 'text-[var(--md-success)]' : 'text-[var(--md-error)]'}`}>
                  {adjustmentTypeConfig[selectedItem.type]?.label}
                </p>
              </div>
              <div><span className="wms-detail-tile__label">Kho hàng</span><p className="text-sm font-medium">{selectedItem.warehouseName}</p></div>
              <div><span className="wms-detail-tile__label">Người tạo</span><p className="text-sm">{selectedItem.createdBy}</p></div>
              <div><span className="wms-detail-tile__label">Tình trạng</span><div className="mt-0.5"><Badge status={selectedItem.condition} /></div></div>
            </div>
            {selectedItem.items?.length > 0 ? (
              <table className="w-full">
                <thead><tr>
                  <th className="table-header-cell">Tên hàng</th>
                  <th className="table-header-cell">SKU</th>
                  <th className="table-header-cell text-right">SL điều chỉnh</th>
                  <th className="table-header-cell">Lý do</th>
                </tr></thead>
                <tbody>
                  {selectedItem.items.map((it, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell">{it.name}</td>
                      <td className="table-cell">{it.sku}</td>
                      <td className={`table-cell text-right font-bold ${selectedItem.type === 'increase' ? 'text-[var(--md-success)]' : 'text-[var(--md-error)]'}`}>
                        {selectedItem.type === 'increase' ? '+' : '-'}{it.adjustQty}
                      </td>
                      <td className="table-cell text-[var(--md-on-surface)]">{it.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-center text-[var(--md-on-surface-variant)] py-8">Không có mặt hàng điều chỉnh</p>}
          </>
        )}
      </Modal>
    </div>
  );
}
