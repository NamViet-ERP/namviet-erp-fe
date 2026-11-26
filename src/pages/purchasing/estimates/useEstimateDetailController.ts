import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../../components/ui/Toast';
import { useMaterials } from '../../../hooks/useMaterials';
import { usePermission } from '../../../hooks/usePermission';
import {
  useApproveEstimateL1,
  useConvertEstimateToPlan,
  usePurchaseEstimate,
  useRejectEstimateApproval,
  useShareEstimateLink,
  useSubmitEstimateApproval,
  useUpdatePurchaseEstimate,
} from '../../../hooks/usePurchaseEstimates';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { canEditEstimate } from '../../../lib/purchaseEstimateStatus';

export type EstimateDraftLine = {
  key: string;
  materialCode: string;
  newQty: string;
  estimateUnitPrice: string;
};

function makeEmptyDraftLine(): EstimateDraftLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialCode: '',
    newQty: '',
    estimateUnitPrice: '',
  };
}

export function useEstimateDetailController(id?: string) {
  const navigate = useNavigate();
  const { has } = usePermission();
  const canEdit = has('purchasing.estimates.update');
  const canApproveL1 = has('purchasing.estimates.approve_l1');
  const canConvert = has('purchasing.plans.create');
  const canShare = has('purchasing.estimates.view') || has('purchasing.estimates.update');

  const [viewVersion, setViewVersion] = useState<number | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [draftLines, setDraftLines] = useState<EstimateDraftLine[]>([]);
  const [decideNote, setDecideNote] = useState('');

  const detail = usePurchaseEstimate(id, viewVersion);
  const updateMutation = useUpdatePurchaseEstimate();
  const submitMutation = useSubmitEstimateApproval();
  const approveL1Mutation = useApproveEstimateL1();
  const rejectMutation = useRejectEstimateApproval();
  const convertMutation = useConvertEstimateToPlan();
  const shareMutation = useShareEstimateLink();
  const { data: materialsPage } = useMaterials({ page: 1, pageSize: 500 });

  const materials = materialsPage?.items ?? [];
  const row = detail.data;
  const versions = row?.versions ?? [];
  const latest = row?.currentVersion ?? 1;
  const viewingLatest = !viewVersion || viewVersion === latest;
  const proposals = row?.proposals ?? [];
  const nextApproval = (row?.approvals ?? []).find(a => a.status === 'pending');
  const workflowLocked = !canEditEstimate(row?.status);
  const canDecideCurrent = Boolean(nextApproval && canApproveL1 && viewingLatest);

  const busy =
    updateMutation.isPending ||
    submitMutation.isPending ||
    approveL1Mutation.isPending ||
    rejectMutation.isPending ||
    convertMutation.isPending ||
    shareMutation.isPending;

  const meta = useMemo(() => {
    if (!row) return '';
    return `Tạo ${formatDateTimeVi(row.createdAt)} · ${row.createdByName} · Sửa ${formatDateTimeVi(row.updatedAt)} · ${row.updatedByName}`;
  }, [row]);

  const startEdit = () => {
    if (!row) return;
    setTitle(row.title);
    setDraftLines(
      row.lines.map(l => ({
        key: l.id,
        materialCode: l.materialCode,
        newQty: String(l.newQty),
        estimateUnitPrice: String(l.estimateUnitPrice || ''),
      })),
    );
    setEditing(true);
  };

  const addDraftLine = () => {
    setDraftLines(prev => [...prev, makeEmptyDraftLine()]);
  };

  const updateDraftLine = (key: string, patch: Partial<EstimateDraftLine>) => {
    setDraftLines(prev => prev.map(l => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeDraftLine = (key: string) => {
    setDraftLines(prev => {
      if (prev.length <= 1) {
        return prev.map(l => (
          l.key === key
            ? { ...l, materialCode: '', newQty: '', estimateUnitPrice: '' }
            : l
        ));
      }
      return prev.filter(l => l.key !== key);
    });
  };

  const save = async () => {
    if (!id) return;
    const lines = draftLines
      .filter(l => l.materialCode)
      .map(l => ({
        materialCode: l.materialCode,
        newQty: Number(String(l.newQty).replace(/[^\d.-]/g, '')) || 0,
        estimateUnitPrice: Number(String(l.estimateUnitPrice).replace(/[^\d.-]/g, '')) || 0,
      }));
    if (lines.length === 0) {
      showToast('error', 'Giữ ít nhất một dòng vật tư.');
      return;
    }
    if (lines.some(l => l.newQty <= 0 || l.estimateUnitPrice <= 0)) {
      showToast('error', 'Mỗi dòng phải có số lượng và giá dự toán lớn hơn 0.');
      return;
    }
    try {
      const updated = await updateMutation.mutateAsync({
        id,
        body: { title: title.trim() || null, lines },
      });
      showToast('success', `Đã lưu Ver ${updated.currentVersion}.`);
      setEditing(false);
      setViewVersion(undefined);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lưu được version mới.'));
    }
  };

  const runSubmit = async () => {
    if (!id || !row) return;
    const incomplete = row.lines.some(l => Number(l.newQty) <= 0 || Number(l.estimateUnitPrice) <= 0);
    if (row.lines.length === 0 || incomplete) {
      showToast('error', 'Mỗi dòng phải có số lượng và giá dự toán lớn hơn 0. Bấm Sửa dòng vật tư để bổ sung.');
      return;
    }
    try {
      await submitMutation.mutateAsync(id);
      showToast('success', 'Đã gửi duyệt (Trưởng dự án).');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không gửi duyệt được.'));
    }
  };

  const runApprove = async () => {
    if (!id || !nextApproval) return;
    try {
      await approveL1Mutation.mutateAsync({ id, note: decideNote.trim() || null });
      showToast('success', 'Đã duyệt dự toán.');
      setDecideNote('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không duyệt được.'));
    }
  };

  const runReject = async () => {
    if (!id || !nextApproval) return;
    try {
      await rejectMutation.mutateAsync({ id, note: decideNote.trim() || null });
      showToast('success', 'Đã từ chối dự toán.');
      setDecideNote('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không từ chối được.'));
    }
  };

  const runConvert = async () => {
    if (!id) return;
    try {
      const result = await convertMutation.mutateAsync(id);
      showToast('success', `Đã tạo kế hoạch ${result.planCode}.`);
      navigate(`/purchasing/plans/${result.planCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không chuyển thành kế hoạch được.'));
    }
  };

  const runShareLink = async () => {
    if (!id) return;
    try {
      const link = await shareMutation.mutateAsync(id);
      const url = `${window.location.origin}${link.path}`;
      await navigator.clipboard.writeText(url);
      showToast('success', 'Đã copy link xem Ver mới nhất.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lấy được link xem.'));
    }
  };

  const back = () => navigate('/operations/estimate-procurement?tab=estimates');

  return {
    canEdit,
    canConvert,
    canShare,
    viewVersion,
    setViewVersion,
    editing,
    setEditing,
    title,
    setTitle,
    draftLines,
    decideNote,
    setDecideNote,
    detail,
    row,
    materials,
    versions,
    latest,
    viewingLatest,
    proposals,
    nextApproval,
    workflowLocked,
    canDecideCurrent,
    busy,
    saving: updateMutation.isPending,
    meta,
    startEdit,
    addDraftLine,
    updateDraftLine,
    removeDraftLine,
    save,
    runSubmit,
    runApprove,
    runReject,
    runConvert,
    runShareLink,
    back,
    openPlan: (planCode: string) => navigate(`/purchasing/plans/${planCode}`),
  };
}
