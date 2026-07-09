import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import MaterialCategoriesSettingsPanel from './MaterialCategoriesSettingsPanel';
import MaterialUnitsSettingsPanel from './MaterialUnitsSettingsPanel';
import SuppliersSettingsPanel from './SuppliersSettingsPanel';
import PriceBooksSettingsPanel from './PriceBooksSettingsPanel';

export default function SettingsPage() {
  const { pathname } = useLocation();
  const isSuppliers = pathname.includes('/settings/suppliers');
  const isUnits = pathname.includes('/settings/material-units');
  const isPriceBooks = pathname.includes('/settings/price-books');

  const title = isSuppliers
    ? 'Danh mục NCC'
    : isUnits
      ? 'Đơn vị tính'
      : isPriceBooks
        ? 'Bảng giá NCC'
        : 'Cây vật tư';
  const subtitle = isSuppliers
    ? 'Khai báo nhà cung cấp dùng khi lập phiếu nhập kho.'
    : isUnits
      ? 'Danh sách đơn vị tính dùng khi tạo mã vật tư.'
      : isPriceBooks
        ? 'Khai báo đơn giá theo vật tư và NCC — gợi ý khi lập phiếu nhập.'
        : 'Cấu trúc phân loại vật tư dùng chung trong kho.';

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Thiết lập" title={title} subtitle={subtitle} />
      {isSuppliers ? (
        <SuppliersSettingsPanel />
      ) : isUnits ? (
        <MaterialUnitsSettingsPanel />
      ) : isPriceBooks ? (
        <PriceBooksSettingsPanel />
      ) : (
        <MaterialCategoriesSettingsPanel />
      )}
    </div>
  );
}
