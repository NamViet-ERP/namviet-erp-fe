import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { CSKH_PROJECT_DEFAULT_TAB, cskhProjectPath } from '../constants/cskhProject';
import { CSKH_SETTINGS_DEFAULT_TAB } from '../constants/cskhSettings';
import CskhLayout from '../pages/cskh/CskhLayout';
import CskhDashboardPage from '../pages/cskh/CskhDashboardPage';
import CskhProjectTabPage from '../pages/cskh/CskhProjectTabPage';
import CskhSettingsTabPage from '../pages/cskh/CskhSettingsTabPage';

function CskhProjectIndexRedirect() {
  const { code = '' } = useParams<{ code: string }>();
  return <Navigate to={cskhProjectPath(code, CSKH_PROJECT_DEFAULT_TAB)} replace />;
}

export default function CskhModuleRoutes() {
  return (
    <Routes>
      <Route element={<CskhLayout />}>
        <Route index element={<CskhDashboardPage />} />
        <Route path="settings" element={<Navigate to={CSKH_SETTINGS_DEFAULT_TAB} replace />} />
        <Route path="settings/:tab" element={<CskhSettingsTabPage />} />
        <Route path="projects/:code" element={<CskhProjectIndexRedirect />} />
        <Route path="projects/:code/:tab" element={<CskhProjectTabPage />} />
        <Route path="*" element={<Navigate to="/cskh" replace />} />
      </Route>
    </Routes>
  );
}
