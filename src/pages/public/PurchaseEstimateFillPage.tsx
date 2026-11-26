import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import PublicFormLayout from '../../components/layout/PublicFormLayout';
import TableShell from '../../components/ui/TableShell';
import ToastContainer, { showToast } from '../../components/ui/Toast';
import {
  usePublicPurchaseEstimate,
  useSubmitPublicPurchaseEstimate,
} from '../../hooks/usePurchaseEstimates';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  buildEstimateBaseline,
  buildPublicEstimateSubmitBody,
  type ProposalDraft,
} from './estimateFill/estimateFillHelpers';
import PublicEstimateEditStep from './estimateFill/PublicEstimateEditStep';
import PublicEstimateReadOnlyView from './estimateFill/PublicEstimateReadOnlyView';
import PublicEstimateReviewStep from './estimateFill/PublicEstimateReviewStep';

interface EstimateFillDraft {
  key: string;
  preparerName: string;
  qtyByCode: Record<string, string>;
  proposals: ProposalDraft[];
}

export default function PurchaseEstimateFillPage() {
  const { token } = useParams<{ token: string }>();
  const publicQuery = usePublicPurchaseEstimate(token);
  const submitMutation = useSubmitPublicPurchaseEstimate();
  const row = publicQuery.data;

  const proposalSeqRef = useRef(0);
  const draftKey = row ? `${token ?? ''}:${row.code}:${row.preparerDate ?? ''}:${row.status}` : '';
  const baseline = useMemo(() => buildEstimateBaseline(row), [row]);

  const [stepState, setStepState] = useState<{ key: string; step: 'edit' | 'review' }>({
    key: '',
    step: 'edit',
  });
  const [draft, setDraft] = useState<EstimateFillDraft | null>(null);

  const step = stepState.key === draftKey ? stepState.step : 'edit';
  const activeDraft = draft && draft.key === draftKey ? draft : null;
  const preparerName = activeDraft?.preparerName ?? baseline.preparerName;
  const qtyByCode = activeDraft?.qtyByCode ?? baseline.qtyByCode;
  const proposals = activeDraft?.proposals ?? baseline.proposals;

  const updateDraft = (patch: Partial<Omit<EstimateFillDraft, 'key'>>) =>
    setDraft({ key: draftKey, preparerName, qtyByCode, proposals, ...patch });
  const setStep = (nextStep: 'edit' | 'review') => setStepState({ key: draftKey, step: nextStep });

  const filled = useMemo(
    () => (row ? row.lines.filter(l => Number(qtyByCode[l.materialCode] ?? 0) > 0) : []),
    [row, qtyByCode],
  );
  const readyProposals = proposals.filter(p => p.name.trim() && Number(p.qty) > 0);

  const goReview = () => {
    if (!preparerName.trim()) {
      showToast('error', 'Vui lòng chọn người lập dự toán.');
      return;
    }
    if (filled.length === 0 && readyProposals.length === 0) {
      showToast('error', 'Chưa có mặt hàng nào được điền số lượng hoặc đề xuất.');
      return;
    }
    setStep('review');
  };

  const submit = async () => {
    if (!token || !row) return;
    try {
      await submitMutation.mutateAsync({
        token,
        body: buildPublicEstimateSubmitBody(row, preparerName, qtyByCode, readyProposals),
      });
      setDraft(null);
      showToast('success', 'Đã gửi dự toán thành công.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không gửi được dự toán.'));
    }
  };

  const handleAddProposal = () => {
    proposalSeqRef.current += 1;
    const key = `draft-${proposalSeqRef.current}`;
    updateDraft({ proposals: [...proposals, { key, name: '', spec: '', unit: '', qty: '', note: '' }] });
  };

  let body;
  if (!token) {
    body = (
      <div role="alert">
        <h3 className="font-semibold">Liên kết không hợp lệ</h3>
        <p className="text-[var(--md-on-surface-variant)]">Thiếu mã dự toán trên đường dẫn.</p>
      </div>
    );
  } else if (publicQuery.isLoading) {
    body = <TableShell loading colSpan={4} />;
  } else if (publicQuery.isError || !row) {
    body = (
      <div role="alert">
        <h3 className="font-semibold">Không mở được dự toán</h3>
        <p className="text-[var(--md-on-surface-variant)]">
          {getApiErrorMessage(publicQuery.error, 'Link đã hết hạn, đã bị thu hồi hoặc sai mã dự toán. Liên hệ phòng Cung ứng để cấp lại.')}
        </p>
      </div>
    );
  } else if (!row.canFill) {
    body = <PublicEstimateReadOnlyView row={row} />;
  } else if (step === 'review') {
    body = (
      <PublicEstimateReviewStep
        row={row}
        preparerName={preparerName}
        filled={filled}
        qtyByCode={qtyByCode}
        readyProposals={readyProposals}
        isSubmitting={submitMutation.isPending}
        onBack={() => setStep('edit')}
        onSubmit={() => void submit()}
      />
    );
  } else {
    body = (
      <PublicEstimateEditStep
        row={row}
        preparerName={preparerName}
        qtyByCode={qtyByCode}
        proposals={proposals}
        onPreparerNameChange={value => updateDraft({ preparerName: value })}
        onQtyChange={(code, value) => updateDraft({ qtyByCode: { ...qtyByCode, [code]: value } })}
        onUpdateProposal={(key, field, value) =>
          updateDraft({ proposals: proposals.map(x => (x.key === key ? { ...x, [field]: value } : x)) })
        }
        onRemoveProposal={key => updateDraft({ proposals: proposals.filter(x => x.key !== key) })}
        onAddProposal={handleAddProposal}
        onGoReview={goReview}
      />
    );
  }

  return (
    <>
      <PublicFormLayout
        wide
        eyebrow="MAYZER"
        title="Phiếu lập dự toán vật tư"
        subtitle={row ? `${row.projectCode}${row.projectName ? ` - ${row.projectName}` : ''} · ${row.title}` : 'Điền số lượng theo mẫu Phòng Cung ứng gửi'}
      >
        {body}
      </PublicFormLayout>
      <ToastContainer />
    </>
  );
}
