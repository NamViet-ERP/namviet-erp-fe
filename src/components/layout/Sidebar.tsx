import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, ChevronLeft, Warehouse as WarehouseIcon, ClipboardCheck } from 'lucide-react';
import type { SidebarMenuItem } from '../../types';
import type { LucideIcon } from 'lucide-react';

type Module = 'warehouse' | 'stocktake';

const moduleIcons: Record<Module, LucideIcon> = { warehouse: WarehouseIcon, stocktake: ClipboardCheck };
const moduleLabels: Record<Module, string> = { warehouse: 'KHO HÀNG', stocktake: 'KIỂM KÊ' };

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  menuItems: SidebarMenuItem[];
  currentModule: Module;
}

export default function Sidebar({ collapsed, onToggle, menuItems, currentModule }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [userCollapsed, setUserCollapsed] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [flyoutStyle, setFlyoutStyle] = useState<React.CSSProperties>({});
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const ModuleIcon = moduleIcons[currentModule] || WarehouseIcon;
  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: SidebarMenuItem) =>
    item.children ? item.children.some(c => location.pathname === c.path) : location.pathname === item.path;

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

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        top: '64px',
        width: collapsed ? '72px' : '240px',
        background: 'var(--md-surface-container)',
        borderRight: '1px solid var(--md-outline-variant)',
        transition: 'width 300ms var(--md-easing)',
      }}
    >
      {/* ── Sidebar Header ── */}
      <div
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 16px' : '0 12px 0 20px',
          borderBottom: '1px solid var(--md-outline-variant)',
          flexShrink: 0,
          transition: 'padding 300ms var(--md-easing)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: collapsed ? '0 0 auto' : 1 }}>
          <ModuleIcon
            size={18}
            style={{
              color: 'var(--md-primary)',
              flexShrink: 0,
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : '18px',
              marginRight: collapsed ? 0 : '8px',
              transition: 'all 250ms var(--md-easing)',
            }}
          />
          <span
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--md-on-surface-variant)',
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : '120px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'all 250ms var(--md-easing)',
            }}
          >
            {moduleLabels[currentModule]}
          </span>
        </div>

        <button
          onClick={onToggle}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-on-surface-variant)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 200ms var(--md-easing), color 200ms var(--md-easing)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(103,80,164,0.08)'; e.currentTarget.style.color = 'var(--md-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--md-on-surface-variant)'; }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px', transition: 'all 200ms var(--md-easing)' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = (item.children?.length ?? 0) > 0;
          const isExpanded = !!expandedItems[item.id];
          const isPopoverOpen = collapsed && hasChildren && (activePopover === item.id || hoveredItem === item.id);
          const active = isActive(item.path) || isParentActive(item) || isPopoverOpen || (!collapsed && isExpanded);

          return (
            <div
              key={item.id}
              ref={el => { itemRefs.current[item.id] = el; }}
              style={{ marginBottom: '2px', position: 'relative' }}
              className="sidebar-item-container"
              onMouseEnter={() => handleItemMouseEnter(item)}
              onMouseLeave={handleItemMouseLeave}
            >
              <button
                onClick={() => {
                  if (collapsed) {
                    if (!hasChildren) navigate(item.path);
                    else setActivePopover(p => p === item.id ? null : item.id);
                  } else {
                    if (hasChildren) {
                      toggleExpand(item.id);
                    } else {
                      navigate(item.path);
                      setExpandedItems({});
                      setUserCollapsed(new Set());
                    }
                  }
                }}
                className={`sidebar-item ${active ? 'active' : ''}`}
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px' : '10px 16px',
                  gap: collapsed ? '0' : '12px',
                  transition: 'padding 300ms var(--md-easing), gap 300ms var(--md-easing)',
                  width: '100%',
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  size={20}
                  style={{
                    flexShrink: 0,
                    color: active ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                    transition: 'color 200ms var(--md-easing)',
                  }}
                />
                <span
                  className={`sidebar-label flex-1 text-left ${collapsed ? 'collapsed' : ''}`}
                  style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.875rem' }}
                >
                  {item.label}
                </span>
                {hasChildren && !collapsed && (
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--md-on-surface-variant)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      opacity: collapsed ? 0 : 1,
                      transition: 'transform 300ms var(--md-easing), opacity 200ms var(--md-easing)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>

              {/* Expanded sub-items — MD3 style */}
              {hasChildren && !collapsed && (
                <div className={`submenu-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="submenu-content">
                    <div
                      style={{
                        marginLeft: '28px',
                        paddingLeft: '8px',
                        marginTop: '2px',
                        marginBottom: '4px',
                        borderLeft: '2px solid var(--md-outline-variant)',
                      }}
                    >
                      {item.children!.map(c => (
                        <button
                          key={c.id}
                          onClick={() => navigate(c.path)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 12px',
                            fontFamily: "'Roboto', sans-serif",
                            fontSize: '0.8125rem',
                            fontWeight: isActive(c.path) ? 700 : 400,
                            borderRadius: '9999px',
                            border: 'none',
                            background: isActive(c.path) ? 'var(--md-secondary-container)' : 'transparent',
                            color: isActive(c.path) ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                            cursor: 'pointer',
                            transition: 'background 200ms var(--md-easing), color 200ms var(--md-easing)',
                            display: 'block',
                          }}
                          onMouseEnter={e => {
                            if (!isActive(c.path)) {
                              e.currentTarget.style.background = 'rgba(103,80,164,0.08)';
                              e.currentTarget.style.color = 'var(--md-on-surface)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive(c.path)) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--md-on-surface-variant)';
                            }
                          }}
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
          style={{ ...flyoutStyle }}
          className="animate-scale-in"
        >
          {/* Hover bridge */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '-10px', width: '10px' }} />

          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                background: 'var(--md-surface-container)',
                borderRadius: '4px',
                boxShadow: 'var(--md-shadow-3)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--md-on-surface-variant)',
                  padding: '12px 16px 8px',
                  borderBottom: '1px solid var(--md-outline-variant)',
                }}
              >
                {popoverItem.label}
              </div>
              <div style={{ padding: '4px 0' }}>
                {popoverItem.children!.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { navigate(c.path); setHoveredItem(null); setActivePopover(null); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontFamily: "'Roboto', sans-serif",
                      fontSize: '0.875rem',
                      fontWeight: isActive(c.path) ? 500 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      border: 'none',
                      background: isActive(c.path) ? 'var(--md-secondary-container)' : 'transparent',
                      color: isActive(c.path) ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface)',
                      cursor: 'pointer',
                      transition: 'background 200ms var(--md-easing)',
                    }}
                    onMouseEnter={e => { if (!isActive(c.path)) e.currentTarget.style.background = 'rgba(103,80,164,0.08)'; }}
                    onMouseLeave={e => { if (!isActive(c.path)) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isActive(c.path) ? 'var(--md-primary)' : 'var(--md-outline)',
                        flexShrink: 0,
                      }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}
