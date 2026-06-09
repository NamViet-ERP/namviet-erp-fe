import { useState } from 'react';
import { Filter, DollarSign, Calendar, Clock, Star, Plus, PhoneCall, Sliders } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import PageHeader from '../../components/ui/PageHeader';
import TabFilter from '../../components/ui/TabFilter';
import { showToast } from '../../components/ui/Toast';

type TabId = 'steel' | 'cement' | 'cable';

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

  // Sliders for dynamic recommendations
  const [priceWeight, setPriceWeight] = useState(40);
  const [creditWeight, setCreditWeight] = useState(30);
  const [leadTimeWeight, setLeadTimeWeight] = useState(30);

  const tabs = [
    { id: 'steel', label: 'Thép xây dựng' },
    { id: 'cement', label: 'Xi măng bao' },
    { id: 'cable', label: 'Cáp điện lực' },
  ];

  const rawSuppliers = suppliersData[activeTab] || [];

  // Dynamically calculate score and sort suppliers
  const scoredSuppliers = (() => {
    if (rawSuppliers.length === 0) return [];

    // Find min and max values for normalization
    const prices = rawSuppliers.map(s => s.price);
    const credits = rawSuppliers.map(s => s.credit);
    const leadTimes = rawSuppliers.map(s => s.leadTime);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minCredit = Math.min(...credits);
    const maxCredit = Math.max(...credits);
    const minLead = Math.min(...leadTimes);
    const maxLead = Math.max(...leadTimes);

    return rawSuppliers.map(s => {
      // Normalization: lower price is better, higher credit is better, lower lead time is better
      const priceScore = maxPrice === minPrice ? 1.0 : (maxPrice - s.price) / (maxPrice - minPrice);
      const creditScore = maxCredit === minCredit ? 1.0 : (s.credit - minCredit) / (maxCredit - minCredit);
      const leadTimeScore = maxLead === minLead ? 1.0 : (maxLead - s.leadTime) / (maxLead - minLead);

      const totalWeight = priceWeight + creditWeight + leadTimeWeight;
      const score = totalWeight === 0 ? 0 : (
        (priceWeight * priceScore) +
        (creditWeight * creditScore) +
        (leadTimeWeight * leadTimeScore)
      ) / totalWeight;

      return {
        ...s,
        score: Math.round(score * 100)
      };
    }).sort((a, b) => b.score - a.score); // Sort by suitability score descending
  })();

  const handleContact = (supplierName: string) => {
    showToast('success', `Đã gửi yêu cầu báo giá tới ${supplierName}`, 'Gửi liên hệ thành công');
  };

  const handleCreateSupplier = () => {
    showToast('info', 'Chức năng thêm nhà cung cấp mới đang được cập nhật.', 'Thêm nhà cung cấp');
  };

  const getCategoryLabel = (id: TabId) => {
    switch (id) {
      case 'steel': return 'Thép xây dựng (đ/kg)';
      case 'cement': return 'Xi măng bao (đ/bao)';
      case 'cable': return 'Cáp điện lực (đ/mét)';
      default: return '';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="ĐỐI TÁC CUNG ỨNG"
        title="ĐỀ XUẤT NHÀ CUNG CẤP TỐI ƯU"
        actions={<>
          <button className="btn btn-outline text-xs"><Filter size={14} /> BỘ LỌC TỐI ƯU</button>
          <button className="btn btn-filled" onClick={handleCreateSupplier}><Plus size={16} /> THÊM MỚI</button>
        </>}
      />

      <TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Sliders & Price Trend Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Sliders Box */}
          <div className="rounded-2xl p-5 shadow-card space-y-4"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h3 className="font-bold text-[var(--md-on-surface)] text-xs tracking-wider uppercase flex items-center gap-1.5">
              <Sliders size={15} /> THIẾT LẬP MỨC ĐỘ ƯU TIÊN SCM ĐẶT HÀNG
            </h3>
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">
              Kéo các thanh trượt dưới đây để điều chỉnh trọng số ưu tiên của phòng Mua hàng. Hệ thống sẽ tự động chấm điểm và đề xuất nhà cung cấp phù hợp nhất cho dự án.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Slider 1: Price */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--md-on-surface)]">Ưu tiên Giá rẻ:</span>
                  <span className="text-[var(--md-primary)] font-bold">{priceWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priceWeight}
                  onChange={(e) => setPriceWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--md-primary)]"
                />
              </div>

              {/* Slider 2: Credit Terms */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--md-on-surface)]">Ưu tiên Công nợ (Credit):</span>
                  <span className="text-[var(--md-primary)] font-bold">{creditWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={creditWeight}
                  onChange={(e) => setCreditWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--md-primary)]"
                />
              </div>

              {/* Slider 3: Lead Time */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--md-on-surface)]">Ưu tiên Giao hàng nhanh:</span>
                  <span className="text-[var(--md-primary)] font-bold">{leadTimeWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={leadTimeWeight}
                  onChange={(e) => setLeadTimeWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--md-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl p-5 shadow-card flex flex-col h-[320px]"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--md-on-surface)] text-xs tracking-wide uppercase">Lịch sử biến động giá cả</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">
                {getCategoryLabel(activeTab)}
              </span>
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistoryData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--md-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--md-primary)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant)" opacity={0.4} />
                  <XAxis dataKey="month" stroke="var(--md-on-surface-variant)" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <YAxis stroke="var(--md-on-surface-variant)" style={{ fontSize: '10px', fontFamily: 'monospace' }} tickFormatter={(v: number) => `${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--md-surface-container-high)', borderColor: 'var(--md-outline)', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: 'var(--md-on-surface)', fontWeight: 'bold' }}
                    formatter={(value) => [formatCurrency(Number(value || 0)) + ' đ', 'Giá bình quân']}
                  />
                  <Area type="monotone" dataKey={activeTab} stroke="var(--md-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Recommendations */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl p-5 shadow-card flex flex-col h-[525px]"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h3 className="font-bold text-[var(--md-on-surface)] text-xs tracking-wide uppercase mb-3">Xếp hạng nhà cung cấp đề xuất</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {scoredSuppliers.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border flex flex-col justify-between transition-all"
                  style={{ 
                    background: idx === 0 ? 'rgba(56,106,32,0.02)' : 'var(--md-surface-container-low)', 
                    borderColor: idx === 0 ? 'var(--md-success)' : 'var(--md-outline-variant)',
                    borderWidth: idx === 0 ? '2px' : '1px'
                  }}>
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-[var(--md-on-surface)] text-xs uppercase leading-tight line-clamp-2">{s.name}</h4>
                        {idx === 0 && (
                          <span className="inline-block text-[9px] font-bold bg-[var(--md-success-container)] text-[var(--md-on-success-container)] px-1.5 py-0.5 rounded mt-1">
                            GỢI Ý TỐT NHẤT (WMS SCM)
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${idx === 0 ? 'bg-[var(--md-success-container)] text-[var(--md-on-success-container)]' : 'bg-gray-100 text-gray-800'}`}>
                          {s.score}% Match
                        </span>
                        <span className="text-[8px] text-gray-500 mt-1 uppercase font-bold">{s.badge}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] text-[var(--md-on-surface-variant)] border-t border-[var(--md-outline-variant)] pt-3">
                      <div className="flex items-center gap-1">
                        <DollarSign size={12} className="text-[var(--md-primary)]" />
                        <div>Giá: <span className="font-bold text-[var(--md-on-surface)]">{formatCurrency(s.price)} đ</span></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <div>Rating: <span className="font-bold text-[var(--md-on-surface)]">{s.rating}</span></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-[var(--md-primary)]" />
                        <div>Công nợ: <span className="font-bold text-[var(--md-on-surface)]">{s.credit} ngày</span></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-[var(--md-primary)]" />
                        <div>Giao hàng: <span className="font-bold text-[var(--md-on-surface)]">{s.leadTime} ngày</span></div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleContact(s.name)}
                    className={`w-full btn text-xs mt-4 flex items-center justify-center gap-2 ${idx === 0 ? 'btn-filled' : 'btn-outline'}`}
                  >
                    <PhoneCall size={12} />
                    LIÊN HỆ ĐẶT HÀNG NGAY
                  </button>
                </div>
              ))}
              {scoredSuppliers.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-8">Không có nhà cung cấp đề xuất nào</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
