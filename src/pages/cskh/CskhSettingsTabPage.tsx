import { Navigate, useParams } from 'react-router-dom';
import { CSKH_SETTINGS_DEFAULT_TAB, CSKH_SETTINGS_TABS } from '../../constants/cskhSettings';
import CskhCatalogPage from './CskhCatalogPage';
import CskhSchedulePage from './CskhSchedulePage';
import CskhStatusPriorityPage from './CskhStatusPriorityPage';

const TAB_IDS = new Set<string>(CSKH_SETTINGS_TABS.map(tab => tab.id));

export default function CskhSettingsTabPage() {
  const { tab } = useParams<{ tab: string }>();
  if (!tab || !TAB_IDS.has(tab)) {
    return <Navigate to={`/cskh/settings/${CSKH_SETTINGS_DEFAULT_TAB}`} replace />;
  }
  const body = tab === 'status-priority'
    ? <CskhStatusPriorityPage />
    : tab === 'schedule'
      ? <CskhSchedulePage />
      : <CskhCatalogPage tab={tab} />;

  return <div className="page-stack cskh-settings">{body}</div>;
}
