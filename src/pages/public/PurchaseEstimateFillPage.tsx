import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PublicFormLayout from '../../components/layout/PublicFormLayout';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import ToastContainer, { showToast } from '../../components/ui/Toast';
import {
  usePublicPurchaseEstimate,
  useSubmitPublicPurchaseEstimate,
} from '../../hooks/usePurchaseEstimates';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import type { PublicPurchaseEstimateApiDto } from '../../types/api/purchasingApi';

type ProposalDraft = { key: string; name: string; spec: string; unit: string; qty: string; note: string };

function groupPublicLines(row: PublicPurchaseEstimateApiDto) {
  const groups = new Map<string, PublicPurchaseEstimateApiDto['lines']>();
  for (const line of row.lines) {
    const key = line.categoryName?.trim() || 'Khác';
    const bucket = groups.get(key) ?? [];
    bucket.push(line);
    groups.set(key, bucket);
  }
  return [...groups.entries()];
}

export default function PurchaseEstimateFillPage() {
  const { token } = useParams<{ token: string }>();
  const publicQuery = usePublicPurchaseEstimate(token);
  const submitMutation = useSubmitPublicPurchaseEstimate();
  const row = publicQuery.data;

  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [preparerName, setPreparerName] = useState('');
  const [qtyByCode, setQtyByCode] = useState<Record<string, string>>({});
  const [proposals, setProposals] = useState<ProposalDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!row || hydrated) return;
    const next: Record<string, string> = {};
    for (const line of row.lines) next[line.materialCode] = String(line.qty ?? 0);
    setQtyByCode(next);
    setPreparerName(row.preparerName ?? '');
    setProposals((row.proposals ?? []).map(p => ({
      key: p.id,
      name: p.name,
      spec: p.spec ?? '',
      unit: p.unit,
      qty: String(p.qty),
      note: p.note ?? '',
    })));
    setHydrated(true);
  }, [row, hydrated]);

  const filled = useMemo(() => {
    if (!row) return [];
    return row.lines.filter(l => Number(qtyByCode[l.materialCode] ?? 0) > 0);
  }, [row, qtyByCode]);

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
        body: {
          preparerName: preparerName.trim(),
          lines: row.lines.map(l => ({
            materialCode: l.materialCode,
            newQty: Number(qtyByCode[l.materialCode] ?? 0) || 0,
          })),
          proposals: readyProposals.map(p => ({
            name: p.name.trim(),
            spec: p.spec.trim() || null,
            unit: p.unit.trim() || 'cái',
            qty: Number(p.qty) || 0,
            note: p.note.trim() || null,
          })),
        },
      });
      showToast('success', 'Đã gửi dự toán thành công.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không gửi được dự toán.'));
    }
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
    body = (
      <div className="wms-inventory-table-wrap">
        <table className="wms-inventory-table">
          <tbody><TableSkeletonRows colSpan={4} /></tbody>
        </table>
      </div>
    );
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
    body = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-info">Chỉ xem</span>
          <span className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            Ver mới nhất · {row.code} · {row.projectCode}
            {row.projectName ? ` - ${row.projectName}` : ''}
          </span>
        </div>
        <h2 className="text-[length:var(--fs-lg)] font-semibold text-[var(--md-on-surface)] m-0">{row.title}</h2>
        <div className="wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell">Hạng mục</th>
                <th className="table-header-cell">Hàng hoá</th>
                <th className="table-header-cell">ĐVT</th>
                <th className="table-header-cell text-right">SL</th>
              </tr>
            </thead>
            <tbody>
              {row.lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-cell">
                    <EmptyState message="Chưa có dòng vật tư." />
                  </td>
                </tr>
              ) : (
                groupPublicLines(row).flatMap(([cat, lines]) =>
                  lines.map(line => (
                    <tr key={line.materialCode} className="table-row">
                      <td className="table-cell">{cat}</td>
                      <td className="table-cell">
                        <span className="font-mono">{line.materialCode}</span>
                        {' '}
                        {line.materialName}
                      </td>
                      <td className="table-cell">{line.unit || '-'}</td>
                      <td className="table-cell text-right tabular-nums">{line.qty}</td>
                    </tr>
                  )),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else if (step === 'review') {
    body = (
      <div className="space-y-3">
        <span className="badge badge-info">Bước 2 - Double check trước khi gửi</span>
        <p>Người lập dự toán: <strong>{preparerName.trim()}</strong></p>
        <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
          Chỉ hiển thị {filled.length + readyProposals.length} dòng đã có số lượng / đề xuất, trên tổng {row.lines.length} mã hàng của mẫu.
        </p>
        <div className="wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell">Hạng mục</th>
                <th className="table-header-cell">Hàng hoá</th>
                <th className="table-header-cell">Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {filled.length === 0 && readyProposals.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-cell"><EmptyState message="Chưa có dòng nào được điền." /></td>
                </tr>
              ) : (
                <>
                  {groupPublicLines({ ...row, lines: filled }).flatMap(([cat, lines]) =>
                    lines.map(line => (
                      <tr key={line.materialCode} className="table-row">
                        <td className="table-cell">{cat}</td>
                        <td className="table-cell">
                          <span className="font-mono">{line.materialCode}</span>
                          {' '}
                          {line.materialName}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {Number(qtyByCode[line.materialCode] ?? 0).toLocaleString('vi-VN')} {line.unit}
                        </td>
                      </tr>
                    )),
                  )}
                  {readyProposals.map(p => (
                    <tr key={p.key} className="table-row">
                      <td className="table-cell">Đề xuất mới</td>
                      <td className="table-cell">
                        <strong>{p.name}</strong>
                        {p.spec ? ` - ${p.spec}` : ''}
                        {p.note ? <div className="text-[var(--md-on-surface-variant)]">{p.note}</div> : null}
                      </td>
                      <td className="table-cell text-right tabular-nums">
                        {Number(p.qty).toLocaleString('vi-VN')} {p.unit}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setStep('edit')}>
            Quay lại chỉnh sửa
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={submitMutation.isPending} onClick={() => void submit()}>
            {submitMutation.isPending ? 'Đang gửi…' : 'Xác nhận gửi dự toán'}
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
          Chọn người lập (Phòng Dự án / Sản xuất), điền số lượng, sau đó bấm &quot;Xem lại trước khi gửi (Double check)&quot;.
        </p>
        <FormField label="Người lập dự toán" required>
          <select
            className="form-input"
            value={preparerName}
            onChange={e => setPreparerName(e.target.value)}
          >
            <option value="">Chọn người lập…</option>
            {(row.preparers ?? []).map(p => {
              const label = `${p.name} - ${p.roleLabel}`;
              return (
                <option key={p.id} value={label}>
                  {label}
                </option>
              );
            })}
          </select>
        </FormField>
        {(row.preparers ?? []).length === 0 ? (
          <p className="text-[length:var(--fs-sm)] text-[var(--md-error)]">
            Chưa có người được gán vai trò Phòng Dự án / Sản xuất. Nhờ Admin cấp vai trò ở Thiết lập người dùng.
          </p>
        ) : null}

        {groupPublicLines(row).map(([cat, lines]) => (
          <div key={cat} className="space-y-2">
            <div className="text-[length:var(--fs-sm)] font-semibold">{cat}</div>
            <div className="wms-inventory-table-wrap">
              <table className="wms-inventory-table">
                <thead>
                  <tr>
                    <th className="table-header-cell">Mã hàng</th>
                    <th className="table-header-cell">Tên hàng</th>
                    <th className="table-header-cell">ĐVT</th>
                    <th className="table-header-cell">Số lượng cần dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map(line => (
                    <tr key={line.materialCode} className="table-row">
                      <td className="table-cell font-mono">{line.materialCode}</td>
                      <td className="table-cell">{line.materialName}</td>
                      <td className="table-cell">{line.unit}</td>
                      <td className="table-cell">
                        <input
                          className="form-input"
                          inputMode="decimal"
                          min={0}
                          value={qtyByCode[line.materialCode] ?? '0'}
                          onChange={e => setQtyByCode(prev => ({ ...prev, [line.materialCode]: e.target.value }))}
                          aria-label={`Số lượng ${line.materialCode}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <div className="text-[length:var(--fs-sm)] font-semibold">Đề xuất mua thêm / yêu cầu thông số đặc thù</div>
          <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            Nếu hàng cần mua chưa có mã ở trên, điền vào đây. Phòng Cung ứng sẽ xem xét bổ sung mã trước khi mua.
          </p>
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Tên hàng đề xuất</th>
                  <th className="table-header-cell">Thông số / quy cách</th>
                  <th className="table-header-cell">ĐVT</th>
                  <th className="table-header-cell">Số lượng</th>
                  <th className="table-header-cell">Lý do / mô tả</th>
                  <th className="table-header-cell"> </th>
                </tr>
              </thead>
              <tbody>
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell"><EmptyState message="Chưa có đề xuất nào." /></td>
                  </tr>
                ) : proposals.map(p => (
                  <tr key={p.key} className="table-row">
                    <td className="table-cell">
                      <input className="form-input" value={p.name} placeholder="Tên hàng đề xuất" onChange={e => setProposals(prev => prev.map(x => x.key === p.key ? { ...x, name: e.target.value } : x))} />
                    </td>
                    <td className="table-cell">
                      <input className="form-input" value={p.spec} placeholder="Thông số / quy cách" onChange={e => setProposals(prev => prev.map(x => x.key === p.key ? { ...x, spec: e.target.value } : x))} />
                    </td>
                    <td className="table-cell">
                      <input className="form-input" value={p.unit} placeholder="ĐVT" onChange={e => setProposals(prev => prev.map(x => x.key === p.key ? { ...x, unit: e.target.value } : x))} />
                    </td>
                    <td className="table-cell">
                      <input className="form-input" inputMode="decimal" value={p.qty} onChange={e => setProposals(prev => prev.map(x => x.key === p.key ? { ...x, qty: e.target.value } : x))} />
                    </td>
                    <td className="table-cell">
                      <input className="form-input" value={p.note} placeholder="Lý do / mô tả thêm" onChange={e => setProposals(prev => prev.map(x => x.key === p.key ? { ...x, note: e.target.value } : x))} />
                    </td>
                    <td className="table-cell">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setProposals(prev => prev.filter(x => x.key !== p.key))}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setProposals(prev => [...prev, { key: String(Date.now()), name: '', spec: '', unit: '', qty: '', note: '' }])}
          >
            Thêm dòng đề xuất
          </button>
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn btn-primary btn-sm" onClick={goReview}>
            Xem lại trước khi gửi (Double check)
          </button>
        </div>
      </div>
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
