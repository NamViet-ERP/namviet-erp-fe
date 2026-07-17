import { FolderKanban } from 'lucide-react';
import ModuleUiPlaceholder from '../../../components/modules/ModuleUiPlaceholder';

/** Boss: nơi lưu & cập nhật liên tục các vấn đề theo dự án. */
export default function ProjectIssuesPage() {
  return (
    <ModuleUiPlaceholder
      eyebrow="Kỹ thuật · CSKH"
      title="Vấn đề theo dự án"
      subtitle="Log issue gắn dự án (bổ sung theo yêu cầu sếp) — cập nhật liên tục, truy vết máy/series khi có."
      emptyMessage="Chưa có vấn đề dự án. Module UI-only, chưa kết nối API."
      icon={FolderKanban}
    />
  );
}
