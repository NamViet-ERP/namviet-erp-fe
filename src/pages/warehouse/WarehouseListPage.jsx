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
import { formatCurrency } from '../../utils/formatCurrency';

export default function WarehouseListPage() {
  const [warehouseList, setWarehouseList] = useState(initialWarehouses);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', group: '', address: '', branch: '', manager: '' });
  const [errors, setErrors] = useState({});

  const filtered = warehouseList.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const validate = () => {
    const errs = {};
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

  const openEdit = (item) => {
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
      const newWh = { id: `wh-${Date.now()}`, ...form, totalStock: 0, totalValue: 0, status: 'active' };
      setWarehouseList(prev => [...prev, newWh]);
      showToast('success', `Đã tạo kho "${form.name}" thành công!`, 'Tạo mới thành công');
    }
    setShowModal(false);
    setErrors({});
  };

  const handleDelete = (item) => {
    if (item.totalStock > 0) {
      showToast('error', `Không thể xóa kho "${item.name}" vì vẫn còn ${formatCurrency(item.totalStock)} sản phẩm trong kho.`, 'Không thể xóa');
      return;
    }
    setWarehouseList(prev => prev.filter(w => w.id !== item.id));
    showToast('warning', `Đã xóa kho "${item.name}"`, 'Xóa thành công');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">KHO HÀNG</h1>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={16} /> TẠO MỚI</button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <select className="form-select w-20 text-xs py-1.5" value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-sm text-gray-500">{filtered.length} kho hàng</span>
          </div>
          <SearchBar value={search} onChange={e => { setSearch(e); setPage(1); }} placeholder="Tìm kiếm kho..." />
        </div>

        {filtered.length === 0 ? <EmptyState message="Không tìm thấy kho hàng nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
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
                    <td className="table-cell font-semibold text-brand-orange cursor-pointer hover:underline"
                      onClick={() => { setDetailItem(w); setShowDetail(true); }}>{w.code}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{w.name}</div>
                    </td>
                    <td className="table-cell">{w.group}</td>
                    <td className="table-cell">{w.branch}</td>
                    <td className="table-cell">{w.manager}</td>
                    <td className="table-cell text-center font-medium">{formatCurrency(w.totalStock)}</td>
                    <td className="table-cell text-center font-medium">{formatCurrency(w.totalValue)}</td>
                    <td className="table-cell text-center"><Badge status={w.status === 'active' ? 'approved' : 'draft'} /></td>
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
        title={editingItem ? 'CHỈNH SỬA KHO HÀNG' : 'TẠO KHO HÀNG MỚI'} size="lg"
        footer={<>
          <button onClick={() => { setShowModal(false); setErrors({}); }} className="btn btn-outline">Hủy bỏ</button>
          <button onClick={handleSave} className="btn btn-primary">{editingItem ? 'Cập nhật' : 'Tạo mới'}</button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Mã kho" required error={errors.code}>
            <input className={`form-input ${errors.code ? 'border-red-400' : ''}`} value={form.code}
              onChange={e => setForm({...form, code: e.target.value})} placeholder="VD: KHO-HCM"
              disabled={!!editingItem} />
          </FormField>
          <FormField label="Tên kho" required error={errors.name}>
            <input className={`form-input ${errors.name ? 'border-red-400' : ''}`} value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Kho Hồ Chí Minh" />
          </FormField>
          <FormField label="Nhóm kho" required error={errors.group}>
            <select className={`form-select ${errors.group ? 'border-red-400' : ''}`} value={form.group}
              onChange={e => setForm({...form, group: e.target.value})}>
              {warehouseGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Chi nhánh" required error={errors.branch}>
            <select className={`form-select ${errors.branch ? 'border-red-400' : ''}`} value={form.branch}
              onChange={e => setForm({...form, branch: e.target.value})}>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </FormField>
          <FormField label="Địa chỉ" required error={errors.address} className="col-span-2">
            <input className={`form-input ${errors.address ? 'border-red-400' : ''}`} value={form.address}
              onChange={e => setForm({...form, address: e.target.value})} placeholder="Nhập địa chỉ kho" />
          </FormField>
          <FormField label="Nhân viên phụ trách" required error={errors.manager} className="col-span-2">
            <input className={`form-input ${errors.manager ? 'border-red-400' : ''}`} value={form.manager}
              onChange={e => setForm({...form, manager: e.target.value})} placeholder="Nhập tên người phụ trách" />
          </FormField>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`CHI TIẾT KHO — ${detailItem?.code || ''}`} size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setShowDetail(false); openEdit(detailItem); }}>
            <Edit size={14} /> Chỉnh sửa
          </button>
          <button className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>
        </>}
      >
        {detailItem && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <span className="text-xs text-gray-400">Mã kho</span>
              <p className="font-bold text-brand-orange text-lg">{detailItem.code}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <span className="text-xs text-gray-400">Tên kho</span>
              <p className="font-semibold text-navy-900">{detailItem.name}</p>
            </div>
            <div><span className="text-xs text-gray-400">Nhóm kho</span><p className="font-medium">{detailItem.group}</p></div>
            <div><span className="text-xs text-gray-400">Chi nhánh</span><p className="font-medium">{detailItem.branch}</p></div>
            <div className="col-span-2"><span className="text-xs text-gray-400">Địa chỉ</span>
              <p className="text-sm flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{detailItem.address}</p>
            </div>
            <div><span className="text-xs text-gray-400">Người phụ trách</span><p className="font-medium">{detailItem.manager}</p></div>
            <div><span className="text-xs text-gray-400">Trạng thái</span>
              <div className="mt-1"><Badge status={detailItem.status === 'active' ? 'approved' : 'draft'} /></div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-4 border border-emerald-100">
              <span className="text-xs text-gray-400">Tổng sản phẩm tồn kho</span>
              <p className="text-2xl font-bold text-navy-900">{formatCurrency(detailItem.totalStock)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
              <span className="text-xs text-gray-400">Tổng giá trị hàng tồn</span>
              <p className="text-2xl font-bold text-navy-900">{formatCurrency(detailItem.totalValue)} đ</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
