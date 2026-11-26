import { useMemo } from 'react';
import { hasValidPm } from '../lib/projectPersonnel';
import { useArrivalPlans } from './useArrivalPlans';
import { useLowStockAlerts } from './useLowStockAlerts';
import { useMaterials } from './useMaterials';
import { useProjects } from './useProjects';
import { usePurchaseOrders } from './usePurchaseOrders';
import { usePurchasePayments } from './usePurchasePayments';
import { usePurchasePlans } from './usePurchasePlans';

const CONSOLIDATED_PAGE_SIZE = 200;
const LOW_STOCK_LIMIT = 200;
const DASH_STALE_TIME = 60_000;

function countOrDash(isLoading: boolean, value: number | undefined): number | string {
  if (isLoading && value === undefined) return '-';
  return value ?? 0;
}

export function useOperationsDashboard() {
  // Primary queries (4 GETs on mount)
  const projectsAllQ = useProjects(
    { page: 1, pageSize: CONSOLIDATED_PAGE_SIZE },
    { staleTime: DASH_STALE_TIME },
  );
  const ordersAllQ = usePurchaseOrders(
    { page: 1, pageSize: CONSOLIDATED_PAGE_SIZE },
    { staleTime: DASH_STALE_TIME },
  );
  const lowStockQ = useLowStockAlerts(undefined, LOW_STOCK_LIMIT, {
    staleTime: DASH_STALE_TIME,
  });
  const paymentsAllQ = usePurchasePayments(
    { page: 1, pageSize: CONSOLIDATED_PAGE_SIZE },
    { staleTime: DASH_STALE_TIME },
  );

  // Secondary queries gated until primary settles (3 GETs => 7 total in <= 200 mode)
  const primarySettled =
    !projectsAllQ.isLoading && !ordersAllQ.isLoading && !lowStockQ.isLoading;

  const plansOpenQ = usePurchasePlans(
    { page: 1, pageSize: 1 },
    { enabled: primarySettled, staleTime: DASH_STALE_TIME },
  );
  const arrivalsQ = useArrivalPlans(
    7,
    {},
    { enabled: primarySettled, staleTime: DASH_STALE_TIME },
  );
  const materialsAllQ = useMaterials(
    { page: 1, pageSize: CONSOLIDATED_PAGE_SIZE, includeInactive: true },
    { enabled: primarySettled, staleTime: DASH_STALE_TIME },
  );

  // Fallback queries enabled ONLY when dataset totalCount > 200
  const projectsOverflow = (projectsAllQ.data?.totalCount ?? 0) > CONSOLIDATED_PAGE_SIZE;
  const ordersOverflow = (ordersAllQ.data?.totalCount ?? 0) > CONSOLIDATED_PAGE_SIZE;
  const paymentsOverflow = (paymentsAllQ.data?.totalCount ?? 0) > CONSOLIDATED_PAGE_SIZE;
  const materialsOverflow = (materialsAllQ.data?.totalCount ?? 0) > CONSOLIDATED_PAGE_SIZE;

  const activeProjectsQ = useProjects(
    { page: 1, pageSize: CONSOLIDATED_PAGE_SIZE, status: 'Active' },
    { enabled: projectsOverflow, staleTime: DASH_STALE_TIME },
  );
  const closedProjectsQ = useProjects(
    { page: 1, pageSize: 1, status: 'Closed' },
    { enabled: projectsOverflow, staleTime: DASH_STALE_TIME },
  );

  const ordersNoneQ = usePurchaseOrders(
    { page: 1, pageSize: 8, deliveryStatus: 'none' },
    { enabled: ordersOverflow, staleTime: DASH_STALE_TIME },
  );
  const ordersPartialQ = usePurchaseOrders(
    { page: 1, pageSize: 8, deliveryStatus: 'partial' },
    { enabled: ordersOverflow, staleTime: DASH_STALE_TIME },
  );
  const ordersUnpaidQ = usePurchaseOrders(
    { page: 1, pageSize: 1, paymentStatus: 'unpaid' },
    { enabled: ordersOverflow, staleTime: DASH_STALE_TIME },
  );
  const ordersPartialPayQ = usePurchaseOrders(
    { page: 1, pageSize: 1, paymentStatus: 'partial' },
    { enabled: ordersOverflow, staleTime: DASH_STALE_TIME },
  );
  const ordersWarningQ = usePurchaseOrders(
    { page: 1, pageSize: 1, paymentWarning: true },
    { enabled: ordersOverflow, staleTime: DASH_STALE_TIME },
  );

  const paymentsDraftQ = usePurchasePayments(
    { page: 1, pageSize: 1, status: 'draft' },
    { enabled: paymentsOverflow, staleTime: DASH_STALE_TIME },
  );
  const paymentsSubmittedQ = usePurchasePayments(
    { page: 1, pageSize: 5, status: 'submitted' },
    { enabled: paymentsOverflow, staleTime: DASH_STALE_TIME },
  );
  const paymentsPaidQ = usePurchasePayments(
    { page: 1, pageSize: 1, status: 'paid' },
    { enabled: paymentsOverflow, staleTime: DASH_STALE_TIME },
  );

  const materialsActiveQ = useMaterials(
    { page: 1, pageSize: 1 },
    { enabled: primarySettled && materialsOverflow, staleTime: DASH_STALE_TIME },
  );

  const projectSummary = useMemo(() => {
    if (!projectsOverflow && projectsAllQ.data) {
      const items = projectsAllQ.data.items;
      const activeItems = items.filter(p => p.status === 'Active');
      const closedCount = items.filter(p => p.status === 'Closed').length;
      return {
        activeItems,
        activeCount: activeItems.length,
        closedCount,
        totalCount: projectsAllQ.data.totalCount,
        activeLoading: projectsAllQ.isLoading,
        closedLoading: projectsAllQ.isLoading,
        hasActiveData: true,
      };
    }
    return {
      activeItems: activeProjectsQ.data?.items ?? [],
      activeCount: activeProjectsQ.data?.totalCount,
      closedCount: closedProjectsQ.data?.totalCount,
      totalCount: projectsAllQ.data?.totalCount,
      activeLoading: projectsOverflow ? activeProjectsQ.isLoading : projectsAllQ.isLoading,
      closedLoading: projectsOverflow ? closedProjectsQ.isLoading : projectsAllQ.isLoading,
      hasActiveData: Boolean(projectsOverflow ? activeProjectsQ.data : projectsAllQ.data),
    };
  }, [
    projectsOverflow,
    projectsAllQ.data,
    projectsAllQ.isLoading,
    activeProjectsQ.data,
    activeProjectsQ.isLoading,
    closedProjectsQ.data,
    closedProjectsQ.isLoading,
  ]);

  const picStats = useMemo(() => {
    const items = projectSummary.activeItems;
    let withPm = 0;
    let withSc = 0;
    let withKeeper = 0;
    for (const row of items) {
      if (hasValidPm(row.pmName, row.pmId)) withPm += 1;
      if (row.scMembers?.trim()) withSc += 1;
      if ((row.warehouseKeepers?.length ?? 0) > 0) withKeeper += 1;
    }
    return {
      withPm,
      withSc,
      withKeeper,
      withoutPm: Math.max(0, items.length - withPm),
    };
  }, [projectSummary.activeItems]);

  const orderSummary = useMemo(() => {
    if (!ordersOverflow && ordersAllQ.data) {
      const items = ordersAllQ.data.items;
      const noneOrders = items.filter(o => o.deliveryStatus === 'none');
      const partialOrders = items.filter(o => o.deliveryStatus === 'partial');
      return {
        openOrderRows: [...noneOrders, ...partialOrders].slice(0, 8),
        orderNone: noneOrders.length,
        orderPartial: partialOrders.length,
        poUnpaid: items.filter(o => o.paymentStatus === 'unpaid').length,
        poPartialPay: items.filter(o => o.paymentStatus === 'partial').length,
        poOverdue: items.filter(o => Boolean(o.paymentWarning)).length,
        noneLoading: ordersAllQ.isLoading,
        partialLoading: ordersAllQ.isLoading,
        unpaidLoading: ordersAllQ.isLoading,
        partialPayLoading: ordersAllQ.isLoading,
        warningLoading: ordersAllQ.isLoading,
      };
    }
    return {
      openOrderRows: [
        ...(ordersNoneQ.data?.items ?? []),
        ...(ordersPartialQ.data?.items ?? []),
      ].slice(0, 8),
      orderNone: ordersNoneQ.data?.totalCount,
      orderPartial: ordersPartialQ.data?.totalCount,
      poUnpaid: ordersUnpaidQ.data?.totalCount,
      poPartialPay: ordersPartialPayQ.data?.totalCount,
      poOverdue: ordersWarningQ.data?.totalCount,
      noneLoading: ordersOverflow ? ordersNoneQ.isLoading : ordersAllQ.isLoading,
      partialLoading: ordersOverflow ? ordersPartialQ.isLoading : ordersAllQ.isLoading,
      unpaidLoading: ordersOverflow ? ordersUnpaidQ.isLoading : ordersAllQ.isLoading,
      partialPayLoading: ordersOverflow ? ordersPartialPayQ.isLoading : ordersAllQ.isLoading,
      warningLoading: ordersOverflow ? ordersWarningQ.isLoading : ordersAllQ.isLoading,
    };
  }, [
    ordersOverflow,
    ordersAllQ.data,
    ordersAllQ.isLoading,
    ordersNoneQ.data,
    ordersNoneQ.isLoading,
    ordersPartialQ.data,
    ordersPartialQ.isLoading,
    ordersUnpaidQ.data,
    ordersUnpaidQ.isLoading,
    ordersPartialPayQ.data,
    ordersPartialPayQ.isLoading,
    ordersWarningQ.data,
    ordersWarningQ.isLoading,
  ]);

  const paymentSummary = useMemo(() => {
    if (!paymentsOverflow && paymentsAllQ.data) {
      const items = paymentsAllQ.data.items;
      const draftPayments = items.filter(p => p.status === 'draft');
      const submittedPayments = items.filter(p => p.status === 'submitted');
      const paidPayments = items.filter(p => p.status === 'paid');
      return {
        pendingPaymentRows: [...submittedPayments, ...draftPayments].slice(0, 5),
        paymentDraft: draftPayments.length,
        paymentSubmitted: submittedPayments.length,
        paymentPaid: paidPayments.length,
        draftLoading: paymentsAllQ.isLoading,
        submittedLoading: paymentsAllQ.isLoading,
        paidLoading: paymentsAllQ.isLoading,
      };
    }
    return {
      pendingPaymentRows: [
        ...(paymentsSubmittedQ.data?.items ?? []),
        ...(paymentsDraftQ.data?.items ?? []),
      ].slice(0, 5),
      paymentDraft: paymentsDraftQ.data?.totalCount,
      paymentSubmitted: paymentsSubmittedQ.data?.totalCount,
      paymentPaid: paymentsPaidQ.data?.totalCount,
      draftLoading: paymentsOverflow ? paymentsDraftQ.isLoading : paymentsAllQ.isLoading,
      submittedLoading: paymentsOverflow ? paymentsSubmittedQ.isLoading : paymentsAllQ.isLoading,
      paidLoading: paymentsOverflow ? paymentsPaidQ.isLoading : paymentsAllQ.isLoading,
    };
  }, [
    paymentsOverflow,
    paymentsAllQ.data,
    paymentsAllQ.isLoading,
    paymentsDraftQ.data,
    paymentsDraftQ.isLoading,
    paymentsSubmittedQ.data,
    paymentsSubmittedQ.isLoading,
    paymentsPaidQ.data,
    paymentsPaidQ.isLoading,
  ]);

  const materialSummary = useMemo(() => {
    const allLoading = !primarySettled || materialsAllQ.isLoading;
    if (!materialsOverflow && materialsAllQ.data) {
      const items = materialsAllQ.data.items;
      return {
        active: items.filter(m => m.isActive).length,
        inactive: items.filter(m => !m.isActive).length,
        total: materialsAllQ.data.totalCount,
        activeLoading: allLoading,
        inactiveLoading: allLoading,
        totalLoading: allLoading,
      };
    }
    const activeCount = materialsActiveQ.data?.totalCount;
    const totalCount = materialsAllQ.data?.totalCount;
    const inactiveCount =
      activeCount === undefined || totalCount === undefined
        ? undefined
        : Math.max(0, totalCount - activeCount);
    const activeLoading =
      !primarySettled || (materialsOverflow ? materialsActiveQ.isLoading : materialsAllQ.isLoading);
    return {
      active: activeCount,
      inactive: inactiveCount,
      total: totalCount,
      activeLoading,
      inactiveLoading: activeLoading || allLoading,
      totalLoading: allLoading,
    };
  }, [
    primarySettled,
    materialsOverflow,
    materialsAllQ.data,
    materialsAllQ.isLoading,
    materialsActiveQ.data,
    materialsActiveQ.isLoading,
  ]);

  const lowStock = useMemo(() => lowStockQ.data ?? [], [lowStockQ.data]);
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

  const isBootLoading =
    (projectsAllQ.isLoading || ordersAllQ.isLoading || lowStockQ.isLoading)
    && !projectsAllQ.data
    && !ordersAllQ.data;

  const isError =
    projectsAllQ.isError
    || ordersAllQ.isError
    || lowStockQ.isError
    || (projectsOverflow && activeProjectsQ.isError)
    || (ordersOverflow && (ordersNoneQ.isError || ordersPartialQ.isError));

  const error =
    projectsAllQ.error
    ?? ordersAllQ.error
    ?? lowStockQ.error
    ?? (projectsOverflow ? activeProjectsQ.error : null)
    ?? (ordersOverflow ? (ordersNoneQ.error ?? ordersPartialQ.error) : null);

  const refetchAll = () => {
    void projectsAllQ.refetch();
    void ordersAllQ.refetch();
    void lowStockQ.refetch();
    void paymentsAllQ.refetch();
    if (primarySettled) {
      void plansOpenQ.refetch();
      void arrivalsQ.refetch();
      void materialsAllQ.refetch();
    }
    if (projectsOverflow) {
      void activeProjectsQ.refetch();
      void closedProjectsQ.refetch();
    }
    if (ordersOverflow) {
      void ordersNoneQ.refetch();
      void ordersPartialQ.refetch();
      void ordersUnpaidQ.refetch();
      void ordersPartialPayQ.refetch();
      void ordersWarningQ.refetch();
    }
    if (paymentsOverflow) {
      void paymentsDraftQ.refetch();
      void paymentsSubmittedQ.refetch();
      void paymentsPaidQ.refetch();
    }
    if (primarySettled && materialsOverflow) {
      void materialsActiveQ.refetch();
    }
  };

  return {
    isBootLoading,
    isError,
    error,
    refetchAll,
    activeProjects: projectSummary.activeItems.slice(0, 8),
    lowStock,
    stockPreview: lowStock.slice(0, 8),
    openOrderRows: orderSummary.openOrderRows,
    pendingPaymentRows: paymentSummary.pendingPaymentRows,
    counts: {
      projectActive: countOrDash(projectSummary.activeLoading, projectSummary.activeCount),
      projectClosed: countOrDash(projectSummary.closedLoading, projectSummary.closedCount),
      projectTotal: countOrDash(projectsAllQ.isLoading, projectSummary.totalCount),
      projectWithPm: countOrDash(
        projectSummary.activeLoading,
        projectSummary.hasActiveData ? picStats.withPm : undefined,
      ),
      projectWithoutPm: countOrDash(
        projectSummary.activeLoading,
        projectSummary.hasActiveData ? picStats.withoutPm : undefined,
      ),
      projectWithSc: countOrDash(
        projectSummary.activeLoading,
        projectSummary.hasActiveData ? picStats.withSc : undefined,
      ),
      projectWithKeeper: countOrDash(
        projectSummary.activeLoading,
        projectSummary.hasActiveData ? picStats.withKeeper : undefined,
      ),
      stockBelowMin: countOrDash(lowStockQ.isLoading, lowStockQ.data ? stockStats.belowMin : undefined),
      stockZero: countOrDash(lowStockQ.isLoading, lowStockQ.data ? stockStats.zeroQty : undefined),
      stockProjects: countOrDash(
        lowStockQ.isLoading,
        lowStockQ.data ? stockStats.projectCount : undefined,
      ),
      orderNone: countOrDash(orderSummary.noneLoading, orderSummary.orderNone),
      orderPartial: countOrDash(orderSummary.partialLoading, orderSummary.orderPartial),
      planCount: countOrDash(!primarySettled || plansOpenQ.isLoading, plansOpenQ.data?.totalCount),
      paymentDraft: countOrDash(paymentSummary.draftLoading, paymentSummary.paymentDraft),
      paymentSubmitted: countOrDash(paymentSummary.submittedLoading, paymentSummary.paymentSubmitted),
      paymentPaid: countOrDash(paymentSummary.paidLoading, paymentSummary.paymentPaid),
      poOverdue: countOrDash(orderSummary.warningLoading, orderSummary.poOverdue),
      poUnpaid: countOrDash(orderSummary.unpaidLoading, orderSummary.poUnpaid),
      poPartialPay: countOrDash(orderSummary.partialPayLoading, orderSummary.poPartialPay),
      arrivalOverdue: countOrDash(
        !primarySettled || arrivalsQ.isLoading,
        arrivalsQ.data ? arrivalStats.overdue : undefined,
      ),
      arrivalDueToday: countOrDash(
        !primarySettled || arrivalsQ.isLoading,
        arrivalsQ.data ? arrivalStats.dueToday : undefined,
      ),
      arrivalUpcoming: countOrDash(
        !primarySettled || arrivalsQ.isLoading,
        arrivalsQ.data ? arrivalStats.upcoming : undefined,
      ),
      materialActive: countOrDash(materialSummary.activeLoading, materialSummary.active),
      materialInactive: countOrDash(materialSummary.inactiveLoading, materialSummary.inactive),
      materialTotal: countOrDash(materialSummary.totalLoading, materialSummary.total),
    },
  };
}
