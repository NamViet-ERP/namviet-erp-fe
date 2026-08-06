import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import MaterialCategoriesSettingsPanel from './MaterialCategoriesSettingsPanel';
import MaterialUnitsSettingsPanel from './MaterialUnitsSettingsPanel';

export default function SettingsPage() {
  const { pathname } = useLocation();
  const isUnits = pathname.includes('/settings/material-units');

  const title = isUnits ? 'Đơn vị tính' : 'Cây vật tư';
  const subtitle = isUnits
    ? 'Danh sách đơn vị tính dùng khi tạo mã vật tư.'
    : 'Cấu trúc phân loại vật tư dùng chung trong kho.';

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Vận hành · Thiết lập" title={title} subtitle={subtitle} />
      {isUnits ? <MaterialUnitsSettingsPanel /> : <MaterialCategoriesSettingsPanel />}
    </div>
  );
}
