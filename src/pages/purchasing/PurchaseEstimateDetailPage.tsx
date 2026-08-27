import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link2, Plus, Trash2 } from 'lucide-react';
import FormField from '../../components/ui/FormField';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import { showToast } from '../../components/ui/Toast';
import {
  useApproveEstimateL1,
  useConvertEstimateToPlan,
  usePurchaseEstimate,
  useRejectEstimateApproval,
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
  canSubmitEstimate,
  estimateStatusBadge,
  estimateStatusLabel,
} from '../../lib/purchaseEstimateStatus';
import { formatCurrencyVnd } from '../../utils/formatCurrency';
import type { PurchaseEstimateLineApiDto } from '../../types/api/purchasingApi';

type DraftLine = { key: string; materialCode: string; newQty: string; estimateUnitPrice: string };

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
  const canConvert = has('purchasing.plans.create');
  const canShare = has('purchasing.estimates.view') || has('purchasing.estimates.update');
  const [viewVersion, setViewVersion] = useState<number | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
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

  const meta = useMemo(() => {
    if (!row) return '';
    return `Tạo ${formatDateTimeVi(row.createdAt)} · ${row.createdByName} · Sửa ${formatDateTimeVi(row.updatedAt)} · ${row.updatedByName}`;
  }, [row]);

  const canDecideCurrent = Boolean(nextApproval && canApproveL1 && viewingLatest);

  const busy = updateMutation.isPending
    || submitMutation.isPending
    || approveL1Mutation.isPending
    || rejectMutation.isPending
    || convertMutation.isPending
    || shareMutation.isPending;

  const back = () => navigate('/purchasing/estimate-procurement?tab=estimates');

  return (
    <div className="page-shell space-y-3 pur-estimate-detail">
      <HrmDetailHeader
        onBack={back}
        title={row ? `${row.code} · ${row.title}` : 'Dự toán'}
        subtitle={row ? `${row.projectCode} · ${meta}` : 'Mua hàng dự toán'}
        actions={(
          <div className="flex flex-wrap gap-2 justify-end">
            {canShare && viewingLatest && !editing ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={busy}
                onClick={() => void runShareLink()}
              >
                <Link2 size={14} aria-hidden />
                Lấy link xem
              </button>
            ) : null}
            {canEdit && viewingLatest && !editing && canEditEstimate(row?.status) ? (
              <button type="button" className="btn btn-outline btn-sm" onClick={startEdit}>
                Sửa dòng vật tư
              </button>
            ) : null}
            {canEdit && viewingLatest && !editing && canSubmitEstimate(row?.status) ? (
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void runSubmit()}>
                Gửi duyệt
              </button>
            ) : null}
            {canConvert && viewingLatest && row?.status === 'approved' && !row.convertedPlanCode ? (
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
            <tbody><TableSkeletonRows colSpan={6} /></tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <span className={`badge ${estimateStatusBadge(row.status)}`}>{estimateStatusLabel(row.status)}</span>
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
              className="pur-estimate-detail__versions w-full shrink-0 rounded-[var(--radius-md)] bg-[var(--md-surface)] lg:w-56"
              aria-label="Lịch sử version"
            >
              <div className="pur-estimate-detail__versions-head px-3 py-2 text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
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
                          'pur-estimate-detail__ver',
                          'w-full rounded-[var(--radius-sm)] px-2.5 py-2 text-left transition-[background-color,border-color,transform] duration-150',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-primary)]',
                          'disabled:cursor-not-allowed disabled:opacity-60',
                          'active:scale-[0.97]',
                          selected ? 'is-selected' : '',
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
            </aside>

            <div className="min-w-0 flex-1 space-y-3">
              {editing ? (
                <div className="space-y-3 pur-estimate-edit">
                  <FormField label="Tiêu đề (tên dự án)">
                    <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
                  </FormField>

                  <div className="pur-create-plan__section-head">
                    <div>
                      <h3 className="pur-create-plan__section-title">Dòng vật tư</h3>
                      <p className="pur-create-plan__section-hint">
                        {draftLines.filter(l => l.materialCode).length} dòng đã chọn
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDraftLines(prev => [...prev, { key: String(Date.now()), materialCode: '', newQty: '', estimateUnitPrice: '' }])}
                      >
                        <Plus size={14} aria-hidden />
                        Thêm vật tư
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={updateMutation.isPending}
                        onClick={() => setEditing(false)}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={updateMutation.isPending}
                        onClick={() => void save()}
                      >
                        {updateMutation.isPending ? 'Đang lưu…' : 'Lưu chỉnh sửa'}
                      </button>
                    </div>
                  </div>

                  <div className="pur-create-plan__table-shell">
                    <table className="form-table import-items-table wms-inventory-table pur-estimate-edit__table">
                      <thead>
                        <tr>
                          <th className="table-header-cell">Vật tư *</th>
                          <th className="table-header-cell text-center">SL *</th>
                          <th className="table-header-cell text-right">Giá dự toán</th>
                          <th className="table-header-cell text-center" aria-label="Xóa" />
                        </tr>
                      </thead>
                      <tbody>
                        {draftLines.map((line, index) => (
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
                                className="form-input text-center tabular-nums"
                                inputMode="decimal"
                                value={line.newQty}
                                onChange={e => setDraftLines(prev => prev.map(l => l.key === line.key ? { ...l, newQty: e.target.value } : l))}
                                aria-label={`Số lượng dòng ${index + 1}`}
                              />
                            </td>
                            <td className="table-cell">
                              <CurrencyInput
                                value={line.estimateUnitPrice}
                                onChange={estimateUnitPrice => setDraftLines(prev => prev.map(l => l.key === line.key ? { ...l, estimateUnitPrice } : l))}
                                suffix="VND"
                              />
                            </td>
                            <td className="table-cell text-center">
                              <button
                                type="button"
                                className="icon-btn icon-btn--danger"
                                aria-label={`Xóa dòng ${index + 1}`}
                                onMouseDown={e => e.preventDefault()}
                                onClick={e => {
                                  /* blur trước khi unmount — tránh browser kéo scroll theo focus */
                                  (e.currentTarget as HTMLButtonElement).blur();
                                  const y = window.scrollY;
                                  setDraftLines(prev => {
                                    if (prev.length <= 1) {
                                      return prev.map(l => (
                                        l.key === line.key
                                          ? { ...l, materialCode: '', newQty: '', estimateUnitPrice: '' }
                                          : l
                                      ));
                                    }
                                    return prev.filter(l => l.key !== line.key);
                                  });
                                  requestAnimationFrame(() => {
                                    if (window.scrollY !== y) window.scrollTo(0, y);
                                  });
                                }}
                              >
                                <Trash2 size={16} aria-hidden />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  <div className="wms-inventory-table-wrap">
                    <table className="wms-inventory-table">
                      <thead>
                        <tr>
                          <th className="table-header-cell">Hạng mục</th>
                          <th className="table-header-cell">Hàng hoá</th>
                          <th className="table-header-cell">ĐVT</th>
                          <th className="table-header-cell">SL</th>
                          <th className="table-header-cell">Giá dự toán</th>
                          <th className="table-header-cell">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.lines.length === 0 && proposals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="table-cell">
                              <EmptyState message={workflowLocked ? 'Chưa có dòng vật tư.' : 'Chưa có dòng. Bấm Sửa dòng vật tư để thêm.'} />
                            </td>
                          </tr>
                        ) : (
                          <>
                            {groupLines(row.lines).flatMap(([cat, lines]) =>
                              lines.map(line => {
                                const price = line.estimateUnitPrice;
                                return (
                                  <tr key={line.id} className="table-row">
                                    <td className="table-cell">{cat}</td>
                                    <td className="table-cell">
                                      <span className="font-mono">{line.materialCode}</span>
                                      {' '}
                                      {line.materialName}
                                    </td>
                                    <td className="table-cell">{line.unit || '-'}</td>
                                    <td className="table-cell text-right tabular-nums">{line.newQty}</td>
                                    <td className="table-cell text-right tabular-nums">{formatCurrencyVnd(price)}</td>
                                    <td className="table-cell text-right tabular-nums font-medium">{formatCurrencyVnd(price * Number(line.newQty))}</td>
                                  </tr>
                                );
                              }),
                            )}
                            {proposals.map(p => (
                              <tr key={p.id} className="table-row">
                                <td className="table-cell"><span className="badge badge-warning">Đề xuất mới</span></td>
                                <td className="table-cell">
                                  <strong>{p.name}</strong>
                                  {p.spec ? ` - ${p.spec}` : ''}
                                </td>
                                <td className="table-cell">{p.unit || '-'}</td>
                                <td className="table-cell text-right tabular-nums">{p.qty}</td>
                                <td className="table-cell text-right tabular-nums">-</td>
                                <td className="table-cell text-right tabular-nums">-</td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {row.approvals.length > 0 ? (
                    <div className="space-y-2">
                      <div className="wms-inventory-table-wrap">
                        <table className="wms-inventory-table">
                          <thead>
                            <tr>
                              <th className="table-header-cell">Cấp duyệt</th>
                              <th className="table-header-cell">Người duyệt</th>
                              <th className="table-header-cell">Trạng thái</th>
                              <th className="table-header-cell">Thời điểm</th>
                              <th className="table-header-cell">Ý kiến</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.approvals.map(a => (
                              <tr key={a.id} className="table-row">
                                <td className="table-cell">{a.name}</td>
                                <td className="table-cell font-medium">
                                  {a.actionByName?.trim() || '-'}
                                </td>
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
                        <div className="pur-estimate-decide" aria-label="Quyết định duyệt">
                          <div className="pur-estimate-decide__head">
                            <h3 className="pur-estimate-decide__title">Quyết định duyệt</h3>
                            <p className="pur-estimate-decide__hint">
                              {nextApproval.name} · Ver {latest}
                            </p>
                          </div>
                          <FormField label="Ý kiến (tuỳ chọn)">
                            <textarea
                              className="form-input"
                              rows={3}
                              value={decideNote}
                              onChange={e => setDecideNote(e.target.value)}
                              placeholder="Nhập ý kiến duyệt…"
                            />
                          </FormField>
                          <div className="pur-estimate-decide__actions">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={busy}
                              onClick={() => void runReject()}
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={busy}
                              onClick={() => void runApprove()}
                            >
                              Duyệt
                            </button>
                          </div>
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
    </div>
  );
}
