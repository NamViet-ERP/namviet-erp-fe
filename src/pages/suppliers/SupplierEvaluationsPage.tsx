import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import TabFilter from '../../components/ui/TabFilter';
import HrmPanel from '../../components/hr/HrmPanel';
import SupplierOrderEvaluationsPanel from '../../components/suppliers/SupplierOrderEvaluationsPanel';
import SupplierKpiEvaluationsPanel from '../../components/suppliers/SupplierKpiEvaluationsPanel';
import SupplierSourcingKpiCards from '../../components/suppliers/SupplierSourcingKpiCards';
import { useSupplierDeliveryEvaluations } from '../../hooks/useSupplierDirectory';
import type { TabItem } from '../../types';

type EvalTab = 'order' | 'kpi';

export default function SupplierEvaluationsPage() {
  const [tab, setTab] = useState<EvalTab>('order');
  const pendingQuery = useSupplierDeliveryEvaluations({
    status: 'pending',
    page: 1,
    pageSize: 1,
  });

  const tabs: TabItem[] = [
    {
      id: 'order',
      label: 'Đánh giá theo đơn hàng',
      count: pendingQuery.data?.totalCount,
    },
    { id: 'kpi', label: 'Đánh giá định kỳ (KPI)' },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Đánh giá & Thăng hạng NCC"
        subtitle="Chuẩn hóa đánh giá thăng hạng (50-20-20-10), KPI Sourcing và đánh giá theo đơn hàng."
      />

      <SupplierSourcingKpiCards />

      <HrmPanel noPadding>
        <div className="px-4 pt-3 border-b border-[var(--md-outline-variant)]">
          <TabFilter
            tabs={tabs}
            activeTab={tab}
            onChange={id => setTab(id as EvalTab)}
          />
        </div>
        {tab === 'order' ? <SupplierOrderEvaluationsPanel /> : null}
        {tab === 'kpi' ? <SupplierKpiEvaluationsPanel /> : null}
      </HrmPanel>
    </div>
  );
}
