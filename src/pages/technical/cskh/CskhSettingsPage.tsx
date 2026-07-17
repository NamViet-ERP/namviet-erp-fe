import { Settings } from 'lucide-react';
import ModuleUiPlaceholder from '../../../components/modules/ModuleUiPlaceholder';

export default function CskhSettingsPage() {
  return (
    <ModuleUiPlaceholder
      eyebrow="Kỹ thuật · CSKH"
      title="Thiết lập CSKH"
      subtitle="Cấu hình nhóm CSKH, cảnh báo bảo trì / phụ tùng / gia hạn."
      emptyMessage="Chưa có mục thiết lập. UI placeholder."
      icon={Settings}
    />
  );
}
