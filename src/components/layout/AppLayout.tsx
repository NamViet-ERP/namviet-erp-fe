import { useEffect, useState } from 'react';

import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';

import Header from './Header';

import Sidebar from './Sidebar';

import ToastContainer from '../ui/Toast';

import { warehouseMenu, warehouseSettingsMenu, stocktakeMenu, membersMenu, recruitmentMenu, adminMenu } from '../../constants/sidebarMenus';

import { getSessionUser, canUserLogin } from '../../constants/systemUsers';

import { authService } from '../../services/authService';

import type { SidebarMenuItem } from '../../types';



type Module = 'warehouse' | 'stocktake' | 'members' | 'recruitment' | 'admin';



export default function AppLayout() {

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [sessionReady, setSessionReady] = useState(false);

  const [sessionOk, setSessionOk] = useState(false);

  const navigate = useNavigate();

  const location = useLocation();



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



  if (!sessionReady) return null;



  if (!sessionOk || !authService.isLoggedIn() || !sessionUser || !canUserLogin(sessionUser)) {

    return <Navigate to="/login" replace />;

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



  const handleModuleSwitch = (module: Module) => {

    if (module === 'warehouse') navigate('/warehouse/dashboard-warehouse');

    else if (module === 'stocktake') navigate('/stocktake/list');

    else if (module === 'recruitment') navigate('/recruitment/candidates');

    else if (module === 'members') navigate('/members/list');

    else if (module === 'admin') navigate('/admin/users');

  };



  const hideSidebar = location.pathname === '/profile' || location.pathname === '/warehouse/dashboard' || location.pathname === '/dashboard';

  const isPortalDashboard = hideSidebar;

  const shellModuleClass = currentModule === 'warehouse' ? 'app-shell--warehouse' : 'app-shell--module';



  const mainClass = [

    'app-main',

    hideSidebar ? 'app-main--full' : sidebarCollapsed ? 'app-main--collapsed' : '',

  ].filter(Boolean).join(' ');



  return (

    <div className={`app-shell ${shellModuleClass}`}>

      <Header currentModule={currentModule} onModuleSwitch={handleModuleSwitch} />

      {!hideSidebar && (

        <Sidebar

          collapsed={sidebarCollapsed}

          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}

          menuItems={menuItems}

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

