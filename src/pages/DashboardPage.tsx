import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Activity, Wrench, ChevronRight,
  ChevronLeft, Gift, Settings,
} from 'lucide-react';

import { showToast } from '../components/ui/Toast';
import { departments, type DepartmentSubItem } from '../constants/departments';
import DepartmentCard from '../components/layout/DepartmentCard';

// ── Design Tokens ──
/*
const tokens = {
  text: {
    primary: 'var(--md-on-surface-variant)',
    secondary: 'var(--md-on-surface)',
    tertiary: 'var(--md-secondary)',
  },
  surface: {
    muted: 'var(--md-surface-container)',
    base: 'var(--md-surface)',
    raised: 'var(--md-surface-container-low)',
    strong: 'var(--md-secondary-container)',
  },
  border: {
    strong: 'var(--md-outline-variant)',
  },
  space: {
    1: '4px',
    2: '5px',
    3: '6px',
    4: '8px',
    5: '12px',
    6: '15px',
    7: '20px',
  },
  radius: {
    xs: '3px',
    sm: '4px',
  },
  motion: {
    duration: {
      instant: '150ms',
      fast: '200ms',
    }
  }
};
*/

// ── Mock Birthdays Data ──
interface BirthdayEvent {
  name: string;
  role: 'Nhân viên' | 'Khách hàng';
}

const birthdaysData: Record<number, BirthdayEvent[]> = {
  9: [
    { name: 'Nguyễn Hoàng Nam', role: 'Nhân viên' },
    { name: 'Công ty TNHH Mayzer Việt Nam', role: 'Khách hàng' }
  ],
  15: [
    { name: 'Trần Bích Thủy', role: 'Nhân viên' }
  ],
  22: [
    { name: 'Lê Minh Đức', role: 'Nhân viên' },
    { name: 'Đoàn Quốc Bảo', role: 'Khách hàng' }
  ],
  29: [
    { name: 'Phan Thanh Hải', role: 'Nhân viên' }
  ]
};

// ── Top Products & Materials Data ──
const topProducts = [
  { imageIcon: Wrench, code: '2102205001', name: 'Bảo trì máy, thay vật tư, kiểm tra tổng thể, vệ sinh máy', qty: 57 },
  { imageIcon: Settings, code: 'LD-ONG', name: 'Lắp đặt đường ống cụm máy', qty: 14 },
  { imageIcon: Activity, code: 'KPF50-T', name: 'Bộ lọc thô King Power', qty: 5 },
  { imageIcon: Activity, code: 'KPF50-A', name: 'Bộ lọc tinh King Power', qty: 5 },
  { imageIcon: Package, code: 'MZ1000-8', name: 'Bình chứa khí nén', qty: 5 },
];

const topMaterials = [
  { imageIcon: Activity, code: '101615004', name: 'King Power Air Compressor Oil (18L)', qty: 63 },
  { imageIcon: Settings, code: '2101602002', name: 'King Power oil filter', qty: 48 },
  { imageIcon: Activity, code: '2101605005', name: 'Motor grease GSR NO.2', qty: 19 },
  { imageIcon: Activity, code: '2101705001', name: 'King Power air filter', qty: 19 },
  { imageIcon: Settings, code: '2101610002', name: 'King Power oil filter', qty: 18 },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<number>(9); // Default today (June 9)

  const handleItemClick = (item: DepartmentSubItem, deptTitle: string) => {
    if (item.path) {
      navigate(item.path);
    } else {
      showToast('info', `Phân hệ "${item.label}" thuộc bộ phận "${deptTitle}" đang được phát triển.`, 'Chức năng giả lập');
    }
  };

  // ── Render Birthday Cake SVG ──
  const renderCake = () => (
    <svg width="100" height="100" viewBox="0 0 120 120" className="mx-auto block" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.06))' }}>
      {/* Stand */}
      <path d="M20,95 L100,95 A3,3 0 0,1 100,98 L20,98 A3,3 0 0,1 20,95 Z" fill="var(--md-outline)" />
      <path d="M48,98 L72,98 L68,106 L52,106 Z" fill="var(--md-outline-variant)" />
      
      {/* Bottom tier */}
      <rect x="25" y="65" width="70" height="30" rx="4" fill="var(--md-primary)" opacity="0.85" />
      <path d="M25,75 Q60,82 95,75" fill="none" stroke="var(--md-primary-container)" strokeWidth="2" />
      <circle cx="35" cy="73" r="2.5" fill="var(--chart-6)" />
      <circle cx="48" cy="73" r="2.5" fill="var(--chart-4)" />
      <circle cx="60" cy="73" r="2.5" fill="var(--chart-3)" />
      <circle cx="72" cy="73" r="2.5" fill="var(--chart-6)" />
      <circle cx="85" cy="73" r="2.5" fill="var(--chart-4)" />

      {/* Top tier */}
      <rect x="35" y="42" width="50" height="23" rx="4" fill="var(--md-secondary)" />
      <path d="M35,49 Q60,55 85,49" fill="none" stroke="var(--md-secondary-container)" strokeWidth="2" />
      <circle cx="43" cy="47" r="2" fill="var(--chart-4)" />
      <circle cx="51" cy="47" r="2" fill="var(--chart-6)" />
      <circle cx="60" cy="47" r="2" fill="var(--chart-3)" />
      <circle cx="69" cy="47" r="2" fill="var(--chart-4)" />
      <circle cx="77" cy="47" r="2" fill="var(--chart-6)" />

      {/* Candles */}
      <rect x="44" y="28" width="2" height="14" fill="var(--chart-4)" />
      <path d="M45,23 C46,25 45,28 45,28 C44,28 43,25 45,23 Z" fill="var(--chart-6)" className="animate-pulse" />

      <rect x="59" y="24" width="2" height="18" fill="var(--chart-5)" />
      <path d="M60,18 C61,21 60,24 60,24 C59,24 58,21 60,18 Z" fill="var(--chart-4)" className="animate-pulse" />

      <rect x="74" y="28" width="2" height="14" fill="var(--chart-4)" />
      <path d="M75,23 C76,25 75,28 75,28 C74,28 73,25 75,23 Z" fill="var(--chart-6)" className="animate-pulse" />

      <ellipse cx="60" cy="42" rx="4" ry="2" fill="var(--md-surface-container-high)" />
      <circle cx="60" cy="40" r="1.5" fill="var(--chart-6)" />
    </svg>
  );

  // ── June 2026 Calendar Grid Generation ──
  // Column 1 is Sunday.
  // Row 1 starts Sunday May 31.
  const calendarCells = [
    { day: 31, isCurrentMonth: false }, // Sunday May 31
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true }, // Today
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 1, isCurrentMonth: false }, // July 1
    { day: 2, isCurrentMonth: false },
    { day: 3, isCurrentMonth: false },
    { day: 4, isCurrentMonth: false },
  ];

  return (
    <div className="relative flex flex-col gap-5 animate-fade-in pb-10">
      
      {/* ── Page Header ── */}
      <div className="flex items-end justify-between relative z-10">
        <div className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)]">
          <Activity size={13} className="text-[var(--md-primary)]" />
          Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* ── Grid Row 1: Functional Department cards (6 columns) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 relative z-10">
        
        {/* Columns 1-5: department cards grouped to balance the 6-col layout */}
        {([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] as const).map(([start, end]) => (
          <div key={start} className="flex flex-col gap-3">
            {departments.slice(start, end).map((dept) => (
              <DepartmentCard
                key={dept.title}
                dept={dept}
                onItemClick={(item) => handleItemClick(item, dept.title)}
              />
            ))}
          </div>
        ))}

        {/* Column 6: Right Side Cards */}
        <div className="flex flex-col gap-3">
          {/* Card 1: Pending tasks */}
          <div 
            className="rounded-lg p-3 text-white flex items-center justify-between cursor-pointer transition-transform duration-150 hover:scale-[1.02] shadow-sm select-none focus-visible:ring focus-visible:ring-[var(--md-secondary)]"
            style={{
              background: 'linear-gradient(135deg, var(--md-secondary), var(--md-primary))'
            }}
            tabIndex={0}
            onClick={() => showToast('info', 'Bạn không có công việc nào chưa hoàn thiện!', 'Công việc')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') showToast('info', 'Bạn không có công việc nào chưa hoàn thiện!', 'Công việc'); }}
            aria-label="0 công việc chưa hoàn thiện"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl font-extrabold tracking-tight">0</span>
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-white">Công việc</p>
                <p className="text-[11px] text-[var(--md-primary-container)] font-medium">chưa hoàn thiện</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-white opacity-80" />
          </div>

          {/* Card 2: Birthday Month */}
          <div className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] p-3 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-[13px] font-bold text-[var(--md-primary)] flex items-center gap-1.5">
                <Gift size={14} className="text-[var(--md-secondary)]" />
                Sinh nhật tháng 6
              </h4>
              <div className="flex items-center gap-3 mt-1.5 text-[11.5px] text-[var(--md-on-surface)] font-medium">
                <span>Nhân viên: <strong className="text-[var(--md-secondary)] font-bold">9</strong></span>
                <span className="h-3 w-[1px] bg-[var(--md-outline-variant)]" />
                <span>Khách hàng: <strong className="text-[var(--md-primary)] font-bold">3</strong></span>
              </div>
            </div>
            <div className="my-2">
              {renderCake()}
            </div>
            <p className="text-[11px] text-center text-[var(--md-on-surface-variant)] italic">
              Chúc mừng sinh nhật các thành viên tháng 6!
            </p>
          </div>
        </div>

      </div>

      {/* ── Grid Row 2: Tables & Interactive Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-1 relative z-10">
        
        {/* Left Columns (3/5 width): Top 5 Tables */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Table 1: Top 5 Products */}
          <div className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] shadow-sm overflow-hidden">
            <div className="bg-[var(--nv-table-header-bg)] text-[var(--nv-table-header-text)] px-3.5 py-2">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                TOP 5 SẢN PHẨM ĐƯỢC BÁN NHIỀU NHẤT TRONG THÁNG
              </h3>
            </div>
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)]">
                    <th className="p-2 text-[11px] font-bold text-[var(--md-on-surface-variant)] w-[70px] text-center">Hình ảnh</th>
                    <th className="p-2 text-[11px] font-bold text-[var(--md-on-surface-variant)] w-[110px]">Mã thành phẩm</th>
                    <th className="p-2 text-[11px] font-bold text-[var(--md-on-surface-variant)]">Tên thành phẩm</th>
                    <th className="p-2 text-[11px] font-bold text-[var(--md-on-surface-variant)] w-[80px] text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => {
                    const ProductIcon = p.imageIcon;
                    return (
                      <tr 
                        key={i} 
                        className="border-b border-[var(--md-outline-variant)] hover:bg-[var(--nv-surface-hover)] transition-colors duration-150"
                      >
                        <td className="p-2 text-center">
                          <div 
                            className="w-8 h-8 rounded-full mx-auto flex items-center justify-center bg-[var(--nv-sidebar-item-hover)]"
                          >
                            <ProductIcon size={14} className="text-[var(--md-primary)]" />
                          </div>
                        </td>
                        <td className="p-2 text-[12px] font-semibold text-[var(--md-on-surface)]">{p.code}</td>
                        <td className="p-2 text-[12px] text-[var(--md-on-surface)] font-medium leading-tight">{p.name}</td>
                        <td className="p-2 text-[12px] font-bold text-[var(--md-primary)] text-right pr-4">{p.qty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Top 5 Tools/Materials */}
          <div className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] shadow-sm overflow-hidden">
            <div className="bg-[var(--nv-table-header-bg)] text-[var(--nv-table-header-text)] px-3.5 py-2">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                TOP 5 CÔNG CỤ VẬT TƯ ĐƯỢC BÁN NHIỀU NHẤT TRONG THÁNG
              </h3>
            </div>
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)]">
                    <th className="p-2 text-[11px] font-bold text-[var(--md-on-surface-variant)] w-[70px] text-center">Hình ảnh</th>
                    <th className="p-2 text-[11px] font-bold text-[var(--md-on-surface-variant)] w-[110px]">Mã thành phẩm</th>
                    <th className="p-2 text-[11px] font-bold text-[var(--md-on-surface-variant)]">Tên thành phẩm</th>
                    <th className="p-2 text-[11px] font-bold text-[var(--md-on-surface-variant)] w-[80px] text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {topMaterials.map((m, i) => {
                    const MaterialIcon = m.imageIcon;
                    return (
                      <tr 
                        key={i} 
                        className="border-b border-[var(--md-outline-variant)] hover:bg-[var(--nv-surface-hover)] transition-colors duration-150"
                      >
                        <td className="p-2 text-center">
                          <div 
                            className="w-8 h-8 rounded-full mx-auto flex items-center justify-center bg-[var(--nv-sidebar-item-hover)]"
                          >
                            <MaterialIcon size={14} className="text-[var(--md-primary)]" />
                          </div>
                        </td>
                        <td className="p-2 text-[12px] font-semibold text-[var(--md-on-surface)]">{m.code}</td>
                        <td className="p-2 text-[12px] text-[var(--md-on-surface)] font-medium leading-tight">{m.name}</td>
                        <td className="p-2 text-[12px] font-bold text-[var(--md-primary)] text-right pr-4">{m.qty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (2/5 width): Calendar Card */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] shadow-sm overflow-hidden h-full flex flex-col">
            <div className="bg-[var(--nv-table-header-bg)] text-[var(--nv-table-header-text)] px-3.5 py-2">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                LỊCH SINH NHẬT NHÂN VIÊN
              </h3>
            </div>
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)]">
              <span className="text-[12.5px] font-bold text-[var(--md-on-surface)] uppercase">tháng 6 2026</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => showToast('info', 'Lịch được đặt cố định ở tháng 6/2026', 'Thông báo')}
                  className="p-1 hover:bg-[var(--md-surface-container)] rounded border border-transparent hover:border-[var(--md-outline-variant)] transition-colors"
                  aria-label="Tháng trước"
                >
                  <ChevronLeft size={14} className="text-[var(--md-on-surface)]" />
                </button>
                <button 
                  onClick={() => showToast('info', 'Lịch được đặt cố định ở tháng 6/2026', 'Thông báo')}
                  className="p-1 hover:bg-[var(--md-surface-container)] rounded border border-transparent hover:border-[var(--md-outline-variant)] transition-colors"
                  aria-label="Tháng sau"
                >
                  <ChevronRight size={14} className="text-[var(--md-on-surface)]" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                {/* Days of the week */}
                <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-bold text-[var(--md-on-surface-variant)]">
                  <div>CN</div>
                  <div>T2</div>
                  <div>T3</div>
                  <div>T4</div>
                  <div>T5</div>
                  <div>T6</div>
                  <div>T7</div>
                </div>

                {/* Days of the month */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, idx) => {
                    const isToday = cell.isCurrentMonth && cell.day === 9;
                    const hasBirthday = cell.isCurrentMonth && birthdaysData[cell.day];
                    const isSelected = cell.isCurrentMonth && selectedDay === cell.day;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (cell.isCurrentMonth) {
                            setSelectedDay(cell.day);
                          }
                        }}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-full text-xs font-semibold border-none cursor-pointer transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]
                          ${!cell.isCurrentMonth ? 'text-[var(--md-outline)] cursor-default' : 'text-[var(--md-on-surface)] hover:bg-[var(--nv-sidebar-item-hover)]'}
                          ${isToday ? 'bg-[var(--md-secondary-container)] text-[var(--md-secondary)]' : ''}
                          ${isSelected && !isToday ? 'bg-[var(--nv-sidebar-item-hover)]' : ''}
                        `}
                        disabled={!cell.isCurrentMonth}
                        style={{ outlineOffset: '-1px' }}
                      >
                        {/* Day number */}
                        <span className={isToday ? 'font-bold' : ''}>{cell.day}</span>
                        
                        {/* Birthday dot indicator */}
                        {hasBirthday && (
                          <span 
                            className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-[var(--md-secondary)]' : 'bg-[var(--chart-5)]'}`}
                            title="Có sinh nhật"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Birthday Details */}
              <div className="mt-4 p-3 bg-[var(--nv-sidebar-item-hover)] border border-[var(--md-outline-variant)] rounded-lg">
                <h4 className="text-[11.5px] font-bold text-[var(--md-primary)] mb-1.5 flex items-center gap-1.5">
                  <Gift size={12} className="text-[var(--md-secondary)]" />
                  Chi tiết sinh nhật ngày {selectedDay}/06/2026:
                </h4>
                {birthdaysData[selectedDay] ? (
                  <div className="flex flex-col gap-1">
                    {birthdaysData[selectedDay].map((b, i) => (
                      <div key={i} className="text-[12px] text-[var(--md-on-surface)] font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--chart-5)]" />
                        <strong>{b.name}</strong> 
                        <span className="text-[var(--md-on-surface-variant)] text-[11px]">({b.role})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-[var(--md-on-surface-variant)] italic">
                    Không có sinh nhật nào trong ngày này.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
