import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Trash2 } from 'lucide-react';
import { transfers as initialTransfers } from '../../data/transfers';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { validateTransferQty } from '../../utils/validators';
import { generateCode } from '../../utils/generateCode';
import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import DetailModal from '../../components/ui/DetailModal';

const emptyForm = { fromWarehouseId: '', toWarehouseId: '', note: '', items: [{ productId: '', qty: '' }] };

export default function TransferListPage() {
  const [data, setData] = useState(initialTransfers);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'all', label: 'Tất cả', count: data.length },
    { id: 'completed', label: 'Hoàn thành', count: data.filter(t => t.status === 'completed').length },
    { id: 'approved', label: 'Đã duyệt', count: data.filter(t => t.status === 'approved').length },
    { id: 'draft', label: 'Nháp', count: data.filter(t => t.status === 'draft').length },
  ];

  let filtered = data;
  if (activeTab !== 'all') filtered = filtered.filter(t => t.status === activeTab);
  if (search) filtered = filtered.filter(t =>
    t.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
    t.fromWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
    t.toWarehouseName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Form handlers
  const validate = () => {
    const errs = {};
    if (!form.fromWarehouseId) errs.fromWarehouseId = 'Vui lòng chọn kho nguồn';
    if (!form.toWarehouseId) errs.toWarehouseId = 'Vui lòng chọn kho đích';
    if (form.fromWarehouseId && form.toWarehouseId && form.fromWarehouseId === form.toWarehouseId) {
      errs.toWarehouseId = 'Kho đích phải khác kho nguồn';
    }
    const validItems = form.items.filter(it => it.productId);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 sản phẩm';
    form.items.forEach((it, i) => {
      if (it.productId && (!it.qty || Number(it.qty) <= 0)) {
        errs[`item_qty_${i}`] = 'Số lượng phải > 0';
      }
      if (it.productId && it.qty) {
        const sourceWh = warehouses.find(w => w.id === form.fromWarehouseId);
        if (sourceWh) {
          const v = validateTransferQty(Number(it.qty), sourceWh.totalStock);
          if (!v.valid) errs[`item_qty_${i}`] = v.message;
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const fromWh = warehouses.find(w => w.id === form.fromWarehouseId);
    const toWh = warehouses.find(w => w.id === form.toWarehouseId);
    const newTransfer = {
      id: `tf-${Date.now()}`,
      voucherCode: generateCode('CK'),
      date: new Date().toLocaleDateString('vi-VN'),
      fromWarehouseId: form.fromWarehouseId,
      fromWarehouseName: fromWh?.name || '',
      toWarehouseId: form.toWarehouseId,
      toWarehouseName: toWh?.name || '',
      items: form.items.filter(it => it.productId).map(it => {
        const prod = products.find(p => p.id === it.productId);
        return { productId: it.productId, sku: prod?.sku, name: prod?.name, qty: Number(it.qty), unit: prod?.unit };
      }),
      status: 'draft',
      createdBy: 'Admin',
      note: form.note,
    };
    setData([newTransfer, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu chuyển kho ${newTransfer.voucherCode} đã được tạo thành công!`, 'Tạo phiếu thành công');
  };

  const handleApprove = (item) => {
    setData(data.map(t => t.id === item.id ? { ...t, status: 'approved', approvedBy: 'Admin' } : t));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}`, 'Duyệt thành công');
  };

  const handleComplete = (item) => {
    setData(data.map(t => t.id === item.id ? { ...t, status: 'completed' } : t));
    showToast('success', `Phiếu ${item.voucherCode} đã hoàn thành!`, 'Hoàn thành');
  };

  const handleCancel = (item) => {
    if (item.status === 'completed') {
      showToast('error', 'Không thể hủy phiếu đã hoàn thành', 'Lỗi');
      return;
    }
    setData(data.map(t => t.id === item.id ? { ...t, status: 'cancelled' } : t));
    showToast('warning', `Đã hủy phiếu ${item.voucherCode}`, 'Đã hủy phiếu');
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', qty: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  const getDropdownItems = (item) => {
    const actions = [{ label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } }];
    if (item.status === 'draft') {
      actions.push({ label: 'Duyệt phiếu', icon: Check, onClick: () => handleApprove(item) });
      actions.push({ divider: true });
      actions.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleCancel(item), danger: true });
    }
    if (item.status === 'approved') {
      actions.push({ label: 'Hoàn thành', icon: Check, onClick: () => handleComplete(item) });
      actions.push({ divider: true });
      actions.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleCancel(item), danger: true });
    }
    actions.push({ label: 'In phiếu', icon: FileText, onClick: () => showToast('info', 'Đang chuẩn bị in...') });
    return actions;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">CHUYỂN KHO</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> TẠO MỚI</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card">
        <div className="px-4 pt-4">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} />
        </div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="form-select w-20 text-xs py-1.5" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {[10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button className="btn btn-outline text-xs py-1.5">XUẤT RA</button>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm kiếm..." />
        </div>

        {paginated.length === 0 ? (
          <EmptyState message="Không tìm thấy phiếu chuyển kho nào!" />
        ) : (
          <div className="overflow-x-auto" style={{ overflow: 'visible' }}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header-cell">Ngày chứng từ</th>
                  <th className="table-header-cell">Mã chứng từ</th>
                  <th className="table-header-cell">Kho nguồn</th>
                  <th className="table-header-cell">Kho đích</th>
                  <th className="table-header-cell">Người tạo</th>
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell">Ghi chú</th>
                  <th className="table-header-cell text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td className="table-cell">{t.date}</td>
                    <td className="table-cell font-semibold text-brand-orange cursor-pointer hover:underline"
                      onClick={() => { setSelectedItem(t); setShowDetail(true); }}>{t.voucherCode}</td>
                    <td className="table-cell">{t.fromWarehouseName}</td>
                    <td className="table-cell">{t.toWarehouseName}</td>
                    <td className="table-cell">{t.createdBy}</td>
                    <td className="table-cell"><Badge status={t.status} /></td>
                    <td className="table-cell text-gray-500 max-w-[200px] truncate">{t.note || '—'}</td>
                    <td className="table-cell text-center">
                      <Dropdown items={getDropdownItems(t)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage}
            pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={filtered.length} />
        </div>
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setErrors({}); }}
        title="TẠO PHIẾU CHUYỂN KHO" size="xl"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setShowCreate(false); setErrors({}); }}>Hủy bỏ</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Tạo phiếu</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Kho nguồn" required error={errors.fromWarehouseId}>
            <select className={`form-select ${errors.fromWarehouseId ? 'border-red-400' : ''}`}
              value={form.fromWarehouseId} onChange={e => setForm({ ...form, fromWarehouseId: e.target.value })}>
              <option value="">-- Chọn kho nguồn --</option>
              {warehouses.filter(w => w.group !== 'Kho hư lỗi' && w.group !== 'Kho bảo hành').map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.branch})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Kho đích" required error={errors.toWarehouseId}>
            <select className={`form-select ${errors.toWarehouseId ? 'border-red-400' : ''}`}
              value={form.toWarehouseId} onChange={e => setForm({ ...form, toWarehouseId: e.target.value })}>
              <option value="">-- Chọn kho đích --</option>
              {warehouses.filter(w => w.id !== form.fromWarehouseId && w.group !== 'Kho hư lỗi' && w.group !== 'Kho bảo hành').map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.branch})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Ghi chú" className="md:col-span-2">
            <textarea className="form-input" rows={2} value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Nhập ghi chú..." />
          </FormField>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-navy-900">Danh sách hàng hóa</h4>
          <button className="btn btn-outline text-xs" onClick={addItem}><Plus size={14} /> Thêm dòng</button>
        </div>
        {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell w-12">STT</th>
                <th className="table-header-cell">Sản phẩm</th>
                <th className="table-header-cell w-32">Số lượng</th>
                <th className="table-header-cell w-12"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell text-center">{i + 1}</td>
                  <td className="table-cell">
                    <select className="form-select text-sm" value={it.productId}
                      onChange={e => updateItem(i, 'productId', e.target.value)}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <input type="number" min="1" className={`form-input text-sm text-right ${errors[`item_qty_${i}`] ? 'border-red-400' : ''}`}
                      value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="0" />
                    {errors[`item_qty_${i}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`item_qty_${i}`]}</p>}
                  </td>
                  <td className="table-cell text-center">
                    {form.items.length > 1 && (
                      <button className="p-1 text-red-400 hover:text-red-600" onClick={() => removeItem(i)}><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Detail modal */}
      <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`PHIẾU CHUYỂN KHO — ${selectedItem?.voucherCode || ''}`} data={selectedItem}
        columns={[
          { key: 'name', label: 'Tên hàng' },
          { key: 'sku', label: 'Mã SKU' },
          { key: 'unit', label: 'Đơn vị' },
          { key: 'qty', label: 'Số lượng', align: 'right' },
        ]}
      />
    </div>
  );
}
