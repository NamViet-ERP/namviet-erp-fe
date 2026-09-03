import { useCallback, useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer, { showToast } from '../ui/Toast';
import { FolderKanban } from 'lucide-react';
import { unifiedSidebarMenu, hrmSettingsMenu } from '../../constants/sidebarMenus';
import { cskhProjectCodeFromPath, cskhProjectMenu } from '../../constants/cskhProject';
import { cskhSettingsMenu } from '../../constants/cskhSettings';
import { useSession } from '../../auth/AuthProvider';
import { authService } from '../../services/authService';
import {
  getFallbackRoute,
  getRouteAccess,
} from '../../lib/routePermissions';
import { hasAnyPermission } from '../../lib/permissions';
import { UI_PERMISSION_DENIED } from '../../lib/uiMessages';
import PageLoader from '../ui/PageLoader';
import Button from '../ui/Button';
import type { SessionCheckResult } from '../../services/authService';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin' | 'technical' | 'cskh' | 'purchasing' | 'suppliers' | 'operations';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionState, setSessionState] = useState<SessionCheckResult | 'checking'>('checking');
  const navigate = useNavigate();
  const location = useLocation();
  const deniedToastShown = useRef<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const checkSession = useCallback(() => {
    let cancelled = false;
    authService.ensureSession().then(result => {
      if (!cancelled) setSessionState(result);
    }).catch(() => {
      if (!cancelled) setSessionState('recoverable-error');
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return checkSession();
  }, [checkSession]);

  const { user: sessionUser, permissions } = useSession();
  const routeAccess = getRouteAccess(location.pathname);
  const fallbackRoute = getFallbackRoute(permissions);
  const permissionDenied =
    sessionState === 'authenticated'
    && Boolean(sessionUser)
    && routeAccess.kind === 'permissions'
    && !hasAnyPermission(permissions, routeAccess.permissions);
  const unknownRoute =
    sessionState === 'authenticated'
    && Boolean(sessionUser)
    && routeAccess.kind === 'unknown';

  useEffect(() => {
    if (!permissionDenied) {
      deniedToastShown.current = null;
      return;
    }
    if (deniedToastShown.current === location.pathname) return;
    deniedToastShown.current = location.pathname;
    showToast('warning', UI_PERMISSION_DENIED.route, UI_PERMISSION_DENIED.title);
  }, [permissionDenied, location.pathname]);

  if (sessionState === 'checking') return <PageLoader />;

  if (sessionState === 'recoverable-error') {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Không thể xác minh phiên đăng nhập</h1>
          <p className="mt-2 text-sm text-[var(--md-on-surface-variant)]">
            Máy chủ chưa phản hồi. Phiên của bạn chưa được tin cậy cho đến khi xác minh thành công.
          </p>
          <Button
            type="button"
            variant="filled"
            className="mt-4"
            onClick={() => {
              setSessionState('checking');
              checkSession();
            }}
          >
            Thử lại
          </Button>
        </div>
      </main>
    );
  }

  if (sessionState === 'unauthenticated' || !authService.isLoggedIn() || !sessionUser) {
    return <Navigate to="/login" replace />;
  }

  if (permissionDenied || unknownRoute) {
    return <Navigate to={fallbackRoute} replace />;
  }

  const currentModule: Module =
    location.pathname.startsWith('/operations') ? 'operations' :
    location.pathname.startsWith('/stocktake') ? 'stocktake' :
    location.pathname.startsWith('/recruitment') ? 'recruitment' :
    location.pathname.startsWith('/members') ? 'members' :
    location.pathname.startsWith('/admin') ? 'admin' :
    location.pathname.startsWith('/cskh') ? 'cskh' :
    location.pathname.startsWith('/technical') ? 'technical' :
    location.pathname.startsWith('/suppliers') ? 'suppliers' :
    location.pathname.startsWith('/purchasing') ? 'purchasing' : 'warehouse';

  const hideSidebar = location.pathname === '/profile';
  const isCskhSettings = location.pathname.startsWith('/cskh/settings');
  const isHrmSettings = location.pathname.startsWith('/members/settings');
  const cskhProjectCode = isCskhSettings ? null : cskhProjectCodeFromPath(location.pathname);
  const isCskhProject = Boolean(cskhProjectCode);
  const isWmsModule =
    currentModule === 'warehouse'
    || currentModule === 'stocktake'
    || currentModule === 'operations';
  const shellModuleClass = isWmsModule ? 'app-shell--module app-shell--wms' : 'app-shell--module';

  const mainClass = [
    'app-main',
    hideSidebar ? 'app-main--full' : sidebarCollapsed ? 'app-main--collapsed' : '',
  ].filter(Boolean).join(' ');

  const sidebarMenuItems = isCskhSettings
    ? cskhSettingsMenu
    : isHrmSettings
      ? hrmSettingsMenu
      : cskhProjectCode
        ? cskhProjectMenu(cskhProjectCode)
        : unifiedSidebarMenu;
  const sidebarBack = isCskhSettings || isCskhProject
    ? () => navigate('/cskh')
    : isHrmSettings
      ? () => navigate('/recruitment/dashboard')
      : undefined;
  const sidebarContextLabel = isCskhSettings || isHrmSettings
    ? 'THIẾT LẬP'
    : cskhProjectCode ?? undefined;

  return (
    <div className={`app-shell ${shellModuleClass}${hideSidebar ? ' app-shell--no-sidebar' : sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}>
      <Header currentModule={currentModule} onModuleSwitch={() => {}} />
      {!hideSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          menuItems={sidebarMenuItems}
          permissions={permissions}
          currentModule={currentModule}
          contextLabel={sidebarContextLabel}
          contextIcon={isCskhProject ? FolderKanban : undefined}
          onBack={sidebarBack}
        />
      )}
      <main className={mainClass}>
        <div className="app-main__inner">
          <div className="page-route-enter">
            <Outlet />
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
