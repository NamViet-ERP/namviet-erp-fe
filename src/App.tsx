import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PageLoader from './components/ui/PageLoader';
import { Agentation } from 'agentation';
import { getDefaultRoute } from './utils/getDefaultRoute';
import { getActiveRole } from './lib/getActiveRole';
import * as Pages from './routes/lazyPages';

export default function App() {
  const enableWms = import.meta.env.VITE_ENABLE_WMS === 'true';
  const role = getActiveRole();

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Pages.LoginPage />} />
          <Route path="/recruitment/apply" element={<Pages.CandidateApplyPage />} />
          <Route path="/employee/onboarding" element={<Pages.EmployeeOnboardPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to={getDefaultRoute(role)} replace />} />
            <Route path="/dashboard" element={<Pages.DashboardPage />} />

            {enableWms ? (
              <>
                <Route path="/warehouse/dashboard" element={<Pages.DashboardPage />} />
                <Route path="/warehouse/dashboard-warehouse" element={<Pages.DashboardWarehousePage />} />
                <Route path="/warehouse/list" element={<Pages.WarehouseListPage />} />
                <Route path="/warehouse/locations" element={<Pages.WarehouseListPage />} />
                <Route path="/warehouse/stock" element={<Pages.StockListPage />} />
                <Route path="/warehouse/expected-imports" element={<Pages.ExpectedImportsPage />} />
                <Route path="/warehouse/reconciliation" element={<Pages.ReconciliationPage />} />
                <Route path="/warehouse/suppliers" element={<Pages.SuppliersPage />} />
                <Route path="/warehouse/barcodes" element={<Pages.BarcodePage />} />
                <Route path="/warehouse/transfer" element={<Pages.TransferListPage />} />
                <Route path="/warehouse/import" element={<Pages.ImportListPage />} />
                <Route path="/warehouse/export" element={<Pages.ExportListPage />} />
                <Route path="/warehouse/settings" element={<Pages.SettingsPage />} />

                <Route path="/stocktake/list" element={<Pages.StocktakeListPage />} />
                <Route path="/stocktake/adjustment" element={<Pages.AdjustmentListPage />} />
                <Route path="/stocktake/settings" element={<Pages.StocktakeSettingsPage />} />
              </>
            ) : (
              <>
                <Route path="/warehouse/*" element={<Navigate to="/dashboard" replace />} />
                <Route path="/stocktake/*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}

            <Route path="/members/list" element={<Pages.MembersPage />} />
            <Route path="/members/settings" element={<Pages.MembersSettingsPage />} />
            <Route path="/members/new" element={<Pages.EmployeeCreatePage />} />
            <Route path="/members/:id" element={<Pages.EmployeeDetailPage />} />

            <Route path="/recruitment/candidates" element={<Pages.CandidateListPage />} />
            <Route path="/recruitment/candidates/:id" element={<Pages.CandidateDetailPage />} />
            <Route path="/recruitment/settings" element={<Pages.RecruitmentSettingsPage />} />

            <Route path="/members/recruits" element={<Navigate to="/recruitment/candidates" replace />} />

            <Route path="/profile" element={<Pages.UserProfilePage />} />

            <Route path="/admin/users" element={<Pages.AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<Pages.AdminUserDetailPage />} />
            <Route path="/admin/settings" element={<Pages.AdminSettingsPage />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  );
}
