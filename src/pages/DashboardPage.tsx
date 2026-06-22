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
    <section className="surface-panel surface-panel--table">
      <header className="surface-panel__header">
        <h3 className="surface-panel__header-title">{title}</h3>
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
                    <span className="portal-rank-table__rank">{index + 1}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="portal-rank-table__icon-wrap">
                      <RowIcon size={14} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-[var(--md-on-surface)] tabular-nums">{row.code}</td>
                  <td className="px-3 py-2.5 text-[12px] text-[var(--md-on-surface)] font-medium leading-snug">
                    <span className="line-clamp-2 text-pretty" title={row.name}>{row.name}</span>
                  </td>
                  <td className="px-3 py-2.5 portal-rank-table__qty">{row.qty}</td>
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
    <div className="page-shell page-shell--portal pb-6">
      {/* ── Greeting strip ── */}
      <header className="portal-greeting">
        <div>
          <h1 className="portal-greeting__title">
            Xin chào, {displayName}
          </h1>
          <p className="portal-greeting__sub">
            Chọn phân hệ để bắt đầu hoặc xem tổng quan bán hàng tháng này.
          </p>
        </div>
        <p className="portal-greeting__meta">
          <Activity size={13} className="portal-greeting__meta-icon" aria-hidden />
          Cập nhật {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </header>

      {/* ── Main layout: modules + sidebar widgets ── */}
      <div className="portal-layout">
        <div className="portal-modules">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.title}
              dept={dept}
              onItemClick={(item) => handleItemClick(item, dept.title)}
            />
          ))}
        </div>

        <aside className="portal-sidebar">
          <button
            type="button"
            className={`portal-pending-card${PENDING_TASKS > 0 ? ' portal-pending-card--active' : ''}`}
            onClick={openTasks}
            aria-label={`${PENDING_TASKS} công việc chưa hoàn thiện`}
          >
            <div className="portal-pending-card__body">
              <div className="portal-pending-card__icon-wrap">
                <ClipboardList size={18} />
              </div>
              <div className="leading-tight">
                <p className="portal-pending-card__count">{PENDING_TASKS}</p>
                <p className="portal-pending-card__label">Công việc chưa hoàn thiện</p>
              </div>
            </div>
            <ChevronRight size={16} className="portal-pending-card__chevron" />
          </button>

          <div className="portal-birthday-card">
            <h2 className="portal-birthday-card__title">
              <Gift size={15} className="portal-birthday-card__title-icon" aria-hidden />
              Sinh nhật {MONTH_NAMES[viewMonth]}
            </h2>
            <div className="portal-birthday-stat-grid">
              <div className="portal-birthday-stat">
                <p className="portal-birthday-stat__label">Nhân viên</p>
                <p className="portal-birthday-stat__value portal-birthday-stat__value--employees">{birthdayStats.employees}</p>
              </div>
              <div className="portal-birthday-stat">
                <p className="portal-birthday-stat__label">Khách hàng</p>
                <p className="portal-birthday-stat__value portal-birthday-stat__value--customers">{birthdayStats.customers}</p>
              </div>
            </div>
            <p className="portal-birthday-card__footer">
              Chúc mừng sinh nhật các thành viên trong tháng!
            </p>
          </div>
        </aside>
      </div>

      {/* ── Tables + calendar ── */}
      <div className="portal-content-grid">
        <div className="portal-content-main">
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

        <div>
          <section className="surface-panel surface-panel--table h-full flex flex-col">
            <header className="surface-panel__header">
              <h3 className="surface-panel__header-title">Lịch sinh nhật nhân viên</h3>
            </header>

            <div className="portal-calendar-nav">
              <span className="portal-calendar-nav__month">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="portal-calendar-nav__actions">
                <button
                  type="button"
                  onClick={() => showToast('info', 'Lịch hiển thị tháng hiện tại.', 'Thông báo')}
                  className="portal-calendar-nav__btn"
                  aria-label="Tháng trước"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => showToast('info', 'Lịch hiển thị tháng hiện tại.', 'Thông báo')}
                  className="portal-calendar-nav__btn"
                  aria-label="Tháng sau"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="portal-calendar-body">
              <div className="portal-calendar-weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label}>{label}</div>
                ))}
              </div>

              <div className="portal-calendar-grid">
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
                      className={[
                        'portal-calendar-day',
                        !cell.isCurrentMonth && 'portal-calendar-day--muted',
                        isToday && 'portal-calendar-day--today',
                        isSelected && !isToday && 'portal-calendar-day--selected',
                      ].filter(Boolean).join(' ')}
                      aria-label={
                        cell.isCurrentMonth
                          ? `Ngày ${cell.day}${hasBirthday ? ', có sinh nhật' : ''}${isToday ? ', hôm nay' : ''}`
                          : undefined
                      }
                      aria-pressed={cell.isCurrentMonth ? isSelected : undefined}
                    >
                      <span>{cell.day}</span>
                      {hasBirthday && (
                        <span className="portal-calendar-day__dot" aria-hidden />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="portal-calendar-detail">
                <h4 className="portal-calendar-detail__title">
                  <Gift size={12} aria-hidden />
                  Ngày {selectedDay}/{String(viewMonth + 1).padStart(2, '0')}/{viewYear}
                </h4>
                {birthdaysData[selectedDay] ? (
                  <ul className="portal-calendar-detail__list">
                    {birthdaysData[selectedDay].map((person) => (
                      <li key={person.name} className="portal-calendar-detail__item">
                        <span className="portal-calendar-detail__dot" aria-hidden />
                        <span className="text-pretty">
                          <strong>{person.name}</strong>
                          <span className="portal-calendar-detail__role">({person.role})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="portal-calendar-detail__empty">
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
