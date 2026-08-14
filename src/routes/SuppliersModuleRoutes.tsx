import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const SuppliersDashboardPage = lazy(() => import('../pages/suppliers/SuppliersDashboardPage'));
const SupplierGroupsPage = lazy(() => import('../pages/suppliers/SupplierGroupsPage'));
const SupplierContactsPage = lazy(() => import('../pages/suppliers/SupplierContactsPage'));
const SupplierSpendPage = lazy(() => import('../pages/suppliers/SupplierSpendPage'));
const SupplierPayablesPage = lazy(() => import('../pages/suppliers/SupplierPayablesPage'));
const SupplierPriceHistoryPage = lazy(() => import('../pages/suppliers/SupplierPriceHistoryPage'));
const SupplierEvaluationsPage = lazy(() => import('../pages/suppliers/SupplierEvaluationsPage'));
const SupplierBlacklistPage = lazy(() => import('../pages/suppliers/SupplierBlacklistPage'));
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
      <Route path="debt" element={<SupplierPayablesPage />} />
      <Route path="price-history" element={<SupplierPriceHistoryPage />} />
      <Route path="evaluations" element={<SupplierEvaluationsPage />} />
      <Route path="blacklist" element={<SupplierBlacklistPage />} />
      <Route path="settings" element={<Navigate to="/suppliers/dashboard" replace />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
