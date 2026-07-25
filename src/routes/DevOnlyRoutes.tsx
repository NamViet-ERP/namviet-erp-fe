import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const SuppliersDashboardPage = lazy(() => import('../pages/suppliers/SuppliersDashboardPage'));
const SupplierGroupsPage = lazy(() => import('../pages/suppliers/SupplierGroupsPage'));
const SupplierEvaluationsPage = lazy(() => import('../pages/suppliers/SupplierEvaluationsPage'));
const SupplierSettingsPage = lazy(() => import('../pages/suppliers/SupplierSettingsPage'));
/** Master NCC (API) — tab chính của module Nhà cung cấp. */
const SupplierMasterPage = lazy(() => import('../pages/purchasing/PurchasingSuppliersPage'));

/** Module Nhà cung cấp — list = API; các tab khác vẫn mock shell. */
export default function DevOnlyRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<SuppliersDashboardPage />} />
      <Route path="groups" element={<SupplierGroupsPage />} />
      <Route path="list" element={<SupplierMasterPage />} />
      <Route path="evaluations" element={<SupplierEvaluationsPage />} />
      <Route path="settings" element={<SupplierSettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
