import { Settings } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

export default function StocktakeSettingsPage() {
  return (
    <div className="page-shell">
      <PageHeader eyebrow="KIỂM KÊ" title="THIẾT LẬP KIỂM KÊ" />

      <div className="surface-panel surface-panel--rounded-xl shadow-card">
        <EmptyState
          icon={Settings}
          message='Phân hệ "Thiết lập" thuộc bộ phận "Kiểm kê" đang được phát triển.'
        />
      </div>
    </div>
  );
}
