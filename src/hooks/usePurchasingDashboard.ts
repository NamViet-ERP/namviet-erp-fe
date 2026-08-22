import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import { purchasingDashboardService } from '../services/purchasingDashboardService';
import type { PurchasingDashboardQueryParams } from '../types/api/purchasingDashboardApi';
import type { PurchasePlanKind } from '../types/api/purchasingApi';
import type { KpiStat } from '../components/ui/Card';
import { usePurchaseContracts } from './usePurchaseContracts';
import { usePurchaseEstimates } from './usePurchaseEstimates';
import { usePurchaseOrders } from './usePurchaseOrders';
import { usePurchasePaymentPlans } from './usePurchasePaymentPlans';
import { usePurchasePayments } from './usePurchasePayments';
import { usePurchasePlans } from './usePurchasePlans';
import { usePurchaseWarranties, usePurchaseWarrantyClaims } from './usePurchaseWarranties';

/** Poll only when SignalR is down — keep a slow safety net when live. */
const POLL_OFFLINE_MS = 15_000;
const POLL_LIVE_MS = false as const;

function pollInterval(live: boolean): number | false {
  return live ? POLL_LIVE_MS : POLL_OFFLINE_MS;
}

export function usePurchasingDashboardSummary(
  params: PurchasingDashboardQueryParams,
  options?: { live?: boolean },
) {
  const live = options?.live ?? false;
  return useQuery({
    queryKey: queryKeys.purchasingDashboard.summary(params),
    queryFn: () => purchasingDashboardService.summary(params),
    refetchInterval: pollInterval(live),
  });
}

export function usePurchasingDashboardChart(
  params: PurchasingDashboardQueryParams,
  options?: { live?: boolean },
) {
  const live = options?.live ?? false;
  return useQuery({
    queryKey: queryKeys.purchasingDashboard.chart(params),
    queryFn: () => purchasingDashboardService.chart(params),
    refetchInterval: pollInterval(live),
  });
}

export function usePurchasingActivityFeed(
  params: PurchasingDashboardQueryParams,
  options?: { live?: boolean },
) {
  const live = options?.live ?? false;
  return useInfiniteQuery({
    queryKey: queryKeys.purchasingDashboard.activity(params),
    queryFn: ({ pageParam }) =>
      purchasingDashboardService.activity({
        ...params,
        cursor: pageParam,
        limit: params.limit ?? 20,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: last => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
    refetchInterval: pollInterval(live),
  });
}

export function usePurchasingActivityActors(
  params: PurchasingDashboardQueryParams,
  options?: { live?: boolean },
) {
  const live = options?.live ?? false;
  return useQuery({
    queryKey: queryKeys.purchasingDashboard.actors(params),
    queryFn: () => purchasingDashboardService.actors(params),
    refetchInterval: live ? false : POLL_OFFLINE_MS * 2,
  });
}

function countOf(total: number | undefined, loading: boolean): number | string {
  if (loading && total === undefined) return '-';
  return total ?? 0;
}

function statsFromCounts(rows: { label: string; value: number | string; tone: KpiStat['tone'] }[]): KpiStat[] {
  return rows.filter(row => {
    if (row.value === '-') return true;
    if (typeof row.value === 'number' && row.value <= 0) return false;
    return true;
  }).map(({ label, value, tone }) => ({ label, value, tone }));
}

type VoucherCard = { show: boolean; stats: KpiStat[] };

function asList<T>(data: T[] | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

function usePlanVoucherBucket(kind: PurchasePlanKind, dateFrom?: string, dateTo?: string): VoucherCard {
  const base = { page: 1, pageSize: 1 as const, kind, dateFrom, dateTo };
  const draftQ = usePurchasePlans({ ...base, status: 'draft' });
  const pendingL1Q = usePurchasePlans({ ...base, status: 'pending_l1' });
  const pendingL2Q = usePurchasePlans({ ...base, status: 'pending_l2' });
  const approvedQ = usePurchasePlans({ ...base, status: 'approved' });
  const rejectedQ = usePurchasePlans({ ...base, status: 'rejected' });
  const closedQ = usePurchasePlans({ ...base, status: 'closed' });

  const loading = draftQ.isLoading || pendingL1Q.isLoading || pendingL2Q.isLoading || approvedQ.isLoading;
  const pending = (pendingL1Q.data?.totalCount ?? 0) + (pendingL2Q.data?.totalCount ?? 0);
  const total =
    (draftQ.data?.totalCount ?? 0)
    + pending
    + (approvedQ.data?.totalCount ?? 0)
    + (rejectedQ.data?.totalCount ?? 0)
    + (closedQ.data?.totalCount ?? 0);

  return {
    show: loading || total > 0,
    stats: statsFromCounts([
      { label: 'Nháp', value: countOf(draftQ.data?.totalCount, draftQ.isLoading), tone: 'info' },
      { label: 'Chờ duyệt', value: pendingL1Q.isLoading || pendingL2Q.isLoading ? '-' : pending, tone: 'warn' },
      { label: 'Đã duyệt', value: countOf(approvedQ.data?.totalCount, approvedQ.isLoading), tone: 'ok' },
      { label: 'Từ chối', value: countOf(rejectedQ.data?.totalCount, rejectedQ.isLoading), tone: 'danger' },
      { label: 'Đã đóng', value: countOf(closedQ.data?.totalCount, closedQ.isLoading), tone: 'neutral' },
    ]),
  };
}

/** Số phiếu theo trạng thái - ẩn dòng/thẻ = 0. Bám menu Mua hàng. */
export function usePurchasingDashboardVouchers(dateFrom?: string, dateTo?: string) {
  const plans = usePlanVoucherBucket('plan', dateFrom, dateTo);
  const adhoc = usePlanVoucherBucket('adhoc', dateFrom, dateTo);

  const orderNoneQ = usePurchaseOrders({ page: 1, pageSize: 1, deliveryStatus: 'none' });
  const orderPartialQ = usePurchaseOrders({ page: 1, pageSize: 1, deliveryStatus: 'partial' });
  const orderCompleteQ = usePurchaseOrders({ page: 1, pageSize: 1, deliveryStatus: 'complete' });
  const ordersLoading = orderNoneQ.isLoading || orderPartialQ.isLoading || orderCompleteQ.isLoading;
  const orderTotal =
    (orderNoneQ.data?.totalCount ?? 0)
    + (orderPartialQ.data?.totalCount ?? 0)
    + (orderCompleteQ.data?.totalCount ?? 0);

  const estimatesQ = usePurchaseEstimates({ page: 1, pageSize: 200 });
  const estimateCounts = useMemo(() => {
    const items = estimatesQ.data?.items ?? [];
    let waiting = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const row of items) {
      if (row.status === 'draft' || row.status === 'shared') waiting += 1;
      else if (row.status === 'approved') approved += 1;
      else if (row.status === 'rejected') rejected += 1;
      else pending += 1;
    }
    return { waiting, pending, approved, rejected, total: items.length };
  }, [estimatesQ.data?.items]);

  const contractDraftQ = usePurchaseContracts({ page: 1, pageSize: 1, status: 'draft' });
  const contractActiveQ = usePurchaseContracts({ page: 1, pageSize: 1, status: 'active' });
  const contractExpiredQ = usePurchaseContracts({ page: 1, pageSize: 1, status: 'expired' });
  const contractsLoading = contractDraftQ.isLoading || contractActiveQ.isLoading || contractExpiredQ.isLoading;
  const contractTotal =
    (contractDraftQ.data?.totalCount ?? 0)
    + (contractActiveQ.data?.totalCount ?? 0)
    + (contractExpiredQ.data?.totalCount ?? 0);

  const payDraftQ = usePurchasePayments({ page: 1, pageSize: 1, status: 'draft' });
  const paySubmittedQ = usePurchasePayments({ page: 1, pageSize: 1, status: 'submitted' });
  const payPaidQ = usePurchasePayments({ page: 1, pageSize: 1, status: 'paid' });
  const paymentsLoading = payDraftQ.isLoading || paySubmittedQ.isLoading || payPaidQ.isLoading;
  const paymentTotal =
    (payDraftQ.data?.totalCount ?? 0)
    + (paySubmittedQ.data?.totalCount ?? 0)
    + (payPaidQ.data?.totalCount ?? 0);

  const payPlansQ = usePurchasePaymentPlans({ page: 1, pageSize: 100 });
  const payPlanCounts = useMemo(() => {
    const rows = payPlansQ.data?.items ?? [];
    let unpaid = 0;
    let partial = 0;
    let paid = 0;
    let overdue = 0;
    for (const row of rows) {
      const s = row.poPaymentStatus?.trim().toLowerCase();
      if (s === 'overdue' || s === 'quá hạn') overdue += 1;
      else if (s === 'paid' || s === 'completed' || s === 'đã thanh toán') paid += 1;
      else if (s === 'partial') partial += 1;
      else unpaid += 1;
    }
    return { unpaid, partial, paid, overdue, total: rows.length };
  }, [payPlansQ.data?.items]);

  const lotsQ = usePurchaseWarranties({});
  const claimsQ = usePurchaseWarrantyClaims({ kind: 'complaint' });
  const warrantyCounts = useMemo(() => {
    const lots = asList(lotsQ.data);
    const claims = asList(claimsQ.data);
    return {
      active: lots.filter(r => r.status === 'active').length,
      expired: lots.filter(r => r.status === 'expired').length,
      openClaims: claims.filter(c => c.status !== 'closed' && c.status !== 'cancelled').length,
      total: lots.length + claims.length,
    };
  }, [lotsQ.data, claimsQ.data]);

  return {
    plans,
    adhoc,
    orders: {
      show: ordersLoading || orderTotal > 0,
      stats: statsFromCounts([
        { label: 'Chưa giao', value: countOf(orderNoneQ.data?.totalCount, orderNoneQ.isLoading), tone: 'warn' },
        { label: 'Giao 1 phần', value: countOf(orderPartialQ.data?.totalCount, orderPartialQ.isLoading), tone: 'info' },
        { label: 'Đã giao đủ', value: countOf(orderCompleteQ.data?.totalCount, orderCompleteQ.isLoading), tone: 'ok' },
      ]),
    } satisfies VoucherCard,
    estimates: {
      show: estimatesQ.isLoading || estimateCounts.total > 0,
      stats: statsFromCounts([
        { label: 'Chờ điền', value: estimatesQ.isLoading && !estimatesQ.data ? '-' : estimateCounts.waiting, tone: 'info' },
        { label: 'Chờ duyệt', value: estimatesQ.isLoading && !estimatesQ.data ? '-' : estimateCounts.pending, tone: 'warn' },
        { label: 'Đã duyệt', value: estimatesQ.isLoading && !estimatesQ.data ? '-' : estimateCounts.approved, tone: 'ok' },
        { label: 'Từ chối', value: estimatesQ.isLoading && !estimatesQ.data ? '-' : estimateCounts.rejected, tone: 'danger' },
      ]),
    } satisfies VoucherCard,
    contracts: {
      show: contractsLoading || contractTotal > 0,
      stats: statsFromCounts([
        { label: 'Nháp', value: countOf(contractDraftQ.data?.totalCount, contractDraftQ.isLoading), tone: 'info' },
        { label: 'Hiệu lực', value: countOf(contractActiveQ.data?.totalCount, contractActiveQ.isLoading), tone: 'ok' },
        { label: 'Hết hạn', value: countOf(contractExpiredQ.data?.totalCount, contractExpiredQ.isLoading), tone: 'danger' },
      ]),
    } satisfies VoucherCard,
    payments: {
      show: paymentsLoading || paymentTotal > 0,
      stats: statsFromCounts([
        { label: 'Nháp', value: countOf(payDraftQ.data?.totalCount, payDraftQ.isLoading), tone: 'info' },
        { label: 'Đã gửi', value: countOf(paySubmittedQ.data?.totalCount, paySubmittedQ.isLoading), tone: 'warn' },
        { label: 'Đã thanh toán', value: countOf(payPaidQ.data?.totalCount, payPaidQ.isLoading), tone: 'ok' },
      ]),
    } satisfies VoucherCard,
    paymentPlans: {
      show: payPlansQ.isLoading || payPlanCounts.total > 0,
      stats: statsFromCounts([
        { label: 'Trễ hạn', value: payPlansQ.isLoading && !payPlansQ.data ? '-' : payPlanCounts.overdue, tone: 'danger' },
        { label: 'Chưa thanh toán', value: payPlansQ.isLoading && !payPlansQ.data ? '-' : payPlanCounts.unpaid, tone: 'warn' },
        { label: 'Thanh toán 1 phần', value: payPlansQ.isLoading && !payPlansQ.data ? '-' : payPlanCounts.partial, tone: 'info' },
        { label: 'Đã thanh toán', value: payPlansQ.isLoading && !payPlansQ.data ? '-' : payPlanCounts.paid, tone: 'ok' },
      ]),
    } satisfies VoucherCard,
    warranties: {
      show: lotsQ.isLoading || claimsQ.isLoading || warrantyCounts.total > 0,
      stats: statsFromCounts([
        { label: 'Còn hạn', value: lotsQ.isLoading && !lotsQ.data ? '-' : warrantyCounts.active, tone: 'ok' },
        { label: 'Hết hạn', value: lotsQ.isLoading && !lotsQ.data ? '-' : warrantyCounts.expired, tone: 'danger' },
        { label: 'Khiếu nại mở', value: claimsQ.isLoading && !claimsQ.data ? '-' : warrantyCounts.openClaims, tone: 'warn' },
      ]),
    } satisfies VoucherCard,
  };
}
