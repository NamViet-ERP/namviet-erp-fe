import PageHeader from '../../components/ui/PageHeader';
import BranchesSettingsPanel from '../../components/hr/BranchesSettingsPanel';
import { usePermission } from '../../hooks/usePermission';

/** Design read: HRM settings drill-in - Chi nhánh catalog, same chrome as Phòng ban. */
export default function BranchesSettingsPage() {
  const { has } = usePermission();
  const canUpdate = has('hrm.members.settings.update');

  return (
    <div className="hrm-page">
      <PageHeader
        eyebrow="Thiết lập"
        title="Chi nhánh"
        subtitle="Quản lý danh mục chi nhánh để chọn trên hồ sơ nhân viên."
      />
      <div className="hrm-settings-grid">
        <BranchesSettingsPanel canUpdate={canUpdate} />
      </div>
    </div>
  );
}
