import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useCskhProject } from '../../hooks/cskh/useCskhProject';
import {
  CSKH_PROJECT_DEFAULT_TAB,
  cskhProjectPath,
  isCskhProjectTab,
} from '../../constants/cskhProject';
import CskhProjectDashboardPage from './CskhProjectDashboardPage';
import CskhProjectSectionPage from './CskhProjectSectionPage';

export default function CskhProjectTabPage() {
  const { code = '', tab } = useParams<{ code: string; tab: string }>();
  const { setProjectCode } = useCskhProject();

  useEffect(() => {
    if (code) setProjectCode(code);
  }, [code, setProjectCode]);

  if (!isCskhProjectTab(tab)) {
    return <Navigate to={cskhProjectPath(code, CSKH_PROJECT_DEFAULT_TAB)} replace />;
  }

  if (tab === 'dashboard') return <CskhProjectDashboardPage />;
  return <CskhProjectSectionPage />;
}
