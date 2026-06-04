import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import PageHeader from '../../components/ui/PageHeader';
import type { Import, DetailModalData } from '../../types';

interface FormItem {
  productId: string;
  qty: string;
  unitPrice: string;
}

interface ImportForm {
  supplier: string;
  referenceCode: string;
  warehouseId: string;
  note: string;
  isDirectProcurement: boolean;
  project: string;
  items: FormItem[];
}

const emptyForm: ImportForm = {
  supplier: '', referenceCode: '', warehouseId: '', note: '',
  isDirectProcurement: false, project: '',
  items: [{ productId: '', qty: '', unitPrice: '' }],
};

export default function ImportListPage() {
  const [data, setData] = useState<Import[]>(initialImports);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Import | null>(null);
  const [form, setForm] = useState<ImportForm>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const errs: Record<string, string> = {};
    if (!form.supplier.trim()) errs.supplier = 'Vui lòng nhập tên nhà cung cấp';
    if (!form.referenceCode.trim()) errs.referenceCode = 'Vui lòng nhập mã PO tham chiếu';
    if (!form.isDirectProcurement && !form.warehouseId) errs.warehouseId = 'Vui lòng chọn kho nhập';
    if (form.isDirectProcurement && !form.project) errs.project = 'Vui lòng chọn dự án thụ hưởng';
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
      return { productId: it.productId, sku: prod?.sku ?? '', name: prod?.name ?? '', qty: Number(it.qty), unit: prod?.unit ?? '', unitPrice: Number(it.unitPrice) };
    });
    const totalValue = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
    const newItem: Import = {
      id: `im-${Date.now()}`, voucherCode: generateCode('NK'),
      date: new Date().toLocaleDateString('vi-VN'),
      supplier: form.supplier, referenceCode: form.referenceCode,
      totalValue, status: 'pending', warehouseApproval: 'pending',
      approvedBy: '', warehouseKeeper: '', items,
      createdBy: 'Admin', note: form.note,
      warehouseId: form.isDirectProcurement ? '' : form.warehouseId,
      isDirectProcurement: form.isDirectProcurement,
      project: form.isDirectProcurement ? form.project : '',
    };
    setData([newItem, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu nhập kho ${newItem.voucherCode} đã được tạo!`, 'Tạo phiếu thành công');
  };

  const handleApprove = (item: Import) => {
    setData(data.map(i => i.id === item.id ? { ...i, status: 'approved' as const, approvedBy: 'Admin' } : i));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}`);
  };

  const handleApproveWarehouse = (item: Import) => {
    setData(data.map(i => i.id === item.id ? { ...i, warehouseApproval: 'approved' as const, warehouseKeeper: 'Admin' } : i));
    showToast('success', `Đã duyệt kho phiếu ${item.voucherCode}`);
  };

  const handleCancel = (item: Import) => {
    setData(data.map(i => i.id === item.id ? { ...i, status: 'cancelled' as const } : i));
    showToast('warning', `Đã hủy phiếu ${item.voucherCode}`);
  };

  const getWhApprovalBadge = (approval: string) => {
    const map: Record<string, { label: string; style: React.CSSProperties }> = {
      approved: { label: 'ĐÃ DUYỆT KHO', style: { background: 'var(--md-success-container)', color: 'var(--md-on-success-container)' } },
      exported: { label: 'ĐÃ CÓ XUẤT KHO', style: { background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' } },
      pending: { label: 'CHƯA DUYỆT KHO', style: { background: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)' } },
    };
    const config = map[approval] || map.pending;
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold" style={config.style}>
        {approval === 'approved' && <Check size={10} />}
        {config.label}
      </span>
    );
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', qty: '', unitPrice: '' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof FormItem, val: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const formTotal = form.items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);

  const getActions = (item: Import) => {
    const a: { label?: string; icon?: LucideIcon; onClick?: () => void; danger?: boolean; divider?: boolean }[] = [
      { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } },
    ];
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
      <PageHeader
        eyebrow="KHO HÀNG"
        title="NHẬP KHO"
        actions={<>
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
          <button className="btn btn-filled" onClick={() => setShowCreate(true)}><Plus size={16} /> TẠO MỚI</button>
        </>}
      />

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)' }}>
        <div className="px-4 pt-4"><TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} /></div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="form-select w-24 text-xs py-1.5" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {[10, 15, 25].map(n => <option key={n} value={n}>{n} mục</option>)}
            </select>
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
                    <td className="table-cell text-[var(--md-on-surface)]">{imp.date}</td>
                    <td className="table-cell font-semibold text-[var(--md-primary)] cursor-pointer hover:underline"
                      onClick={() => { setSelectedItem(imp); setShowDetail(true); }}>
                      <div>{imp.voucherCode}</div>
                      {imp.isDirectProcurement && (
                        <span className="inline-block text-[9px] font-bold bg-[rgba(122,81,0,0.15)] text-[var(--md-warning)] px-2 py-0.5 rounded-full border border-[rgba(122,81,0,0.25)] mt-0.5">
                          MUA TRỰC TIẾP DỰ ÁN
                        </span>
                      )}
                    </td>
                    <td className="table-cell max-w-[250px] text-[var(--md-on-surface)]"><p className="text-sm truncate">{imp.supplier}</p></td>
                    <td className="table-cell text-[var(--md-on-surface)]">
                      <div>{imp.referenceCode}</div>
                      {imp.isDirectProcurement && (
                        <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5 font-semibold">Dự án: {imp.project}</div>
                      )}
                    </td>
                    <td className="table-cell text-right font-medium text-[var(--md-on-surface)]">{formatCurrency(imp.totalValue)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Badge status={imp.status} />
                        {imp.approvedBy && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[var(--md-primary-container)] flex items-center justify-center">
                              <span className="text-[8px] font-bold text-[var(--md-on-primary-container)]">{imp.approvedBy?.[0]}</span>
                            </div>
                            <span className="text-xs text-[var(--md-on-surface-variant)]">{imp.approvedBy}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        {getWhApprovalBadge(imp.warehouseApproval)}
                        {imp.warehouseKeeper && <div className="text-[11px] text-[var(--md-on-surface-variant)] mt-0.5">Thủ kho: {imp.warehouseKeeper}</div>}
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
            <span className="text-sm text-[var(--md-on-surface-variant)]">Tổng giá trị: </span>
            <span className="text-lg font-bold text-[var(--md-on-surface)]">{formatCurrency(formTotal)} đ</span>
          </div>
          <button className="btn btn-outline" onClick={() => { setShowCreate(false); setErrors({}); }}>Hủy bỏ</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Tạo phiếu</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Nhà cung cấp" required error={errors.supplier}>
            <input className={`form-input ${errors.supplier ? 'border-[var(--md-error)]' : ''}`}
              value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
              placeholder="CÔNG TY TNHH..." />
          </FormField>
          <FormField label="Mã PO tham chiếu" required error={errors.referenceCode}>
            <input className={`form-input ${errors.referenceCode ? 'border-[var(--md-error)]' : ''}`}
              value={form.referenceCode} onChange={e => setForm({ ...form, referenceCode: e.target.value })}
              placeholder="PO-000000" />
          </FormField>
          
          <div className="col-span-1 md:col-span-2 flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="isDirectProcurement"
              className="w-4 h-4 rounded border-gray-300 text-[var(--md-primary)] focus:ring-[var(--md-primary)] accent-[var(--md-primary)]"
              checked={form.isDirectProcurement}
              onChange={e => setForm({ ...form, isDirectProcurement: e.target.checked, warehouseId: '', project: '' })}
            />
            <label htmlFor="isDirectProcurement" className="text-xs font-bold text-[var(--md-on-surface-variant)] uppercase cursor-pointer">
              Mua phát sinh trực tiếp cho dự án (Không qua kho chung)
            </label>
          </div>

          {form.isDirectProcurement ? (
            <FormField label="Dự án thụ hưởng" required error={errors.project}>
              <select className={`form-select ${errors.project ? 'border-[var(--md-error)]' : ''}`}
                value={form.project} onChange={e => setForm({ ...form, project: e.target.value })}>
                <option value="">-- Chọn dự án --</option>
                <option value="Dự án 1 - Khách sạn Mường Thanh">Dự án 1 - Khách sạn Mường Thanh</option>
                <option value="Dự án 2 - Nhà máy Dệt Nam Định">Dự án 2 - Nhà máy Dệt Nam Định</option>
                <option value="Dự án 3 - Hóa dầu Nghi Sơn">Dự án 3 - Hóa dầu Nghi Sơn</option>
                <option value="Dự án 4 - Nhà máy Bia Heineken">Dự án 4 - Nhà máy Bia Heineken</option>
                <option value="Dự án 5 - Vinhomes Grand Park">Dự án 5 - Vinhomes Grand Park</option>
                <option value="Dự án 6 - Sân bay Long Thành">Dự án 6 - Sân bay Long Thành</option>
              </select>
            </FormField>
          ) : (
            <FormField label="Kho nhập" required error={errors.warehouseId}>
              <select className={`form-select ${errors.warehouseId ? 'border-[var(--md-error)]' : ''}`}
                value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })}>
                <option value="">-- Chọn kho --</option>
                {warehouses.filter(w => w.group !== 'Kho hư lỗi').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </FormField>
          )}

          <FormField label="Ghi chú">
            <input className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú..." />
          </FormField>

          {form.isDirectProcurement && (
            <div className="col-span-1 md:col-span-2 bg-[rgba(122,81,0,0.1)] border border-[rgba(122,81,0,0.2)] text-[var(--md-warning)] text-xs p-3 rounded-lg flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--md-warning)] mt-1.5 flex-shrink-0" />
              <span>Vật tư này sẽ được hạch toán trực tiếp chi phí vào dự án chỉ định và không được tính vào tồn kho chung của công ty.</span>
            </div>
          )}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-[var(--md-on-surface)]">Danh sách hàng hóa</h4>
          <button className="btn btn-outline text-xs" onClick={addItem}><Plus size={14} /> Thêm dòng</button>
        </div>
        {errors.items && <p className="text-[var(--md-error)] text-xs mb-2">{errors.items}</p>}
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
                  <td className="table-cell text-center text-[var(--md-on-surface)]">{i + 1}</td>
                  <td className="table-cell">
                    <select className="form-select text-sm" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <input type="number" min="1" className={`form-input text-sm text-right ${errors[`qty_${i}`] ? 'border-[var(--md-error)]' : ''}`}
                      value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="0" />
                    {errors[`qty_${i}`] && <p className="text-[var(--md-error)] text-[10px]">{errors[`qty_${i}`]}</p>}
                  </td>
                  <td className="table-cell">
                    <input type="number" min="0" className={`form-input text-sm text-right ${errors[`price_${i}`] ? 'border-[var(--md-error)]' : ''}`}
                      value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="0" />
                    {errors[`price_${i}`] && <p className="text-[var(--md-error)] text-[10px]">{errors[`price_${i}`]}</p>}
                  </td>
                  <td className="table-cell text-right font-medium text-sm text-[var(--md-on-surface)]">{formatCurrency(lineTotal)}</td>
                  <td className="table-cell text-center">
                    {form.items.length > 1 && <button className="p-1 text-[var(--md-error)] opacity-80 hover:opacity-100" onClick={() => removeItem(i)}><Trash2 size={14} /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Modal>

      <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`PHIẾU NHẬP KHO — ${selectedItem?.voucherCode || ''}`} data={selectedItem as DetailModalData | null}
        columns={[
          { key: 'name', label: 'Tên hàng' },
          { key: 'sku', label: 'Mã SKU' },
          { key: 'unit', label: 'Đơn vị' },
          { key: 'qty', label: 'Số lượng', align: 'right' },
          { key: 'unitPrice', label: 'Đơn giá', align: 'right', render: (it) => formatCurrency(it.unitPrice as number) },
          { key: 'total', label: 'Thành tiền', align: 'right', render: (it) => formatCurrency(((it.qty as number) || 0) * ((it.unitPrice as number) || 0)) },
        ]}
      />
    </div>
  );
}
