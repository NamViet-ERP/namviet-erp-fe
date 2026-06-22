import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import namvietGroupLogo from '../../assets/NamVietGroup.png';
import {
  Search, Grid3X3, Settings, BarChart3, Bell, ChevronDown,
  User, LogOut, X, Check, AlertTriangle, Package, FileText, Moon, Sun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { showToast } from '../ui/Toast';
import { departments } from '../../constants/departments';
import { getSessionUser, clearSessionUser } from '../../constants/systemUsers';
import { authService } from '../../services/authService';
import { USE_MOCK } from '../../lib/mock';
import DepartmentCard from './DepartmentCard';
import RoleSwitcher from './RoleSwitcher';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin';
type NotifType = 'warning' | 'import' | 'export' | 'info';

interface User {
  name: string;
  initials: string;
  role: string;
  email: string;
}


interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: LucideIcon;
}

const mockNotifications: Notification[] = [
  { id: 1, type: 'import',  title: 'Phiếu nhập #NK-2026001', message: 'Đã được duyệt bởi Nguyễn Văn A', time: '5 phút trước',  read: false, icon: Package },
  { id: 2, type: 'warning', title: 'Tồn kho thấp',           message: 'Sản phẩm "Xi măng PCB40" sắp hết hàng',     time: '15 phút trước', read: false, icon: AlertTriangle },
  { id: 3, type: 'export',  title: 'Phiếu xuất #XK-2026043', message: 'Đang chờ xác nhận xuất kho',                time: '1 giờ trước',   read: false, icon: FileText },
  { id: 4, type: 'info',    title: 'Kiểm kê hoàn tất',       message: 'Đợt kiểm kê tháng 5 đã hoàn thành',         time: '2 giờ trước',   read: true,  icon: Check },
  { id: 5, type: 'import',  title: 'Phiếu nhập #NK-2026000', message: 'Nhập kho thành công 150 sản phẩm',          time: '3 giờ trước',   read: true,  icon: Package },
];

/* MD3 tonal containers for notification types — use CSS classes notif-icon--* */
const notifIconClass: Record<NotifType, string> = {
  warning: 'notif-icon--warning',
  import: 'notif-icon--import',
  export: 'notif-icon--export',
  info: 'notif-icon--info',
};

/* ── Shared Icon Button ── */
interface IconBtnProps {
  children: ReactNode;
  title?: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

function IconBtn({ children, title, active, onClick, badge }: IconBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`nv-header-icon-btn${active ? ' nv-header-icon-btn--active' : ''}`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="nv-header-icon-btn__badge">{badge}</span>
      )}
    </button>
  );
}

/* ── Menu item button (for user menu) ── */
interface MenuBtnProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}

function MenuBtn({ icon: Icon, label, onClick, danger }: MenuBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`user-menu-panel__menu-btn${danger ? ' user-menu-panel__menu-btn--danger' : ''}`}
    >
      <Icon size={18} className="user-menu-panel__menu-btn-icon" />
      {label}
    </button>
  );
}

/* ── Dark Mode hook (stored in localStorage) ── */
function useDarkMode(): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('nv-dark');
    if (stored !== null) return stored === 'true';
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('nv-dark', String(dark));
  }, [dark]);

  return [dark, setDark];
}

interface HeaderProps {
  currentModule: Module;
  onModuleSwitch: (module: Module) => void;
}

export default function Header({ currentModule: _currentModule, onModuleSwitch: _onModuleSwitch }: HeaderProps) {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const currentUser = sessionUser ?? { name: 'User', initials: 'U', roleLabel: '', email: '' };
  const activeUserId = sessionUser?.id ?? 'admin';

  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [moduleMenuClosing, setModuleMenuClosing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchFocused, setSearchFocused] = useState(false);
  const [dark, setDark] = useDarkMode();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const moduleMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeModuleMenu = useCallback(() => {
    if (!showModuleMenu || moduleMenuClosing) return;
    setModuleMenuClosing(true);
    moduleMenuTimer.current = setTimeout(() => {
      setShowModuleMenu(false);
      setModuleMenuClosing(false);
    }, 280);
  }, [showModuleMenu, moduleMenuClosing]);

  const openModuleMenu = useCallback(() => {
    if (moduleMenuTimer.current) clearTimeout(moduleMenuTimer.current);
    setModuleMenuClosing(false);
    setShowModuleMenu(true);
  }, []);

  const toggleModuleMenu = useCallback(() => {
    if (showModuleMenu) closeModuleMenu();
    else openModuleMenu();
  }, [showModuleMenu, closeModuleMenu, openModuleMenu]);

  useEffect(() => () => {
    if (moduleMenuTimer.current) clearTimeout(moduleMenuTimer.current);
  }, []);

  const handleModuleItemClick = useCallback((item: { path?: string; label: string }, deptTitle: string) => {
    if (item.path) {
      navigate(item.path);
    } else {
      showToast('info', `Phân hệ "${item.label}" thuộc bộ phận "${deptTitle}" đang được phát triển.`, 'Chức năng giả lập');
    }
    closeModuleMenu();
  }, [navigate, closeModuleMenu]);

  const moduleMenuOpen = showModuleMenu || moduleMenuClosing;
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(e.target as Node)) closeModuleMenu();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [closeModuleMenu]);

  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const markAsRead = (id: number) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));

  const handleSettingsClick = () => {
    showToast('info', 'Phân hệ "Cài đặt" đang được phát triển.', 'Chức năng giả lập');
    setShowUserMenu(false);
  };

  return (
    <header className="nv-header">
      {/* ── Left: Logo ── */}
      <div
        className="flex items-center gap-2.5 shrink-0 cursor-pointer"
        onClick={() => navigate('/warehouse/dashboard')}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') navigate('/warehouse/dashboard'); }}
        aria-label="Về trang chủ"
      >
        <img
          src={namvietGroupLogo}
          alt="Nam Viet Group"
          className="header-brand-logo h-14 w-auto object-contain"
        />
      </div>

      {/* ── Center: Search ── */}
      <div className={`nv-header-search hidden sm:block${searchFocused ? ' nv-header-search--focused' : ''}`}>
        <Search className="nv-header-search__icon" size={16} aria-hidden />
        <input
          type="search"
          placeholder="Tìm kiếm chứng từ, sản phẩm..."
          className="nv-header-search__input"
          aria-label="Tìm kiếm chứng từ, sản phẩm"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Module switcher */}
        <div className="nv-header-anchor" ref={moduleMenuRef}>
          <IconBtn title="Chuyển module" active={moduleMenuOpen} onClick={toggleModuleMenu}>
            <Grid3X3 size={20} />
          </IconBtn>
          {moduleMenuOpen && (
            <>
              <div
                className={moduleMenuClosing ? 'mega-menu-scrim mega-menu-scrim--out' : 'mega-menu-scrim'}
                onClick={closeModuleMenu}
                aria-hidden
              />
              <div
                className={`mega-menu-panel ${moduleMenuClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
              >
                <div className="mega-menu-panel__header">
                  <h2 className="mega-menu-panel__title">Truy cập phân hệ</h2>
                  <p className="mega-menu-panel__subtitle">Chọn module để điều hướng nhanh trong hệ thống</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <DepartmentCard
                      key={dept.title}
                      dept={dept}
                      onItemClick={(item) => handleModuleItemClick(item, dept.title)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dark mode toggle */}
        <IconBtn title={dark ? 'Chế độ sáng' : 'Chế độ tối'} onClick={() => setDark(d => !d)}>
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </IconBtn>

        {/* Divider */}
        <div className="hidden lg:block w-px h-6 bg-[var(--nv-header-border)] mx-1" aria-hidden />

        {/* Báo cáo */}
        <button
          type="button"
          className="nv-header-report-btn"
          onClick={() => navigate('/warehouse/dashboard-warehouse')}
        >
          <BarChart3 size={15} aria-hidden />
          Báo cáo kho
        </button>

        <div className="hidden lg:block w-px h-6 bg-[var(--nv-header-border)] mx-1" aria-hidden />

        {/* Notifications */}
        <div className="nv-header-anchor" ref={notifRef}>
          <IconBtn
            title="Thông báo"
            active={showNotifications}
            onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }}
            badge={unreadCount}
          >
            <Bell size={20} />
          </IconBtn>

          {showNotifications && (
            <div className="nv-notif-panel animate-scale-in">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[var(--md-on-surface)] text-balance">
                    Thông báo
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--md-error-container)] text-[var(--md-error)] tabular-nums">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-[13px] text-[var(--md-primary)] font-medium px-2 py-1 rounded-lg hover:bg-[var(--nv-surface-hover)] transition-colors duration-150"
                    >
                      Đọc tất cả
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="size-8 flex items-center justify-center rounded-full hover:bg-[var(--nv-surface-hover)] text-[var(--md-on-surface-variant)] transition-colors duration-150"
                    aria-label="Đóng thông báo"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="h-px bg-[var(--md-outline-variant)]" />

              {/* List */}
              <div className="max-h-[340px] overflow-y-auto">
                {notifications.map(n => {
                  const NIcon = n.icon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-[var(--md-outline-variant)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--nv-surface-hover)] ${
                        !n.read ? 'bg-[color-mix(in_srgb,var(--md-primary)_4%,transparent)]' : ''
                      }`}
                    >
                      <div className={`notif-icon ${notifIconClass[n.type] || notifIconClass.info}`}>
                        <NIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm text-[var(--md-on-surface)] truncate ${!n.read ? 'font-semibold' : 'font-normal'}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="size-2 rounded-full bg-[var(--md-secondary)] shrink-0" aria-hidden />
                          )}
                        </div>
                        <p className="text-[13px] text-[var(--md-on-surface-variant)] mt-0.5 line-clamp-2 text-pretty">
                          {n.message}
                        </p>
                        <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 opacity-80">
                          {n.time}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 border-t border-[var(--md-outline-variant)]">
                <button
                  type="button"
                  className="w-full text-center text-sm font-medium text-[var(--md-primary)] py-2 rounded-xl hover:bg-[var(--nv-surface-hover)] transition-colors duration-150"
                >
                  Xem tất cả thông báo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}
            className={`nv-header-user-trigger${showUserMenu ? ' nv-header-user-trigger--open' : ''}`}
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            aria-label="Menu tài khoản"
          >
            <div className="nv-header-user-trigger__avatar">{currentUser.initials}</div>
            <span className="nv-header-user-trigger__name hidden xl:block">
              {currentUser.name}
            </span>
            <ChevronDown size={14} className="nv-header-user-trigger__chevron hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="user-menu-panel animate-scale-in" role="menu">
              <div className="user-menu-panel__profile">
                <div className="user-menu-panel__avatar">{currentUser.initials}</div>
                <div className="min-w-0">
                  <p className="user-menu-panel__name">{currentUser.name}</p>
                  <p className="user-menu-panel__email">{currentUser.email}</p>
                  {'roleLabel' in currentUser && currentUser.roleLabel && (
                    <span className="user-menu-panel__role-badge">{currentUser.roleLabel}</span>
                  )}
                </div>
              </div>

              {USE_MOCK && (
                <RoleSwitcher
                  activeUserId={activeUserId}
                  onSwitch={() => {
                    setShowUserMenu(false);
                    window.location.reload();
                  }}
                />
              )}

              <div className="user-menu-panel__section">
                <MenuBtn icon={User} label="Thông tin tài khoản" onClick={() => { navigate('/profile'); setShowUserMenu(false); }} />
                <MenuBtn icon={Settings} label="Cài đặt" onClick={handleSettingsClick} />
              </div>
              <div className="user-menu-panel__section user-menu-panel__section--bordered">
                <MenuBtn icon={LogOut} label="Đăng xuất" danger onClick={() => {
                  authService.logout();
                  clearSessionUser();
                  setShowUserMenu(false);
                  navigate('/login');
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
