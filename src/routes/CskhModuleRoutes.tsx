import { Navigate, Route, Routes } from 'react-router-dom';
import CskhLayout from '../pages/cskh/CskhLayout';
import CskhDashboardPage from '../pages/cskh/CskhDashboardPage';
import CskhScreenPage from '../pages/cskh/CskhScreenPage';

/** Phân hệ CSKH - Phase 0: khung menu + empty, chưa API nghiệp vụ. */
export default function CskhModuleRoutes() {
  return (
    <Routes>
      <Route element={<CskhLayout />}>
        <Route index element={<CskhDashboardPage />} />
        <Route path="customers" element={<CskhScreenPage screen="customers" />} />
        <Route path="documents/approval" element={<CskhScreenPage screen="approval" />} />
        <Route path="documents/transit" element={<CskhScreenPage screen="transit" />} />
        <Route path="documents/feedback" element={<CskhScreenPage screen="feedback" />} />
        <Route path="documents/archive" element={<CskhScreenPage screen="archive" />} />
        <Route path="bottlenecks" element={<CskhScreenPage screen="bottlenecks" />} />
        <Route path="requests" element={<CskhScreenPage screen="requests" />} />
        <Route path="gantt" element={<CskhScreenPage screen="gantt" />} />
        <Route path="meetings" element={<CskhScreenPage screen="meetings" />} />
        <Route path="warranties" element={<CskhScreenPage screen="warranties" />} />
        <Route path="settings" element={<CskhScreenPage screen="settings" />} />
        <Route path="*" element={<Navigate to="/cskh" replace />} />
      </Route>
    </Routes>
  );
}
