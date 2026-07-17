import { Headphones } from 'lucide-react';
import ModuleUiPlaceholder from '../../../components/modules/ModuleUiPlaceholder';

export default function CareHistoryPage() {
  return (
    <ModuleUiPlaceholder
      eyebrow="Kỹ thuật · CSKH"
      title="Lịch sử chăm sóc sau bán"
      subtitle="Phiếu chăm sóc cập nhật liên tục: nội dung → giải pháp → phản hồi KT → phản hồi KH."
      emptyMessage="Chưa có lịch sử chăm sóc. Sẽ hỗ trợ tab Chưa/Đã hoàn thành khi có BE."
      icon={Headphones}
    />
  );
}
