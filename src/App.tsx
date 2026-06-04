import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { Agentation } from 'agentation';

// Warehouse pages
import DashboardPage from './pages/warehouse/DashboardPage';
import WarehouseListPage from './pages/warehouse/WarehouseListPage';
import TransferListPage from './pages/warehouse/TransferListPage';
import ConversionListPage from './pages/warehouse/ConversionListPage';
import ImportListPage from './pages/warehouse/ImportListPage';
import ExportListPage from './pages/warehouse/ExportListPage';
import SettingsPage from './pages/warehouse/SettingsPage';
import ExpectedImportsPage from './pages/warehouse/ExpectedImportsPage';
import ReconciliationPage from './pages/warehouse/ReconciliationPage';
import SuppliersPage from './pages/warehouse/SuppliersPage';
import BarcodePage from './pages/warehouse/BarcodePage';

// Stocktake pages
import StocktakeListPage from './pages/stocktake/StocktakeListPage';
import AdjustmentListPage from './pages/stocktake/AdjustmentListPage';
import StocktakeSettingsPage from './pages/stocktake/StocktakeSettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/warehouse/dashboard" replace />} />

          {/* Module 1: Kho hàng */}
          <Route path="/warehouse/dashboard" element={<DashboardPage />} />
          <Route path="/warehouse/list" element={<WarehouseListPage />} />
          <Route path="/warehouse/locations" element={<WarehouseListPage />} />
          <Route path="/warehouse/stock" element={<WarehouseListPage />} />
          <Route path="/warehouse/expected-imports" element={<ExpectedImportsPage />} />
          <Route path="/warehouse/reconciliation" element={<ReconciliationPage />} />
          <Route path="/warehouse/suppliers" element={<SuppliersPage />} />
          <Route path="/warehouse/barcodes" element={<BarcodePage />} />
          <Route path="/warehouse/transfer" element={<TransferListPage />} />
          <Route path="/warehouse/conversion" element={<ConversionListPage />} />
          <Route path="/warehouse/import" element={<ImportListPage />} />
          <Route path="/warehouse/export" element={<ExportListPage />} />
          <Route path="/warehouse/settings" element={<SettingsPage />} />

          {/* Module 2: Kiểm kê */}
          <Route path="/stocktake/list" element={<StocktakeListPage />} />
          <Route path="/stocktake/adjustment" element={<AdjustmentListPage />} />
          <Route path="/stocktake/settings" element={<StocktakeSettingsPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/warehouse/dashboard" replace />} />
        </Route>
      </Routes>
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  );
}
