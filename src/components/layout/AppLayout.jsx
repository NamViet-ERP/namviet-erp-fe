import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/Toast';
import { warehouseMenu, stocktakeMenu } from '../../constants/sidebarMenus';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentModule = location.pathname.startsWith('/stocktake') ? 'stocktake' : 'warehouse';
  const menuItems = currentModule === 'stocktake' ? stocktakeMenu : warehouseMenu;

  const handleModuleSwitch = (module) => {
    navigate(module === 'warehouse' ? '/warehouse/dashboard' : '/stocktake/list');
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #eef2f3, #e0e5eb)' }}>
      <Header currentModule={currentModule} onModuleSwitch={handleModuleSwitch} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        menuItems={menuItems}
        currentModule={currentModule}
      />
      <main className="min-h-screen"
        style={{ paddingTop: '64px', marginLeft: sidebarCollapsed ? '56px' : '232px', transition: 'margin-left 300ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        <div className="p-8"><Outlet /></div>
      </main>
      <ToastContainer />
    </div>
  );
}
