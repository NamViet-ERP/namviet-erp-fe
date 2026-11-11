import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import TabFilter from '../../components/ui/TabFilter';
import HrmPanel from '../../components/hr/HrmPanel';
import SupplierTierGradingPanel from '../../components/suppliers/SupplierTierGradingPanel';
import SupplierOrderEvaluationsPanel from '../../components/suppliers/SupplierOrderEvaluationsPanel';
import SupplierKpiEvaluationsPanel from '../../components/suppliers/SupplierKpiEvaluationsPanel';
import SupplierSourcingKpiCards from '../../components/suppliers/SupplierSourcingKpiCards';
import { useSupplierDeliveryEvaluations } from '../../hooks/useSupplierDirectory';
import type { TabItem } from '../../types';

type EvalTab = 'tier' | 'order' | 'kpi';
const VALID_TABS: EvalTab[] = ['tier', 'order', 'kpi'];

export default function SupplierEvaluationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSupplierId = searchParams.get('supplierId');
  const urlTab = searchParams.get('tab') as EvalTab | null;

  const getInitialTab = (): EvalTab => {
    if (urlTab && VALID_TABS.includes(urlTab)) return urlTab;
    if (urlSupplierId) return 'order';
    return 'tier';
  };

  const [tab, setTab] = useState<EvalTab>(getInitialTab);

  useEffect(() => {
    if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== tab) {
      setTab(urlTab);
    } else if (!urlTab && urlSupplierId && tab === 'tier') {
      setTab('order');
    }
  }, [urlTab, urlSupplierId]);

  const handleTabChange = (newTabId: string) => {
    const nextTab = newTabId as EvalTab;
    setTab(nextTab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', nextTab);
      return next;
    }, { replace: true });
  };

  const pendingQuery = useSupplierDeliveryEvaluations({
    status: 'pending',
    page: 1,
    pageSize: 1,
  });

  const tabs: TabItem[] = [
    {
      id: 'tier',
      label: 'Chấm điểm thăng hạng (50-20-20-10)',
    },
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
            onChange={handleTabChange}
          />
        </div>
        {tab === 'tier' ? <SupplierTierGradingPanel /> : null}
        {tab === 'order' ? <SupplierOrderEvaluationsPanel /> : null}
        {tab === 'kpi' ? <SupplierKpiEvaluationsPanel /> : null}
      </HrmPanel>
    </div>
  );
}
