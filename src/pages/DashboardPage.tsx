import { useNavigate } from 'react-router-dom';
import {
  Activity, ChevronRight, Gift, ClipboardList,
} from 'lucide-react';

import { departments, type DepartmentSubItem } from '../constants/departments';
import DepartmentCard from '../components/layout/DepartmentCard';
import TopSalesTable from '../components/dashboard/TopSalesTable';
import PortalBirthdayCalendar from '../components/dashboard/PortalBirthdayCalendar';
import { getSessionUser, getSessionPermissions } from '../constants/systemUsers';
import { handlePermissionNavClick } from '../lib/protectedNavigation';
import { useBirthdayCalendar } from '../hooks/dashboard/useBirthdayCalendar';
import { useTopSalesRows } from '../hooks/dashboard/useTopSalesRows';
import { PENDING_TASKS } from '../hooks/dashboard/calendarConstants';
import { showToast } from '../components/ui/Toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const sessionPermissions = getSessionPermissions();
  const visibleDepartments = departments;
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
    goToday,
    birthdaysByDay,
    calendarCells,
    birthdayStats,
    monthLabel,
    isInitialLoading: birthdaysLoading,
    isFetching: birthdaysFetching,
    isError: birthdaysError,
  } = useBirthdayCalendar();

  const sessionUser = getSessionUser();
  const displayName = sessionUser?.name?.split(' ').slice(-1)[0] ?? 'bạn';

  const handleItemClick = (item: DepartmentSubItem, deptTitle: string) => {
    handlePermissionNavClick(sessionPermissions, item, navigate, { deptTitle });
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
    <div className="page-shell page-shell--portal portal-page pb-6">
      <div className="portal-ambient portal-ambient--tl" aria-hidden />
      <div className="portal-ambient portal-ambient--br" aria-hidden />

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
          {visibleDepartments.map((dept) => (
            <DepartmentCard
              key={dept.title}
              dept={dept}
              permissions={sessionPermissions}
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
            <div className="portal-birthday-stat">
              <p className="portal-birthday-stat__label">Nhân viên</p>
              <p className="portal-birthday-stat__value portal-birthday-stat__value--employees">{birthdayStats.employees}</p>
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

        <PortalBirthdayCalendar
          viewYear={viewYear}
          viewMonth={viewMonth}
          today={today}
          isViewingCurrentMonth={isViewingCurrentMonth}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          shiftMonth={shiftMonth}
          goToday={goToday}
          birthdaysByDay={birthdaysByDay}
          calendarCells={calendarCells}
          monthBirthdayCount={birthdayStats.employees}
          isInitialLoading={birthdaysLoading}
          isFetching={birthdaysFetching}
          isError={birthdaysError}
        />
      </div>
    </div>
  );
}
