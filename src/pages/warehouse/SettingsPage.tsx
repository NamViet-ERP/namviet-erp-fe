import { useLocation, NavLink } from 'react-router-dom';
import { Globe, Package, Ruler } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import MaterialCategoriesSettingsPanel from './MaterialCategoriesSettingsPanel';
import MaterialUnitsSettingsPanel from './MaterialUnitsSettingsPanel';
import MaterialOriginsSettingsPanel from './MaterialOriginsSettingsPanel';

export default function SettingsPage() {
  const { pathname } = useLocation();
  const isOrigins = pathname.includes('/settings/material-origins');
  const isUnits = pathname.includes('/settings/material-units');

  const title = isOrigins ? 'Xuất xứ & Nhãn hiệu' : isUnits ? 'Đơn vị tính' : 'Cây vật tư';
  const subtitle = isOrigins
    ? 'Quản lý hãng sản xuất, quốc gia xuất xứ và nhóm nước dùng khi tạo mã vật tư.'
    : isUnits
      ? 'Danh sách đơn vị tính dùng khi tạo mã vật tư.'
      : 'Cấu trúc phân loại vật tư dùng chung trong kho.';

  return (
    <div className="page-shell">
      <PageHeader eyebrow="SLC · Thiết lập" title={title} subtitle={subtitle} />
      <div className="flex gap-2 border-b border-[var(--md-outline-variant)] mb-4">
        <NavLink
          to="/operations/settings/material-categories"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              isActive
                ? 'border-[var(--md-primary)] text-[var(--md-primary)] font-semibold'
                : 'border-transparent text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`
          }
        >
          <Package size={16} />
          Cây vật tư
        </NavLink>
        <NavLink
          to="/operations/settings/material-units"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              isActive
                ? 'border-[var(--md-primary)] text-[var(--md-primary)] font-semibold'
                : 'border-transparent text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`
          }
        >
          <Ruler size={16} />
          Đơn vị tính
        </NavLink>
        <NavLink
          to="/operations/settings/material-origins"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              isActive
                ? 'border-[var(--md-primary)] text-[var(--md-primary)] font-semibold'
                : 'border-transparent text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`
          }
        >
          <Globe size={16} />
          Xuất xứ & Nhãn hiệu
        </NavLink>
      </div>
      {isOrigins ? (
        <MaterialOriginsSettingsPanel />
      ) : isUnits ? (
        <MaterialUnitsSettingsPanel />
      ) : (
        <MaterialCategoriesSettingsPanel />
      )}
    </div>
  );
}
