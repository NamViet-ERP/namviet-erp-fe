import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, PanelLeft, PanelRight, Warehouse as WarehouseIcon, ClipboardCheck, ChevronLeft } from 'lucide-react';

const moduleIcons = { warehouse: WarehouseIcon, stocktake: ClipboardCheck };
const moduleLabels = { warehouse: 'KHO HÀNG', stocktake: 'KIỂM KÊ' };

export default function Sidebar({ collapsed, onToggle, menuItems, currentModule }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const [userCollapsed, setUserCollapsed] = useState(new Set());
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activePopover, setActivePopover] = useState(null);
  const [flyoutStyle, setFlyoutStyle] = useState({});
  const hoverTimeout = useRef(null);
  const itemRefs = useRef({});

  const ModuleIcon = moduleIcons[currentModule] || WarehouseIcon;
  const isActive = (path) => location.pathname === path;
  const isParentActive = (item) => item.children ? item.children.some(c => location.pathname === c.path) : location.pathname === item.path;

  // Auto-expand active parents on location change
  useEffect(() => {
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
  }, [location.pathname]);

  // When sidebar collapses/expands, reset state
  useEffect(() => {
    if (collapsed) {
      setExpandedItems({});
      setUserCollapsed(new Set());
      setHoveredItem(null);
      setActivePopover(null);
    } else {
      const init = {};
      menuItems.forEach(item => {
        if (item.children && isParentActive(item)) init[item.id] = true;
      });
      setExpandedItems(init);
      setUserCollapsed(new Set());
      setActivePopover(null);
    }
  }, [collapsed]);

  // Click outside to close active popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (collapsed && !e.target.closest('.sidebar-item-container')) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsed]);

  const toggleExpand = (id) => {
    const wasExpanded = expandedItems[id];
    setExpandedItems(p => ({ ...p, [id]: !wasExpanded }));
    setUserCollapsed(prev => {
      const next = new Set(prev);
      wasExpanded ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleItemMouseEnter = (item) => { 
    if (!collapsed) return; 
    clearTimeout(hoverTimeout.current); 
    setHoveredItem(item.id); 
    if (activePopover && activePopover !== item.id) setActivePopover(null);
  };
  const handleItemMouseLeave = () => { if (!collapsed) return; hoverTimeout.current = setTimeout(() => setHoveredItem(null), 120); };
  const handlePopoverEnter = () => clearTimeout(hoverTimeout.current);
  const handlePopoverLeave = () => { hoverTimeout.current = setTimeout(() => { setHoveredItem(null); setActivePopover(null); }, 120); };

  useEffect(() => () => clearTimeout(hoverTimeout.current), []);

  const popoverItemId = activePopover || hoveredItem;
  const popoverItemRaw = collapsed && popoverItemId ? menuItems.find(i => i.id === popoverItemId) : null;
  const popoverItem = popoverItemRaw?.children?.length > 0 ? popoverItemRaw : null;

  const updateFlyoutPosition = useCallback(() => {
    if (!popoverItem || !itemRefs.current[popoverItemId]) return;
    const rect = itemRefs.current[popoverItemId].getBoundingClientRect();
    setFlyoutStyle({
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.right + 8}px`,
      minWidth: '220px',
      zIndex: 99999
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
    <aside className="fixed left-0 bottom-0 z-40 flex flex-col"
      style={{ top: '64px', width: collapsed ? '56px' : '232px', background: 'linear-gradient(to bottom, #ffffff, #f0f2f5)', borderRight: '1px solid #e8eaef', transition: 'width 300ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>

      {/* Sidebar Header with Toggle Button (Unified for smooth transition) */}
      <div 
        className="flex items-center justify-between flex-shrink-0"
        style={{ 
          height: '64px', 
          padding: collapsed ? '0 12px' : '0 16px', 
          borderBottom: '1px solid #f0f1f4',
          transition: 'padding 300ms cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        <div className="flex items-center overflow-hidden flex-1">
          <ModuleIcon 
            size={18} 
            className="flex-shrink-0 transition-all duration-200" 
            style={{ 
              color: '#b07825',
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : '18px',
              marginRight: collapsed ? 0 : '8px'
            }} 
          />
          <span 
            className="text-[13px] font-bold uppercase tracking-[0.06em] transition-all duration-200 truncate"
            style={{ 
              color: '#555d75',
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : '120px'
            }}
          >
            {moduleLabels[currentModule]}
          </span>
        </div>
        <button 
          onClick={onToggle} 
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors flex-shrink-0" 
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-4 transition-all duration-200">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children?.length > 0;
          const isExpanded = !!expandedItems[item.id];
          const isPopoverOpen = collapsed && hasChildren && (activePopover === item.id || hoveredItem === item.id);
          const active = isActive(item.path) || isParentActive(item) || isPopoverOpen || (!collapsed && isExpanded);

          return (
            <div key={item.id} ref={el => itemRefs.current[item.id] = el} className="mb-px relative sidebar-item-container"
              onMouseEnter={() => handleItemMouseEnter(item)} onMouseLeave={handleItemMouseLeave}>
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
                className={`w-full sidebar-item group ${active ? 'active' : ''}`}
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '9px 0' : '9px 12px',
                  gap: collapsed ? '0' : '10px',
                  background: active ? 'linear-gradient(to right, #fefce8, #fff7ed)' : undefined,
                  color: active ? '#b07825' : '#8890a5',
                  transition: 'padding 300ms cubic-bezier(0.2, 0.8, 0.2, 1), gap 300ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 150ms ease, color 150ms ease',
                }}
                title={collapsed ? item.label : undefined}>
                <Icon size={17} className="flex-shrink-0" style={{ color: active ? '#b07825' : '#8890a5' }} />
                <span className={`sidebar-label flex-1 text-left ${collapsed ? 'collapsed' : ''}`}>
                  {item.label}
                </span>
                {hasChildren && (
                  <ChevronDown 
                    size={13} 
                    className={`absolute right-3 transition-all duration-300 ${collapsed ? 'opacity-0 scale-50' : 'opacity-100 scale-100'} ${isExpanded ? 'rotate-180' : ''}`} 
                    style={{ color: '#b0b5c5', transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }} 
                  />
                )}
              </button>

              {/* Expanded sub-items with smooth height transition */}
              {hasChildren && !collapsed && (
                <div className={`submenu-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="submenu-content">
                    <div className="ml-[22px] pl-3 mt-0.5 mb-1" style={{ borderLeft: '1.5px solid #e8eaef' }}>
                      {item.children.map(c => (
                        <button key={c.id} onClick={() => navigate(c.path)}
                          className="w-full text-left px-2.5 py-[6px] text-[13px] rounded-md transition-all duration-100 hover:bg-gray-50"
                          style={{ fontWeight: isActive(c.path) ? 600 : 400,
                            color: isActive(c.path) ? '#b07825' : '#7a829a',
                            background: isActive(c.path) ? 'linear-gradient(to right, #fff7ed, #fffcf2)' : undefined }}>
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

      {/* Flyout Popover Portal */}
      {popoverItem && createPortal(
        <div 
          onMouseEnter={handlePopoverEnter} 
          onMouseLeave={handlePopoverLeave}
          className="fixed animate-scale-in origin-left" 
          style={flyoutStyle}
        >
          {/* Invisible bridge for hover */}
          <div className="absolute top-0 bottom-0 -left-[12px] w-[12px]" />

          <div className="relative">
            {/* Left pointing arrow */}
            <div className="absolute -left-[5px] top-[14px] w-3 h-3 bg-white border-l border-b border-[#e5e7ec] rotate-45 z-0" />
            
            <div className="relative z-10 bg-white rounded-xl py-2"
              style={{ border: '1px solid #e5e7ec', boxShadow: '0 10px 40px -10px rgba(20,25,40,0.15)' }}>
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] mb-1"
                style={{ color: '#9a9fb0', borderBottom: '1px solid #f0f1f4' }}>{popoverItem.label}</div>
              {popoverItem.children.map(c => (
                    <button key={c.id} onClick={() => { navigate(c.path); setHoveredItem(null); setActivePopover(null); }}
                      className="w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-gray-50 flex items-center gap-2.5"
                      style={{ 
                        fontWeight: isActive(c.path) ? 600 : 400, 
                        color: isActive(c.path) ? '#b07825' : '#555d75',
                        background: isActive(c.path) ? 'linear-gradient(to right, #fff7ed, #fffcf2)' : undefined 
                      }}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity duration-200 ${isActive(c.path) ? 'opacity-100' : 'opacity-0'}`} 
                        style={{ background: '#c07a2a' }} />
                      <span className="-ml-1">{c.label}</span>
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
