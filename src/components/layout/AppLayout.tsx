import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/Toast';
import { warehouseMenu, stocktakeMenu } from '../../constants/sidebarMenus';
import type { SidebarMenuItem } from '../../types';

type Module = 'warehouse' | 'stocktake';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentModule: Module = location.pathname.startsWith('/stocktake') ? 'stocktake' : 'warehouse';
  const menuItems: SidebarMenuItem[] = currentModule === 'stocktake' ? stocktakeMenu : warehouseMenu;

  const handleModuleSwitch = (module: Module) => {
    navigate(module === 'warehouse' ? '/warehouse/dashboard' : '/stocktake/list');
  };

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
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        menuItems={menuItems}
        currentModule={currentModule}
      />
      <main
        style={{
          minHeight: '100vh',
          paddingTop: '64px',
          marginLeft: sidebarCollapsed ? '72px' : '240px',
          transition: `margin-left 300ms var(--md-easing)`,
        }}
      >
        <div
          className="animate-fade-in"
          key={location.pathname}
          style={{ padding: '24px 32px' }}
        >
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
