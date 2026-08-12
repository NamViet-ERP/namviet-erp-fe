import PageHeader from '../../components/ui/PageHeader';
import SuppliersSettingsPanel from '../warehouse/SuppliersSettingsPanel';

/** Danh mục NCC master — phân hệ Nhà cung cấp (API dùng chung PO / phiếu nhập). */
export default function PurchasingSuppliersPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Nhà cung cấp"
        subtitle="Danh mục NCC master. NCC mới là Hạng D, trạng thái Mới; sếp duyệt xong mới đặt PO được."
      />
      <SuppliersSettingsPanel />
    </div>
  );
}
