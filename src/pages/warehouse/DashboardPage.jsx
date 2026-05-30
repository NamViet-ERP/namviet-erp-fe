import { Package, DollarSign, Warehouse } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../../components/ui/Card';
import { warehouses } from '../../data/warehouses';
import { formatCurrency, formatCurrencyShort } from '../../utils/formatCurrency';

const totalStock = warehouses.reduce((sum, w) => sum + w.totalStock, 0);
const totalValue = warehouses.reduce((sum, w) => sum + w.totalValue, 0);
const totalWarehouses = warehouses.filter(w => w.status === 'active').length;

const stockByCategory = [
  { name: 'Máy nén khí trục vít', value: 420, color: '#3a6ea5' },
  { name: 'Máy nén khí piston', value: 280, color: '#2a8a8a' },
  { name: 'Bình chứa', value: 195, color: '#6a5aaa' },
  { name: 'Máy sấy khí', value: 110, color: '#b07825' },
  { name: 'Lọc khí', value: 340, color: '#b54a3a' },
  { name: 'Phụ kiện', value: 560, color: '#2a8a6a' },
];

const stockByWarehouse = warehouses
  .filter(w => w.group === 'Kho chính' || w.group === 'Kho phụ')
  .map((w, i) => ({
    name: w.branch, value: w.totalStock,
    color: ['#3a6ea5', '#2a8a8a', '#6a5aaa', '#b07825', '#b54a3a'][i % 5],
  }));

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#fff', border: '1px solid #e5e7ec', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p className="font-semibold" style={{ color: '#1a1e2e' }}>{payload[0].name}</p>
      <p style={{ color: '#555d75' }}>Số lượng: <span className="font-bold" style={{ color: '#1a1e2e' }}>{formatCurrency(payload[0].value)}</span></p>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-[20px] font-bold mb-5" style={{ color: '#1a1e2e', letterSpacing: '-0.01em' }}>
        Dashboard Kho hàng
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="Tổng Tồn Kho" value={formatCurrency(totalStock)} subtitle="sản phẩm trong tất cả kho" accent="amber" icon={Package} />
        <Card title="Tổng Giá Trị" value={formatCurrencyShort(totalValue)} subtitle="giá trị hàng tồn kho" accent="blue" icon={DollarSign} />
        <Card title="Tổng Kho" value={totalWarehouses} subtitle="kho đang hoạt động" accent="teal" icon={Warehouse} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #e8eaef' }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: '#1a1e2e' }}>Số lượng theo loại hàng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stockByCategory} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel}
                outerRadius={110} innerRadius={48} dataKey="value" animationDuration={600}>
                {stockByCategory.map((e, i) => <Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={7}
                formatter={(v) => <span className="text-[11px]" style={{ color: '#555d75' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #e8eaef' }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: '#1a1e2e' }}>Số lượng theo kho</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stockByWarehouse} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel}
                outerRadius={110} innerRadius={48} dataKey="value" animationBegin={100} animationDuration={600}>
                {stockByWarehouse.map((e, i) => <Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={7}
                formatter={(v) => <span className="text-[11px]" style={{ color: '#555d75' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
