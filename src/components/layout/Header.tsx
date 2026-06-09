import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoWhite from '../../assets/logo-white.png';
import {
  Search, Grid3X3, Settings, BarChart3, Bell, ChevronDown,
  User, LogOut, X, Check, AlertTriangle, Package, FileText, Moon, Sun,
  Megaphone, HeartHandshake, ShoppingCart, CreditCard, FolderKanban,
  FileSignature, Wrench, Factory, Users, ChevronRight, Calendar,
  TrendingUp, ClipboardCheck, UserCheck, Gift, ArrowLeftRight, Barcode,
  PackagePlus, Truck, Activity, Warehouse, DollarSign
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { showToast } from '../ui/Toast';

interface SubItem {
  label: string;
  icon: LucideIcon;
  path?: string;
}

interface Department {
  title: string;
  icon: LucideIcon;
  items: SubItem[];
}

const departments: Department[] = [
  {
    title: 'MARKETING - SALE',
    icon: Megaphone,
    items: [
      { label: 'Marketing - Sale', icon: TrendingUp }
    ]
  },
  {
    title: 'CSKH - SAU BÁN',
    icon: HeartHandshake,
    items: [
      { label: 'Chăm sóc Khách Hàng', icon: Users },
      { label: 'Lịch CSKH - Sau Bán', icon: Calendar },
      { label: 'Công Việc CSKH', icon: ClipboardCheck },
      { label: 'Bảo Hành', icon: Wrench }
    ]
  },
  {
    title: 'MUA HÀNG',
    icon: ShoppingCart,
    items: [
      { label: 'Nhà Cung Cấp', icon: Truck, path: '/warehouse/suppliers' },
      { label: 'Mua Hàng', icon: PackagePlus, path: '/warehouse/expected-imports' }
    ]
  },
  {
    title: 'KÊ TOÁN',
    icon: CreditCard,
    items: [
      { label: 'Công Nợ Bán', icon: DollarSign },
      { label: 'Công Nợ Mua', icon: DollarSign },
      { label: 'Quỹ', icon: Activity },
      { label: 'Ngân Hàng', icon: Warehouse },
      { label: 'Phiếu Kế Toán/Kế Hoạch Chi', icon: FileSignature },
      { label: 'Đề Nghị Thanh Toán', icon: FileSignature }
    ]
  },
  {
    title: 'DỰ ÁN',
    icon: FolderKanban,
    items: [
      { label: 'Công Việc Dự Án', icon: ClipboardCheck },
      { label: 'Lịch Dự Án', icon: Calendar }
    ]
  },
  {
    title: 'BÁN HÀNG',
    icon: FileSignature,
    items: [
      { label: 'Bán Hàng', icon: DollarSign },
      { label: 'Kế Hoạch Giao Hàng', icon: Calendar },
      { label: 'Hợp Đồng Bán', icon: FileSignature },
      { label: 'Trả Lại Hàng Bán', icon: ArrowLeftRight }
    ]
  },
  {
    title: 'KỸ THUẬT',
    icon: Wrench,
    items: [
      { label: 'Công Việc Kỹ Thuật', icon: ClipboardCheck },
      { label: 'Lịch Kỹ Thuật', icon: Calendar },
      { label: 'Chăm Sóc Khách Hàng', icon: Users },
      { label: 'Đánh Giá (KPI)', icon: Activity }
    ]
  },
  {
    title: 'KHO HÀNG',
    icon: Warehouse,
    items: [
      { label: 'Kho Hàng', icon: Warehouse, path: '/warehouse/dashboard-warehouse' },
      { label: 'Kiểm Kê', icon: ClipboardCheck, path: '/stocktake/list' },
      { label: 'Thành Phẩm, Phụ Tùng, NVL', icon: Barcode, path: '/warehouse/stock' }
    ]
  },
  {
    title: 'SẢN XUẤT',
    icon: Factory,
    items: [
      { label: 'Sản Xuất', icon: Factory },
      { label: 'QC', icon: Activity }
    ]
  },
  {
    title: 'HRM',
    icon: Users,
    items: [
      { label: 'Nhân Viên', icon: Users, path: '/members/list' },
      { label: 'Tuyển Dụng', icon: UserCheck },
      { label: 'C & B', icon: CreditCard },
      { label: 'Đăng Ký KM', icon: FileSignature },
      { label: 'Công Tác Phí', icon: DollarSign }
    ]
  }
];

const renderCake = () => (
  <svg width="60" height="60" viewBox="0 0 120 120" className="mx-auto block" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}>
    <path d="M20,95 L100,95 A3,3 0 0,1 100,98 L20,98 A3,3 0 0,1 20,95 Z" fill="var(--md-outline)" />
    <path d="M48,98 L72,98 L68,106 L52,106 Z" fill="var(--md-outline-variant)" />
    <rect x="25" y="65" width="70" height="30" rx="4" fill="var(--md-primary)" opacity="0.85" />
    <path d="M25,75 Q60,82 95,75" fill="none" stroke="var(--md-primary-container)" strokeWidth="2" />
    <circle cx="35" cy="73" r="2.5" fill="#f43f5e" />
    <circle cx="48" cy="73" r="2.5" fill="#eab308" />
    <circle cx="60" cy="73" r="2.5" fill="#10b981" />
    <circle cx="72" cy="73" r="2.5" fill="#f43f5e" />
    <circle cx="85" cy="73" r="2.5" fill="#eab308" />
    <rect x="35" y="42" width="50" height="23" rx="4" fill="var(--md-secondary)" />
    <path d="M35,49 Q60,55 85,49" fill="none" stroke="var(--md-secondary-container)" strokeWidth="2" />
    <circle cx="43" cy="47" r="2" fill="#eab308" />
    <circle cx="51" cy="47" r="2" fill="#f43f5e" />
    <circle cx="60" cy="47" r="2" fill="#10b981" />
    <circle cx="69" cy="47" r="2" fill="#eab308" />
    <circle cx="77" cy="47" r="2" fill="#f43f5e" />
    <rect x="44" y="28" width="2" height="14" fill="#fb923c" />
    <path d="M45,23 C46,25 45,28 45,28 C44,28 43,25 45,23 Z" fill="#ef4444" className="animate-pulse" />
    <rect x="59" y="24" width="2" height="18" fill="#f87171" />
    <path d="M60,18 C61,21 60,24 60,24 C59,24 58,21 60,18 Z" fill="#f59e0b" className="animate-pulse" />
    <rect x="74" y="28" width="2" height="14" fill="#fb923c" />
    <path d="M75,23 C76,25 75,28 75,28 C74,28 73,25 75,23 Z" fill="#ef4444" className="animate-pulse" />
    <ellipse cx="60" cy="42" rx="4" ry="2" fill="var(--md-surface-container-high)" />
    <circle cx="60" cy="40" r="1.5" fill="#ef4444" />
  </svg>
);

type Module = 'warehouse' | 'stocktake' | 'members';
type NotifType = 'warning' | 'import' | 'export' | 'info';

const moduleLabels: Record<Module, string> = { 
  warehouse: 'Kho hàng', 
  stocktake: 'Kiểm kê',
  members: 'Thành viên'
};

interface User {
  name: string;
  initials: string;
  role: string;
  email: string;
}

const rolesMap = {
  admin: { name: 'Admin', initials: 'AD', role: 'Quản trị viên', email: 'admin@namviet.vn' },
  accountant: { name: 'Lê Thị Hồng', initials: 'LH', role: 'Kế toán trưởng', email: 'hong.le@namviet.vn' },
  procurement: { name: 'Mỹ Chi', initials: 'MC', role: 'Phòng mua hàng', email: 'chi.my@namviet.vn' },
  pm: { name: 'Nguyễn Văn Hùng', initials: 'NH', role: 'Quản lý dự án (PM)', email: 'hung.nguyen@namviet.vn' },
  storekeeper: { name: 'Phan Văn Vỹ', initials: 'VV', role: 'Thủ kho (Storekeeper)', email: 'vy.phan@namviet.vn' },
};

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
  warning: { bg: 'var(--md-tertiary-container)',        color: 'var(--md-on-tertiary-container)' },
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
          ? 'rgba(179,38,30,0.08)'
          : 'rgba(103,80,164,0.08)';
      }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={18} strokeWidth={1.5} style={{ color: danger ? 'var(--md-error)' : 'var(--md-on-surface-variant)', flexShrink: 0 }} />
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
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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

export default function Header({ currentModule, onModuleSwitch }: HeaderProps) {
  const navigate = useNavigate();
  const activeRole = localStorage.getItem('nv-user-role') || 'admin';
  const currentUser = rolesMap[activeRole as keyof typeof rolesMap] || rolesMap.admin;

  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchFocused, setSearchFocused] = useState(false);
  const [dark, setDark] = useDarkMode();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(e.target as Node)) setShowModuleMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
          src={logoWhite}
          alt="Mayzer Logo"
          style={{
            height: '60px',
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
          <IconBtn title="Chuyển module" active={showModuleMenu} onClick={() => setShowModuleMenu(!showModuleMenu)}>
            <Grid3X3 size={20} />
          </IconBtn>
          {showModuleMenu && (
            <>
              {/* Backdrop */}
              <div
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
                onClick={() => setShowModuleMenu(false)}
              />
              {/* Mega Menu Dropdown */}
              <div
                className="animate-scale-in"
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
                  {/* Column 1: MARKETING-SALE, CSKH-SAU BÁN, MUA HÀNG */}
                  <div className="flex flex-col gap-3">
                    {departments.slice(0, 3).map((dept) => {
                      const DeptIcon = dept.icon;
                      return (
                        <div 
                          key={dept.title} 
                          className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--md-outline-variant)]">
                            <DeptIcon size={16} className="text-[var(--md-secondary)]" />
                            <h3 className="text-[11.5px] font-bold text-[var(--md-primary)]">{dept.title}</h3>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {dept.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <button
                                  key={item.label}
                                  onClick={() => {
                                    if (item.path) {
                                      navigate(item.path);
                                    } else {
                                      showToast('info', `Phân hệ "${item.label}" thuộc bộ phận "${dept.title}" đang được phát triển.`, 'Chức năng giả lập');
                                    }
                                    setShowModuleMenu(false);
                                  }}
                                  className="flex items-center justify-between w-full p-2 bg-[var(--md-surface-container-low)] hover:bg-[var(--nv-sidebar-item-hover)] border border-[var(--md-outline-variant)] hover:border-[var(--md-secondary)] rounded transition-all duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]"
                                  style={{ borderStyle: 'solid', borderWidth: '1px', outlineOffset: '2px', cursor: 'pointer' }}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <ItemIcon size={14} className="text-[var(--md-on-surface-variant)] flex-shrink-0" />
                                    <span className="text-[12px] font-medium text-[var(--md-on-surface)] truncate">{item.label}</span>
                                  </div>
                                  <ChevronRight size={12} className="text-[var(--md-on-surface-variant)] flex-shrink-0 ml-1" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 2: KẾ TOÁN, DỰ ÁN */}
                  <div className="flex flex-col gap-3">
                    {departments.slice(3, 5).map((dept) => {
                      const DeptIcon = dept.icon;
                      return (
                        <div 
                          key={dept.title} 
                          className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--md-outline-variant)]">
                            <DeptIcon size={16} className="text-[var(--md-secondary)]" />
                            <h3 className="text-[11.5px] font-bold text-[var(--md-primary)]">{dept.title}</h3>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {dept.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <button
                                  key={item.label}
                                  onClick={() => {
                                    if (item.path) {
                                      navigate(item.path);
                                    } else {
                                      showToast('info', `Phân hệ "${item.label}" thuộc bộ phận "${dept.title}" đang được phát triển.`, 'Chức năng giả lập');
                                    }
                                    setShowModuleMenu(false);
                                  }}
                                  className="flex items-center justify-between w-full p-2 bg-[var(--md-surface-container-low)] hover:bg-[var(--nv-sidebar-item-hover)] border border-[var(--md-outline-variant)] hover:border-[var(--md-secondary)] rounded transition-all duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]"
                                  style={{ borderStyle: 'solid', borderWidth: '1px', outlineOffset: '2px', cursor: 'pointer' }}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <ItemIcon size={14} className="text-[var(--md-on-surface-variant)] flex-shrink-0" />
                                    <span className="text-[12px] font-medium text-[var(--md-on-surface)] truncate">{item.label}</span>
                                  </div>
                                  <ChevronRight size={12} className="text-[var(--md-on-surface-variant)] flex-shrink-0 ml-1" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 3: BÁN HÀNG, KỸ THUẬT */}
                  <div className="flex flex-col gap-3">
                    {departments.slice(5, 7).map((dept) => {
                      const DeptIcon = dept.icon;
                      return (
                        <div 
                          key={dept.title} 
                          className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--md-outline-variant)]">
                            <DeptIcon size={16} className="text-[var(--md-secondary)]" />
                            <h3 className="text-[11.5px] font-bold text-[var(--md-primary)]">{dept.title}</h3>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {dept.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <button
                                  key={item.label}
                                  onClick={() => {
                                    if (item.path) {
                                      navigate(item.path);
                                    } else {
                                      showToast('info', `Phân hệ "${item.label}" thuộc bộ phận "${dept.title}" đang được phát triển.`, 'Chức năng giả lập');
                                    }
                                    setShowModuleMenu(false);
                                  }}
                                  className="flex items-center justify-between w-full p-2 bg-[var(--md-surface-container-low)] hover:bg-[var(--nv-sidebar-item-hover)] border border-[var(--md-outline-variant)] hover:border-[var(--md-secondary)] rounded transition-all duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]"
                                  style={{ borderStyle: 'solid', borderWidth: '1px', outlineOffset: '2px', cursor: 'pointer' }}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <ItemIcon size={14} className="text-[var(--md-on-surface-variant)] flex-shrink-0" />
                                    <span className="text-[12px] font-medium text-[var(--md-on-surface)] truncate">{item.label}</span>
                                  </div>
                                  <ChevronRight size={12} className="text-[var(--md-on-surface-variant)] flex-shrink-0 ml-1" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 4: KHO HÀNG, SẢN XUẤT */}
                  <div className="flex flex-col gap-3">
                    {departments.slice(7, 9).map((dept) => {
                      const DeptIcon = dept.icon;
                      return (
                        <div 
                          key={dept.title} 
                          className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--md-outline-variant)]">
                            <DeptIcon size={16} className="text-[var(--md-secondary)]" />
                            <h3 className="text-[11.5px] font-bold text-[var(--md-primary)]">{dept.title}</h3>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {dept.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <button
                                  key={item.label}
                                  onClick={() => {
                                    if (item.path) {
                                      navigate(item.path);
                                    } else {
                                      showToast('info', `Phân hệ "${item.label}" thuộc bộ phận "${dept.title}" đang được phát triển.`, 'Chức năng giả lập');
                                    }
                                    setShowModuleMenu(false);
                                  }}
                                  className="flex items-center justify-between w-full p-2 bg-[var(--md-surface-container-low)] hover:bg-[var(--nv-sidebar-item-hover)] border border-[var(--md-outline-variant)] hover:border-[var(--md-secondary)] rounded transition-all duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]"
                                  style={{ borderStyle: 'solid', borderWidth: '1px', outlineOffset: '2px', cursor: 'pointer' }}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <ItemIcon size={14} className="text-[var(--md-on-surface-variant)] flex-shrink-0" />
                                    <span className="text-[12px] font-medium text-[var(--md-on-surface)] truncate">{item.label}</span>
                                  </div>
                                  <ChevronRight size={12} className="text-[var(--md-on-surface-variant)] flex-shrink-0 ml-1" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 5: HRM */}
                  <div className="flex flex-col gap-3">
                    {departments.slice(9, 10).map((dept) => {
                      const DeptIcon = dept.icon;
                      return (
                        <div 
                          key={dept.title} 
                          className="bg-[var(--md-surface-container)] rounded-lg border border-[var(--md-outline-variant)] p-3 shadow-sm h-full flex flex-col"
                        >
                          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--md-outline-variant)]">
                            <DeptIcon size={16} className="text-[var(--md-secondary)]" />
                            <h3 className="text-[11.5px] font-bold text-[var(--md-primary)]">{dept.title}</h3>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-1">
                            {dept.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <button
                                  key={item.label}
                                  onClick={() => {
                                    if (item.path) {
                                      navigate(item.path);
                                    } else {
                                      showToast('info', `Phân hệ "${item.label}" thuộc bộ phận "${dept.title}" đang được phát triển.`, 'Chức năng giả lập');
                                    }
                                    setShowModuleMenu(false);
                                  }}
                                  className="flex items-center justify-between w-full p-2 bg-[var(--md-surface-container-low)] hover:bg-[var(--nv-sidebar-item-hover)] border border-[var(--md-outline-variant)] hover:border-[var(--md-secondary)] rounded transition-all duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--md-secondary)]"
                                  style={{ borderStyle: 'solid', borderWidth: '1px', outlineOffset: '2px', cursor: 'pointer' }}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <ItemIcon size={14} className="text-[var(--md-on-surface-variant)] flex-shrink-0" />
                                    <span className="text-[12px] font-medium text-[var(--md-on-surface)] truncate">{item.label}</span>
                                  </div>
                                  <ChevronRight size={12} className="text-[var(--md-on-surface-variant)] flex-shrink-0 ml-1" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>


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
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(103,80,164,0.08)'; }}
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
                        background: !n.read ? 'rgba(103,80,164,0.04)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 200ms var(--md-easing)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(103,80,164,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = !n.read ? 'rgba(103,80,164,0.04)' : 'transparent'; }}
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
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(103,80,164,0.08)'; }}
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
            <div
              className="animate-scale-in"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '240px',
                background: 'var(--md-surface-container)',
                borderRadius: '16px',
                boxShadow: 'var(--md-shadow-3)',
                zIndex: 60,
                overflow: 'hidden',
              }}
            >
              {/* User info */}
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--md-outline-variant)' }}>
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: '14px', background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', borderRadius: '9999px', flexShrink: 0 }}>
                  {currentUser.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.9375rem', fontWeight: 700, color: 'var(--md-on-surface)' }}>{currentUser.name}</p>
                  <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</p>
                </div>
              </div>

              {/* Role Switcher */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--md-outline-variant)', background: 'rgba(103,80,164,0.03)' }}>
                <label style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  Vai trò mô phỏng
                </label>
                <select
                  value={activeRole}
                  onChange={(e) => {
                    localStorage.setItem('nv-user-role', e.target.value);
                    setShowUserMenu(false);
                    window.location.reload();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--md-outline)',
                    background: 'var(--md-surface-container-low)',
                    color: 'var(--md-on-surface)',
                    fontSize: '0.8125rem',
                    fontFamily: "'Roboto', sans-serif",
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="accountant">Kế toán trưởng</option>
                  <option value="procurement">Phòng mua hàng</option>
                  <option value="pm">Quản lý dự án (PM)</option>
                  <option value="storekeeper">Thủ kho (Storekeeper)</option>
                </select>
              </div>

              <div style={{ padding: '4px 0' }}>
                <MenuBtn icon={User} label="Thông tin tài khoản" onClick={() => { navigate('/profile'); setShowUserMenu(false); }} />
                <MenuBtn icon={Settings} label="Cài đặt" onClick={() => { navigate('/warehouse/settings'); setShowUserMenu(false); }} />
              </div>
              <div style={{ borderTop: '1px solid var(--md-outline-variant)', padding: '4px 0' }}>
                <MenuBtn icon={LogOut} label="Đăng xuất" danger onClick={() => {
                  localStorage.removeItem('nv-logged-in');
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
