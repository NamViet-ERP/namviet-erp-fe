import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Activity, Wrench, ChevronRight,
  ChevronLeft, Gift, Settings, ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { showToast } from '../components/ui/Toast';
import { departments, type DepartmentSubItem } from '../constants/departments';
import DepartmentCard from '../components/layout/DepartmentCard';
import { getSessionUser } from '../constants/systemUsers';

// ── Mock Birthdays Data ──
interface BirthdayEvent {
  name: string;
  role: 'Nhân viên' | 'Khách hàng';
}

const birthdaysData: Record<number, BirthdayEvent[]> = {
  9: [
    { name: 'Nguyễn Hoàng Nam', role: 'Nhân viên' },
    { name: 'Công ty TNHH Mayzer Việt Nam', role: 'Khách hàng' },
  ],
  15: [{ name: 'Trần Bích Thủy', role: 'Nhân viên' }],
  18: [{ name: 'Phạm Văn Tuấn', role: 'Nhân viên' }],
  22: [
    { name: 'Lê Minh Đức', role: 'Nhân viên' },
    { name: 'Đoàn Quốc Bảo', role: 'Khách hàng' },
  ],
  29: [{ name: 'Phan Thanh Hải', role: 'Nhân viên' }],
};

interface TopRow {
  imageIcon: LucideIcon;
  code: string;
  name: string;
  qty: number;
}

const topProducts: TopRow[] = [
  { imageIcon: Wrench, code: '2102205001', name: 'Bảo trì máy, thay vật tư, kiểm tra tổng thể, vệ sinh máy', qty: 57 },
  { imageIcon: Settings, code: 'LD-ONG', name: 'Lắp đặt đường ống cụm máy', qty: 14 },
  { imageIcon: Activity, code: 'KPF50-T', name: 'Bộ lọc thô King Power', qty: 5 },
  { imageIcon: Activity, code: 'KPF50-A', name: 'Bộ lọc tinh King Power', qty: 5 },
  { imageIcon: Package, code: 'MZ1000-8', name: 'Bình chứa khí nén', qty: 5 },
];

const topMaterials: TopRow[] = [
  { imageIcon: Activity, code: '101615004', name: 'King Power Air Compressor Oil (18L)', qty: 63 },
  { imageIcon: Settings, code: '2101602002', name: 'King Power oil filter', qty: 48 },
  { imageIcon: Activity, code: '2101605005', name: 'Motor grease GSR NO.2', qty: 19 },
  { imageIcon: Activity, code: '2101705001', name: 'King Power air filter', qty: 19 },
  { imageIcon: Settings, code: '2101610002', name: 'King Power oil filter', qty: 18 },
];

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;
const MONTH_NAMES = [
  'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
  'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12',
] as const;

interface CalendarCell {
  day: number;
  isCurrentMonth: boolean;
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, isCurrentMonth: true });
  }
  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextMonthDay, isCurrentMonth: false });
    nextMonthDay += 1;
  }
  return cells;
}

function countMonthBirthdays(data: Record<number, BirthdayEvent[]>) {
  let employees = 0;
  let customers = 0;
  Object.values(data).forEach((events) => {
    events.forEach((event) => {
      if (event.role === 'Nhân viên') employees += 1;
      else customers += 1;
    });
  });
  return { employees, customers };
}

interface TopSalesTableProps {
  title: string;
  rows: TopRow[];
  codeLabel?: string;
}

function TopSalesTable({ title, rows, codeLabel = 'Mã thành phẩm' }: TopSalesTableProps) {
  return (
    <section className="bg-[var(--md-surface-container)] rounded-2xl border border-[var(--md-outline-variant02)] shadow-sm overflow-hidden">
      <header className="bg-[var(--nv-table-header-bg)] text-[var(--nv-table-header-text)] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-balance leading-snug">{title}</h3>
      </header>
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)]">
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)] w-10 text-center">#</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)] w-16 text-center">Ảnh</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)] w-[108px]">{codeLabel}</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)]">Tên</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)] w-20 text-right">SL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const RowIcon = row.imageIcon;
              return (
                <tr
                  key={row.code}
                  className="border-b border-[var(--md-outline-variant)] last:border-b-0 hover:bg-[var(--nv-surface-hover)] transition-colors duration-150"
                >
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--md-primary-container)] text-[11px] font-bold text-[var(--md-primary)] tabular-nums">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="size-8 rounded-xl mx-auto flex items-center justify-center bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)]">
                      <RowIcon size={14} className="text-[var(--md-secondary)]" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-[var(--md-on-surface)] tabular-nums">{row.code}</td>
                  <td className="px-3 py-2.5 text-[12px] text-[var(--md-on-surface)] font-medium leading-snug">
                    <span className="line-clamp-2 text-pretty" title={row.name}>{row.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-bold text-[var(--md-primary)] text-right tabular-nums pr-4">{row.qty}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const PENDING_TASKS = 0;

export default function DashboardPage() {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const viewYear = now.getFullYear();
  const viewMonth = now.getMonth();
  const today = now.getDate();

  const [selectedDay, setSelectedDay] = useState<number>(today);

  const calendarCells = useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const birthdayStats = useMemo(() => countMonthBirthdays(birthdaysData), []);
  const sessionUser = getSessionUser();
  const displayName = sessionUser?.name?.split(' ').slice(-1)[0] ?? 'bạn';

  const handleItemClick = (item: DepartmentSubItem, deptTitle: string) => {
    if (item.path) {
      navigate(item.path);
    } else {
      showToast('info', `Phân hệ "${item.label}" thuộc bộ phận "${deptTitle}" đang được phát triển.`, 'Chức năng giả lập');
    }
  };

  const openTasks = () => {
    showToast(
      'info',
      PENDING_TASKS === 0
        ? 'Bạn không có công việc nào chưa hoàn thiện.'
        : `Bạn có ${PENDING_TASKS} công việc chưa hoàn thiện.`,
      'Công việc',
    );
  };

  return (
    <div className="relative flex flex-col gap-6 animate-fade-in pb-6">
      {/* ── Greeting strip ── */}
      <header className="flex flex-wrap items-end justify-between gap-3 relative z-10">
        <div>
          <h1 className="text-xl font-bold text-[var(--md-on-surface)] text-balance leading-tight">
            Xin chào, {displayName}
          </h1>
          <p className="mt-1 text-sm text-[var(--md-on-surface-variant)] text-pretty">
            Chọn phân hệ để bắt đầu hoặc xem tổng quan bán hàng tháng này.
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)] shrink-0">
          <Activity size={13} className="text-[var(--md-secondary)]" aria-hidden />
          Cập nhật {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </header>

      {/* ── Main layout: modules + sidebar widgets ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.title}
              dept={dept}
              onItemClick={(item) => handleItemClick(item, dept.title)}
            />
          ))}
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-[calc(64px+20px)] xl:self-start">
          {/* Pending tasks */}
          <button
            type="button"
            className={`rounded-2xl p-4 flex items-center justify-between text-left transition-[transform,background-color,border-color] duration-150 ease-out hover:scale-[1.01] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)] ${
              PENDING_TASKS > 0
                ? 'bg-[var(--md-secondary)] text-white shadow-sm'
                : 'bg-[var(--md-surface-container)] border border-[var(--md-outline-variant02)] text-[var(--md-on-surface)]'
            }`}
            onClick={openTasks}
            aria-label={`${PENDING_TASKS} công việc chưa hoàn thiện`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`size-10 shrink-0 flex items-center justify-center rounded-xl ${
                  PENDING_TASKS > 0 ? 'bg-white/15' : 'bg-[var(--md-secondary-container)]'
                }`}
              >
                <ClipboardList
                  size={18}
                  className={PENDING_TASKS > 0 ? 'text-white' : 'text-[var(--md-secondary)]'}
                />
              </div>
              <div className="leading-tight">
                <p className={`text-2xl font-bold tabular-nums ${PENDING_TASKS > 0 ? 'text-white' : 'text-[var(--md-primary)]'}`}>
                  {PENDING_TASKS}
                </p>
                <p className={`text-[13px] font-medium ${PENDING_TASKS > 0 ? 'text-white/90' : 'text-[var(--md-on-surface-variant)]'}`}>
                  Công việc chưa hoàn thiện
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className={PENDING_TASKS > 0 ? 'text-white/80' : 'text-[var(--md-on-surface-variant)]'}
            />
          </button>

          {/* Birthday summary */}
          <div className="bg-[var(--md-surface-container)] rounded-2xl border border-[var(--md-outline-variant02)] p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-bold text-[var(--md-primary)] flex items-center gap-1.5 text-balance">
                <Gift size={15} className="text-[var(--md-secondary)] shrink-0" aria-hidden />
                Sinh nhật {MONTH_NAMES[viewMonth]}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[var(--md-surface-container-high)] px-3 py-2 border border-[var(--md-outline-variant)]">
                <p className="text-[11px] text-[var(--md-on-surface-variant)]">Nhân viên</p>
                <p className="text-lg font-bold text-[var(--md-secondary)] tabular-nums">{birthdayStats.employees}</p>
              </div>
              <div className="rounded-xl bg-[var(--md-surface-container-high)] px-3 py-2 border border-[var(--md-outline-variant)]">
                <p className="text-[11px] text-[var(--md-on-surface-variant)]">Khách hàng</p>
                <p className="text-lg font-bold text-[var(--md-primary)] tabular-nums">{birthdayStats.customers}</p>
              </div>
            </div>
            <p className="text-xs text-center text-[var(--md-on-surface-variant)] text-pretty">
              Chúc mừng sinh nhật các thành viên trong tháng!
            </p>
          </div>
        </aside>
      </div>

      {/* ── Tables + calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 relative z-10">
        <div className="lg:col-span-3 flex flex-col gap-5">
          <TopSalesTable
            title="Top 5 sản phẩm bán chạy trong tháng"
            rows={topProducts}
          />
          <TopSalesTable
            title="Top 5 công cụ vật tư bán chạy trong tháng"
            rows={topMaterials}
            codeLabel="Mã vật tư"
          />
        </div>

        <div className="lg:col-span-2">
          <section className="bg-[var(--md-surface-container)] rounded-2xl border border-[var(--md-outline-variant02)] shadow-sm overflow-hidden h-full flex flex-col">
            <header className="bg-[var(--nv-table-header-bg)] text-[var(--nv-table-header-text)] px-4 py-2.5">
              <h3 className="text-[13px] font-semibold text-balance">Lịch sinh nhật nhân viên</h3>
            </header>

            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)]">
              <span className="text-sm font-semibold text-[var(--md-on-surface)] capitalize">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => showToast('info', 'Lịch hiển thị tháng hiện tại.', 'Thông báo')}
                  className="size-7 flex items-center justify-center hover:bg-[var(--md-surface-container)] rounded-lg border border-transparent hover:border-[var(--md-outline-variant)] transition-colors duration-150"
                  aria-label="Tháng trước"
                >
                  <ChevronLeft size={14} className="text-[var(--md-on-surface)]" />
                </button>
                <button
                  type="button"
                  onClick={() => showToast('info', 'Lịch hiển thị tháng hiện tại.', 'Thông báo')}
                  className="size-7 flex items-center justify-center hover:bg-[var(--md-surface-container)] rounded-lg border border-transparent hover:border-[var(--md-outline-variant)] transition-colors duration-150"
                  aria-label="Tháng sau"
                >
                  <ChevronRight size={14} className="text-[var(--md-on-surface)]" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="grid grid-cols-7 text-center mb-2 text-[11px] font-semibold text-[var(--md-on-surface-variant)]">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label}>{label}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  const isToday = cell.isCurrentMonth && cell.day === today;
                  const hasBirthday = cell.isCurrentMonth && Boolean(birthdaysData[cell.day]);
                  const isSelected = cell.isCurrentMonth && selectedDay === cell.day;

                  return (
                    <button
                      key={`${cell.isCurrentMonth ? 'in' : 'out'}-${cell.day}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (cell.isCurrentMonth) setSelectedDay(cell.day);
                      }}
                      disabled={!cell.isCurrentMonth}
                      className={`relative aspect-square flex items-center justify-center rounded-full text-xs font-semibold border-none transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)] ${
                        !cell.isCurrentMonth
                          ? 'text-[var(--md-outline)] cursor-default'
                          : 'text-[var(--md-on-surface)] hover:bg-[var(--nv-sidebar-item-hover)] cursor-pointer'
                      } ${
                        isToday
                          ? 'bg-[var(--md-secondary)] text-white font-bold'
                          : isSelected
                            ? 'bg-[var(--md-secondary-container)] text-[var(--md-secondary)]'
                            : ''
                      }`}
                      style={{ outlineOffset: '-1px' }}
                      aria-label={
                        cell.isCurrentMonth
                          ? `Ngày ${cell.day}${hasBirthday ? ', có sinh nhật' : ''}${isToday ? ', hôm nay' : ''}`
                          : undefined
                      }
                      aria-pressed={cell.isCurrentMonth ? isSelected : undefined}
                    >
                      <span className="tabular-nums">{cell.day}</span>
                      {hasBirthday && (
                        <span
                          className={`absolute bottom-1 size-1.5 rounded-full ${
                            isToday ? 'bg-white' : 'bg-[var(--chart-5)]'
                          }`}
                          aria-hidden
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] rounded-xl">
                <h4 className="text-xs font-semibold text-[var(--md-primary)] mb-2 flex items-center gap-1.5">
                  <Gift size={12} className="text-[var(--md-secondary)]" aria-hidden />
                  Ngày {selectedDay}/{String(viewMonth + 1).padStart(2, '0')}/{viewYear}
                </h4>
                {birthdaysData[selectedDay] ? (
                  <ul className="flex flex-col gap-1.5">
                    {birthdaysData[selectedDay].map((person) => (
                      <li
                        key={person.name}
                        className="text-[12px] text-[var(--md-on-surface)] font-medium flex items-start gap-2"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--chart-5)]" aria-hidden />
                        <span className="text-pretty">
                          <strong>{person.name}</strong>
                          <span className="text-[var(--md-on-surface-variant)] text-[11px] ml-1">({person.role})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-[var(--md-on-surface-variant)] text-pretty">
                    Không có sinh nhật trong ngày này.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
