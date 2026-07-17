import { ClipboardList } from 'lucide-react';
import ModuleUiPlaceholder from '../../../components/modules/ModuleUiPlaceholder';

/** Boss: báo cáo nội bộ CSKH / kỹ thuật. */
export default function InternalReportsPage() {
  return (
    <ModuleUiPlaceholder
      eyebrow="Kỹ thuật · CSKH"
      title="Báo cáo nội bộ"
      subtitle="Báo cáo nội bộ CSKH (đầy đủ hơn bản CĐT) — thống kê công việc, phụ tùng, KPI."
      emptyMessage="Chưa có báo cáo nội bộ. UI placeholder."
      icon={ClipboardList}
    />
  );
}
