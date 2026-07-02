import { useNavigate } from 'react-router-dom';
import {
  Activity, ChevronRight, ChevronLeft, Gift, ClipboardList,
} from 'lucide-react';

import { departments, type DepartmentSubItem } from '../constants/departments';
import DepartmentCard from '../components/layout/DepartmentCard';
import TopSalesTable from '../components/dashboard/TopSalesTable';
import { getSessionUser } from '../constants/systemUsers';
import { useBirthdayCalendar } from '../hooks/dashboard/useBirthdayCalendar';
import { useTopSalesRows } from '../hooks/dashboard/useTopSalesRows';
import { WEEKDAY_LABELS, PENDING_TASKS } from '../hooks/dashboard/calendarConstants';
import { showToast } from '../components/ui/Toast';
import { UI_COMING_SOON } from '../lib/uiMessages';
import { formatDate } from '../utils/formatDate';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { topProducts, topMaterials } = useTopSalesRows();
  const {
    now,
    viewYear,
    viewMonth,
    today,
    isViewingCurrentMonth,
    selectedDay,
    setSelectedDay,
    shiftMonth,
    birthdaysByDay,
    calendarCells,
    birthdayStats,
    monthLabel,
  } = useBirthdayCalendar();

  const sessionUser = getSessionUser();
  const displayName = sessionUser?.name?.split(' ').slice(-1)[0] ?? 'bạn';

  const handleItemClick = (item: DepartmentSubItem, deptTitle: string) => {
    if (item.path) {
      navigate(item.path);
    } else {
      showToast('info', UI_COMING_SOON.module(item.label, deptTitle), UI_COMING_SOON.title);
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
              Sinh nhật {monthLabel}
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
                {monthLabel} {viewYear}
              </span>
              <div className="portal-calendar-nav__actions">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="portal-calendar-nav__btn"
                  aria-label="Tháng trước"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
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
                  const isToday = cell.isCurrentMonth && cell.day === today && isViewingCurrentMonth;
                  const hasBirthday = cell.isCurrentMonth && Boolean(birthdaysByDay[cell.day]);
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
                  Ngày {formatDate(new Date(viewYear, viewMonth, selectedDay))}
                </h4>
                {birthdaysByDay[selectedDay] ? (
                  <ul className="portal-calendar-detail__list">
                    {birthdaysByDay[selectedDay].map((person) => (
                      <li key={person.name} className="portal-calendar-detail__item">
                        <span className="portal-calendar-detail__dot" aria-hidden />
                        <span className="text-pretty">
                          <strong>{person.name}</strong>
                          {person.department && (
                            <span className="portal-calendar-detail__role">({person.department})</span>
                          )}
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
