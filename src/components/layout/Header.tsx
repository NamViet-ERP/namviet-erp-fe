import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAMVIET_GROUP_LOGO_URL } from '../../constants/branding';
import {
  Search, Grid3X3, Settings, BarChart3, Bell, ChevronDown,
  User, LogOut, X, PackagePlus, PackageMinus, ArrowLeftRight, ClipboardCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { showToast } from '../ui/Toast';
import { departments } from '../../constants/departments';
import { getSessionUser, clearSessionUser, getSessionPermissions } from '../../constants/systemUsers';
import { authService } from '../../services/authService';
import { UI_COMING_SOON } from '../../lib/uiMessages';
import { handlePermissionNavClick } from '../../lib/protectedNavigation';
import { useWmsNotifications } from '../../hooks/useWmsNotifications';
import { useDarkMode } from '../../hooks/useDarkMode';
import type { WmsNotificationItemApiDto } from '../../services/notificationsService';
import DepartmentCard from './DepartmentCard';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin' | 'technical' | 'purchasing' | 'suppliers' | 'operations';
type NotifType = 'warning' | 'import' | 'export' | 'info' | 'transfer' | 'stocktake';

const NOTIF_READ_KEY = 'nv-wms-notif-read';

function readStoredNotifIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(NOTIF_READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistNotifRead(id: string) {
  const ids = readStoredNotifIds();
  ids.add(id);
  sessionStorage.setItem(NOTIF_READ_KEY, JSON.stringify([...ids]));
}

function mapNotifType(kind: string): NotifType {
  if (kind === 'import' || kind === 'export' || kind === 'transfer' || kind === 'stocktake') return kind;
  return 'info';
}

function mapNotifIcon(kind: string): LucideIcon {
  if (kind === 'import') return PackagePlus;
  if (kind === 'export') return PackageMinus;
  if (kind === 'transfer') return ArrowLeftRight;
  if (kind === 'stocktake') return ClipboardCheck;
  return Bell;
}

function mapApiNotification(item: WmsNotificationItemApiDto, readIds: Set<string>): Notification {
  const type = mapNotifType(item.kind);
  return {
    id: item.id,
    type,
    title: item.title,
    message: item.message,
    time: item.timeLabel,
    read: readIds.has(item.id),
    icon: mapNotifIcon(item.kind),
    route: item.route,
  };
}

interface User {
  name: string;
  initials: string;
  role: string;
  email: string;
}


interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: LucideIcon;
  route: string;
}

/* MD3 tonal containers for notification types — use CSS classes notif-icon--* */
const notifIconClass: Record<NotifType, string> = {
  warning: 'notif-icon--warning',
  import: 'notif-icon--import',
  export: 'notif-icon--export',
  info: 'notif-icon--info',
  transfer: 'notif-icon--info',
  stocktake: 'notif-icon--warning',
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

interface HeaderProps {
  currentModule: Module;
  onModuleSwitch: (module: Module) => void;
}

export default function Header({ currentModule: _currentModule, onModuleSwitch: _onModuleSwitch }: HeaderProps) {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const sessionPermissions = getSessionPermissions();
  const visibleDepartments = departments;
  const currentUser = sessionUser ?? { name: 'User', initials: 'U', roleLabel: '', email: '' };
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [moduleMenuClosing, setModuleMenuClosing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(readStoredNotifIds);
  const [searchFocused, setSearchFocused] = useState(false);
  useDarkMode();
  const { data: pendingNotifications } = useWmsNotifications();

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

  const handleModuleItemClick = useCallback((item: { path?: string; label: string; permission?: string | string[] }, deptTitle: string) => {
    handlePermissionNavClick(sessionPermissions, item, navigate, {
      deptTitle,
      onAfter: closeModuleMenu,
    });
  }, [navigate, closeModuleMenu, sessionPermissions]);

  const moduleMenuOpen = showModuleMenu || moduleMenuClosing;
  const notifications = useMemo(
    () => pendingNotifications?.items?.map(item => mapApiNotification(item, readNotificationIds)) ?? [],
    [pendingNotifications, readNotificationIds],
  );
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

  const markAllRead = () => {
    notifications.forEach(n => persistNotifRead(n.id));
    setReadNotificationIds(new Set(notifications.map(n => n.id)));
  };
  const markAsRead = (id: string, route?: string) => {
    persistNotifRead(id);
    setReadNotificationIds(previous => new Set(previous).add(id));
    if (route) {
      navigate(route);
      setShowNotifications(false);
    }
  };

  const handleSettingsClick = () => {
    showToast('info', UI_COMING_SOON.settings, UI_COMING_SOON.title);
    setShowUserMenu(false);
  };

  return (
    <header className="nv-header">
      <div className="nv-header__inner">
        <button
          type="button"
          className="nv-header__brand"
          onClick={() => navigate('/warehouse/dashboard')}
          aria-label="Về trang chủ"
        >
          <img
            src={NAMVIET_GROUP_LOGO_URL}
            alt="Nam Viet Group"
            className="nv-header__logo"
          />
        </button>

        <div className={`nv-header-search nv-header-search--bar${searchFocused ? ' nv-header-search--focused' : ''}`}>
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

        <div className="nv-header__actions">
          <div className="nv-header__cluster">
            <div className="nv-header-anchor" ref={moduleMenuRef}>
              <IconBtn title="Chuyển module" active={moduleMenuOpen} onClick={toggleModuleMenu}>
                <Grid3X3 size={18} />
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

                    <div className="portal-modules">
                      {visibleDepartments.map((dept) => (
                        <DepartmentCard
                          key={dept.title}
                          dept={dept}
                          permissions={sessionPermissions}
                          onItemClick={(item) => handleModuleItemClick(item, dept.title)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="nv-header__divider" aria-hidden />

          <button
            type="button"
            className="nv-header-report-btn"
            onClick={() => navigate('/warehouse/reports')}
          >
            <BarChart3 size={15} aria-hidden />
            Báo cáo kho
          </button>

          <div className="nv-header__divider nv-header__divider--wide" aria-hidden />

          <div className="nv-header-anchor" ref={notifRef}>
              <IconBtn
                title="Thông báo"
                active={showNotifications}
                onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }}
                badge={pendingNotifications?.totalCount ?? unreadCount}
              >
                <Bell size={18} />
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
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell
                      size={28}
                      className="mx-auto mb-2 text-[var(--md-on-surface-variant)] opacity-45"
                      aria-hidden
                    />
                    <p className="text-sm text-[var(--md-on-surface-variant)]">Chưa có thông báo</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const NIcon = n.icon;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => markAsRead(n.id, n.route)}
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
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-[var(--md-outline-variant)]">
                  <button
                    type="button"
                    className="w-full text-center text-sm font-medium text-[var(--md-primary)] py-2 rounded-xl hover:bg-[var(--nv-surface-hover)] transition-colors duration-150"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/warehouse/reports?section=pending');
                    }}
                  >
                    Xem báo cáo chờ duyệt
                  </button>
                </div>
              )}
            </div>
          )}
          </div>

          <div className="nv-header-anchor nv-header-user-wrap" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}
                className={`nv-header-user-trigger${showUserMenu ? ' nv-header-user-trigger--open' : ''}`}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                aria-label="Menu tài khoản"
              >
                <div className="nv-header-user-trigger__avatar">{currentUser.initials}</div>
                <span className="nv-header-user-trigger__name">
                  {currentUser.name}
                </span>
                <ChevronDown size={14} className="nv-header-user-trigger__chevron" />
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

                  <div className="user-menu-panel__section">
                    <MenuBtn icon={User} label="Thông tin tài khoản" onClick={() => { navigate('/profile'); setShowUserMenu(false); }} />
                    <MenuBtn icon={Settings} label="Cài đặt" onClick={handleSettingsClick} />
                  </div>
                  <div className="user-menu-panel__section user-menu-panel__section--bordered">
                    <MenuBtn icon={LogOut} label="Đăng xuất" danger onClick={() => {
                      void authService.logout().finally(() => {
                        clearSessionUser();
                        setShowUserMenu(false);
                        navigate('/login');
                      });
                    }} />
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </header>
  );
}
