import { Cake } from 'lucide-react';
import ModuleUiPlaceholder from '../../../components/modules/ModuleUiPlaceholder';

export default function CskhBirthdaysPage() {
  return (
    <ModuleUiPlaceholder
      eyebrow="Kỹ thuật · CSKH"
      title="Sinh nhật hôm nay"
      subtitle="Nhắc sinh nhật khách hàng sau bán — theo ERP cũ."
      emptyMessage="Hôm nay không có sinh nhật khách hàng (hoặc chưa có dữ liệu)."
      icon={Cake}
    />
  );
}
