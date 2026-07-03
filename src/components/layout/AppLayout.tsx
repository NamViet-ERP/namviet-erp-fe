import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer, { showToast } from '../ui/Toast';
import {
  warehouseMenu,
  warehouseSettingsMenu,
  stocktakeMenu,
  membersMenu,
  recruitmentMenu,
  adminMenu,
} from '../../constants/sidebarMenus';
import { getSessionUser, canUserLogin, getSessionPermissions } from '../../constants/systemUsers';
import { authService } from '../../services/authService';
import {
  getFallbackRoute,
  getRequiredPermissionsForPath,
} from '../../lib/routePermissions';
import { hasAnyPermission } from '../../lib/permissions';
import { UI_PERMISSION_DENIED } from '../../lib/uiMessages';
import type { SidebarMenuItem } from '../../types';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const deniedToastShown = useRef<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    authService.ensureSession().then(ok => {
      if (!cancelled) {
        setSessionOk(ok);
        setSessionReady(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const sessionUser = getSessionUser();
  const permissions = getSessionPermissions();

  useEffect(() => {
    if (!sessionReady || !sessionOk || !sessionUser) return;

    const requiredPermissions = getRequiredPermissionsForPath(location.pathname);
    if (!requiredPermissions || hasAnyPermission(permissions, requiredPermissions)) {
      deniedToastShown.current = null;
      return;
    }

    if (deniedToastShown.current === location.pathname) return;
    deniedToastShown.current = location.pathname;

    showToast('warning', UI_PERMISSION_DENIED.route, UI_PERMISSION_DENIED.title);
    navigate(getFallbackRoute(permissions), { replace: true });
  }, [location.pathname, sessionReady, sessionOk, sessionUser, permissions, navigate]);

  if (!sessionReady) return null;

  if (!sessionOk || !authService.isLoggedIn() || !sessionUser || !canUserLogin(sessionUser)) {
    return <Navigate to="/login" replace />;
  }

  const requiredPermissions = getRequiredPermissionsForPath(location.pathname);
  if (requiredPermissions && !hasAnyPermission(permissions, requiredPermissions)) {
    return null;
  }

  const currentModule: Module =
    location.pathname.startsWith('/stocktake') ? 'stocktake' :
    location.pathname.startsWith('/recruitment') ? 'recruitment' :
    location.pathname.startsWith('/members') ? 'members' :
    location.pathname.startsWith('/admin') ? 'admin' : 'warehouse';

  const isWarehouseSettings =
    currentModule === 'warehouse' && location.pathname.startsWith('/warehouse/settings');

  const menuItems: SidebarMenuItem[] =
    isWarehouseSettings ? warehouseSettingsMenu :
    currentModule === 'stocktake' ? stocktakeMenu :
    currentModule === 'recruitment' ? recruitmentMenu :
    currentModule === 'members' ? membersMenu :
    currentModule === 'admin' ? adminMenu : warehouseMenu;

  const hideSidebar = location.pathname === '/profile' || location.pathname === '/warehouse/dashboard' || location.pathname === '/dashboard';
  const isPortalDashboard = hideSidebar;
  const shellModuleClass = currentModule === 'warehouse' ? 'app-shell--warehouse' : 'app-shell--module';

  const mainClass = [
    'app-main',
    hideSidebar ? 'app-main--full' : sidebarCollapsed ? 'app-main--collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`app-shell ${shellModuleClass}`}>
      <Header currentModule={currentModule} onModuleSwitch={() => {}} />
      {!hideSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          menuItems={menuItems}
          permissions={permissions}
          currentModule={currentModule}
          contextLabel={isWarehouseSettings ? 'Thiết lập' : undefined}
          onBack={isWarehouseSettings ? () => navigate('/warehouse/dashboard-warehouse') : undefined}
        />
      )}
      <main className={mainClass}>
        <div className={isPortalDashboard ? 'app-main__inner app-main__inner--portal' : 'app-main__inner'}>
          <div key={location.pathname} className="page-route-enter">
            <Outlet />
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
