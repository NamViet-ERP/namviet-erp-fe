import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import TabFilter from '../../components/ui/TabFilter';
import HrmPanel from '../../components/hr/HrmPanel';
import SupplierOrderEvaluationsPanel from '../../components/suppliers/SupplierOrderEvaluationsPanel';
import SupplierKpiEvaluationsPanel from '../../components/suppliers/SupplierKpiEvaluationsPanel';
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
        title="Đánh giá NCC"
        subtitle="Đánh giá theo đơn hàng và KPI định kỳ. Xếp hạng theo ngưỡng trong Thiết lập. Blacklist xem mục riêng trên menu."
      />
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
