import PageHeader from '../../components/ui/PageHeader';
import SuppliersSettingsPanel from '../warehouse/SuppliersSettingsPanel';

/** Danh mục NCC master — phân hệ Nhà cung cấp (API dùng chung PO / phiếu nhập). */
export default function PurchasingSuppliersPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Nhà cung cấp"
        subtitle="Danh mục NCC master — điều khoản thanh toán (hạn công nợ) dùng khi tạo PO và phiếu nhập."
      />
      <SuppliersSettingsPanel />
    </div>
  );
}
