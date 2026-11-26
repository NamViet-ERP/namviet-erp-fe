import { RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import { useOperationsDashboard } from '../../hooks/useOperationsDashboard';
import { getApiErrorMessage } from '../../lib/apiClient';
import OperationsDashboardBoards from './dashboard/OperationsDashboardBoards';
import OperationsKpiGrid from './dashboard/OperationsKpiGrid';

/** Tổng quan SLC - KPI + bảng cảnh báo theo chrome ERP. */
export default function OperationsDashboardPage() {
  const dash = useOperationsDashboard();

  if (dash.isBootLoading) {
    return <PageLoader />;
  }

  if (dash.isError) {
    return (
      <PageShell variant="list" className="operations-dashboard">
        <PageHeader
          title="Tổng quan vận hành"
          subtitle="Theo dõi tồn kho, đơn mua, thanh toán và dự án đang chạy."
        />
        <SectionCard>
          <EmptyState
            message={getApiErrorMessage(dash.error, 'Không tải được tổng quan vận hành.')}
            action={(
              <Button
                type="button"
                variant="tonal"
                size="sm"
                leftIcon={RefreshCw}
                onClick={() => dash.refetchAll()}
              >
                Thử lại
              </Button>
            )}
          />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell variant="list" className="operations-dashboard">
      <PageHeader
        eyebrow="Dự án EPC"
        title="Tổng quan Vận hành Dự án"
        subtitle="Chỉ số dự án, mua hàng, tồn kho - bấm thẻ để đi tới màn chi tiết."
        actions={(
          <p className="page-header__updated">
            Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      />

      <OperationsKpiGrid counts={dash.counts} />

      <OperationsDashboardBoards
        stockPreview={dash.stockPreview}
        openOrderRows={dash.openOrderRows}
        pendingPaymentRows={dash.pendingPaymentRows}
        activeProjects={dash.activeProjects}
      />
    </PageShell>
  );
}
