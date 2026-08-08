import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const SuppliersDashboardPage = lazy(() => import('../pages/suppliers/SuppliersDashboardPage'));
const SupplierGroupsPage = lazy(() => import('../pages/suppliers/SupplierGroupsPage'));
const SupplierContactsPage = lazy(() => import('../pages/suppliers/SupplierContactsPage'));
const SupplierSpendPage = lazy(() => import('../pages/suppliers/SupplierSpendPage'));
const SupplierPriceHistoryPage = lazy(() => import('../pages/suppliers/SupplierPriceHistoryPage'));
const SupplierEvaluationsPage = lazy(() => import('../pages/suppliers/SupplierEvaluationsPage'));
const SupplierBlacklistPage = lazy(() => import('../pages/suppliers/SupplierBlacklistPage'));
const SupplierSettingsPage = lazy(() => import('../pages/suppliers/SupplierSettingsPage'));
const SupplierMasterPage = lazy(() => import('../pages/suppliers/SupplierMasterPage'));

/** Module Nhà cung cấp — mọi tab dùng API thật. */
export default function SuppliersModuleRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<SuppliersDashboardPage />} />
      <Route path="groups" element={<SupplierGroupsPage />} />
      <Route path="list" element={<SupplierMasterPage />} />
      <Route path="contacts" element={<SupplierContactsPage />} />
      <Route path="spend" element={<SupplierSpendPage />} />
      <Route path="price-history" element={<SupplierPriceHistoryPage />} />
      <Route path="evaluations" element={<SupplierEvaluationsPage />} />
      <Route path="blacklist" element={<SupplierBlacklistPage />} />
      <Route path="settings" element={<SupplierSettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
