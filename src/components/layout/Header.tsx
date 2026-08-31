import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAMVIET_GROUP_LOGO_URL } from '../../constants/branding';
import {
  Settings, BarChart3, Bell, ChevronDown,
  User, LogOut, X, PackagePlus, PackageMinus, ArrowLeftRight, ClipboardCheck, FileSpreadsheet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { showToast } from '../ui/Toast';
import { clearSessionUser } from '../../constants/systemUsers';
import { useSession } from '../../auth/AuthProvider';
import { authService } from '../../services/authService';
import { UI_COMING_SOON } from '../../lib/uiMessages';
import { WMS_REPORTS_ENABLED } from '../../constants/sidebarMenus';
import { useWmsNotifications } from '../../hooks/useWmsNotifications';
import { useActivityRealtime } from '../../hooks/useActivityRealtime';
import { useDarkMode } from '../../hooks/useDarkMode';
import { isOwnWmsBellToastSuppressed } from '../../lib/wms/ownWmsBellToast';
import type { WmsNotificationItemApiDto } from '../../services/notificationsService';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin' | 'technical' | 'cskh' | 'purchasing' | 'suppliers' | 'operations';
type NotifType = 'warning' | 'import' | 'export' | 'info' | 'transfer' | 'stocktake' | 'estimate';

const NOTIF_READ_KEY = 'nv-wms-notif-read';
const BELL_TOAST_MS = 4000;

type BellToast = {
  kind: 'import' | 'estimate';
  title: string;
  voucherCode: string;
  extraCount: number;
};

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
  if (kind === 'import' || kind === 'export' || kind === 'transfer' || kind === 'stocktake' || kind === 'estimate') {
    return kind;
  }
  return 'info';
}

function mapNotifIcon(kind: string): LucideIcon {
  if (kind === 'import') return PackagePlus;
  if (kind === 'export') return PackageMinus;
  if (kind === 'transfer') return ArrowLeftRight;
  if (kind === 'stocktake') return ClipboardCheck;
  if (kind === 'estimate') return FileSpreadsheet;
  return Bell;
}

function mapApiNotification(item: WmsNotificationItemApiDto, readIds: Set<string>): Notification {
  const type = mapNotifType(item.kind);
  const contextLabel = item.contextLabel?.trim() ?? '';
  const createdByName = item.createdByName?.trim() ?? '';
  const fallbackActor = (item.message ?? '')
    .replace(item.voucherCode, '')
    .replace(/[—–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    id: item.id,
    type,
    title: item.title,
    voucherCode: item.voucherCode,
    contextLabel,
    createdByName: createdByName || (!contextLabel ? fallbackActor : ''),
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
  voucherCode: string;
  contextLabel: string;
  createdByName: string;
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
  estimate: 'notif-icon--warning',
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
  const { user: sessionUser } = useSession();
  const currentUser = sessionUser ?? { name: 'User', initials: 'U', roleLabel: '', email: '' };
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(readStoredNotifIds);
  const [bellToast, setBellToast] = useState<BellToast | null>(null);
  const [toastPaused, setToastPaused] = useState(false);
  useDarkMode();
  useActivityRealtime('wms');
  const { data: pendingNotifications } = useWmsNotifications();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const seenImportIdsRef = useRef<Set<string> | null>(null);
  const showNotificationsRef = useRef(showNotifications);
  showNotificationsRef.current = showNotifications;

  const notifications = useMemo(
    () => pendingNotifications?.items?.map(item => mapApiNotification(item, readNotificationIds)) ?? [],
    [pendingNotifications, readNotificationIds],
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!pendingNotifications) return;
    const pendingItems = pendingNotifications.items.filter(
      item => item.kind === 'import' || item.kind === 'estimate',
    );
    const ids = pendingItems.map(item => item.id);
    if (seenImportIdsRef.current === null) {
      seenImportIdsRef.current = new Set(ids);
      return;
    }
    const fresh = pendingItems.filter(item => !seenImportIdsRef.current!.has(item.id));
    ids.forEach(id => seenImportIdsRef.current!.add(id));
    const toAnnounce = fresh.filter(item => !isOwnWmsBellToastSuppressed(item.voucherCode));
    if (toAnnounce.length === 0 || showNotificationsRef.current) return;
    const estimateFresh = toAnnounce.filter(item => item.kind === 'estimate');
    const importFresh = toAnnounce.filter(item => item.kind === 'import');
    if (estimateFresh.length > 0) {
      const first = estimateFresh[0];
      setBellToast({
        kind: 'estimate',
        title: estimateFresh.length === 1
          ? '1 dự toán chờ duyệt'
          : `${estimateFresh.length} dự toán chờ duyệt`,
        voucherCode: first.voucherCode || '',
        extraCount: Math.max(0, estimateFresh.length - 1),
      });
      return;
    }
    if (importFresh.length === 0) return;
    const first = importFresh[0];
    setBellToast({
      kind: 'import',
      title: importFresh.length === 1
        ? '1 phiếu nhập kho được tạo'
        : `${importFresh.length} phiếu nhập kho được tạo`,
      voucherCode: first.voucherCode || '',
      extraCount: Math.max(0, importFresh.length - 1),
    });
  }, [pendingNotifications]);

  useEffect(() => {
    if (!bellToast) {
      setToastPaused(false);
      return;
    }
    setToastPaused(false);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setBellToast(null), BELL_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [bellToast]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setBellToast(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setBellToast(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

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
          onClick={() => navigate('/operations/dashboard')}
          aria-label="Về trang chủ"
        >
          <img
            src={NAMVIET_GROUP_LOGO_URL}
            alt="Mayzer"
            className="nv-header__logo"
          />
        </button>

        <div className="nv-header__actions">
          {WMS_REPORTS_ENABLED ? (
            <button
              type="button"
              className="nv-header-report-btn"
              onClick={() => navigate('/warehouse/reports')}
            >
              <BarChart3 size={15} aria-hidden />
              Báo cáo kho
            </button>
          ) : null}

          <div className="nv-header__divider nv-header__divider--wide" aria-hidden />

          <div className="nv-header-anchor" ref={notifRef}>
              <IconBtn
                title="Thông báo"
                active={showNotifications}
                onClick={() => {
                  setShowNotifications(p => !p);
                  setShowUserMenu(false);
                  setBellToast(null);
                }}
                badge={unreadCount}
              >
                <Bell size={18} />
              </IconBtn>

              {bellToast && !showNotifications && (
                <div
                  key={`${bellToast.title}:${bellToast.voucherCode}:${bellToast.extraCount}`}
                  className={`nv-notif-toast${toastPaused ? ' nv-notif-toast--paused' : ''}`}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  onMouseEnter={() => setToastPaused(true)}
                  onMouseLeave={() => setToastPaused(false)}
                  onFocusCapture={() => setToastPaused(true)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                      setToastPaused(false);
                    }
                  }}
                >
                  <span className="nv-notif-toast__caret" aria-hidden />
                  <button
                    type="button"
                    className="nv-notif-toast__hit"
                    onClick={() => {
                      setShowNotifications(true);
                      setBellToast(null);
                      setShowUserMenu(false);
                    }}
                  >
                    <span
                      className={`notif-icon ${bellToast.kind === 'estimate' ? 'notif-icon--warning' : 'notif-icon--import'}`}
                      aria-hidden
                    >
                      {bellToast.kind === 'estimate'
                        ? <FileSpreadsheet size={16} />
                        : <PackagePlus size={16} />}
                    </span>
                    <span className="nv-notif-toast__copy">
                      <span className="nv-notif-toast__kicker">
                        {bellToast.kind === 'estimate' ? 'Dự toán' : 'Nhập kho'}
                      </span>
                      <span className="nv-notif-toast__title">{bellToast.title}</span>
                      {(bellToast.voucherCode || bellToast.extraCount > 0) && (
                        <span className="nv-notif-toast__meta">
                          {bellToast.voucherCode && (
                            <span className="nv-notif-code">{bellToast.voucherCode}</span>
                          )}
                          {bellToast.extraCount > 0 && (
                            <span className="nv-notif-toast__more">+{bellToast.extraCount}</span>
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="nv-notif-toast__close"
                    aria-label="Đóng thông báo"
                    onClick={() => setBellToast(null)}
                  >
                    <X size={16} aria-hidden />
                  </button>
                  <span
                    className="nv-notif-toast__timer"
                    aria-hidden
                    onAnimationEnd={event => {
                      if (!event.animationName.includes('nv-notif-toast-timer')) return;
                      setBellToast(null);
                    }}
                  />
                </div>
              )}

              {showNotifications && (
                <div
                  className="nv-notif-panel animate-scale-in"
                  role="region"
                  aria-labelledby="nv-notif-panel-title"
                >
                  <span className="nv-notif-panel__caret" aria-hidden />
                  <div className="nv-notif-panel__head">
                    <div className="nv-notif-panel__heading">
                      <span id="nv-notif-panel-title" className="nv-notif-panel__title">
                        Thông báo
                      </span>
                      {unreadCount > 0 && (
                        <span className="nv-notif-panel__badge">{unreadCount} mới</span>
                      )}
                    </div>
                    <div className="nv-notif-panel__actions">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="nv-notif-panel__text-btn"
                        >
                          Đọc tất cả
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="nv-notif-panel__icon-btn"
                        aria-label="Đóng thông báo"
                      >
                        <X size={16} aria-hidden />
                      </button>
                    </div>
                  </div>

                  <div className="nv-notif-panel__list">
                    {notifications.length === 0 ? (
                      <div className="nv-notif-panel__empty">
                        <Bell size={22} aria-hidden />
                        <p>Chưa có thông báo</p>
                      </div>
                    ) : (
                      notifications.map(n => {
                        const NIcon = n.icon;
                        const label = [n.title, n.voucherCode, n.contextLabel, n.createdByName, n.time]
                          .filter(Boolean)
                          .join('. ');
                        return (
                          <button
                            key={n.id}
                            type="button"
                            aria-label={label}
                            onClick={() => markAsRead(n.id, n.route)}
                            className={`nv-notif-panel__item${n.read ? '' : ' nv-notif-panel__item--unread'}`}
                          >
                            <span className={`notif-icon ${notifIconClass[n.type] || notifIconClass.info}`} aria-hidden>
                              <NIcon size={16} />
                            </span>
                            <span className="nv-notif-panel__item-body">
                              <span className="nv-notif-panel__item-title">{n.title}</span>
                              {(n.voucherCode || n.contextLabel || n.createdByName) && (
                                <span className="nv-notif-panel__item-meta">
                                  {n.voucherCode && (
                                    <span className="nv-notif-code">{n.voucherCode}</span>
                                  )}
                                  {n.contextLabel && (
                                    <span className="nv-notif-panel__place">{n.contextLabel}</span>
                                  )}
                                  {n.createdByName && (
                                    <span className="nv-notif-panel__actor">{n.createdByName}</span>
                                  )}
                                </span>
                              )}
                              <span className="nv-notif-panel__item-time">{n.time}</span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {WMS_REPORTS_ENABLED && notifications.length > 0 && (
                    <div className="nv-notif-panel__footer">
                      <button
                        type="button"
                        className="nv-notif-panel__footer-btn"
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
                onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); setBellToast(null); }}
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
