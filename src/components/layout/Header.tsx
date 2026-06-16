import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import namvietGroupLogo from '../../assets/NamViet Group.png';
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

/* MD3 tonal containers for notification types */
const notifContainers: Record<NotifType, { bg: string; color: string }> = {
  warning: { bg: 'var(--md-warning-container)',        color: 'var(--md-on-warning-container)' },
  import:  { bg: 'var(--md-primary-container)',         color: 'var(--md-on-primary-container)' },
  export:  { bg: 'var(--md-secondary-container)',       color: 'var(--md-on-secondary-container)' },
  info:    { bg: 'var(--md-surface-container-low)',     color: 'var(--md-on-surface-variant)' },
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
      onClick={onClick}
      title={title}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '9999px',
        border: 'none',
        background: active ? 'var(--nv-header-icon-active-bg)' : 'transparent',
        color: active ? 'var(--nv-header-icon-active)' : 'var(--nv-header-icon)',
        cursor: 'pointer',
        transition: 'background 200ms var(--md-easing), color 200ms var(--md-easing)',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--nv-header-icon-active-bg)';
          e.currentTarget.style.color = 'var(--nv-header-icon-hover)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--nv-header-icon)';
        }
      }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '4px', right: '4px',
            minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '9999px',
            fontFamily: "'Roboto', sans-serif",
            fontSize: '10px', fontWeight: 700,
            padding: '0 4px',
            background: 'var(--md-error)',
            color: 'var(--md-on-error)',
            boxShadow: '0 0 0 2px var(--md-surface-container)',
          }}
        >
          {badge}
        </span>
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
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 16px',
        fontFamily: "'Roboto', sans-serif",
        fontSize: '0.875rem',
        fontWeight: 400,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        border: 'none',
        background: 'transparent',
        color: danger ? 'var(--md-error)' : 'var(--md-on-surface)',
        cursor: 'pointer',
        transition: 'background 200ms var(--md-easing)',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger
          ? 'color-mix(in srgb, var(--md-error) 8%, transparent)'
          : 'var(--nv-surface-hover)';
      }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={18} style={{ color: danger ? 'var(--md-error)' : 'var(--md-on-surface-variant)', flexShrink: 0 }} />
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

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'var(--nv-header-bg)',
        borderBottom: '1px solid var(--nv-header-border)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'var(--md-shadow-1)',
        transition: 'background var(--md-duration) var(--md-easing)',
      }}
    >
      {/* ── Left: Logo ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        onClick={() => navigate('/warehouse/dashboard')}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') navigate('/warehouse/dashboard'); }}
      >
        {/* Mayzer Logo */}
        <img
          src={namvietGroupLogo}
          alt="NamViet Group"
          style={{
            height: '56px',
            objectFit: 'contain',
            borderRadius: '6px',
          }}
        />
      </div>

      {/* ── Center: Search — MD3 Filled ── */}
      <div style={{ flex: 1, maxWidth: '480px', margin: '0 24px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: searchFocused ? 'var(--md-primary)' : 'var(--nv-header-search-placeholder)',
              pointerEvents: 'none',
              transition: 'color 200ms var(--md-easing)',
            }}
            size={16}
          />
          <input
            type="text"
            placeholder="Tìm kiếm chứng từ, sản phẩm..."
            className="form-input-compact"
            style={{ paddingLeft: '40px', width: '100%', borderRadius: '24px', border: 'none', background: 'var(--nv-header-search-bg)', color: 'var(--nv-header-search-text)', height: '40px' }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>

        {/* Module switcher */}
        <div style={{ position: 'relative' }} ref={moduleMenuRef}>
          <IconBtn title="Chuyển module" active={moduleMenuOpen} onClick={toggleModuleMenu}>
            <Grid3X3 size={20} />
          </IconBtn>
          {moduleMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className={moduleMenuClosing ? 'mega-menu-scrim--out' : 'mega-menu-scrim'}
                style={{
                  position: 'fixed',
                  top: '64px',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 90,
                }}
                onClick={closeModuleMenu}
              />
              {/* Mega Menu Dropdown */}
              <div
                className={`mega-menu-panel ${moduleMenuClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
                style={{
                  position: 'fixed',
                  top: '72px',
                  left: '20px',
                  right: '20px',
                  maxHeight: 'calc(100vh - 100px)',
                  background: 'var(--md-surface-container-high)',
                  border: '1px solid var(--md-outline-variant)',
                  borderRadius: '24px',
                  boxShadow: 'var(--md-shadow-3)',
                  zIndex: 100,
                  overflowY: 'auto',
                  padding: '24px',
                  maxWidth: '1280px',
                  margin: '0 auto',
                }}
              >
                {/* 5 columns grid */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
                  style={{ width: '100%' }}
                >
                  {/* Columns 1-5: department cards (shared DepartmentCard component) */}
                  {([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] as const).map(([start, end]) => (
                    <div key={start} className="flex flex-col gap-3">
                      {departments.slice(start, end).map((dept) => (
                        <DepartmentCard
                          key={dept.title}
                          dept={dept}
                          onItemClick={(item) => handleModuleItemClick(item, dept.title)}
                        />
                      ))}
                    </div>
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
        <div style={{ width: '1px', height: '24px', background: 'var(--nv-header-border)', margin: '0 4px' }} />

        {/* Báo cáo button — MD3 Outlined Pill */}
        <button
          className="hidden lg:flex btn btn-outlined"
          onClick={() => navigate('/warehouse/dashboard-warehouse')}
          style={{ height: '36px', padding: '0 16px', fontSize: '0.8125rem', gap: '6px', color: 'var(--nv-header-on-bg)', borderColor: 'var(--nv-header-border)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--nv-header-icon-active-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <BarChart3 size={16} /> BÁO CÁO DASHBOARD
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--nv-header-border)', margin: '0 4px' }} />

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <IconBtn
            title="Thông báo"
            active={showNotifications}
            onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }}
            badge={unreadCount}
          >
            <Bell size={20} />
          </IconBtn>

          {showNotifications && (
            <div
              className="animate-scale-in"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '380px',
                background: 'var(--md-surface-container)',
                borderRadius: '16px',
                boxShadow: 'var(--md-shadow-3)',
                zIndex: 60,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--md-on-surface)' }}>
                    Thông báo
                  </span>
                  {unreadCount > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', fontWeight: 700, background: 'var(--md-error-container)', color: 'var(--md-error)' }}>
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.8125rem', color: 'var(--md-primary)', fontWeight: 500, border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px', borderRadius: '9999px' }}
                    >
                      Đọc tất cả
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '9999px', border: 'none', background: 'transparent', color: 'var(--md-on-surface-variant)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--nv-surface-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--md-outline-variant)' }} />

              {/* List */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.map(n => {
                  const NIcon = n.icon;
                  const c = notifContainers[n.type] || notifContainers.info;
                  return (
                    <button key={n.id} onClick={() => markAsRead(n.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        border: 'none',
                        borderBottom: '1px solid var(--md-outline-variant)',
                        background: !n.read ? 'color-mix(in srgb, var(--md-primary) 4%, transparent)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 200ms var(--md-easing)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--nv-surface-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = !n.read ? 'color-mix(in srgb, var(--md-primary) 4%, transparent)' : 'transparent'; }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: c.bg, color: c.color }}>
                        <NIcon size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.875rem', color: 'var(--md-on-surface)', fontWeight: !n.read ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.title}
                          </p>
                          {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--md-primary)', flexShrink: 0 }} />}
                        </div>
                        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.message}
                        </p>
                        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', marginTop: '2px', opacity: 0.7 }}>
                          {n.time}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ padding: '12px 16px' }}>
                <button
                  style={{ width: '100%', textAlign: 'center', fontFamily: "'Roboto', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: 'var(--md-primary)', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', borderRadius: '9999px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--nv-surface-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Xem tất cả thông báo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}
            style={{
              marginLeft: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px',
              borderRadius: '9999px',
              border: 'none',
              background: showUserMenu ? 'var(--nv-header-icon-active-bg)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 200ms var(--md-easing)',
            }}
            onMouseEnter={e => { if (!showUserMenu) e.currentTarget.style.background = 'var(--nv-header-icon-active-bg)'; }}
            onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              style={{
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: '13px',
                background: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
                borderRadius: '9999px',
              }}
            >
              {currentUser.initials}
            </div>
            <ChevronDown size={14} style={{ color: 'var(--nv-header-icon)', transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 200ms var(--md-easing)' }} />
          </button>

          {showUserMenu && (
            <div className="user-menu-panel animate-scale-in">
              <div className="user-menu-panel__profile">
                <div className="user-menu-panel__avatar">{currentUser.initials}</div>
                <div style={{ minWidth: 0 }}>
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

              <div style={{ padding: '4px 0' }}>
                <MenuBtn icon={User} label="Thông tin tài khoản" onClick={() => { navigate('/profile'); setShowUserMenu(false); }} />
                <MenuBtn icon={Settings} label="Cài đặt" onClick={() => { navigate('/warehouse/settings'); setShowUserMenu(false); }} />
              </div>
              <div style={{ borderTop: '1px solid var(--md-outline-variant)', padding: '4px 0' }}>
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
