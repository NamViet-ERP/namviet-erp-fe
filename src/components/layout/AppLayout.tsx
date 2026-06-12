import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/Toast';
import { warehouseMenu, stocktakeMenu, membersMenu, recruitmentMenu } from '../../constants/sidebarMenus';
import { getSessionUser, canUserLogin, clearSessionUser } from '../../constants/systemUsers';
import type { SidebarMenuItem } from '../../types';

type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = localStorage.getItem('nv-logged-in') === 'true';
  const sessionUser = getSessionUser();

  if (!isLoggedIn || !sessionUser || !canUserLogin(sessionUser)) {
    if (isLoggedIn) localStorage.removeItem('nv-logged-in');
    return <Navigate to="/login" replace />;
  }

  const currentModule: Module =
    location.pathname.startsWith('/stocktake') ? 'stocktake' :
    location.pathname.startsWith('/recruitment') ? 'recruitment' :
    location.pathname.startsWith('/members') ? 'members' : 'warehouse';

  const menuItems: SidebarMenuItem[] =
    currentModule === 'stocktake' ? stocktakeMenu :
    currentModule === 'recruitment' ? recruitmentMenu :
    currentModule === 'members' ? membersMenu : warehouseMenu;

  const handleModuleSwitch = (module: Module) => {
    if (module === 'warehouse') navigate('/warehouse/dashboard-warehouse');
    else if (module === 'stocktake') navigate('/stocktake/list');
    else if (module === 'recruitment') navigate('/recruitment/candidates');
    else if (module === 'members') navigate('/members/list');
  };

  const hideSidebar = location.pathname === '/profile' || location.pathname === '/warehouse/dashboard';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--md-surface)',
        color: 'var(--md-on-surface)',
        transition: 'background var(--md-duration) var(--md-easing), color var(--md-duration) var(--md-easing)',
      }}
    >
      <Header currentModule={currentModule} onModuleSwitch={handleModuleSwitch} />
      {!hideSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          menuItems={menuItems}
          currentModule={currentModule}
        />
      )}
      <main
        style={{
          minHeight: '100vh',
          paddingTop: '64px',
          marginLeft: hideSidebar ? '0px' : (sidebarCollapsed ? '48px' : '180px'),
          transition: `margin-left 300ms var(--md-easing)`,
        }}
      >
        <div
          className="animate-fade-in"
          key={location.pathname}
          style={{ padding: '16px 20px' }}
        >
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
