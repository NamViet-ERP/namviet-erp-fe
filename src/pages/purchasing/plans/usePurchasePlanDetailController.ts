import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { showToast } from '../../../components/ui/Toast';
import { usePermission } from '../../../hooks/usePermission';
import {
  useApprovePurchasePlanL1,
  useApprovePurchasePlanL2,
  usePurchasePlan,
  useRejectPurchasePlan,
  useRemakePurchasePlan,
  useSubmitPurchasePlan,
  useSupplierMaterialRisks,
  useUpdatePurchasePlan,
} from '../../../hooks/usePurchasePlans';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { SupplierMaterialRiskPairRequest } from '../../../types/api/purchasingApi';
import { formatCurrencyFull } from '../../../utils/formatCurrency';

function formatPlanMoney(v: number | null | undefined): string {
  if (v == null) return '—';
  return formatCurrencyFull(v);
}

export type PlanTotalTone = 'budget' | 'proposal' | 'purchase' | 'paid';

export function usePurchasePlanDetailController() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { has } = usePermission();

  const planQuery = usePurchasePlan(code);
  const plan = planQuery.data;

  const updateMutation = useUpdatePurchasePlan();
  const submitMutation = useSubmitPurchasePlan();
  const approveL1Mutation = useApprovePurchasePlanL1();
  const approveL2Mutation = useApprovePurchasePlanL2();
  const rejectMutation = useRejectPurchasePlan();
  const remakeMutation = useRemakePurchasePlan();

  const [confirmClose, setConfirmClose] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isAdhoc =
    location.pathname.startsWith('/purchasing/adhoc')
    || plan?.kind === 'adhoc'
    || (code ?? '').toUpperCase().startsWith('MHPS-');
  const listPath = isAdhoc ? '/purchasing/adhoc' : '/purchasing/plans';
  const back = () => navigate(listPath);

  const canSubmit = has('purchasing.plans.submit');
  const canApproveL1 = has('purchasing.plans.approve_l1');
  const canApproveL2 = has('purchasing.plans.approve_l2');
  const canReject = has('purchasing.plans.reject');
  const canRemake = has('purchasing.plans.remake');

  const lines = useMemo(() => plan?.lines ?? [], [plan?.lines]);

  const actionBusy =
    updateMutation.isPending
    || submitMutation.isPending
    || approveL1Mutation.isPending
    || approveL2Mutation.isPending
    || rejectMutation.isPending
    || remakeMutation.isPending;

  const runAction = async (okMsg: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      showToast('success', okMsg);
      await planQuery.refetch();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Thao tác thất bại.'));
    }
  };

  const riskPairs = useMemo((): SupplierMaterialRiskPairRequest[] => {
    const seen = new Set<string>();
    const pairs: SupplierMaterialRiskPairRequest[] = [];
    for (const line of lines) {
      const materialCode = line.materialCode?.trim();
      if (!materialCode) continue;
      const names = [
        line.selectedSupplierName,
        line.purchaseSupplierName,
        line.proposalSupplierName,
        ...(line.quotes ?? []).map(q => q.supplierName),
      ]
        .map(n => (n ?? '').trim())
        .filter(Boolean);
      for (const supplierName of names) {
        const key = `${materialCode.toLowerCase()}|${supplierName.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({ materialCode, supplierName });
      }
    }
    return pairs;
  }, [lines]);

  const { data: riskRows = [] } = useSupplierMaterialRisks(riskPairs, Boolean(plan));
  const warnRisks = useMemo(() => riskRows.filter(r => r.warn), [riskRows]);

  const setPlanStatus = async (next: 'approved' | 'closed') => {
    if (!plan) return;
    try {
      await updateMutation.mutateAsync({ code: plan.code, body: { status: next } });
      showToast(
        'success',
        next === 'approved' ? `Đã mở lại KHMH ${plan.code}.` : `Đã đóng KHMH ${plan.code}.`,
      );
      setConfirmClose(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không đổi được trạng thái KHMH.'));
    }
  };

  const confirmReject = () => {
    if (!plan) return;
    void runAction(`Đã từ chối ${plan.code}.`, async () => {
      await rejectMutation.mutateAsync({
        code: plan.code,
        reason: rejectReason.trim() || undefined,
      });
      setRejectOpen(false);
      setRejectReason('');
    });
  };

  const handleRemake = () => {
    if (!plan) return;
    void (async () => {
      try {
        const created = await remakeMutation.mutateAsync(plan.code);
        showToast('success', `Đã lập phiếu nháp ${created.code}.`);
        navigate(`${listPath}/${encodeURIComponent(created.code)}`);
      } catch (err) {
        showToast('error', getApiErrorMessage(err, 'Không lập được phiếu mới.'));
      }
    })();
  };

  const headerMeta = useMemo(() => {
    if (!plan) return [];
    return [
      { label: 'Mã KHMH', value: plan.code },
      { label: 'Dự án', value: plan.projectName || plan.projectCode || '—' },
      { label: 'Ngày tạo', value: formatDateTimeVi(plan.createdAt) ?? '—' },
      { label: 'Người tạo', value: plan.createdByName || '—' },
      { label: 'Ghi chú', value: plan.note || '—' },
    ];
  }, [plan]);

  const totals = useMemo(() => {
    if (!plan) return [] as Array<{ label: string; value: string; tone: PlanTotalTone }>;
    return [
      { label: 'Dự toán', value: formatPlanMoney(plan.budgetTotal), tone: 'budget' as const },
      { label: 'Đề xuất', value: formatPlanMoney(plan.proposalTotal), tone: 'proposal' as const },
      { label: 'Mua hàng', value: formatPlanMoney(plan.purchaseTotal), tone: 'purchase' as const },
      { label: 'Tổng chi', value: formatPlanMoney(plan.paidTotal), tone: 'paid' as const },
    ];
  }, [plan]);

  return {
    code,
    plan,
    isLoading: planQuery.isLoading,
    isError: planQuery.isError,
    error: planQuery.error,
    refetch: planQuery.refetch,
    isAdhoc,
    listPath,
    back,
    canSubmit,
    canApproveL1,
    canApproveL2,
    canReject,
    canRemake,
    lines,
    warnRisks,
    headerMeta,
    totals,
    actionBusy,
    confirmClose,
    setConfirmClose,
    editOpen,
    setEditOpen,
    rejectOpen,
    setRejectOpen,
    rejectReason,
    setRejectReason,
    updatePending: updateMutation.isPending,
    rejectPending: rejectMutation.isPending,
    submitPlan: () => {
      if (!plan) return;
      void runAction(`Đã gửi duyệt ${plan.code}.`, () => submitMutation.mutateAsync(plan.code));
    },
    approveL1: () => {
      if (!plan) return;
      void runAction(`Đã duyệt cấp 1 ${plan.code}.`, () => approveL1Mutation.mutateAsync(plan.code));
    },
    approveL2: () => {
      if (!plan) return;
      void runAction(`Đã duyệt cấp 2 ${plan.code}.`, () => approveL2Mutation.mutateAsync(plan.code));
    },
    setPlanStatus,
    confirmReject,
    handleRemake,
  };
}
