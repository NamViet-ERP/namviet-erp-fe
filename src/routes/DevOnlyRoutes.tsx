import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const SuppliersDashboardPage = lazy(() => import('../pages/suppliers/SuppliersDashboardPage'));
const SupplierGroupsPage = lazy(() => import('../pages/suppliers/SupplierGroupsPage'));
const SupplierListPage = lazy(() => import('../pages/suppliers/SupplierListPage'));
const SupplierEvaluationsPage = lazy(() => import('../pages/suppliers/SupplierEvaluationsPage'));
const SupplierSettingsPage = lazy(() => import('../pages/suppliers/SupplierSettingsPage'));
const PurchasePlansPage = lazy(() => import('../pages/purchasing/PurchasePlansPage'));
const PurchaseOrdersPage = lazy(() => import('../pages/purchasing/PurchaseOrdersPage'));
const PurchaseRequestsPage = lazy(() => import('../pages/purchasing/PurchaseRequestsPage'));
const PurchaseDeliveriesPage = lazy(() => import('../pages/purchasing/PurchaseDeliveriesPage'));
const PurchasePaymentsPage = lazy(() => import('../pages/purchasing/PurchasePaymentsPage'));
const PurchaseDocumentsPage = lazy(() => import('../pages/purchasing/PurchaseDocumentsPage'));
const PurchasingSettingsPage = lazy(() => import('../pages/purchasing/PurchasingSettingsPage'));

type DevOnlyRoutesProps = {
  module: 'purchasing' | 'suppliers';
};

export default function DevOnlyRoutes({ module }: DevOnlyRoutesProps) {
  if (module === 'suppliers') {
    return (
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuppliersDashboardPage />} />
        <Route path="groups" element={<SupplierGroupsPage />} />
        <Route path="list" element={<SupplierListPage />} />
        <Route path="evaluations" element={<SupplierEvaluationsPage />} />
        <Route path="settings" element={<SupplierSettingsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route index element={<Navigate to="plans" replace />} />
      <Route path="dashboard" element={<Navigate to="../plans" replace />} />
      <Route path="suppliers" element={<Navigate to="/suppliers/list" replace />} />
      <Route path="plans" element={<PurchasePlansPage />} />
      <Route path="orders" element={<PurchaseOrdersPage />} />
      <Route path="orders/domestic" element={<Navigate to="../.." replace />} />
      <Route path="orders/international" element={<Navigate to="../.." replace />} />
      <Route path="requests" element={<PurchaseRequestsPage />} />
      <Route path="deliveries" element={<PurchaseDeliveriesPage />} />
      <Route path="payments" element={<PurchasePaymentsPage />} />
      <Route path="documents" element={<PurchaseDocumentsPage />} />
      <Route path="settings" element={<PurchasingSettingsPage />} />
      <Route path="*" element={<Navigate to="plans" replace />} />
    </Routes>
  );
}
