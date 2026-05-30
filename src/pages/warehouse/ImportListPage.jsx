import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Trash2 } from 'lucide-react';
import { imports as initialImports } from '../../data/imports';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { generateCode } from '../../utils/generateCode';
import { formatCurrency } from '../../utils/formatCurrency';
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

const emptyForm = { supplier: '', referenceCode: '', warehouseId: '', note: '', items: [{ productId: '', qty: '', unitPrice: '' }] };

export default function ImportListPage() {
  const [data, setData] = useState(initialImports);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'all', label: 'Tất cả', count: data.length },
    { id: 'approved', label: 'Đã Duyệt', count: data.filter(i => i.status === 'approved').length },
    { id: 'pending', label: 'Chưa duyệt', count: data.filter(i => i.status === 'pending').length },
    { id: 'wh_approved', label: 'Đã duyệt kho', count: data.filter(i => i.warehouseApproval === 'approved').length },
    { id: 'wh_pending', label: 'Chưa duyệt kho', count: data.filter(i => i.warehouseApproval === 'pending').length },
  ];

  let filtered = data;
  if (activeTab === 'approved') filtered = filtered.filter(i => i.status === 'approved');
  else if (activeTab === 'pending') filtered = filtered.filter(i => i.status === 'pending');
  else if (activeTab === 'wh_approved') filtered = filtered.filter(i => i.warehouseApproval === 'approved');
  else if (activeTab === 'wh_pending') filtered = filtered.filter(i => i.warehouseApproval === 'pending');

  if (search) filtered = filtered.filter(i =>
    i.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier.toLowerCase().includes(search.toLowerCase()) ||
    i.referenceCode.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const validate = () => {
    const errs = {};
    if (!form.supplier.trim()) errs.supplier = 'Vui lòng nhập tên nhà cung cấp';
    if (!form.referenceCode.trim()) errs.referenceCode = 'Vui lòng nhập mã PO tham chiếu';
    if (!form.warehouseId) errs.warehouseId = 'Vui lòng chọn kho nhập';
    const validItems = form.items.filter(it => it.productId);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 sản phẩm';
    form.items.forEach((it, i) => {
      if (it.productId && (!it.qty || Number(it.qty) <= 0)) errs[`qty_${i}`] = 'Số lượng phải > 0';
      if (it.productId && (!it.unitPrice || Number(it.unitPrice) <= 0)) errs[`price_${i}`] = 'Đơn giá phải > 0';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const items = form.items.filter(it => it.productId).map(it => {
      const prod = products.find(p => p.id === it.productId);
      return { productId: it.productId, sku: prod?.sku, name: prod?.name, qty: Number(it.qty), unit: prod?.unit, unitPrice: Number(it.unitPrice) };
    });
    const totalValue = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
    const newItem = {
      id: `im-${Date.now()}`, voucherCode: generateCode('NK'),
      date: new Date().toLocaleDateString('vi-VN'),
      supplier: form.supplier, referenceCode: form.referenceCode,
      totalValue, status: 'pending', warehouseApproval: 'pending',
      approvedBy: '', warehouseKeeper: '', items,
      createdBy: 'Admin', note: form.note, warehouseId: form.warehouseId,
    };
    setData([newItem, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu nhập kho ${newItem.voucherCode} đã được tạo!`, 'Tạo phiếu thành công');
  };

  const handleApprove = (item) => {
    setData(data.map(i => i.id === item.id ? { ...i, status: 'approved', approvedBy: 'Admin' } : i));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}`);
  };

  const handleApproveWarehouse = (item) => {
    setData(data.map(i => i.id === item.id ? { ...i, warehouseApproval: 'approved', warehouseKeeper: 'Admin' } : i));
    showToast('success', `Đã duyệt kho phiếu ${item.voucherCode}`);
  };

  const handleCancel = (item) => {
    setData(data.map(i => i.id === item.id ? { ...i, status: 'cancelled' } : i));
    showToast('warning', `Đã hủy phiếu ${item.voucherCode}`);
  };

  const getWhApprovalBadge = (approval) => {
    const map = {
      approved: { label: 'ĐÃ DUYỆT KHO', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
      exported: { label: 'ĐÃ CÓ XUẤT KHO', cls: 'bg-red-100 text-red-700 border border-red-200' },
      pending: { label: 'CHƯA DUYỆT KHO', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    };
    const config = map[approval] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${config.cls}`}>
        {approval === 'approved' && <Check size={10} />}
        {config.label}
      </span>
    );
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', qty: '', unitPrice: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => { const items = [...form.items]; items[i] = { ...items[i], [field]: val }; setForm({ ...form, items }); };

  const formTotal = form.items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);

  const getActions = (item) => {
    const a = [{ label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } }];
    if (item.status === 'pending') {
      a.push({ label: 'Duyệt phiếu', icon: Check, onClick: () => handleApprove(item) });
    }
    if (item.warehouseApproval === 'pending') {
      a.push({ label: 'Duyệt kho', icon: Check, onClick: () => handleApproveWarehouse(item) });
    }
    if (item.status !== 'cancelled') {
      a.push({ divider: true });
      a.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleCancel(item), danger: true });
    }
    a.push({ label: 'In phiếu', icon: FileText, onClick: () => showToast('info', 'Đang chuẩn bị in...') });
    return a;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">NHẬP KHO</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> TẠO MỚI</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 pt-4"><TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} /></div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="form-select w-20 text-xs py-1.5" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {[10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button className="btn btn-outline text-xs py-1.5">XUẤT RA</button>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm kiếm..." />
        </div>

        {paginated.length === 0 ? <EmptyState message="Không tìm thấy phiếu nhập kho nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header-cell">Ngày chứng từ</th>
                <th className="table-header-cell">Mã chứng từ</th>
                <th className="table-header-cell">Nhà cung cấp</th>
                <th className="table-header-cell">Mã tham chiếu</th>
                <th className="table-header-cell text-right">Tổng giá trị</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell">Duyệt kho</th>
                <th className="table-header-cell text-center">Tác vụ</th>
              </tr></thead>
              <tbody>
                {paginated.map((imp) => (
                  <tr key={imp.id} className="table-row">
                    <td className="table-cell">{imp.date}</td>
                    <td className="table-cell font-semibold text-brand-orange cursor-pointer hover:underline"
                      onClick={() => { setSelectedItem(imp); setShowDetail(true); }}>{imp.voucherCode}</td>
                    <td className="table-cell max-w-[250px]"><p className="text-sm truncate">{imp.supplier}</p></td>
                    <td className="table-cell">{imp.referenceCode}</td>
                    <td className="table-cell text-right font-medium">{formatCurrency(imp.totalValue)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Badge status={imp.status} />
                        {imp.approvedBy && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-gray-600">{imp.approvedBy?.[0]}</span>
                            </div>
                            <span className="text-xs text-gray-500">{imp.approvedBy}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        {getWhApprovalBadge(imp.warehouseApproval)}
                        {imp.warehouseKeeper && <div className="text-[11px] text-gray-400 mt-0.5">Thủ kho: {imp.warehouseKeeper}</div>}
                      </div>
                    </td>
                    <td className="table-cell text-center"><Dropdown items={getActions(imp)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={filtered.length} />
        </div>
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setErrors({}); }}
        title="TẠO PHIẾU NHẬP KHO" size="xl"
        footer={<>
          <div className="flex-1 text-left">
            <span className="text-sm text-gray-500">Tổng giá trị: </span>
            <span className="text-lg font-bold text-navy-900">{formatCurrency(formTotal)} đ</span>
          </div>
          <button className="btn btn-outline" onClick={() => { setShowCreate(false); setErrors({}); }}>Hủy bỏ</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Tạo phiếu</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Nhà cung cấp" required error={errors.supplier}>
            <input className={`form-input ${errors.supplier ? 'border-red-400' : ''}`}
              value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
              placeholder="CÔNG TY TNHH..." />
          </FormField>
          <FormField label="Mã PO tham chiếu" required error={errors.referenceCode}>
            <input className={`form-input ${errors.referenceCode ? 'border-red-400' : ''}`}
              value={form.referenceCode} onChange={e => setForm({ ...form, referenceCode: e.target.value })}
              placeholder="PO-000000" />
          </FormField>
          <FormField label="Kho nhập" required error={errors.warehouseId}>
            <select className={`form-select ${errors.warehouseId ? 'border-red-400' : ''}`}
              value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">-- Chọn kho --</option>
              {warehouses.filter(w => w.group !== 'Kho hư lỗi').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </FormField>
          <FormField label="Ghi chú">
            <input className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú..." />
          </FormField>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-navy-900">Danh sách hàng hóa</h4>
          <button className="btn btn-outline text-xs" onClick={addItem}><Plus size={14} /> Thêm dòng</button>
        </div>
        {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}
        <table className="w-full">
          <thead><tr>
            <th className="table-header-cell w-12">STT</th>
            <th className="table-header-cell">Sản phẩm</th>
            <th className="table-header-cell w-24">Số lượng</th>
            <th className="table-header-cell w-36">Đơn giá (VND)</th>
            <th className="table-header-cell w-36 text-right">Thành tiền</th>
            <th className="table-header-cell w-12"></th>
          </tr></thead>
          <tbody>
            {form.items.map((it, i) => {
              const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
              return (
                <tr key={i} className="table-row">
                  <td className="table-cell text-center">{i + 1}</td>
                  <td className="table-cell">
                    <select className="form-select text-sm" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <input type="number" min="1" className={`form-input text-sm text-right ${errors[`qty_${i}`] ? 'border-red-400' : ''}`}
                      value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="0" />
                    {errors[`qty_${i}`] && <p className="text-red-500 text-[10px]">{errors[`qty_${i}`]}</p>}
                  </td>
                  <td className="table-cell">
                    <input type="number" min="0" className={`form-input text-sm text-right ${errors[`price_${i}`] ? 'border-red-400' : ''}`}
                      value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="0" />
                    {errors[`price_${i}`] && <p className="text-red-500 text-[10px]">{errors[`price_${i}`]}</p>}
                  </td>
                  <td className="table-cell text-right font-medium text-sm">{formatCurrency(lineTotal)}</td>
                  <td className="table-cell text-center">
                    {form.items.length > 1 && <button className="p-1 text-red-400 hover:text-red-600" onClick={() => removeItem(i)}><Trash2 size={14} /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Modal>

      <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`PHIẾU NHẬP KHO — ${selectedItem?.voucherCode || ''}`} data={selectedItem}
        columns={[
          { key: 'name', label: 'Tên hàng' },
          { key: 'sku', label: 'Mã SKU' },
          { key: 'unit', label: 'Đơn vị' },
          { key: 'qty', label: 'Số lượng', align: 'right' },
          { key: 'unitPrice', label: 'Đơn giá', align: 'right', render: (it) => formatCurrency(it.unitPrice) },
          { key: 'total', label: 'Thành tiền', align: 'right', render: (it) => formatCurrency((it.qty || 0) * (it.unitPrice || 0)) },
        ]}
      />
    </div>
  );
}
