import { useCallback, useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer, { showToast } from '../ui/Toast';
import { unifiedSidebarMenu } from '../../constants/sidebarMenus';
import { getSessionUser, getSessionPermissions } from '../../constants/systemUsers';
import { authService } from '../../services/authService';
import {
  getFallbackRoute,
  getRequiredPermissionsForPath,
} from '../../lib/routePermissions';
import { hasAnyPermission } from '../../lib/permissions';
import { UI_PERMISSION_DENIED } from '../../lib/uiMessages';
import PageLoader from '../ui/PageLoader';
import type { SessionCheckResult } from '../../services/authService';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin' | 'technical' | 'purchasing' | 'suppliers' | 'operations';

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

  const sessionUser = getSessionUser();
  const permissions = getSessionPermissions();

  useEffect(() => {
    if (sessionState !== 'authenticated' || !sessionUser) return;

    const requiredPermissions = getRequiredPermissionsForPath(location.pathname);
    if (!requiredPermissions || hasAnyPermission(permissions, requiredPermissions)) {
      deniedToastShown.current = null;
      return;
    }

    if (deniedToastShown.current === location.pathname) return;
    deniedToastShown.current = location.pathname;

    showToast('warning', UI_PERMISSION_DENIED.route, UI_PERMISSION_DENIED.title);
    navigate(getFallbackRoute(permissions), { replace: true });
  }, [location.pathname, sessionState, sessionUser, permissions, navigate]);

  if (sessionState === 'checking') return <PageLoader />;

  if (sessionState === 'recoverable-error') {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Không thể xác minh phiên đăng nhập</h1>
          <p className="mt-2 text-sm text-[var(--md-on-surface-variant)]">
            Máy chủ chưa phản hồi. Phiên của bạn chưa được tin cậy cho đến khi xác minh thành công.
          </p>
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={() => {
              setSessionState('checking');
              checkSession();
            }}
          >
            Thử lại
          </button>
        </div>
      </main>
    );
  }

  if (sessionState === 'unauthenticated' || !authService.isLoggedIn() || !sessionUser) {
    return <Navigate to="/login" replace />;
  }

  const requiredPermissions = getRequiredPermissionsForPath(location.pathname);
  if (requiredPermissions && !hasAnyPermission(permissions, requiredPermissions)) {
    return <PageLoader />;
  }

  const currentModule: Module =
    location.pathname.startsWith('/operations') ? 'operations' :
    location.pathname.startsWith('/stocktake') ? 'stocktake' :
    location.pathname.startsWith('/recruitment') ? 'recruitment' :
    location.pathname.startsWith('/members') ? 'members' :
    location.pathname.startsWith('/admin') ? 'admin' :
    location.pathname.startsWith('/technical') ? 'technical' :
    location.pathname.startsWith('/suppliers') ? 'suppliers' :
    location.pathname.startsWith('/purchasing') ? 'purchasing' : 'warehouse';

  const hideSidebar = location.pathname === '/profile';
  const isWmsModule =
    currentModule === 'warehouse'
    || currentModule === 'stocktake'
    || currentModule === 'operations';
  const shellModuleClass = isWmsModule ? 'app-shell--module app-shell--wms' : 'app-shell--module';

  const mainClass = [
    'app-main',
    hideSidebar ? 'app-main--full' : sidebarCollapsed ? 'app-main--collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`app-shell ${shellModuleClass}${hideSidebar ? ' app-shell--no-sidebar' : sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}>
      <Header currentModule={currentModule} onModuleSwitch={() => {}} />
      {!hideSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          menuItems={unifiedSidebarMenu}
          permissions={permissions}
          currentModule={currentModule}
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
