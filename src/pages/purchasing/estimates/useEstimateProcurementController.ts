import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, FilePlus2, Send, XCircle } from 'lucide-react';
import { showToast } from '../../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../../constants/pagination';
import { useMaterials } from '../../../hooks/useMaterials';
import { usePermission } from '../../../hooks/usePermission';
import { useProjects } from '../../../hooks/useProjects';
import {
  useApproveEstimateL1,
  useConvertEstimateToPlan,
  useCreatePurchaseEstimate,
  usePurchaseEstimates,
  useRejectEstimateApproval,
  useSubmitEstimateApproval,
} from '../../../hooks/usePurchaseEstimates';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { canSubmitEstimate } from '../../../lib/purchaseEstimateStatus';
import type { DropdownItem, TabItem } from '../../../types';
import type {
  CreatePurchaseEstimateRequest,
  PurchaseEstimateListItemApiDto,
} from '../../../types/api/purchasingApi';

export function useEstimateProcurementController() {
  const { has } = usePermission();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const canViewEstimates = has('purchasing.estimates.view');
  const canViewRfq = has('purchasing.rfq.view');
  const canWriteEstimate = has('purchasing.estimates.create');
  const canUpdateEstimate = has('purchasing.estimates.update');
  const canApproveL1 = has('purchasing.estimates.approve_l1');
  const canConvert = has('purchasing.plans.create');
  const canWriteRfq = has('purchasing.rfq.create');
  const canUpdateRfq = has('purchasing.rfq.update');

  const requestedTab = params.get('tab') === 'rfq' ? 'rfq' : 'estimates';
  const tab: 'rfq' | 'estimates' = requestedTab === 'rfq'
    ? (canViewRfq ? 'rfq' : 'estimates')
    : (canViewEstimates ? 'estimates' : 'rfq');
  const setTab = (next: 'rfq' | 'estimates') => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    setParams(nextParams, { replace: true });
  };

  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [creating, setCreating] = useState(false);

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      projectCode: projectCode || undefined,
    }),
    [page, pageSize, search, projectCode],
  );
  const list = usePurchaseEstimates(listParams);
  const createMutation = useCreatePurchaseEstimate();
  const submitMutation = useSubmitEstimateApproval();
  const approveL1Mutation = useApproveEstimateL1();
  const rejectMutation = useRejectEstimateApproval();
  const convertMutation = useConvertEstimateToPlan();
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const { data: materialsPage } = useMaterials({ page: 1, pageSize: 500 });
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const materials = materialsPage?.items ?? [];
  const toolbarProject = useMemo(
    () => projects.find(p => p.projectCode === projectCode),
    [projects, projectCode],
  );

  const runEstimateAction = async (okMsg: string, action: () => Promise<unknown>) => {
    try {
      await action();
      showToast('success', okMsg);
      void list.refetch();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thực hiện được tác vụ.'));
    }
  };

  const rowActions = (row: PurchaseEstimateListItemApiDto): DropdownItem[] => {
    const items: DropdownItem[] = [
      {
        label: 'Xem chi tiết',
        icon: Eye,
        onClick: () => navigate(`/operations/estimate-procurement/${encodeURIComponent(row.id)}`),
      },
    ];
    if (canUpdateEstimate && canSubmitEstimate(row.status)) {
      items.push({
        label: 'Gửi duyệt',
        icon: Send,
        onClick: () => void runEstimateAction(`Đã gửi duyệt ${row.code}.`, () => submitMutation.mutateAsync(row.id)),
      });
    }
    if (canApproveL1 && row.status === 'pending_approval') {
      items.push(
        { divider: true },
        {
          label: 'Duyệt',
          icon: CheckCircle2,
          onClick: () => void runEstimateAction(`Đã duyệt ${row.code}.`, () => approveL1Mutation.mutateAsync({ id: row.id })),
        },
        {
          label: 'Từ chối',
          icon: XCircle,
          danger: true,
          onClick: () => void runEstimateAction(`Đã từ chối ${row.code}.`, () => rejectMutation.mutateAsync({ id: row.id })),
        },
      );
    }
    if (canConvert && row.status === 'approved') {
      items.push(
        { divider: true },
        {
          label: 'Tạo kế hoạch mua hàng',
          icon: FilePlus2,
          onClick: () => void runEstimateAction(`Đã tạo KHMH từ ${row.code}.`, () => convertMutation.mutateAsync(row.id)),
        },
      );
    }
    return items;
  };

  const handleCreateSubmit = async (body: CreatePurchaseEstimateRequest) => {
    try {
      const created = await createMutation.mutateAsync(body);
      showToast('success', `Đã tạo ${created.code}.`);
      setCreating(false);
      navigate(`/operations/estimate-procurement/${encodeURIComponent(created.id)}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được dự toán.'));
    }
  };

  const tabs: TabItem[] = [
    ...(canViewEstimates ? [{ id: 'estimates', label: 'Dự toán' }] : []),
    ...(canViewRfq ? [{ id: 'rfq', label: 'Giá chào thầu' }] : []),
  ];

  const toolbarRemaining = toolbarProject
    ? (toolbarProject.materialBudgetRemaining ?? (toolbarProject.materialBudget - (toolbarProject.approvedImportValue ?? 0)))
    : 0;

  return {
    tab,
    setTab,
    tabs,
    canWriteEstimate,
    canWriteRfq,
    canUpdateRfq,
    search,
    setSearch,
    projectCode,
    setProjectCode,
    page,
    setPage,
    pageSize,
    setPageSize,
    creating,
    setCreating,
    list,
    createPending: createMutation.isPending,
    projects,
    materials,
    toolbarProject,
    toolbarRemaining,
    rowActions,
    handleCreateSubmit,
  };
}
