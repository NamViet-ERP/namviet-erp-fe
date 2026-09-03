import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PageLoader from './components/ui/PageLoader';
import ErrorBoundary from './components/ErrorBoundary';
import { Agentation } from 'agentation';
import { CSKH_MODULE_ENABLED } from './constants/cskh';
import { WMS_REPORTS_ENABLED } from './constants/sidebarMenus';
import { getDefaultRoute } from './utils/getDefaultRoute';
import { getActiveRole } from './lib/getActiveRole';
import * as Pages from './routes/lazyPages';

const SuppliersModuleRoutes = lazy(() => import('./routes/SuppliersModuleRoutes'));
const CskhModuleRoutes = lazy(() => import('./routes/CskhModuleRoutes'));

export default function App() {
  const role = getActiveRole();

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Pages.LoginPage />} />
          <Route path="/recruitment/apply" element={<Pages.CandidateApplyPage />} />
          <Route path="/employee/onboarding" element={<Pages.EmployeeOnboardPage />} />
          <Route path="/estimates/fill/:token" element={<Pages.PurchaseEstimateFillPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to={getDefaultRoute(role)} replace />} />
            {/* Portal card đã tắt — chuyển về Tổng quan Vận hành */}
            <Route path="/dashboard" element={<Navigate to="/operations/dashboard" replace />} />
            <Route path="/warehouse/dashboard" element={<Navigate to="/operations/dashboard" replace />} />
            <Route path="/warehouse/dashboard-warehouse" element={<Pages.DashboardWarehousePage />} />
            <Route path="/warehouse/list" element={<Navigate to="/warehouse/projects" replace />} />
            <Route path="/warehouse/locations" element={<Navigate to="/warehouse/projects" replace />} />
            <Route path="/warehouse/stock" element={<Pages.StockListPage />} />
            <Route path="/warehouse/materials" element={<Navigate to="/operations/materials" replace />} />
            <Route path="/warehouse/projects" element={<Pages.ProjectsPage />} />
            <Route path="/warehouse/projects/:code" element={<Pages.ProjectDetailPage />} />
            <Route path="/warehouse/arrival-plans" element={<Pages.ArrivalPlansPage />} />
            <Route path="/warehouse/suppliers" element={<Navigate to="/suppliers/list" replace />} />
            <Route path="/warehouse/transfer" element={<Pages.TransferListPage />} />
            <Route path="/warehouse/material-return" element={<Pages.MaterialReturnPage />} />
            <Route path="/warehouse/defects" element={<Pages.DefectsPage />} />
            <Route path="/warehouse/import" element={<Pages.ImportListPage />} />
            <Route path="/warehouse/export" element={<Pages.ExportListPage />} />
            <Route
              path="/warehouse/reports"
              element={
                WMS_REPORTS_ENABLED
                  ? <Pages.WarehouseReportsPage />
                  : <Navigate to="/warehouse/dashboard-warehouse" replace />
              }
            />
            <Route path="/warehouse/settings" element={<Navigate to="/operations/settings/material-categories" replace />} />
            <Route path="/warehouse/settings/material-categories" element={<Navigate to="/operations/settings/material-categories" replace />} />
            <Route path="/warehouse/settings/material-units" element={<Navigate to="/operations/settings/material-units" replace />} />
            <Route path="/warehouse/settings/suppliers" element={<Navigate to="/suppliers/list" replace />} />

            <Route path="/operations" element={<Navigate to="/operations/dashboard" replace />} />
            <Route path="/operations/dashboard" element={<Pages.OperationsDashboardPage />} />
            <Route path="/operations/projects" element={<Pages.OperationsProjectsPage />} />
            <Route path="/operations/materials" element={<Pages.MaterialsPage />} />
            <Route path="/operations/settings" element={<Navigate to="/operations/settings/material-categories" replace />} />
            <Route path="/operations/settings/material-categories" element={<Pages.SettingsPage />} />
            <Route path="/operations/settings/material-units" element={<Pages.SettingsPage />} />

            <Route path="/stocktake/list" element={<Pages.StocktakeListPage />} />
            <Route path="/stocktake/settings" element={<Navigate to="/stocktake/list" replace />} />

            <Route path="/members/list" element={<Pages.MembersPage />} />
            <Route path="/members/settings" element={<Pages.MembersSettingsPage />} />
            <Route path="/members/settings/:tab" element={<Pages.MembersSettingsPage />} />
            <Route path="/members/new" element={<Pages.EmployeeCreatePage />} />
            <Route path="/members/:id" element={<Pages.EmployeeDetailPage />} />

            <Route path="/recruitment/dashboard" element={<Pages.RecruitmentDashboardPage />} />
            <Route path="/recruitment/plans" element={<Pages.RecruitmentPlansPage />} />
            <Route path="/recruitment/costs" element={<Pages.RecruitmentCostsPage />} />
            <Route path="/recruitment/candidates" element={<Pages.CandidateListPage />} />
            <Route path="/recruitment/candidates/:id" element={<Pages.CandidateDetailPage />} />
            <Route path="/recruitment/calendar" element={<Pages.RecruitmentCalendarPage />} />
            <Route path="/recruitment/reports" element={<Pages.RecruitmentReportsPage />} />
            <Route path="/recruitment/hr-stats" element={<Pages.RecruitmentHrStatsPage />} />
            <Route path="/recruitment/settings" element={<Navigate to="/members/settings/recruitment" replace />} />

            <Route path="/members/recruits" element={<Navigate to="/recruitment/candidates" replace />} />

            <Route path="/profile" element={<Pages.UserProfilePage />} />

            <Route path="/admin/users" element={<Pages.AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<Pages.AdminUserDetailPage />} />
            <Route path="/admin/settings" element={<Pages.AdminSettingsPage />} />
            <Route path="/admin/settings/roles/:code/permissions" element={<Pages.AdminRolePermissionsPage />} />

            {CSKH_MODULE_ENABLED ? (
              <Route path="/cskh/*" element={<CskhModuleRoutes />} />
            ) : (
              <>
                <Route path="/cskh" element={<Navigate to={getDefaultRoute(role)} replace />} />
                <Route path="/cskh/*" element={<Navigate to={getDefaultRoute(role)} replace />} />
              </>
            )}
            <Route path="/technical" element={<Navigate to={CSKH_MODULE_ENABLED ? '/cskh' : getDefaultRoute(role)} replace />} />
            <Route path="/technical/*" element={<Navigate to={CSKH_MODULE_ENABLED ? '/cskh' : getDefaultRoute(role)} replace />} />

            <Route path="/purchasing" element={<Navigate to="/purchasing/dashboard" replace />} />
            <Route path="/purchasing/dashboard" element={<Pages.PurchasingDashboardPage />} />
            <Route path="/purchasing/plans" element={<Pages.PurchasePlansPage />} />
            <Route path="/purchasing/plans/:code" element={<Pages.PurchasePlanDetailPage />} />
            <Route path="/purchasing/adhoc" element={<Pages.PurchaseAdhocPlansPage />} />
            <Route path="/purchasing/adhoc/:code" element={<Pages.PurchasePlanDetailPage />} />
            <Route path="/purchasing/orders" element={<Pages.PurchaseOrdersPage />} />
            <Route path="/purchasing/orders/new" element={<Pages.PurchaseOrderDetailPage />} />
            <Route path="/purchasing/orders/:code" element={<Pages.PurchaseOrderDetailPage />} />
            <Route path="/purchasing/estimate-procurement" element={<Pages.PurchaseEstimateProcurementPage />} />
            <Route path="/purchasing/estimate-procurement/:id" element={<Pages.PurchaseEstimateDetailPage />} />
            <Route path="/purchasing/price-book" element={<Pages.PurchasePriceBookPage />} />
            <Route path="/purchasing/contracts" element={<Pages.PurchaseContractsPage />} />
            <Route path="/purchasing/documents" element={<Pages.PurchaseDocumentsPage />} />
            <Route path="/purchasing/warranties" element={<Pages.PurchaseWarrantiesPage />} />
            <Route path="/purchasing/payment-plans" element={<Pages.PurchasePaymentPlansPage />} />
            <Route path="/purchasing/payments" element={<Pages.PurchasePaymentsPage />} />
            <Route path="/purchasing/payments/new" element={<Pages.PurchasePaymentDetailPage />} />
            <Route path="/purchasing/payments/:code" element={<Pages.PurchasePaymentDetailPage />} />
            <Route path="/purchasing/suppliers" element={<Navigate to="/suppliers/list" replace />} />
            <Route path="/purchasing/settings" element={<Navigate to="/purchasing/dashboard" replace />} />

            <Route path="/suppliers/*" element={<SuppliersModuleRoutes />} />

            <Route path="*" element={<Navigate to={getDefaultRoute(role)} replace />} />
          </Route>
        </Routes>
      </Suspense>
      {import.meta.env.DEV && (
        <ErrorBoundary fallback={null}>
          <Agentation />
        </ErrorBoundary>
      )}
    </BrowserRouter>
  );
}
