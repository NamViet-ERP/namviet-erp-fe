import PageHeader from '../../components/ui/PageHeader';
import MaterialCategoriesSettingsPanel from './MaterialCategoriesSettingsPanel';

export default function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader eyebrow="Kho hàng" title="Thiết lập" />
      <MaterialCategoriesSettingsPanel />
    </div>
  );
}
