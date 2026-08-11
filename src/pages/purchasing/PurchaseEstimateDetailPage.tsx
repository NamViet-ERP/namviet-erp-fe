import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import { showToast } from '../../components/ui/Toast';
import {
  useConvertEstimateToPlan,
  useDecideEstimateApproval,
  usePurchaseEstimate,
  useReviewPurchaseEstimate,
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
  const canApprove = has('purchasing.estimates.approve');
  const canConvert = has('purchasing.plans.create');
  const [viewVersion, setViewVersion] = useState<number | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [decideNote, setDecideNote] = useState('');

  const detail = usePurchaseEstimate(id, viewVersion);
  const updateMutation = useUpdatePurchaseEstimate();
  const shareMutation = useShareEstimateLink();
  const reviewMutation = useReviewPurchaseEstimate();
  const submitMutation = useSubmitEstimateApproval();
  const decideMutation = useDecideEstimateApproval();
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

  const runDecide = async (decision: 'approved' | 'rejected') => {
    if (!id || !nextApproval) return;
    try {
      await decideMutation.mutateAsync({
        id,
        body: { level: nextApproval.level, decision, note: decideNote.trim() || null },
      });
      showToast('success', decision === 'approved' ? `Đã duyệt cấp ${nextApproval.level}.` : `Đã từ chối cấp ${nextApproval.level}.`);
      setDecideNote('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không duyệt được.'));
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

  const busy = updateMutation.isPending
    || shareMutation.isPending
    || reviewMutation.isPending
    || submitMutation.isPending
    || decideMutation.isPending
    || convertMutation.isPending;

  return (
    <div className="page-shell space-y-3">
      <PageHeader
        eyebrow="Mua hàng dự toán"
        title={row ? `${row.code} · ${row.title}` : 'Dự toán'}
        subtitle={row ? `${row.projectCode} · ${meta}` : undefined}
        actions={(
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/purchasing/estimate-procurement?tab=estimates')}>
              Quay lại
            </button>
            {canEdit && viewingLatest && !editing && canShareEstimate(row?.status) ? (
              <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void openShare()}>
                Lấy link điền
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

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">Lịch sử version</span>
            {versions.map(v => (
              <button
                key={v.id}
                type="button"
                className={`btn btn-sm ${(!viewVersion && v.versionNumber === latest) || viewVersion === v.versionNumber ? 'btn-primary' : 'btn-outline'}`}
                disabled={editing}
                onClick={() => setViewVersion(v.versionNumber)}
                title={`${formatDateTimeVi(v.createdAt)} · ${v.updatedByName}`}
              >
                Ver {v.versionNumber}
              </button>
            ))}
            <span className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
              Đang xem Ver {row.viewedVersion}. Vận hành luôn dùng Ver {row.currentVersion}.
            </span>
          </div>

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
                              <td className="table-cell">{line.unit || '—'}</td>
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
                            <td className="table-cell">{p.unit || '—'}</td>
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
                            <td className="table-cell">{a.actionByName || '—'}</td>
                            <td className="table-cell">
                              <span className={`badge ${a.status === 'approved' ? 'badge-success' : a.status === 'rejected' ? 'badge-error' : 'badge-pending'}`}>
                                {a.status === 'approved' ? 'Đã duyệt' : a.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                              </span>
                            </td>
                            <td className="table-cell">{a.actionAt ? formatDateTimeVi(a.actionAt) : '—'}</td>
                            <td className="table-cell">{a.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {canApprove && row.status === 'pending_approval' && nextApproval ? (
                    <div className="flex flex-wrap gap-2 items-end">
                      <FormField label={`Ý kiến cấp ${nextApproval.level} (${nextApproval.name})`}>
                        <input
                          className="form-input"
                          value={decideNote}
                          onChange={e => setDecideNote(e.target.value)}
                          placeholder="Ghi chú (tuỳ chọn)"
                        />
                      </FormField>
                      <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void runDecide('approved')}>
                        Duyệt
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void runDecide('rejected')}>
                        Từ chối
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      <Modal isOpen={Boolean(shareUrl)} onClose={() => setShareUrl('')} title={`Link điền dự toán - ${row?.code ?? ''}`} size="md">
        <div className="space-y-3">
          <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            Sao chép link rồi gửi Zalo / email cho người lập dự toán. Họ không cần tài khoản. Sau khi Double check và gửi, dữ liệu cập nhật ngay tại đây.
          </p>
          <FormField label="Đường dẫn chia sẻ">
            <input className="form-input font-mono" value={shareUrl} readOnly onFocus={e => e.target.select()} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShareUrl('')}>Đóng</button>
            <a className="btn btn-outline btn-sm" href={shareUrl} target="_blank" rel="noreferrer">Mở thử</a>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void copyShare()}>Sao chép link</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
