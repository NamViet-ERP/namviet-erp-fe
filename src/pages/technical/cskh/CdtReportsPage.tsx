import { FileText } from 'lucide-react';
import ModuleUiPlaceholder from '../../../components/modules/ModuleUiPlaceholder';

/** Boss: báo cáo gửi Chủ đầu tư. */
export default function CdtReportsPage() {
  return (
    <ModuleUiPlaceholder
      eyebrow="Kỹ thuật · CSKH"
      title="Báo cáo CĐT"
      subtitle="Báo cáo dành cho Chủ đầu tư — phạm vi/field sẽ khác báo cáo nội bộ."
      emptyMessage="Chưa có báo cáo CĐT. UI placeholder."
      icon={FileText}
    />
  );
}
