import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import MaterialCategoriesSettingsPanel from './MaterialCategoriesSettingsPanel';
import SuppliersSettingsPanel from './SuppliersSettingsPanel';

export default function SettingsPage() {
  const { pathname } = useLocation();
  const isSuppliers = pathname.includes('/settings/suppliers');

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Thiết lập"
        title={isSuppliers ? 'Danh mục NCC' : 'Cây vật tư'}
        subtitle={
          isSuppliers
            ? 'Khai báo nhà cung cấp dùng khi lập phiếu nhập kho.'
            : 'Cấu trúc phân loại vật tư dùng chung trong kho.'
        }
      />
      {isSuppliers ? <SuppliersSettingsPanel /> : <MaterialCategoriesSettingsPanel />}
    </div>
  );
}
