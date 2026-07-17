import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PageLoader from './components/ui/PageLoader';
import { Agentation } from 'agentation';
import { getDefaultRoute } from './utils/getDefaultRoute';
import { getActiveRole } from './lib/getActiveRole';
import * as Pages from './routes/lazyPages';

const DevOnlyRoutes = import.meta.env.DEV
  ? lazy(() => import('./routes/DevOnlyRoutes'))
  : null;

export default function App() {
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

            <Route path="/warehouse/dashboard" element={<Pages.DashboardPage />} />
            <Route path="/warehouse/dashboard-warehouse" element={<Pages.DashboardWarehousePage />} />
            <Route path="/warehouse/list" element={<Navigate to="/warehouse/projects" replace />} />
            <Route path="/warehouse/locations" element={<Navigate to="/warehouse/projects" replace />} />
            <Route path="/warehouse/stock" element={<Pages.StockListPage />} />
            <Route path="/warehouse/materials" element={<Pages.MaterialsPage />} />
            <Route path="/warehouse/projects" element={<Pages.ProjectsPage />} />
            <Route path="/warehouse/projects/:code" element={<Pages.ProjectDetailPage />} />
            <Route path="/warehouse/suppliers" element={<Navigate to="/warehouse/settings/suppliers" replace />} />
            <Route path="/warehouse/transfer" element={<Pages.TransferListPage />} />
            <Route path="/warehouse/material-return" element={<Pages.MaterialReturnPage />} />
            <Route path="/warehouse/import" element={<Pages.ImportListPage />} />
            <Route path="/warehouse/export" element={<Pages.ExportListPage />} />
            <Route path="/warehouse/reports" element={<Pages.WarehouseReportsPage />} />
            <Route path="/warehouse/settings" element={<Navigate to="/warehouse/settings/material-categories" replace />} />
            <Route path="/warehouse/settings/material-categories" element={<Pages.SettingsPage />} />
            <Route path="/warehouse/settings/material-units" element={<Pages.SettingsPage />} />
            <Route path="/warehouse/settings/suppliers" element={<Pages.SettingsPage />} />
            <Route path="/warehouse/settings/price-books" element={<Pages.SettingsPage />} />

            <Route path="/stocktake/list" element={<Pages.StocktakeListPage />} />
            <Route path="/stocktake/settings" element={<Pages.StocktakeSettingsPage />} />

            <Route path="/members/list" element={<Pages.MembersPage />} />
            <Route path="/members/settings" element={<Pages.MembersSettingsPage />} />
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
            <Route path="/recruitment/settings" element={<Pages.RecruitmentSettingsPage />} />

            <Route path="/members/recruits" element={<Navigate to="/recruitment/candidates" replace />} />

            <Route path="/profile" element={<Pages.UserProfilePage />} />

            <Route path="/admin/users" element={<Pages.AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<Pages.AdminUserDetailPage />} />
            <Route path="/admin/settings" element={<Pages.AdminSettingsPage />} />
            <Route path="/admin/settings/roles/:code/permissions" element={<Pages.AdminRolePermissionsPage />} />

            <Route path="/technical" element={<Navigate to="/technical/cskh/clients" replace />} />
            <Route path="/technical/cskh" element={<Navigate to="/technical/cskh/clients" replace />} />
            <Route path="/technical/cskh/clients" element={<Pages.AfterSalesClientsPage />} />
            <Route path="/technical/cskh/history" element={<Pages.CareHistoryPage />} />
            <Route path="/technical/cskh/project-issues" element={<Pages.ProjectIssuesPage />} />
            <Route path="/technical/cskh/reports-cdt" element={<Pages.CdtReportsPage />} />
            <Route path="/technical/cskh/reports-internal" element={<Pages.InternalReportsPage />} />
            <Route path="/technical/cskh/birthdays" element={<Pages.CskhBirthdaysPage />} />
            <Route path="/technical/cskh/settings" element={<Pages.CskhSettingsPage />} />

            {DevOnlyRoutes && (
              <>
                <Route path="/purchasing/*" element={<DevOnlyRoutes module="purchasing" />} />
                <Route path="/suppliers/*" element={<DevOnlyRoutes module="suppliers" />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/dashboard" replace />} />          </Route>
        </Routes>
      </Suspense>
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  );
}
