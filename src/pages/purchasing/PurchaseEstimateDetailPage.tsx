import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import Modal from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import {
  useApproveEstimateL1,
  useApproveEstimateL2,
  useConvertEstimateToPlan,
  usePurchaseEstimate,
  useRejectEstimateApproval,
  useReviewPurchaseEstimate,
  useRevokeEstimateShare,
  useShareEstimateLink,
  useSubmitEstimateApproval,
  useUpdatePurchaseEstimate,
} from '../../hooks/usePurchaseEstimates';
import { useMaterials } from '../../hooks/useMaterials';
import { usePermission } from '../../hooks/usePermission';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import {
  canEditEstimate,
  canShareEstimate,
  estimateStatusBadge,
  estimateStatusLabel,
} from '../../lib/purchaseEstimateStatus';
import type { PurchaseEstimateLineApiDto } from '../../types/api/purchasingApi';

type DraftLine = { key: string; materialCode: string; newQty: string };

function qtyClass(oldQty: number, newQty: number) {
  if (newQty > oldQty) return 'text-[var(--md-success)]';
  if (newQty < oldQty) return 'text-[var(--md-error)]';
  return '';
}

function groupLines(lines: PurchaseEstimateLineApiDto[]) {
  const groups = new Map<string, PurchaseEstimateLineApiDto[]>();
  for (const line of lines) {
    const key = line.categoryName?.trim() || 'Khác';
    const bucket = groups.get(key) ?? [];
    bucket.push(line);
    groups.set(key, bucket);
  }
  return [...groups.entries()];
}

export default function PurchaseEstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { has } = usePermission();
  const canEdit = has('purchasing.estimates.update');
  const canApproveL1 = has('purchasing.estimates.approve_l1');
  const canApproveL2 = has('purchasing.estimates.approve_l2');
  const canConvert = has('purchasing.plans.create');
  const [viewVersion, setViewVersion] = useState<number | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);
  const [decideNote, setDecideNote] = useState('');

  const detail = usePurchaseEstimate(id, viewVersion);
  const updateMutation = useUpdatePurchaseEstimate();
  const shareMutation = useShareEstimateLink();
  const revokeShareMutation = useRevokeEstimateShare();
  const reviewMutation = useReviewPurchaseEstimate();
  const submitMutation = useSubmitEstimateApproval();
  const approveL1Mutation = useApproveEstimateL1();
  const approveL2Mutation = useApproveEstimateL2();
  const rejectMutation = useRejectEstimateApproval();
  const convertMutation = useConvertEstimateToPlan();
  const { data: materialsPage } = useMaterials({ page: 1, pageSize: 200 });
  const materials = materialsPage?.items ?? [];
  const row = detail.data;

  const versions = row?.versions ?? [];
  const latest = row?.currentVersion ?? 1;
  const viewingLatest = !viewVersion || viewVersion === latest;
  const filledLines = (row?.lines ?? []).filter(l => Number(l.newQty) > 0);
  const proposals = row?.proposals ?? [];
  const nextApproval = (row?.approvals ?? []).find(a => a.status === 'pending');
  const workflowLocked = !canEditEstimate(row?.status);

  const startEdit = () => {
    if (!row) return;
    setTitle(row.title);
    setDraftLines(
      row.lines.map(l => ({
        key: l.id,
        materialCode: l.materialCode,
        newQty: String(l.newQty),
      })),
    );
    setEditing(true);
  };

  const save = async () => {
    if (!id) return;
    const lines = draftLines
      .filter(l => l.materialCode)
      .map(l => ({ materialCode: l.materialCode, newQty: Number(l.newQty) || 0 }));
    if (lines.length === 0) {
      showToast('error', 'Giữ ít nhất một dòng vật tư.');
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

  const openShare = async () => {
    if (!id) return;
    try {
      const link = await shareMutation.mutateAsync(id);
      setShareUrl(`${window.location.origin}${link.path}`);
      setShareExpiresAt(link.expiresAt ?? null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lấy được link điền.'));
    }
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('success', 'Đã sao chép link.');
    } catch {
      showToast('error', 'Không sao chép được. Hãy chọn và copy thủ công.');
    }
  };

  const runReview = async () => {
    if (!id) return;
    try {
      await reviewMutation.mutateAsync(id);
      showToast('success', 'Đã xác nhận kiểm tra - sẵn sàng gửi duyệt.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xác nhận được.'));
    }
  };

  const runSubmit = async () => {
    if (!id) return;
    try {
      await submitMutation.mutateAsync(id);
      showToast('success', 'Đã gửi duyệt các cấp.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không gửi duyệt được.'));
    }
  };

  const runApprove = async () => {
    if (!id || !nextApproval) return;
    const note = decideNote.trim() || null;
    try {
      if (nextApproval.level <= 1) {
        await approveL1Mutation.mutateAsync({ id, note });
      } else {
        await approveL2Mutation.mutateAsync({ id, note });
      }
      showToast('success', `Đã duyệt cấp ${nextApproval.level}.`);
      setDecideNote('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không duyệt được.'));
    }
  };

  const runReject = async () => {
    if (!id || !nextApproval) return;
    try {
      await rejectMutation.mutateAsync({ id, note: decideNote.trim() || null });
      showToast('success', `Đã từ chối cấp ${nextApproval.level}.`);
      setDecideNote('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không từ chối được.'));
    }
  };

  const runRevokeShare = async () => {
    if (!id) return;
    try {
      await revokeShareMutation.mutateAsync(id);
      setShareUrl('');
      setShareExpiresAt(null);
      showToast('success', 'Đã thu hồi link điền.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thu hồi được link.'));
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

  const meta = useMemo(() => {
    if (!row) return '';
    return `Tạo ${formatDateTimeVi(row.createdAt)} · ${row.createdByName} · Sửa ${formatDateTimeVi(row.updatedAt)} · ${row.updatedByName}`;
  }, [row]);

  const activeShareExpiresAt = shareExpiresAt ?? row?.shareExpiresAt ?? null;
  const canDecideCurrent = Boolean(
    nextApproval
    && ((nextApproval.level <= 1 && canApproveL1) || (nextApproval.level > 1 && canApproveL2)),
  );

  const busy = updateMutation.isPending
    || shareMutation.isPending
    || revokeShareMutation.isPending
    || reviewMutation.isPending
    || submitMutation.isPending
    || approveL1Mutation.isPending
    || approveL2Mutation.isPending
    || rejectMutation.isPending
    || convertMutation.isPending;

  const back = () => navigate('/purchasing/estimate-procurement?tab=estimates');

  return (
    <div className="page-shell space-y-3">
      <HrmDetailHeader
        onBack={back}
        title={row ? `${row.code} · ${row.title}` : 'Dự toán'}
        subtitle={row ? `${row.projectCode} · ${meta}` : 'Mua hàng dự toán'}
        actions={(
          <div className="flex flex-wrap gap-2 justify-end">
            {canEdit && viewingLatest && !editing && canShareEstimate(row?.status) ? (
              <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void openShare()}>
                {activeShareExpiresAt ? 'Cấp lại link điền' : 'Lấy link điền'}
              </button>
            ) : null}
            {canEdit && viewingLatest && !editing && activeShareExpiresAt ? (
              <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void runRevokeShare()}>
                Thu hồi link
              </button>
            ) : null}
            {canEdit && viewingLatest && !editing && canEditEstimate(row?.status) ? (
              <button type="button" className="btn btn-outline btn-sm" onClick={startEdit}>
                Chỉnh sửa mẫu
              </button>
            ) : null}
            {canEdit && viewingLatest && row?.status === 'submitted' && !editing ? (
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void runReview()}>
                Xác nhận đã kiểm tra
              </button>
            ) : null}
            {canEdit && viewingLatest && row?.status === 'reviewed' && !editing ? (
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void runSubmit()}>
                Gửi duyệt các cấp
              </button>
            ) : null}
            {canConvert && row?.status === 'approved' && !row.convertedPlanCode ? (
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void runConvert()}>
                Tạo kế hoạch mua hàng
              </button>
            ) : null}
          </div>
        )}
      />

      {detail.isError ? (
        <EmptyState message={getApiErrorMessage(detail.error, 'Không tải được dự toán.')} />
      ) : detail.isLoading || !row ? (
        <div className="wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <tbody><TableSkeletonRows colSpan={4} /></tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <span className={`badge ${estimateStatusBadge(row.status)}`}>{estimateStatusLabel(row.status)}</span>
            <span className="text-[length:var(--fs-sm)]">Người lập: <strong>{row.preparerName || 'Chưa có'}</strong></span>
            <span className="text-[length:var(--fs-sm)]">SC kiểm tra: <strong>{row.reviewedByName || 'Chưa kiểm tra'}</strong></span>
            {activeShareExpiresAt ? (
              <span className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
                Link điền hết hạn: <strong className="tabular-nums">{formatDateTimeVi(activeShareExpiresAt)}</strong>
              </span>
            ) : null}
            {row.convertedPlanCode ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(`/purchasing/plans/${row.convertedPlanCode}`)}
              >
                KHMH {row.convertedPlanCode}
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <aside
              className="w-full shrink-0 rounded-[var(--radius-md)] border border-[var(--md-outline-variant)] bg-[var(--md-surface)] lg:w-56"
              aria-label="Lịch sử version"
            >
              <div className="border-b border-[var(--md-outline-variant)] px-3 py-2 text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
                Lịch sử version
              </div>
              <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto p-2">
                {[...versions]
                  .sort((a, b) => b.versionNumber - a.versionNumber)
                  .map(v => {
                    const selected = (!viewVersion && v.versionNumber === latest)
                      || viewVersion === v.versionNumber;
                    const isLatest = v.versionNumber === latest;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={editing}
                        onClick={() => setViewVersion(isLatest ? undefined : v.versionNumber)}
                        className={[
                          'w-full rounded-[var(--radius-sm)] border px-2.5 py-2 text-left transition-[background-color,border-color,transform] duration-150',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-primary)]',
                          'disabled:cursor-not-allowed disabled:opacity-60',
                          'active:scale-[0.97]',
                          selected
                            ? 'border-[var(--md-primary)] bg-[var(--tint-primary-weak)]'
                            : 'border-[var(--md-outline-variant)] bg-[var(--md-surface)] hover:bg-[var(--tint-primary-weak)]',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[length:var(--fs-sm)] font-semibold text-[var(--md-on-surface)]">
                            Ver {v.versionNumber}
                          </span>
                          {isLatest ? (
                            <span className="text-[length:var(--fs-micro)] font-medium text-[var(--md-primary)]">
                              Mới nhất
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-[length:var(--fs-xs)] tabular-nums text-[var(--md-on-surface-variant)]">
                          {formatDateTimeVi(v.createdAt)}
                        </div>
                        <div className="mt-0.5 truncate text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
                          {v.updatedByName}
                        </div>
                      </button>
                    );
                  })}
              </div>
              <p className="border-t border-[var(--md-outline-variant)] px-3 py-2 text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
                Đang xem Ver {row.viewedVersion}. Vận hành luôn dùng Ver {row.currentVersion}.
              </p>
            </aside>

            <div className="min-w-0 flex-1 space-y-3">
              {editing ? (
                <div className="space-y-3">
                  <FormField label="Tiêu đề">
                    <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
                  </FormField>
                  <div className="wms-inventory-table-wrap">
                    <table className="wms-inventory-table">
                      <thead>
                        <tr>
                          <th className="table-header-cell">Vật tư</th>
                          <th className="table-header-cell">SL mới</th>
                          <th className="table-header-cell"> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftLines.map(line => (
                          <tr key={line.key} className="table-row">
                            <td className="table-cell">
                              <MaterialAutocomplete
                                value={line.materialCode}
                                onChange={materialCode => setDraftLines(prev => prev.map(l => l.key === line.key ? { ...l, materialCode } : l))}
                                materials={materials}
                              />
                            </td>
                            <td className="table-cell">
                              <input
                                className="form-input"
                                inputMode="decimal"
                                value={line.newQty}
                                onChange={e => setDraftLines(prev => prev.map(l => l.key === line.key ? { ...l, newQty: e.target.value } : l))}
                              />
                            </td>
                            <td className="table-cell">
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraftLines(prev => prev.filter(l => l.key !== line.key))}>
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setDraftLines(prev => [...prev, { key: String(Date.now()), materialCode: '', newQty: '' }])}>
                      Thêm vật tư
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" disabled={updateMutation.isPending} onClick={() => setEditing(false)}>Hủy</button>
                    <button type="button" className="btn btn-primary btn-sm" disabled={updateMutation.isPending} onClick={() => void save()}>
                      {updateMutation.isPending ? 'Đang lưu…' : `Lưu thành Ver ${latest + 1}`}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
                    Double check - {filledLines.length + proposals.length} dòng đã điền / đề xuất trên tổng {row.lines.length} mã hàng của mẫu.
                  </p>
                  <div className="wms-inventory-table-wrap">
                    <table className="wms-inventory-table">
                      <thead>
                        <tr>
                          <th className="table-header-cell">Hạng mục</th>
                          <th className="table-header-cell">Hàng hoá</th>
                          <th className="table-header-cell">ĐVT</th>
                          <th className="table-header-cell">SL cũ</th>
                          <th className="table-header-cell">SL mới</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filledLines.length === 0 && proposals.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="table-cell">
                              <EmptyState message={workflowLocked ? 'Chưa có dòng nào được điền.' : 'Mẫu chưa được điền. Lấy link rồi gửi cho người lập dự toán.'} />
                            </td>
                          </tr>
                        ) : (
                          <>
                            {groupLines(filledLines).flatMap(([cat, lines]) =>
                              lines.map(line => (
                                <tr key={line.id} className="table-row">
                                  <td className="table-cell">{cat}</td>
                                  <td className="table-cell">
                                    <span className="font-mono">{line.materialCode}</span>
                                    {' '}
                                    {line.materialName}
                                  </td>
                                  <td className="table-cell">{line.unit || '-'}</td>
                                  <td className="table-cell text-right tabular-nums">{line.oldQty}</td>
                                  <td className={`table-cell text-right tabular-nums font-medium ${qtyClass(line.oldQty, line.newQty)}`}>
                                    {line.newQty}
                                  </td>
                                </tr>
                              )),
                            )}
                            {proposals.map(p => (
                              <tr key={p.id} className="table-row">
                                <td className="table-cell"><span className="badge badge-warning">Đề xuất mới</span></td>
                                <td className="table-cell">
                                  <strong>{p.name}</strong>
                                  {p.spec ? ` - ${p.spec}` : ''}
                                  {p.note ? (
                                    <div className="text-[var(--md-on-surface-variant)]">{p.note}</div>
                                  ) : null}
                                </td>
                                <td className="table-cell">{p.unit || '-'}</td>
                                <td className="table-cell text-right tabular-nums">0</td>
                                <td className="table-cell text-right tabular-nums font-medium text-[var(--md-success)]">{p.qty}</td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {row.approvals.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[length:var(--fs-sm)] font-medium">Luồng duyệt</div>
                      <div className="wms-inventory-table-wrap">
                        <table className="wms-inventory-table">
                          <thead>
                            <tr>
                              <th className="table-header-cell">Cấp</th>
                              <th className="table-header-cell">Người duyệt</th>
                              <th className="table-header-cell">Trạng thái</th>
                              <th className="table-header-cell">Thời điểm</th>
                              <th className="table-header-cell">Ý kiến</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.approvals.map(a => (
                              <tr key={a.id} className="table-row">
                                <td className="table-cell">Cấp {a.level} · {a.name}</td>
                                <td className="table-cell">{a.actionByName || '-'}</td>
                                <td className="table-cell">
                                  <span className={`badge ${a.status === 'approved' ? 'badge-success' : a.status === 'rejected' ? 'badge-error' : 'badge-pending'}`}>
                                    {a.status === 'approved' ? 'Đã duyệt' : a.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                                  </span>
                                </td>
                                <td className="table-cell">{a.actionAt ? formatDateTimeVi(a.actionAt) : '-'}</td>
                                <td className="table-cell">{a.note || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {canDecideCurrent && row.status === 'pending_approval' && nextApproval ? (
                        <div className="flex flex-wrap gap-2 items-end">
                          <FormField label={`Ý kiến cấp ${nextApproval.level} (${nextApproval.name})`}>
                            <input
                              className="form-input"
                              value={decideNote}
                              onChange={e => setDecideNote(e.target.value)}
                              placeholder="Ghi chú (tuỳ chọn)"
                            />
                          </FormField>
                          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void runApprove()}>
                            Duyệt cấp {nextApproval.level}
                          </button>
                          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void runReject()}>
                            Từ chối
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <Modal isOpen={Boolean(shareUrl)} onClose={() => setShareUrl('')} title={`Link điền dự toán - ${row?.code ?? ''}`} size="md">
        <div className="space-y-3">
          <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            Link mới thay thế link cũ. Hết hạn sau 7 ngày. Sao chép rồi gửi Zalo / email cho người lập dự toán. Họ không cần tài khoản.
          </p>
          <FormField label="Đường dẫn chia sẻ">
            <input className="form-input font-mono" value={shareUrl} readOnly onFocus={e => e.target.select()} />
          </FormField>
          {shareExpiresAt ? (
            <p className="text-[length:var(--fs-sm)]">
              Hết hạn: <strong className="tabular-nums">{formatDateTimeVi(shareExpiresAt)}</strong>
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShareUrl('')}>Đóng</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void runRevokeShare()}>
              Thu hồi
            </button>
            <a className="btn btn-outline btn-sm" href={shareUrl} target="_blank" rel="noreferrer">Mở thử</a>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void copyShare()}>Sao chép link</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
