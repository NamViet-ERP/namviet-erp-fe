import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronsLeft, ChevronLeft, X, Warehouse as WarehouseIcon, ClipboardCheck, Users, UserCheck, ShieldCheck, Settings, Wrench, Headphones, ShoppingCart, Building2, Activity, LayoutDashboard } from 'lucide-react';
import type { SidebarMenuItem } from '../../types';
import type { LucideIcon } from 'lucide-react';
import type { PermissionKey } from '../../lib/permissions';
import {
  handlePermissionNavClick,
  isNavItemAccessible,
  type PermissionNavItem,
} from '../../lib/protectedNavigation';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin' | 'technical' | 'cskh' | 'purchasing' | 'suppliers' | 'operations';

const moduleIcons: Record<Module, LucideIcon> = { 
  warehouse: WarehouseIcon, 
  stocktake: ClipboardCheck,
  members: Users,
  recruitment: UserCheck,
  admin: ShieldCheck,
  technical: Wrench,
  cskh: Headphones,
  purchasing: ShoppingCart,
  suppliers: Building2,
  operations: Activity,
};
const moduleLabels: Record<Module, string> = {
  warehouse: 'KHO HÀNG',
  stocktake: 'KIỂM KÊ',
  members: 'NHÂN VIÊN',
  recruitment: 'TUYỂN DỤNG',
  admin: 'ADMIN',
  technical: 'KỸ THUẬT',
  cskh: 'CSKH',
  purchasing: 'MUA HÀNG',
  suppliers: 'NHÀ CUNG CẤP',
  operations: 'SLC',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  menuItems: SidebarMenuItem[];
  permissions: readonly PermissionKey[];
  currentModule: Module;
  contextLabel?: string;
  contextIcon?: LucideIcon;
  onBack?: () => void;
}

function subscribeMobileMedia(callback: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mq = window.matchMedia('(max-width: 1023px)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getMobileSnapshot() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 1023px)').matches
    : false;
}

function getMobileServerSnapshot() {
  return false;
}

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
  menuItems,
  permissions,
  currentModule,
  contextLabel,
  contextIcon,
  onBack,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [userCollapsed, setUserCollapsed] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [flyoutStyle, setFlyoutStyle] = useState<React.CSSProperties>({});
  const [tipStyle, setTipStyle] = useState<React.CSSProperties>({});
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isMobile = useSyncExternalStore(subscribeMobileMedia, getMobileSnapshot, getMobileServerSnapshot);

  const isEffectiveCollapsed = collapsed && !isMobile;

  /** Sidebar thống nhất: luôn hiện nhãn hệ thống; contextLabel (vd. Thiết lập) vẫn ưu tiên. */
  const isUnifiedNav = menuItems.some(item => (item.children?.length ?? 0) > 0);
  const ModuleIcon = onBack
    ? (contextIcon ?? Settings)
    : isUnifiedNav
      ? LayoutDashboard
      : (moduleIcons[currentModule] || WarehouseIcon);
  const headerLabel = contextLabel ?? (isUnifiedNav ? 'HỆ THỐNG' : moduleLabels[currentModule]);

  /** List + trang con (chi tiết/new) đều giữ active — vd. /purchasing/plans/KHMH-001. */
  const isPathActive = (menuPath: string, pathname: string) => {
    if (!menuPath) return false;
    if (pathname === menuPath) return true;
    return pathname.startsWith(`${menuPath}/`);
  };

  const isActive = (path: string) => isPathActive(path, location.pathname);
  const isParentActive = (item: SidebarMenuItem) =>
    item.children
      ? item.children.some(c => isPathActive(c.path, location.pathname))
      : isPathActive(item.path, location.pathname);

  const navigateMenuItem = (item: PermissionNavItem) => {
    handlePermissionNavClick(permissions, item, navigate);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedItems(prev => {
      const next = { ...prev };
      let changed = false;
      menuItems.forEach(item => {
        if (item.children && (onBack || isParentActive(item)) && !userCollapsed.has(item.id) && !next[item.id]) {
          next[item.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isEffectiveCollapsed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedItems({});
      setUserCollapsed(new Set());
      setHoveredItem(null);
      setActivePopover(null);
    } else {
      const init: Record<string, boolean> = {};
      menuItems.forEach(item => {
        if (item.children && (onBack || isParentActive(item))) init[item.id] = true;
      });
      setExpandedItems(init);
      setUserCollapsed(new Set());
      setActivePopover(null);
    }
  }, [isEffectiveCollapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isEffectiveCollapsed && !(e.target as Element).closest?.('.sidebar-item-container')) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEffectiveCollapsed]);

  const toggleExpand = (id: string) => {
    const wasExpanded = expandedItems[id];
    setExpandedItems(p => ({ ...p, [id]: !wasExpanded }));
    setUserCollapsed(prev => {
      const next = new Set(prev);
      if (wasExpanded) { next.add(id); } else { next.delete(id); }
      return next;
    });
  };

  const handleItemMouseEnter = (item: SidebarMenuItem) => {
    if (!isEffectiveCollapsed) return;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredItem(item.id);
    if (activePopover && activePopover !== item.id) setActivePopover(null);
    if (!(item.children?.length) && itemRefs.current[item.id]) {
      const rect = itemRefs.current[item.id]!.getBoundingClientRect();
      setTipStyle({
        position: 'fixed',
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + 8}px`,
        transform: 'translateY(-50%)',
        zIndex: 99999,
      });
    }
  };
  const handleItemMouseLeave = () => {
    if (!isEffectiveCollapsed) return;
    hoverTimeout.current = setTimeout(() => setHoveredItem(null), 120);
  };
  const handlePopoverEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  };
  const handlePopoverLeave = () => {
    hoverTimeout.current = setTimeout(() => { setHoveredItem(null); setActivePopover(null); }, 120);
  };

  useEffect(() => () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  }, []);

  const popoverItemId = activePopover || hoveredItem;
  const popoverItemRaw = isEffectiveCollapsed && popoverItemId ? menuItems.find(i => i.id === popoverItemId) : null;
  const popoverItem = (popoverItemRaw?.children?.length ?? 0) > 0 ? popoverItemRaw : null;
  const tipItem =
    isEffectiveCollapsed && hoveredItem && !activePopover && !popoverItem
      ? menuItems.find(i => i.id === hoveredItem && !(i.children?.length)) ?? null
      : null;

  const updateFlyoutPosition = useCallback(() => {
    if (!popoverItem || !popoverItemId || !itemRefs.current[popoverItemId]) return;
    const rect = itemRefs.current[popoverItemId]!.getBoundingClientRect();
    setFlyoutStyle({
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.right + 8}px`,
      minWidth: '220px',
      zIndex: 99999,
    });
  }, [popoverItem, popoverItemId]);

  const updateTipPosition = useCallback(() => {
    if (!tipItem || !itemRefs.current[tipItem.id]) return;
    const rect = itemRefs.current[tipItem.id]!.getBoundingClientRect();
    setTipStyle({
      position: 'fixed',
      top: `${rect.top + rect.height / 2}px`,
      left: `${rect.right + 8}px`,
      transform: 'translateY(-50%)',
      zIndex: 99999,
    });
  }, [tipItem]);

  useEffect(() => {
    if (popoverItem) {
      updateFlyoutPosition();
      window.addEventListener('scroll', updateFlyoutPosition, true);
      window.addEventListener('resize', updateFlyoutPosition);
      return () => {
        window.removeEventListener('scroll', updateFlyoutPosition, true);
        window.removeEventListener('resize', updateFlyoutPosition);
      };
    }
  }, [popoverItem, updateFlyoutPosition]);

  useEffect(() => {
    if (tipItem) {
      updateTipPosition();
      window.addEventListener('scroll', updateTipPosition, true);
      window.addEventListener('resize', updateTipPosition);
      return () => {
        window.removeEventListener('scroll', updateTipPosition, true);
        window.removeEventListener('resize', updateTipPosition);
      };
    }
  }, [tipItem, updateTipPosition]);

  const isModuleAlt =
    currentModule === 'warehouse' || currentModule === 'stocktake'
    || currentModule === 'members' || currentModule === 'recruitment' || currentModule === 'admin'
      || currentModule === 'technical' || currentModule === 'cskh' || currentModule === 'purchasing' || currentModule === 'suppliers';

  return (
    <aside
      className={`app-sidebar${isEffectiveCollapsed ? ' app-sidebar--collapsed' : ''}${mobileOpen ? ' app-sidebar--mobile-open' : ''}${isModuleAlt ? ' app-sidebar--module-alt' : ''}`}
    >
      <div className="sidebar-header">
        {isEffectiveCollapsed ? (
          <button
            type="button"
            onClick={onToggle}
            title="Mở rộng"
            className="sidebar-module-btn sidebar-module-btn--expand"
          >
            <ModuleIcon size={16} />
          </button>
        ) : (
          <>
            <div className="sidebar-header__main">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  title="Quay lại"
                  aria-label="Quay lại"
                  className="sidebar-module-btn sidebar-module-btn--back"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <div className="sidebar-module-icon">
                <ModuleIcon size={16} />
              </div>
              <span className="sidebar-module-label">{headerLabel}</span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              title="Thu gọn"
              className="sidebar-module-btn sidebar-module-btn--collapse desktop-only-flex"
            >
              <ChevronsLeft size={16} />
            </button>
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                title="Đóng menu"
                aria-label="Đóng menu"
                className="sidebar-module-btn sidebar-module-btn--close mobile-only-flex"
              >
                <X size={18} />
              </button>
            )}
          </>
        )}
      </div>

      <nav key={onBack ? 'drill-in' : isUnifiedNav ? 'unified' : currentModule} className="sidebar-nav sidebar-nav-enter">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = (item.children?.length ?? 0) > 0;
          const isExpanded = !!expandedItems[item.id];
          const isPopoverOpen = isEffectiveCollapsed && hasChildren && (activePopover === item.id || hoveredItem === item.id);
          const active = isParentActive(item) || isPopoverOpen || (!hasChildren && isActive(item.path));
          const locked = hasChildren
            ? !item.children!.some(c => isNavItemAccessible(permissions, c))
            : !isNavItemAccessible(permissions, item);

          return (
            <div
              key={item.id}
              ref={el => { itemRefs.current[item.id] = el; }}
              className="sidebar-item-container"
              onMouseEnter={() => handleItemMouseEnter(item)}
              onMouseLeave={handleItemMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  if (isEffectiveCollapsed) {
                    if (!hasChildren) navigateMenuItem(item);
                    else setActivePopover(p => p === item.id ? null : item.id);
                  } else if (hasChildren) {
                    toggleExpand(item.id);
                  } else {
                    navigateMenuItem(item);
                    if (!isUnifiedNav) {
                      setExpandedItems({});
                      setUserCollapsed(new Set());
                    }
                  }
                }}
                className={`sidebar-item${active ? ' active' : ''}${locked ? ' sidebar-item--locked' : ''}`}
                aria-label={isEffectiveCollapsed ? item.label : undefined}
                aria-expanded={hasChildren ? isExpanded : undefined}
              >
                <Icon size={18} className="sidebar-item__icon" />
                <span className={`sidebar-item__label sidebar-label flex-1 text-left${isEffectiveCollapsed ? ' collapsed' : ''}`}>
                  {item.label}
                </span>
                {hasChildren && !isEffectiveCollapsed && (
                  <ChevronDown
                    size={12}
                    className={`sidebar-item__chevron${isExpanded ? ' sidebar-item__chevron--open' : ''}`}
                  />
                )}
              </button>

              {hasChildren && !isEffectiveCollapsed && (
                <div className={`submenu-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="submenu-content">
                    <div className="sidebar-subnav">
                      {item.children!.map(c => {
                        const ChildIcon = c.icon;
                        const childLocked = !isNavItemAccessible(permissions, c);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => navigateMenuItem({
                              label: c.label,
                              path: c.path,
                              permission: c.permission,
                            })}
                            className={`sidebar-subitem${isActive(c.path) ? ' sidebar-subitem--active' : ''}${
                              childLocked ? ' sidebar-subitem--locked' : ''
                            }`}
                          >
                            {ChildIcon ? <ChildIcon size={15} className="sidebar-subitem__icon" aria-hidden /> : null}
                            <span>{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Flyout Popover (collapsed mode) ── */}
      {popoverItem && createPortal(
        <div
          onMouseEnter={handlePopoverEnter}
          onMouseLeave={handlePopoverLeave}
          style={flyoutStyle}
          className="animate-scale-in"
        >
          <div className="sidebar-flyout-bridge" />
          <div className="sidebar-flyout-panel">
            <div className="sidebar-flyout-panel__title">{popoverItem.label}</div>
            <div className="sidebar-flyout-panel__list">
              {popoverItem.children!.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    navigateMenuItem({
                      label: c.label,
                      path: c.path,
                      permission: c.permission,
                    });
                    setHoveredItem(null);
                    setActivePopover(null);
                  }}
                  className={`sidebar-flyout-item${isActive(c.path) ? ' sidebar-flyout-item--active' : ''}${
                    !isNavItemAccessible(permissions, c) ? ' sidebar-flyout-item--locked' : ''
                  }`}
                >
                  <span className="sidebar-flyout-item__dot" aria-hidden />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Label tip (collapsed leaf items) — vertically centered with icon ── */}
      {tipItem && createPortal(
        <div
          role="tooltip"
          style={tipStyle}
          className="sidebar-collapsed-tip"
        >
          {tipItem.label}
        </div>,
        document.body
      )}
    </aside>
  );
}
