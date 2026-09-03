import { Navigate, useParams } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';
import MembersSettingsPage from './MembersSettingsPage';
import BranchesSettingsPage from './BranchesSettingsPage';
import RecruitmentSettingsPage from '../recruitment/RecruitmentSettingsPage';

const TAB_DEPARTMENTS = 'departments';
const TAB_BRANCHES = 'branches';
const TAB_RECRUITMENT = 'recruitment';

/** Design read: HRM settings drill-in sidebar - Phòng ban / Chi nhánh / Tuyển dụng. */
export default function HrmSettingsPage() {
  const { tab } = useParams<{ tab: string }>();
  const { has } = usePermission();
  const canOrgSettings = has('hrm.members.settings.view');
  const canRecruitment = has('hrm.recruitment.positions.view');

  const fallback = canOrgSettings
    ? TAB_DEPARTMENTS
    : canRecruitment
      ? TAB_RECRUITMENT
      : null;

  if (!tab) {
    return fallback ? <Navigate to={`/members/settings/${fallback}`} replace /> : null;
  }
  if ((tab === TAB_DEPARTMENTS || tab === TAB_BRANCHES) && !canOrgSettings) {
    return canRecruitment
      ? <Navigate to={`/members/settings/${TAB_RECRUITMENT}`} replace />
      : null;
  }
  if (tab === TAB_RECRUITMENT && !canRecruitment) {
    return canOrgSettings
      ? <Navigate to={`/members/settings/${TAB_DEPARTMENTS}`} replace />
      : null;
  }
  if (tab !== TAB_DEPARTMENTS && tab !== TAB_BRANCHES && tab !== TAB_RECRUITMENT) {
    return fallback ? <Navigate to={`/members/settings/${fallback}`} replace /> : null;
  }

  if (tab === TAB_RECRUITMENT) return <RecruitmentSettingsPage />;
  if (tab === TAB_BRANCHES) return <BranchesSettingsPage />;
  return <MembersSettingsPage />;
}
