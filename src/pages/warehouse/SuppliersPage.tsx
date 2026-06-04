import { useState } from 'react';
import { Filter, DollarSign, Calendar, Clock, Star, Plus, PhoneCall } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import PageHeader from '../../components/ui/PageHeader';
import TabFilter from '../../components/ui/TabFilter';
import { showToast } from '../../components/ui/Toast';

type TabId = 'steel' | 'cement' | 'cable';

// Mock Price Trends History
interface PriceHistoryEntry {
  month: string;
  steel: number;
  cement: number;
  cable: number;
}

interface Supplier {
  name: string;
  price: number;
  credit: number;
  leadTime: number;
  rating: number;
  badge: string;
}

const priceHistoryData: PriceHistoryEntry[] = [
  { month: 'T1', steel: 14500, cement: 82000, cable: 21000 },
  { month: 'T2', steel: 14800, cement: 83000, cable: 21200 },
  { month: 'T3', steel: 15200, cement: 83500, cable: 21500 },
  { month: 'T4', steel: 15600, cement: 84000, cable: 22000 },
  { month: 'T5', steel: 16000, cement: 85500, cable: 22800 },
  { month: 'T6', steel: 16200, cement: 86000, cable: 23800 },
];

// Mock Supplier Data
const suppliersData: Record<TabId, Supplier[]> = {
  'steel': [
    { name: 'Công ty TNHH Thép Việt Nhật', price: 16200, credit: 60, leadTime: 3, rating: 4.8, badge: 'Ưu tiên công nợ' },
    { name: 'Tổng kho Thép Miền Bắc', price: 15800, credit: 30, leadTime: 5, rating: 4.5, badge: 'Giá rẻ nhất' },
    { name: 'Tập đoàn Hòa Phát Chi nhánh Nam Việt', price: 16500, credit: 15, leadTime: 1, rating: 4.9, badge: 'Giao hàng siêu tốc' },
  ],
  'cement': [
    { name: 'Công ty Xi măng Hoàng Long', price: 86000, credit: 45, leadTime: 2, rating: 4.6, badge: 'Đối tác lâu năm' },
    { name: 'Nhà phân phối Vật tư Minh Đức', price: 84000, credit: 15, leadTime: 4, rating: 4.3, badge: 'Giá rẻ nhất' },
    { name: 'Tổng công ty Xi măng VICEM', price: 88000, credit: 60, leadTime: 2, rating: 4.7, badge: 'Uy tín hàng đầu' },
  ],
  'cable': [
    { name: 'Nhà phân phối Cáp CADIVI', price: 23800, credit: 45, leadTime: 2, rating: 4.8, badge: 'Nhà máy trực tiếp' },
    { name: 'Điện Công nghiệp Lioa', price: 24200, credit: 90, leadTime: 4, rating: 4.6, badge: 'Gia hạn công nợ tối đa' },
    { name: 'Vật tư Cơ điện Thịnh Phát', price: 23500, credit: 30, leadTime: 3, rating: 4.4, badge: 'Giá ổn định' }
  ]
};

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('steel');

  const tabs = [
    { id: 'steel', label: 'Thép xây dựng' },
    { id: 'cement', label: 'Xi măng bao' },
    { id: 'cable', label: 'Cáp điện lực' },
  ];

  const suppliers = suppliersData[activeTab] || [];

  const handleContact = (supplierName: string) => {
    showToast('success', `Đã gửi yêu cầu báo giá tới ${supplierName}`, 'Gửi liên hệ thành công');
  };

  const handleCreateSupplier = () => {
    showToast('info', 'Chức năng thêm nhà cung cấp mới đang được cập nhật.', 'Thêm nhà cung cấp');
  };

  // Helper labels for the chart
  const getCategoryLabel = (id: TabId) => {
    switch (id) {
      case 'steel': return 'Thép xây dựng (đ/kg)';
      case 'cement': return 'Xi măng bao (đ/bao)';
      case 'cable': return 'Cáp điện lực (đ/mét)';
      default: return '';
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="ĐỐI TÁC CUNG ỨNG"
        title="QUẢN LÝ NHÀ CUNG CẤP & GIÁ VẬT TƯ"
        actions={<>
          <button className="btn btn-outline text-xs"><Filter size={14} /> BỘ LỌC TỐI ƯU</button>
          <button className="btn btn-filled" onClick={handleCreateSupplier}><Plus size={16} /> THÊM MỚI</button>
        </>}
      />

      <TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Price Trend Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-5 shadow-card flex flex-col h-[480px]"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--md-on-surface)] text-sm tracking-wide uppercase">Xu hướng biến động giá</h3>
                <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">Biểu đồ so sánh giá trị vật tư trung bình theo tháng (6 tháng gần nhất)</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">
                {getCategoryLabel(activeTab)}
              </span>
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--md-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--md-primary)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant)" opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--md-on-surface-variant)" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <YAxis stroke="var(--md-on-surface-variant)" style={{ fontSize: '11px', fontFamily: 'monospace' }} tickFormatter={(v: number) => `${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--md-surface-container-high)', borderColor: 'var(--md-outline)', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: 'var(--md-on-surface)', fontWeight: 'bold' }}
                    formatter={(value, _name) => [formatCurrency(Number(value || 0)) + ' đ', 'Đơn giá trung bình']}
                  />
                  <Area type="monotone" dataKey={activeTab} stroke="var(--md-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Suppliers Directory */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl p-5 shadow-card flex flex-col h-[480px]"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h3 className="font-bold text-[var(--md-on-surface)] text-sm tracking-wide uppercase mb-3">Nhà cung cấp đề xuất</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {suppliers.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border flex flex-col justify-between"
                  style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)' }}>
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-[var(--md-on-surface)] text-xs uppercase leading-tight line-clamp-2">{s.name}</h4>
                      <span className="badge badge-exported text-[10px] font-bold flex-shrink-0">
                        {s.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] text-[var(--md-on-surface-variant)] border-t border-[var(--md-outline-variant)] pt-3">
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={13} className="text-[var(--md-primary)]" />
                        <div>Giá: <span className="font-bold text-[var(--md-on-surface)]">{formatCurrency(s.price)} đ</span></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star size={13} className="text-amber-500 fill-amber-500" />
                        <div>Đánh giá: <span className="font-bold text-[var(--md-on-surface)]">{s.rating}</span></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-[var(--md-primary)]" />
                        <div>Công nợ: <span className="font-bold text-[var(--md-on-surface)]">{s.credit} ngày</span></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[var(--md-primary)]" />
                        <div>Giao hàng: <span className="font-bold text-[var(--md-on-surface)]">{s.leadTime} ngày</span></div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleContact(s.name)}
                    className="w-full btn btn-outline text-xs mt-4 flex items-center justify-center gap-2"
                  >
                    <PhoneCall size={12} />
                    LIÊN HỆ BÁO GIÁ NHANH
                  </button>
                </div>
              ))}
              {suppliers.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-8">Không có nhà cung cấp đề xuất nào</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
