import { PackageX } from 'lucide-react';

export default function EmptyState({ message = 'Không tìm thấy dữ liệu nào!', icon: Icon = PackageX }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Icon size={48} className="mb-3 text-gray-300" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
