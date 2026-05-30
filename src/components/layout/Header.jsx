import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Grid3X3, Settings, BarChart3, Bell, ChevronDown,
  User, LogOut, X, Check, AlertTriangle, Package, FileText
} from 'lucide-react';

const moduleLabels = {
  warehouse: 'KHO HÀNG',
  stocktake: 'KIỂM KÊ',
};

const currentUser = {
  name: 'Admin',
  initials: 'AD',
  role: 'Quản trị viên',
  email: 'admin@namviet.vn',
};

const mockNotifications = [
  { id: 1, type: 'import', title: 'Phiếu nhập #NK-2026001', message: 'Đã được duyệt bởi Nguyễn Văn A', time: '5 phút trước', read: false, icon: Package },
  { id: 2, type: 'warning', title: 'Tồn kho thấp', message: 'Sản phẩm "Xi măng PCB40" sắp hết hàng', time: '15 phút trước', read: false, icon: AlertTriangle },
  { id: 3, type: 'export', title: 'Phiếu xuất #XK-2026043', message: 'Đang chờ xác nhận xuất kho', time: '1 giờ trước', read: false, icon: FileText },
  { id: 4, type: 'info', title: 'Kiểm kê hoàn tất', message: 'Đợt kiểm kê tháng 5 đã hoàn thành', time: '2 giờ trước', read: true, icon: Check },
  { id: 5, type: 'import', title: 'Phiếu nhập #NK-2026000', message: 'Nhập kho thành công 150 sản phẩm', time: '3 giờ trước', read: true, icon: Package },
];

export default function Header({ currentModule, onModuleSwitch }) {
  const navigate = useNavigate();
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserTooltip, setShowUserTooltip] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [searchFocused, setSearchFocused] = useState(false);

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const moduleMenuRef = useRef(null);
  const tooltipTimeout = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(e.target)) setShowModuleMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleUserMouseEnter = () => {
    if (!showUserMenu) tooltipTimeout.current = setTimeout(() => setShowUserTooltip(true), 400);
  };
  const handleUserMouseLeave = () => { clearTimeout(tooltipTimeout.current); setShowUserTooltip(false); };
  const handleUserClick = () => { clearTimeout(tooltipTimeout.current); setShowUserTooltip(false); setShowUserMenu(p => !p); setShowNotifications(false); };
  const handleNotifClick = () => { setShowNotifications(p => !p); setShowUserMenu(false); };
  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const markAsRead = (id) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));

  const notifColors = {
    warning: { bg: '#fef7e6', color: '#9a7520' },
    import:  { bg: '#e8f1fa', color: '#3a6ea5' },
    export:  { bg: '#f0e8fa', color: '#6a4ca5' },
    info:    { bg: '#e6f5ee', color: '#2a7a50' },
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-5"
      style={{ background: '#1a1e2e', borderBottom: '1px solid #2a2f42' }}>

      {/* Left: Logo */}
      <div className="flex items-center gap-3 cursor-pointer group"
        onClick={() => navigate('/warehouse/dashboard')} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') navigate('/warehouse/dashboard'); }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[11px] tracking-tight"
          style={{ background: 'linear-gradient(135deg, #3a6ea5, #2a8a8a)', color: '#fff' }}>
          NV
        </div>
        <div className="hidden sm:block leading-none">
          <div className="font-semibold text-[14px] text-white tracking-[-0.01em]">
            Nam<span style={{ color: '#d4943a' }}>Việt</span>
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: '#7a829a' }}>Warehouse Management</div>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-lg mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={15}
            style={{ color: searchFocused ? '#a0a8c0' : '#555d75' }} />
          <input type="text" placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-[13px] transition-all duration-300 ease-out"
            style={{
              background: searchFocused ? '#252a3c' : '#22263a',
              border: `1px solid ${searchFocused ? '#3a4060' : '#2a2f42'}`,
              color: '#d0d4e0', outline: 'none',
            }}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Module switcher */}
        <div className="relative" ref={moduleMenuRef}>
          <IconBtn title="Chuyển module" active={showModuleMenu}
            onClick={() => setShowModuleMenu(!showModuleMenu)}>
            <Grid3X3 size={18} />
          </IconBtn>
          {showModuleMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50 animate-scale-in"
              style={{ background: '#fff', border: '1px solid #e5e7ec', boxShadow: '0 8px 30px rgba(20,25,40,0.12)' }}>
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9a9fb0' }}>Modules</div>
              {Object.entries(moduleLabels).map(([key, label]) => (
                <button key={key}
                  onClick={() => { onModuleSwitch(key); setShowModuleMenu(false); }}
                  className="w-full text-left px-3 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-gray-50"
                  style={{ color: currentModule === key ? '#b07825' : '#555d75', fontWeight: currentModule === key ? 600 : 400,
                    background: currentModule === key ? '#faf5ed' : undefined }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentModule === key ? '#c07a2a' : '#d0d4e0' }} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <IconBtn title="Cài đặt"><Settings size={18} /></IconBtn>

        <div className="w-px h-5 mx-1.5" style={{ background: '#2a2f42' }} />

        <button className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 ease-out"
          style={{ border: '1px solid #3a4060', color: '#a0a8c0' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#252a3c'; e.currentTarget.style.color = '#d0d4e0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0a8c0'; }}>
          <BarChart3 size={14} /> BÁO CÁO
        </button>

        <div className="w-px h-5 mx-1.5" style={{ background: '#2a2f42' }} />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <IconBtn title="Thông báo" active={showNotifications} onClick={handleNotifClick} badge={unreadCount}>
            <Bell size={18} />
          </IconBtn>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[380px] rounded-xl overflow-hidden z-50 animate-scale-in"
              style={{ background: '#fff', border: '1px solid #e5e7ec', boxShadow: '0 8px 30px rgba(20,25,40,0.15)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f0f1f4' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: '#1a1e2e' }}>Thông báo</span>
                  {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: '#fde8e6', color: '#b5403a' }}>{unreadCount}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && <button onClick={markAllRead}
                    className="text-[11px] font-medium px-2 py-1 rounded transition-colors hover:bg-gray-50"
                    style={{ color: '#3a6ea5' }}>Đánh dấu đã đọc</button>}
                  <button onClick={() => setShowNotifications(false)}
                    className="p-1 rounded transition-colors hover:bg-gray-100" style={{ color: '#9a9fb0' }}>
                    <X size={13} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(n => {
                  const NIcon = n.icon;
                  const c = notifColors[n.type] || notifColors.info;
                  return (
                    <button key={n.id} onClick={() => markAsRead(n.id)}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-gray-50"
                      style={{ background: !n.read ? '#f6f8fc' : undefined, borderBottom: '1px solid #f5f6f8' }}>
                      <div className="mt-0.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: c.bg, color: c.color }}><NIcon size={14} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] truncate" style={{ fontWeight: !n.read ? 600 : 400, color: '#1a1e2e' }}>{n.title}</p>
                          {!n.read && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#3a6ea5' }} />}
                        </div>
                        <p className="text-[12px] mt-0.5 truncate" style={{ color: '#7a829a' }}>{n.message}</p>
                        <p className="text-[11px] mt-1" style={{ color: '#a5aab8' }}>{n.time}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2" style={{ borderTop: '1px solid #f0f1f4', background: '#fafbfc' }}>
                <button className="w-full text-center text-[12px] font-medium py-1 rounded transition-colors hover:bg-gray-100"
                  style={{ color: '#3a6ea5' }}>Xem tất cả thông báo</button>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative" ref={userMenuRef}>
          <button onClick={handleUserClick} onMouseEnter={handleUserMouseEnter} onMouseLeave={handleUserMouseLeave}
            className="ml-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors"
            style={{ background: showUserMenu ? '#252a3c' : undefined }}
            onMouseOver={e => { if (!showUserMenu) e.currentTarget.style.background = '#252a3c'; }}
            onMouseOut={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3a6ea5, #2a5a8a)', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
              {currentUser.initials}
            </div>
            <ChevronDown size={12} className={`hidden sm:block transition-transform duration-300 ease-out ${showUserMenu ? 'rotate-180' : ''}`}
              style={{ color: '#555d75' }} />
          </button>
          {showUserTooltip && !showUserMenu && (
            <div className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg whitespace-nowrap z-50 animate-fade-in pointer-events-none"
              style={{ background: '#2a2f42', color: '#d0d4e0' }}>
              <div className="text-[12px] font-medium">{currentUser.name}</div>
              <div className="text-[11px]" style={{ color: '#7a829a' }}>{currentUser.role}</div>
            </div>
          )}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50 animate-scale-in"
              style={{ background: '#fff', border: '1px solid #e5e7ec', boxShadow: '0 8px 30px rgba(20,25,40,0.12)' }}>
              <div className="px-3 py-3 flex items-center gap-2.5" style={{ borderBottom: '1px solid #f0f1f4' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3a6ea5, #2a5a8a)', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                  {currentUser.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: '#1a1e2e' }}>{currentUser.name}</p>
                  <p className="text-[11px]" style={{ color: '#7a829a' }}>{currentUser.email}</p>
                </div>
              </div>
              <div className="py-1">
                <MenuBtn icon={User} label="Thông tin tài khoản" onClick={() => setShowUserMenu(false)} />
                <MenuBtn icon={Settings} label="Cài đặt" onClick={() => setShowUserMenu(false)} />
              </div>
              <div className="py-1" style={{ borderTop: '1px solid #f0f1f4' }}>
                <MenuBtn icon={LogOut} label="Đăng xuất" danger onClick={() => { setShowUserMenu(false); alert('Đăng xuất'); }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children, title, active, onClick, badge }) {
  return (
    <button onClick={onClick} className="relative p-2 rounded-lg transition-colors duration-300 ease-out" title={title}
      style={{ color: active ? '#d0d4e0' : '#6a7190', background: active ? '#252a3c' : undefined }}
      onMouseEnter={e => { e.currentTarget.style.background = '#252a3c'; e.currentTarget.style.color = '#d0d4e0'; }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6a7190'; } }}>
      {children}
      {badge > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1"
        style={{ background: '#c04a3a', color: '#fff', border: '2px solid #1a1e2e' }}>{badge}</span>}
    </button>
  );
}

function MenuBtn({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-gray-50"
      style={{ color: danger ? '#c04a3a' : '#555d75' }}>
      <Icon size={15} style={{ color: danger ? '#d06a5a' : '#9a9fb0' }} /> {label}
    </button>
  );
}
