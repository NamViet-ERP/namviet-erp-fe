import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronsLeft, ChevronLeft, Warehouse as WarehouseIcon, ClipboardCheck, Users, UserCheck, ShieldCheck, Settings, Wrench, ShoppingCart, Building2 } from 'lucide-react';
import type { SidebarMenuItem } from '../../types';
import type { LucideIcon } from 'lucide-react';
import type { PermissionKey } from '../../lib/permissions';
import { handlePermissionNavClick, isNavItemAccessible } from '../../lib/protectedNavigation';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin' | 'technical' | 'purchasing' | 'suppliers';

const moduleIcons: Record<Module, LucideIcon> = { 
  warehouse: WarehouseIcon, 
  stocktake: ClipboardCheck,
  members: Users,
  recruitment: UserCheck,
  admin: ShieldCheck,
  technical: Wrench,
  purchasing: ShoppingCart,
  suppliers: Building2,
};
const moduleLabels: Record<Module, string> = {
  warehouse: 'KHO HÀNG',
  stocktake: 'KIỂM KÊ',
  members: 'NHÂN VIÊN',
  recruitment: 'TUYỂN DỤNG',
  admin: 'ADMIN',
  technical: 'KỸ THUẬT',
  purchasing: 'MUA HÀNG',
  suppliers: 'NHÀ CUNG CẤP',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  menuItems: SidebarMenuItem[];
  permissions: readonly PermissionKey[];
  currentModule: Module;
  contextLabel?: string;
  onBack?: () => void;
}

export default function Sidebar({ collapsed, onToggle, menuItems, permissions, currentModule, contextLabel, onBack }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [userCollapsed, setUserCollapsed] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [flyoutStyle, setFlyoutStyle] = useState<React.CSSProperties>({});
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const ModuleIcon = onBack ? Settings : (moduleIcons[currentModule] || WarehouseIcon);
  const headerLabel = contextLabel ?? moduleLabels[currentModule];

  const isPathActive = (menuPath: string, pathname: string) => {
    if (!menuPath) return false;
    if (pathname === menuPath) return true;
    if (menuPath === '/warehouse/projects' && pathname.startsWith('/warehouse/projects/')) return true;
    return false;
  };

  const isActive = (path: string) => isPathActive(path, location.pathname);
  const isParentActive = (item: SidebarMenuItem) =>
    item.children
      ? item.children.some(c => isPathActive(c.path, location.pathname))
      : isPathActive(item.path, location.pathname);

  const navigateMenuItem = (item: SidebarMenuItem) => {
    handlePermissionNavClick(permissions, item, navigate);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedItems(prev => {
      const next = { ...prev };
      let changed = false;
      menuItems.forEach(item => {
        if (item.children && isParentActive(item) && !userCollapsed.has(item.id) && !next[item.id]) {
          next[item.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (collapsed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedItems({});
      setUserCollapsed(new Set());
      setHoveredItem(null);
      setActivePopover(null);
    } else {
      const init: Record<string, boolean> = {};
      menuItems.forEach(item => {
        if (item.children && isParentActive(item)) init[item.id] = true;
      });
      setExpandedItems(init);
      setUserCollapsed(new Set());
      setActivePopover(null);
    }
  }, [collapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (collapsed && !(e.target as Element).closest?.('.sidebar-item-container')) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsed]);

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
    if (!collapsed) return;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredItem(item.id);
    if (activePopover && activePopover !== item.id) setActivePopover(null);
  };
  const handleItemMouseLeave = () => {
    if (!collapsed) return;
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
  const popoverItemRaw = collapsed && popoverItemId ? menuItems.find(i => i.id === popoverItemId) : null;
  const popoverItem = (popoverItemRaw?.children?.length ?? 0) > 0 ? popoverItemRaw : null;

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

  const isModuleAlt =
    currentModule === 'warehouse' || currentModule === 'stocktake'
    || currentModule === 'members' || currentModule === 'recruitment' || currentModule === 'admin'
      || currentModule === 'technical' || currentModule === 'purchasing' || currentModule === 'suppliers';

  return (
    <aside
      className={`app-sidebar${collapsed ? ' app-sidebar--collapsed' : ''}${isModuleAlt ? ' app-sidebar--module-alt' : ''}`}
    >
      <div className="sidebar-header">
        {collapsed ? (
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
                  title="Quay lại Kho hàng"
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
              className="sidebar-module-btn sidebar-module-btn--collapse"
            >
              <ChevronsLeft size={16} />
            </button>
          </>
        )}
      </div>

      <nav key={currentModule} className="sidebar-nav sidebar-nav-enter">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = (item.children?.length ?? 0) > 0;
          const isExpanded = !!expandedItems[item.id];
          const isPopoverOpen = collapsed && hasChildren && (activePopover === item.id || hoveredItem === item.id);
          const active = isActive(item.path) || isParentActive(item) || isPopoverOpen || (!collapsed && isExpanded);
          const locked = !isNavItemAccessible(permissions, item);

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
                  if (collapsed) {
                    if (!hasChildren) navigateMenuItem(item);
                    else setActivePopover(p => p === item.id ? null : item.id);
                  } else {
                    if (hasChildren) {
                      toggleExpand(item.id);
                    } else {
                      navigateMenuItem(item);
                      setExpandedItems({});
                      setUserCollapsed(new Set());
                    }
                  }
                }}
                className={`sidebar-item${active ? ' active' : ''}${locked ? ' sidebar-item--locked' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="sidebar-item__icon" />
                <span className={`sidebar-item__label sidebar-label flex-1 text-left${collapsed ? ' collapsed' : ''}`}>
                  {item.label}
                </span>
                {hasChildren && !collapsed && (
                  <ChevronDown
                    size={12}
                    className={`sidebar-item__chevron${isExpanded ? ' sidebar-item__chevron--open' : ''}`}
                  />
                )}
              </button>

              {hasChildren && !collapsed && (
                <div className={`submenu-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="submenu-content">
                    <div className="sidebar-subnav">
                      {item.children!.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => navigateMenuItem({ ...item, path: c.path, label: c.label })}
                          className={`sidebar-subitem${isActive(c.path) ? ' sidebar-subitem--active' : ''}${
                            !isNavItemAccessible(permissions, item) ? ' sidebar-subitem--locked' : ''
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
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
                    navigateMenuItem({ ...popoverItem, path: c.path, label: c.label });
                    setHoveredItem(null);
                    setActivePopover(null);
                  }}
                  className={`sidebar-flyout-item${isActive(c.path) ? ' sidebar-flyout-item--active' : ''}${
                    !isNavItemAccessible(permissions, popoverItem) ? ' sidebar-flyout-item--locked' : ''
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
    </aside>
  );
}
