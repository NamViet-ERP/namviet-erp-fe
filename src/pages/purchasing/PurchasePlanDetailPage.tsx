import { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronRight, FolderLock, FolderOpen } from 'lucide-react';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import {
  usePurchasePlan,
  useSupplierMaterialRisks,
  useUpdatePurchasePlan,
} from '../../hooks/usePurchasePlans';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { formatCurrency } from '../../utils/formatCurrency';
import type {
  PurchasePlanLineApiDto,
  SupplierMaterialRiskPairRequest,
} from '../../types/api/purchasingApi';

function money(v: number | null | undefined): string {
  if (v == null) return '—';
  return formatCurrency(v);
}

function qty(v: number | null | undefined): string {
  if (v == null) return '—';
  return String(v);
}

function planStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'pending_l1': return 'Chờ duyệt cấp 1';
    case 'pending_l2': return 'Chờ duyệt cấp 2';
    case 'approved':
    case 'active': return 'Đã duyệt';
    case 'rejected': return 'Từ chối';
    case 'closed': return 'Đã đóng';
    default: return status || '—';
  }
}

function planStatusPillClass(status: string | null | undefined): string {
  switch (status) {
    case 'approved':
    case 'active': return 'pur-erp__pill pur-erp__pill--ok';
    case 'closed':
    case 'rejected': return 'pur-erp__pill pur-erp__pill--danger';
    case 'pending_l1':
    case 'pending_l2': return 'pur-erp__pill pur-erp__pill--warn';
    default: return 'pur-erp__pill pur-erp__pill--warn';
  }
}

function PlanStatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <span className={planStatusPillClass(status)}>
      {planStatusLabel(status)}
    </span>
  );
}

function LineQuotes({ line }: { line: PurchasePlanLineApiDto }) {
  const [open, setOpen] = useState(false);
  const quotes = line.quotes ?? [];
  if (quotes.length === 0) return <span className="text-sm">—</span>;
  return (
    <div>
      <button
        type="button"
        className="btn btn-text btn-sm"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        {open ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
        {quotes.length} báo giá
      </button>
      {open && (
        <ul className="pur-detail__quote-list">
          {quotes.map(q => (
            <li key={q.id}>
              {q.supplierName || '—'}: {formatCurrency(q.unitPrice ?? 0)}
              {q.note ? ` - ${q.note}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Chi tiết KHMH — header kiểu HR + meta/tổng tiền căn chỉnh + bảng dòng. */
export default function PurchasePlanDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: plan, isLoading, isError, error, refetch } = usePurchasePlan(code);
  const updateMutation = useUpdatePurchasePlan();
  const [confirmClose, setConfirmClose] = useState(false);
  const isAdhoc =
    location.pathname.startsWith('/purchasing/adhoc')
    || plan?.kind === 'adhoc'
    || (code ?? '').toUpperCase().startsWith('MHPS-');
  const listPath = isAdhoc ? '/purchasing/adhoc' : '/purchasing/plans';
  const back = () => navigate(listPath);

  const lines = plan?.lines ?? [];

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
    if (!plan) return [];
    return [
      { label: 'Dự toán', value: money(plan.budgetTotal), tone: 'budget', bg: '#d7eaf3', border: '#9cc9de' },
      { label: 'Đề xuất', value: money(plan.proposalTotal), tone: 'proposal', bg: '#d8eee5', border: '#9dceb8' },
      { label: 'Mua hàng', value: money(plan.purchaseTotal), tone: 'purchase', bg: '#f3e6cc', border: '#dfc28a' },
      { label: 'Tổng chi', value: money(plan.paidTotal), tone: 'paid', bg: '#E5F4EC', border: '#9dceb8' },
    ];
  }, [plan]);

  if (isError) {
    return (
      <div className="hrm-page w-full pur-detail">
        <HrmDetailHeader onBack={back} title={code ? `KHMH ${code}` : 'Chi tiết KHMH'} />
        <EmptyState
          message={getApiErrorMessage(error, 'Không tải được chi tiết KHMH.')}
          action={(
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { void refetch(); }}>
              Thử lại
            </button>
          )}
        />
      </div>
    );
  }

  if (isLoading || !plan) {
    return (
      <div className="hrm-page w-full pur-detail">
        <HrmDetailHeader onBack={back} title={code ? `KHMH ${code}` : 'Chi tiết KHMH'} />
        <section className="pur-detail__card">
          <div className="overflow-x-auto table-scroll">
            <table className="pur-erp__table">
              <tbody>
                <TableSkeletonRows rows={6} colSpan={4} />
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  const projectSubtitle = plan.projectName || plan.projectCode || undefined;
  const isApproved = plan.status === 'approved' || plan.status === 'active';
  const isClosed = plan.status === 'closed';

  return (
    <div className="hrm-page w-full pur-detail">
      <HrmDetailHeader
        onBack={back}
        title={`KHMH ${plan.code}`}
        subtitle={projectSubtitle}
        actions={(
          <div className="pur-detail__actions">
            <PlanStatusBadge status={plan.status} />
            {isClosed ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={updateMutation.isPending}
                onClick={() => { void setPlanStatus('approved'); }}
              >
                <FolderOpen size={15} strokeWidth={1.75} aria-hidden />
                Mở lại kế hoạch
              </button>
            ) : null}
            {isApproved ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={updateMutation.isPending}
                onClick={() => setConfirmClose(true)}
              >
                <FolderLock size={15} strokeWidth={1.75} aria-hidden />
                Đóng kế hoạch
              </button>
            ) : null}
          </div>
        )}
      />

      <section className="pur-detail__card" aria-label="Thông tin kế hoạch">
        <div className="pur-detail__meta">
          {headerMeta.map(m => (
            <div key={m.label} className="pur-detail__field">
              <div className="pur-detail__field-label">{m.label}</div>
              <div className="pur-detail__field-value">{m.value}</div>
            </div>
          ))}
        </div>
        <div className="pur-detail__totals" aria-label="Tổng tiền">
          {totals.map(t => (
            <div
              key={t.label}
              className={`pur-detail__total pur-detail__total--${t.tone}`}
              style={{ backgroundColor: t.bg, borderColor: t.border }}
            >
              <div className="pur-detail__total-label">{t.label}</div>
              <div className="pur-detail__total-value">{t.value}</div>
            </div>
          ))}
        </div>
      </section>

      {warnRisks.length > 0 ? (
        <section className="pur-create-plan__risk-list" aria-label="Cảnh báo NCC và vật tư" role="status">
          {warnRisks.map(risk => (
            <div
              key={`${risk.materialCode}|${risk.supplierId ?? ''}|${risk.supplierName ?? ''}`}
              className="pur-create-plan__risk-banner"
            >
              <AlertTriangle size={16} aria-hidden />
              <div>
                <strong>
                  Cảnh báo NCC {risk.supplierName || '—'} / {risk.materialCode}
                </strong>
                {risk.reasons.map(reason => (
                  <p key={reason}>{reason}</p>
                ))}
                <p>Chỉ cảnh báo mềm - không chặn duyệt.</p>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="pur-detail__card" aria-label="Danh sách mặt hàng">
        <h2 className="pur-detail__section-title">Danh sách mặt hàng</h2>
        {lines.length === 0 ? (
          <EmptyState message="KHMH chưa có dòng hàng." />
        ) : (
          <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
            <table className="pur-erp__table pur-erp__table--plan pur-detail__lines-table">
              <thead>
                <tr>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">STT</th>
                  <th className="pur-detail__th pur-detail__th--base">Hệ</th>
                  <th className="pur-detail__th pur-detail__th--base">Danh mục</th>
                  <th className="pur-detail__th pur-detail__th--base">Mã VT</th>
                  <th className="pur-detail__th pur-detail__th--base">Tên sản phẩm</th>
                  <th className="pur-detail__th pur-detail__th--base">Quy cách</th>
                  <th className="pur-detail__th pur-detail__th--base">ĐVT</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">SL</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">KG/ĐVT</th>
                  <th className="pur-detail__th pur-detail__th--base">Ghi chú</th>
                  <th className="pur-detail__th pur-detail__th--base">Tình trạng</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--budget">ĐG dự toán</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--budget">TT dự toán</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--proposal">ĐG đề xuất</th>
                  <th className="pur-detail__th pur-detail__th--proposal">NCC đề xuất</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--proposal">TT đề xuất</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--purchase">ĐG mua</th>
                  <th className="pur-detail__th pur-detail__th--purchase">NCC mua</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--purchase">TT mua</th>
                  <th className="pur-detail__th pur-detail__th--select">NCC chọn</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--select">Giá chọn</th>
                  <th className="pur-detail__th pur-detail__th--select">Lý do chọn</th>
                  <th className="pur-detail__th pur-detail__th--track">Báo giá</th>
                  <th className="pur-detail__th pur-detail__th--track">PO</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Đã đặt</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Đã giao</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Lỗi</th>
                  <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Còn lại</th>
                  <th className="pur-detail__th pur-detail__th--track">Ngày DK</th>
                  <th className="pur-detail__th pur-detail__th--track">Ngày TT</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id}>
                    <td className="pur-erp__td-num">{line.lineNo || idx + 1}</td>
                    <td>{line.systemName || '—'}</td>
                    <td>{line.category || '—'}</td>
                    <td>{line.materialCode || '—'}</td>
                    <td>{line.productName}</td>
                    <td>{line.spec || '—'}</td>
                    <td>{line.unit || '—'}</td>
                    <td className="pur-erp__td-num">{qty(line.quantity)}</td>
                    <td className="pur-erp__td-num">{qty(line.kgPerUnit)}</td>
                    <td>{line.lineNote || '—'}</td>
                    <td>{line.purchaseStatus || '—'}</td>
                    <td className="pur-erp__td-num">{money(line.budgetUnitPrice)}</td>
                    <td className="pur-erp__td-num">{money(line.budgetAmount)}</td>
                    <td className="pur-erp__td-num">{money(line.proposalUnitPrice)}</td>
                    <td>{line.proposalSupplierName || '—'}</td>
                    <td className="pur-erp__td-num">{money(line.proposalAmount)}</td>
                    <td className="pur-erp__td-num">{money(line.purchaseUnitPrice)}</td>
                    <td>{line.purchaseSupplierName || '—'}</td>
                    <td className="pur-erp__td-num">{money(line.purchaseAmount)}</td>
                    <td>{line.selectedSupplierName || '—'}</td>
                    <td className="pur-erp__td-num">{money(line.selectedUnitPrice)}</td>
                    <td>{line.selectionReason || '—'}</td>
                    <td><LineQuotes line={line} /></td>
                    <td>—</td>
                    <td className="pur-erp__td-num">{qty(line.orderedQty)}</td>
                    <td className="pur-erp__td-num">{qty(line.receivedQty)}</td>
                    <td className="pur-erp__td-num">{qty(line.defectQty)}</td>
                    <td className="pur-erp__td-num">{qty(line.remainingOrderableQty)}</td>
                    <td>{formatDateCell(line.expectedDeliveryDate ?? undefined)}</td>
                    <td>{formatDateCell(line.actualReceiptDate ?? undefined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="pur-detail__muted">Chưa có lịch sử thay đổi.</p>

      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => { void setPlanStatus('closed'); }}
        title="Đóng kế hoạch mua hàng"
        message={plan
          ? `Đóng KHMH ${plan.code}? Sau khi đóng sẽ không tạo được đơn mua hàng từ kế hoạch này.`
          : ''}
        confirmLabel="Đóng"
        variant="danger"
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
