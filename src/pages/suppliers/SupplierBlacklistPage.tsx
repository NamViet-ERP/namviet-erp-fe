import HrmPanel from '../../components/hr/HrmPanel';
import PageHeader from '../../components/ui/PageHeader';
import SupplierBlacklistPanel from '../../components/suppliers/SupplierBlacklistPanel';

/** Sidebar tab riêng — không nằm trong Đánh giá NCC. */
export default function SupplierBlacklistPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Danh sách blacklist"
        subtitle="NCC bị hạn chế hợp tác. Thêm từ hồ sơ Nhà cung cấp; gỡ tại đây khi đã xử lý rủi ro."
      />
      <HrmPanel noPadding>
        <SupplierBlacklistPanel embedded />
      </HrmPanel>
    </div>
  );
}
