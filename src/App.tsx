import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { Agentation } from 'agentation';
import { getDefaultRoute } from './utils/getDefaultRoute';

// Warehouse pages
import DashboardPage from './pages/DashboardPage';
import DashboardWarehousePage from './pages/warehouse/DashboardWarehousePage';
import WarehouseListPage from './pages/warehouse/WarehouseListPage';
import TransferListPage from './pages/warehouse/TransferListPage';
import ImportListPage from './pages/warehouse/ImportListPage';
import ExportListPage from './pages/warehouse/ExportListPage';
import SettingsPage from './pages/warehouse/SettingsPage';
import ExpectedImportsPage from './pages/warehouse/ExpectedImportsPage';
import ReconciliationPage from './pages/warehouse/ReconciliationPage';
import SuppliersPage from './pages/warehouse/SuppliersPage';
import BarcodePage from './pages/warehouse/BarcodePage';
import StockListPage from './pages/warehouse/StockListPage';
import MembersPage from './pages/members/MembersPage';
import EmployeeCreatePage from './pages/members/EmployeeCreatePage';
import EmployeeDetailPage from './pages/members/EmployeeDetailPage';
import MembersSettingsPage from './pages/members/MembersSettingsPage';
import UserProfilePage from './pages/profile/UserProfilePage';
import LoginPage from './pages/auth/LoginPage';
import CandidateApplyPage from './pages/public/CandidateApplyPage';
import EmployeeOnboardPage from './pages/public/EmployeeOnboardPage';
import CandidateListPage from './pages/recruitment/CandidateListPage';
import CandidateDetailPage from './pages/recruitment/CandidateDetailPage';
import RecruitmentSettingsPage from './pages/recruitment/RecruitmentSettingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Stocktake pages
import StocktakeListPage from './pages/stocktake/StocktakeListPage';
import AdjustmentListPage from './pages/stocktake/AdjustmentListPage';
import StocktakeSettingsPage from './pages/stocktake/StocktakeSettingsPage';

export default function App() {
  const enableWms = import.meta.env.VITE_ENABLE_WMS === 'true';
  const role = localStorage.getItem('nv-user-role') || undefined;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recruitment/apply" element={<CandidateApplyPage />} />
        <Route path="/employee/onboarding" element={<EmployeeOnboardPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={getDefaultRoute(role)} replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {enableWms ? (
            <>
              {/* Module 1: Kho hàng */}
              <Route path="/warehouse/dashboard" element={<DashboardPage />} />
              <Route path="/warehouse/dashboard-warehouse" element={<DashboardWarehousePage />} />
              <Route path="/warehouse/list" element={<WarehouseListPage />} />
              <Route path="/warehouse/locations" element={<WarehouseListPage />} />
              <Route path="/warehouse/stock" element={<StockListPage />} />
              <Route path="/warehouse/expected-imports" element={<ExpectedImportsPage />} />
              <Route path="/warehouse/reconciliation" element={<ReconciliationPage />} />
              <Route path="/warehouse/suppliers" element={<SuppliersPage />} />
              <Route path="/warehouse/barcodes" element={<BarcodePage />} />
              <Route path="/warehouse/transfer" element={<TransferListPage />} />
              <Route path="/warehouse/import" element={<ImportListPage />} />
              <Route path="/warehouse/export" element={<ExportListPage />} />
              <Route path="/warehouse/settings" element={<SettingsPage />} />

              {/* Module 2: Kiểm kê */}
              <Route path="/stocktake/list" element={<StocktakeListPage />} />
              <Route path="/stocktake/adjustment" element={<AdjustmentListPage />} />
              <Route path="/stocktake/settings" element={<StocktakeSettingsPage />} />
            </>
          ) : (
            <>
              <Route path="/warehouse/*" element={<Navigate to="/dashboard" replace />} />
              <Route path="/stocktake/*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}

          {/* Module: Nhân viên */}
          <Route path="/members/list" element={<MembersPage />} />
          <Route path="/members/settings" element={<MembersSettingsPage />} />
          <Route path="/members/new" element={<EmployeeCreatePage />} />
          <Route path="/members/:id" element={<EmployeeDetailPage />} />

          {/* Module: Tuyển dụng */}
          <Route path="/recruitment/candidates" element={<CandidateListPage />} />
          <Route path="/recruitment/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="/recruitment/settings" element={<RecruitmentSettingsPage />} />

          {/* Legacy redirect */}
          <Route path="/members/recruits" element={<Navigate to="/recruitment/candidates" replace />} />

          <Route path="/profile" element={<UserProfilePage />} />

          {/* Module: Admin */}
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  );
}
