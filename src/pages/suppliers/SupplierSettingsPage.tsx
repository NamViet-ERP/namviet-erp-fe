import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import { createSuppliersModuleSeed } from '../../data/suppliersMock';

const seed = createSuppliersModuleSeed();

export default function SupplierSettingsPage() {
  const rows = seed.settings;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Thiết lập"
        subtitle="Cấu hình đánh giá và quy tắc danh mục NCC."
      />
      <HrmPanel>
        <ul className="purchasing-settings-list">
          {rows.map(row => (
            <li key={row.id} className="purchasing-settings-item">
              <div>
                <p className="font-semibold text-[var(--md-on-surface)]">{row.label}</p>
                <p className="text-sm text-[var(--md-on-surface-variant)]">{row.description}</p>
              </div>
              <span className="purchasing-settings-item__value">{row.value}</span>
            </li>
          ))}
        </ul>
      </HrmPanel>
    </div>
  );
}
