import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Eye } from 'lucide-react';
import { warehouses as initialWarehouses, warehouseGroups, branches } from '../../data/warehouses';
import { showToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import Dropdown from '../../components/ui/Dropdown';
import Badge from '../../components/ui/Badge';
import FormField from '../../components/ui/FormField';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { useActiveEmployees } from '../../hooks/useEmployees';
import type { Warehouse } from '../../types';

interface WarehouseForm {
  code: string;
  name: string;
  group: string;
  address: string;
  branch: string;
  manager: string;
}

const generateUniqueWarehouseId = () => `wh-${Date.now()}`;

export default function WarehouseListPage() {
  const { data: activeEmployees = [] } = useActiveEmployees();
  const [warehouseList, setWarehouseList] = useState<Warehouse[]>(initialWarehouses);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailItem, setDetailItem] = useState<Warehouse | null>(null);
  const [editingItem, setEditingItem] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<WarehouseForm>({ code: '', name: '', group: '', address: '', branch: '', manager: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = warehouseList.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã kho';
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên kho';
    if (!form.group) errs.group = 'Vui lòng chọn nhóm kho';
    if (!form.branch) errs.branch = 'Vui lòng chọn chi nhánh';
    if (!form.address.trim()) errs.address = 'Vui lòng nhập địa chỉ';
    if (!form.manager.trim()) errs.manager = 'Vui lòng nhập người phụ trách';
    // Check duplicate code (only for new items)
    if (!editingItem && form.code.trim() && warehouseList.some(w => w.code.toUpperCase() === form.code.trim().toUpperCase())) {
      errs.code = 'Mã kho đã tồn tại';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ code: '', name: '', group: warehouseGroups[0], address: '', branch: branches[0], manager: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item: Warehouse) => {
    setEditingItem(item);
    setForm({ code: item.code, name: item.name, group: item.group, address: item.address, branch: item.branch, manager: item.manager });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editingItem) {
      setWarehouseList(prev => prev.map(w => w.id === editingItem.id ? { ...w, ...form } : w));
      showToast('success', `Đã cập nhật kho "${form.name}"`, 'Cập nhật thành công');
    } else {
      const newWh: Warehouse = { id: generateUniqueWarehouseId(), ...form, totalStock: 0, totalValue: 0, status: 'active' };
      setWarehouseList(prev => [...prev, newWh]);
      showToast('success', `Đã tạo kho "${form.name}" thành công!`, 'Tạo mới thành công');
    }
    setShowModal(false);
    setErrors({});
  };

  const handleDelete = (item: Warehouse) => {
    if (item.totalStock > 0) {
      showToast('error', `Không thể xóa kho "${item.name}" vì vẫn còn ${formatCurrency(item.totalStock)} vật tư trong kho.`, 'Không thể xóa');
      return;
    }
    setWarehouseList(prev => prev.filter(w => w.id !== item.id));
    showToast('warning', `Đã xóa kho "${item.name}"`, 'Xóa thành công');
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Kho hàng"
        title="Danh sách kho"
        actions={<button onClick={openCreate} className="btn btn-filled"><Plus size={16} /> Tạo mới</button>}
      />

      <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card">
        <div className="surface-panel__filter-bar page-filter-bar">
          <div className="flex items-center gap-2">
            <select className="form-select w-24 text-xs py-1.5" value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} mục</option>)}
            </select>
            <span className="text-sm text-[var(--md-on-surface-variant)]">{filtered.length} kho hàng</span>
          </div>
          <SearchBar value={search} onChange={e => { setSearch(e); setPage(1); }} placeholder="Tìm kiếm kho..." />
        </div>

        {filtered.length === 0 ? <EmptyState message="Không tìm thấy kho hàng nào!" /> : (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full text-xs table-min-w--950">
              <thead><tr>
                <th className="table-header-cell">Mã kho</th>
                <th className="table-header-cell">Tên kho</th>
                <th className="table-header-cell">Nhóm</th>
                <th className="table-header-cell">Chi nhánh</th>
                <th className="table-header-cell">Phụ trách</th>
                <th className="table-header-cell text-center">Tổng tồn</th>
                <th className="table-header-cell text-center">Tổng giá trị</th>
                <th className="table-header-cell text-center">Trạng thái</th>
                <th className="table-header-cell text-center">Tác vụ</th>
              </tr></thead>
              <tbody>
                {paginated.map((w) => (
                  <tr key={w.id} className="table-row">
                    <td className="table-cell font-semibold text-[var(--md-primary)] cursor-pointer hover:underline"
                      onClick={() => { setDetailItem(w); setShowDetail(true); }}>{w.code}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-[var(--md-on-surface)]"><MapPin size={14} className="text-[var(--md-outline)]" />{w.name}</div>
                    </td>
                    <td className="table-cell text-[var(--md-on-surface)]">{w.group}</td>
                    <td className="table-cell text-[var(--md-on-surface)]">{w.branch}</td>
                    <td className="table-cell text-[var(--md-on-surface)]">{w.manager}</td>
                    <td className="table-cell text-center font-medium text-[var(--md-on-surface)]">{formatCurrency(w.totalStock)}</td>
                    <td className="table-cell text-center font-medium text-[var(--md-on-surface)]">{formatCurrency(w.totalValue)}</td>
                    <td className="table-cell text-center"><Badge status={w.status} /></td>
                    <td className="table-cell text-center">
                      <Dropdown items={[
                        { label: 'Xem chi tiết', icon: Eye, onClick: () => { setDetailItem(w); setShowDetail(true); } },
                        { label: 'Chỉnh sửa', icon: Edit, onClick: () => openEdit(w) },
                        { divider: true },
                        { label: 'Xóa', icon: Trash2, danger: true, onClick: () => handleDelete(w) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage}
            pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} totalItems={filtered.length} />
        </div>
      </div>

      {/* Create/Edit modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setErrors({}); }}
        title={editingItem ? 'Chỉnh sửa kho' : 'Tạo kho mới'} size="xl"
        footer={<>
          <button onClick={() => { setShowModal(false); setErrors({}); }} className="btn btn-outline">Hủy bỏ</button>
          <button onClick={handleSave} className="btn btn-primary">{editingItem ? 'Cập nhật' : 'Tạo mới'}</button>
        </>}
      >
        <div className="modal-form-bordered grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Mã kho" required error={errors.code}>
            <input className="form-input" value={form.code}
              onChange={e => setForm({...form, code: e.target.value})} placeholder="VD: KHO-HCM"
              disabled={!!editingItem} />
          </FormField>
          <FormField label="Tên kho" required error={errors.name}>
            <input className="form-input" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Kho Hồ Chí Minh" />
          </FormField>
          <FormField label="Nhóm kho" required error={errors.group}>
            <select className="form-select" value={form.group}
              onChange={e => setForm({...form, group: e.target.value})}>
              {warehouseGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Chi nhánh" required error={errors.branch}>
            <select className="form-select" value={form.branch}
              onChange={e => setForm({...form, branch: e.target.value})}>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </FormField>
          <FormField label="Địa chỉ" required error={errors.address} className="col-span-2">
            <input className="form-input" value={form.address}
              onChange={e => setForm({...form, address: e.target.value})} placeholder="Nhập địa chỉ kho" />
          </FormField>
          <FormField label="Nhân viên phụ trách" required error={errors.manager} className="col-span-2">
            <select
              className="form-select"
              value={form.manager}
              onChange={e => setForm({ ...form, manager: e.target.value })}
            >
              <option value="">-- Chọn nhân viên phụ trách --</option>
              {activeEmployees.map(emp => (
                <option key={emp.id} value={emp.fullName}>
                  {emp.code ? `${emp.code} — ` : ''}{emp.fullName}{emp.position ? ` (${emp.position})` : ''}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`Chi tiết kho — ${detailItem?.code || ''}`} size="xl"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setShowDetail(false); if (detailItem) openEdit(detailItem); }}>
            <Edit size={14} /> Chỉnh sửa
          </button>
          <button className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>
        </>}
      >
        {detailItem && (
          <div className="grid grid-cols-2 gap-6">
            <div className="wms-detail-tile">
              <span className="wms-detail-tile__label">Mã kho</span>
              <p className="wms-detail-tile__value wms-detail-tile__value--lg">{detailItem.code}</p>
            </div>
            <div className="wms-detail-tile">
              <span className="wms-detail-tile__label">Tên kho</span>
              <p className="wms-detail-tile__value">{detailItem.name}</p>
            </div>
            <div><span className="wms-detail-tile__label">Nhóm kho</span><p className="wms-detail-tile__value">{detailItem.group}</p></div>
            <div><span className="wms-detail-tile__label">Chi nhánh</span><p className="wms-detail-tile__value">{detailItem.branch}</p></div>
            <div className="col-span-2"><span className="wms-detail-tile__label">Địa chỉ</span>
              <p className="text-sm flex items-center gap-2 text-[var(--md-on-surface)]"><MapPin size={14} className="text-[var(--md-outline)]" />{detailItem.address}</p>
            </div>
            <div><span className="wms-detail-tile__label">Người phụ trách</span><p className="wms-detail-tile__value">{detailItem.manager}</p></div>
            <div><span className="wms-detail-tile__label">Trạng thái</span>
              <div className="mt-1"><Badge status={detailItem.status} /></div>
            </div>
            <div className="wms-detail-tile wms-detail-tile--success">
              <span className="wms-detail-tile__label">Tổng vật tư tồn kho</span>
              <p className="wms-detail-tile__value">{formatCurrency(detailItem.totalStock)}</p>
            </div>
            <div className="wms-detail-tile wms-detail-tile--primary">
              <span className="wms-detail-tile__label">Tổng giá trị hàng tồn</span>
              <p className="wms-detail-tile__value">{formatCurrency(detailItem.totalValue)} đ</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
