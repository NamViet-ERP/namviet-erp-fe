import { useMemo } from 'react';
import { useArrivalPlans } from './useArrivalPlans';
import { useLowStockAlerts } from './useLowStockAlerts';
import { useMaterials } from './useMaterials';
import { useProjects } from './useProjects';
import { usePurchaseOrders } from './usePurchaseOrders';
import { usePurchasePayments } from './usePurchasePayments';
import { usePurchasePlans } from './usePurchasePlans';

const EMPTY_PM_ID = '00000000-0000-0000-0000-000000000000';
const ACTIVE_PROJECT_PIC_PAGE = 200;
const LOW_STOCK_LIMIT = 200;

function countOrDash(isLoading: boolean, value: number | undefined): number | string {
  if (isLoading && value === undefined) return '-';
  return value ?? 0;
}

export function useOperationsDashboard() {
  const allProjectsQ = useProjects({ page: 1, pageSize: 1 });
  const activeProjectsQ = useProjects({
    page: 1,
    pageSize: ACTIVE_PROJECT_PIC_PAGE,
    status: 'Active',
  });
  const closedProjectsQ = useProjects({ page: 1, pageSize: 1, status: 'Closed' });

  const lowStockQ = useLowStockAlerts(undefined, LOW_STOCK_LIMIT);

  const ordersNoneQ = usePurchaseOrders({ page: 1, pageSize: 8, deliveryStatus: 'none' });
  const ordersPartialQ = usePurchaseOrders({ page: 1, pageSize: 8, deliveryStatus: 'partial' });
  const ordersUnpaidQ = usePurchaseOrders({ page: 1, pageSize: 1, paymentStatus: 'unpaid' });
  const ordersPartialPayQ = usePurchaseOrders({ page: 1, pageSize: 1, paymentStatus: 'partial' });
  const ordersWarningQ = usePurchaseOrders({ page: 1, pageSize: 1, paymentWarning: true });

  const paymentsDraftQ = usePurchasePayments({ page: 1, pageSize: 1, status: 'draft' });
  const paymentsSubmittedQ = usePurchasePayments({ page: 1, pageSize: 5, status: 'submitted' });
  const paymentsPaidQ = usePurchasePayments({ page: 1, pageSize: 1, status: 'paid' });
  const plansOpenQ = usePurchasePlans({ page: 1, pageSize: 1 });

  const arrivalsQ = useArrivalPlans(7);
  const materialsActiveQ = useMaterials({ page: 1, pageSize: 1 });
  const materialsAllQ = useMaterials({ page: 1, pageSize: 1, includeInactive: true });

  const lowStock = lowStockQ.data ?? [];
  const openOrderRows = [...(ordersNoneQ.data?.items ?? []), ...(ordersPartialQ.data?.items ?? [])].slice(0, 8);
  const pendingPaymentRows = [
    ...(paymentsSubmittedQ.data?.items ?? []),
    ...(paymentsDraftQ.data?.items ?? []),
  ].slice(0, 5);

  const picStats = useMemo(() => {
    const items = activeProjectsQ.data?.items ?? [];
    let withPm = 0;
    let withSc = 0;
    let withKeeper = 0;
    for (const row of items) {
      const hasPm = Boolean(row.pmName?.trim()) && row.pmId !== EMPTY_PM_ID;
      if (hasPm) withPm += 1;
      if (row.scMembers?.trim()) withSc += 1;
      if ((row.warehouseKeepers?.length ?? 0) > 0) withKeeper += 1;
    }
    const scanned = items.length;
    return {
      withPm,
      withSc,
      withKeeper,
      withoutPm: Math.max(0, scanned - withPm),
    };
  }, [activeProjectsQ.data?.items]);

  const stockStats = useMemo(() => {
    const zeroQty = lowStock.filter(a => a.actualQty <= 0).length;
    const projectCount = new Set(lowStock.map(a => a.projectCode)).size;
    return { belowMin: lowStock.length, zeroQty, projectCount };
  }, [lowStock]);

  const arrivalStats = useMemo(() => {
    const projects = arrivalsQ.data?.projects ?? [];
    return projects.reduce(
      (acc, p) => {
        acc.overdue += p.overdueCount;
        acc.dueToday += p.dueTodayCount;
        acc.upcoming += p.upcomingCount;
        return acc;
      },
      { overdue: 0, dueToday: 0, upcoming: 0 },
    );
  }, [arrivalsQ.data?.projects]);

  const materialsActive = materialsActiveQ.data?.totalCount;
  const materialsAll = materialsAllQ.data?.totalCount;
  const materialsInactive =
    materialsActive === undefined || materialsAll === undefined
      ? undefined
      : Math.max(0, materialsAll - materialsActive);

  const isBootLoading =
    (allProjectsQ.isLoading || activeProjectsQ.isLoading || lowStockQ.isLoading)
    && !activeProjectsQ.data
    && !allProjectsQ.data;

  const isError =
    allProjectsQ.isError
    || activeProjectsQ.isError
    || lowStockQ.isError
    || ordersNoneQ.isError
    || ordersPartialQ.isError;

  const error =
    allProjectsQ.error
    ?? activeProjectsQ.error
    ?? lowStockQ.error
    ?? ordersNoneQ.error
    ?? ordersPartialQ.error;

  const refetchAll = () => {
    void allProjectsQ.refetch();
    void activeProjectsQ.refetch();
    void closedProjectsQ.refetch();
    void lowStockQ.refetch();
    void ordersNoneQ.refetch();
    void ordersPartialQ.refetch();
    void ordersUnpaidQ.refetch();
    void ordersPartialPayQ.refetch();
    void ordersWarningQ.refetch();
    void paymentsDraftQ.refetch();
    void paymentsSubmittedQ.refetch();
    void paymentsPaidQ.refetch();
    void plansOpenQ.refetch();
    void arrivalsQ.refetch();
    void materialsActiveQ.refetch();
    void materialsAllQ.refetch();
  };

  return {
    isBootLoading,
    isError,
    error,
    refetchAll,
    activeProjects: (activeProjectsQ.data?.items ?? []).slice(0, 8),
    lowStock,
    stockPreview: lowStock.slice(0, 8),
    openOrderRows,
    pendingPaymentRows,
    counts: {
      projectActive: countOrDash(activeProjectsQ.isLoading, activeProjectsQ.data?.totalCount),
      projectClosed: countOrDash(closedProjectsQ.isLoading, closedProjectsQ.data?.totalCount),
      projectTotal: countOrDash(allProjectsQ.isLoading, allProjectsQ.data?.totalCount),
      projectWithPm: countOrDash(activeProjectsQ.isLoading, activeProjectsQ.data ? picStats.withPm : undefined),
      projectWithoutPm: countOrDash(activeProjectsQ.isLoading, activeProjectsQ.data ? picStats.withoutPm : undefined),
      projectWithSc: countOrDash(activeProjectsQ.isLoading, activeProjectsQ.data ? picStats.withSc : undefined),
      projectWithKeeper: countOrDash(activeProjectsQ.isLoading, activeProjectsQ.data ? picStats.withKeeper : undefined),
      stockBelowMin: countOrDash(lowStockQ.isLoading, lowStockQ.data ? stockStats.belowMin : undefined),
      stockZero: countOrDash(lowStockQ.isLoading, lowStockQ.data ? stockStats.zeroQty : undefined),
      stockProjects: countOrDash(lowStockQ.isLoading, lowStockQ.data ? stockStats.projectCount : undefined),
      orderNone: countOrDash(ordersNoneQ.isLoading, ordersNoneQ.data?.totalCount),
      orderPartial: countOrDash(ordersPartialQ.isLoading, ordersPartialQ.data?.totalCount),
      planCount: countOrDash(plansOpenQ.isLoading, plansOpenQ.data?.totalCount),
      paymentDraft: countOrDash(paymentsDraftQ.isLoading, paymentsDraftQ.data?.totalCount),
      paymentSubmitted: countOrDash(paymentsSubmittedQ.isLoading, paymentsSubmittedQ.data?.totalCount),
      paymentPaid: countOrDash(paymentsPaidQ.isLoading, paymentsPaidQ.data?.totalCount),
      poOverdue: countOrDash(ordersWarningQ.isLoading, ordersWarningQ.data?.totalCount),
      poUnpaid: countOrDash(ordersUnpaidQ.isLoading, ordersUnpaidQ.data?.totalCount),
      poPartialPay: countOrDash(ordersPartialPayQ.isLoading, ordersPartialPayQ.data?.totalCount),
      arrivalOverdue: countOrDash(arrivalsQ.isLoading, arrivalsQ.data ? arrivalStats.overdue : undefined),
      arrivalDueToday: countOrDash(arrivalsQ.isLoading, arrivalsQ.data ? arrivalStats.dueToday : undefined),
      arrivalUpcoming: countOrDash(arrivalsQ.isLoading, arrivalsQ.data ? arrivalStats.upcoming : undefined),
      materialActive: countOrDash(materialsActiveQ.isLoading, materialsActive),
      materialInactive: countOrDash(
        materialsActiveQ.isLoading || materialsAllQ.isLoading,
        materialsInactive,
      ),
      materialTotal: countOrDash(materialsAllQ.isLoading, materialsAll),
    },
  };
}
