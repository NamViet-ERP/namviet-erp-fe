import PageHeader from '../../components/ui/PageHeader';
import SuppliersSettingsPanel from '../warehouse/SuppliersSettingsPanel';

/** Danh mục NCC master - màn chính của phân hệ Nhà cung cấp. */
export default function SupplierMasterPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Nhà cung cấp"
        subtitle="Master NCC của phân hệ: ngành hàng, phân loại, điều khoản, doanh số mua và đánh giá gần nhất."
      />
      <SuppliersSettingsPanel />
    </div>
  );
}
