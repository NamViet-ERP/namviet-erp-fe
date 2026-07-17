import { Users } from 'lucide-react';
import ModuleUiPlaceholder from '../../../components/modules/ModuleUiPlaceholder';

export default function AfterSalesClientsPage() {
  return (
    <ModuleUiPlaceholder
      eyebrow="Kỹ thuật · CSKH"
      title="Khách hàng sau bán"
      subtitle="Danh mục KH technical (theo ERP cũ) — lọc nhóm A–Z CSKH, phụ trách, series."
      emptyMessage="Chưa có dữ liệu khách hàng sau bán. UI sẵn sàng để nối API sau."
      icon={Users}
    />
  );
}
