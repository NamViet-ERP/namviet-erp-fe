import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import { usePurchasePlan, usePurchasePlans } from '../../hooks/usePurchasePlans';
import {
  useApprovePurchaseOrder,
  useCreatePurchaseOrder,
  usePlacePurchaseOrder,
  usePurchaseOrder,
  useUnapprovePurchaseOrder,
  useUpdatePurchaseOrder,
} from '../../hooks/usePurchaseOrders';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { formatCurrency, formatCurrencyFull } from '../../utils/formatCurrency';
import { findSupplierByName, suppliersService } from '../../services/suppliersService';
import { usePermission } from '../../hooks/usePermission';
import CreateImportFromPoModal from '../../components/purchasing/CreateImportFromPoModal';
import Badge from '../../components/ui/Badge';
import { useImports } from '../../hooks/useImports';
import {
  PoStatusPill,
  poApprovalStatus,
  poDeliveryStatus,
  poPaymentStatus,
  poPaymentWarningStatus,
  poPlacementStatus,
} from '../../lib/purchasing/purchaseOrderStatus';
import type { PurchasePlanLineApiDto } from '../../types/api/purchasingApi';
import type { StatusKey } from '../../types';

function supplierOf(line: PurchasePlanLineApiDto): string {
  return (
    line.selectedSupplierName
    || line.purchaseSupplierName
    || line.proposalSupplierName
    || ''
  ).trim();
}

function unitPriceOf(line: PurchasePlanLineApiDto): number {
  return line.selectedUnitPrice ?? line.purchaseUnitPrice ?? line.proposalUnitPrice ?? 0;
}

/** Chi tiết PO hoặc tạo mới: chọn KHMH → NCC → dòng hàng. */
export default function PurchaseOrderDetailPage() {
  const { code } = useParams<{ code: string }>();
  const isCreate = !code || code === 'new';
  const navigate = useNavigate();

  if (isCreate) {
    return <CreatePurchaseOrderForm onCreated={c => navigate(`/purchasing/orders/${encodeURIComponent(c)}`, { replace: true })} />;
  }

  return <PurchaseOrderDetailView code={code} />;
}

function PurchaseOrderDetailView({ code }: { code: string }) {
  const navigate = useNavigate();
  const { data: order, isLoading, isError, error, refetch } = usePurchaseOrder(code);
  const approveMutation = useApprovePurchaseOrder();
  const unapproveMutation = useUnapprovePurchaseOrder();
  const placeMutation = usePlacePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const { has } = usePermission();
  const canApprove = has('purchasing.orders.approve');
  const canUnapprove = has('purchasing.orders.unapprove');
  const canPlace = has('purchasing.orders.place');
  const canUpdate = has('purchasing.orders.update');
  const canCreateImport = has('wms.imports.create');
  const canCreatePayment = has('purchasing.payments.create');
  const lines = order?.lines ?? [];
  const actionBusy =
    approveMutation.isPending
    || unapproveMutation.isPending
    || placeMutation.isPending
    || updateMutation.isPending;
  const isDraft = order?.approvalStatus === 'draft';
  const isApproved = order?.approvalStatus === 'approved';
  const isPlaced = order?.orderPlacementStatus === 'placed';
  const deliveryIncomplete = order?.deliveryStatus !== 'complete';

  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const importsQuery = useImports();
  const relatedImports = useMemo(
    () => (importsQuery.data ?? []).filter(
      imp => (imp.referenceCode ?? '').trim().toLowerCase() === code.trim().toLowerCase(),
    ),
    [importsQuery.data, code],
  );
  const [editNote, setEditNote] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editLines, setEditLines] = useState<Record<number, {
    qty: string;
    unitPrice: string;
    note: string;
    expectedDeliveryDate: string;
  }>>({});

  const approval = poApprovalStatus(order?.approvalStatus);
  const placement = poPlacementStatus(order?.orderPlacementStatus);
  const delivery = poDeliveryStatus(order?.deliveryStatus);
  const payment = poPaymentStatus(order?.paymentStatus);
  const paymentWarning = poPaymentWarningStatus(Boolean(order?.paymentWarning));

  const startEdit = () => {
    if (!order) return;
    setEditNote(order.note ?? '');
    setEditOrderDate(order.orderDate ? String(order.orderDate).slice(0, 10) : '');
    const next: typeof editLines = {};
    for (const line of order.lines) {
      next[line.id] = {
        qty: String(line.ordered),
        unitPrice: String(line.poPrice),
        note: line.note ?? '',
        expectedDeliveryDate: line.expectedDeliveryDate
          ? String(line.expectedDeliveryDate).slice(0, 10)
          : '',
      };
    }
    setEditLines(next);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditLines({});
  };

  const saveEdit = async () => {
    if (!order) return;
    const bodyLines = order.lines.map(line => {
      const draft = editLines[line.id];
      const planLineId = line.planLineId;
      if (planLineId == null) {
        throw new Error(`Dòng "${line.name}" thiếu planLineId — không thể lưu.`);
      }
      return {
        planLineId,
        qty: Number(draft?.qty ?? line.ordered),
        unitPrice: Number(draft?.unitPrice ?? line.poPrice),
        expectedDeliveryDate: draft?.expectedDeliveryDate?.trim()
          ? draft.expectedDeliveryDate.trim()
          : null,
        note: draft?.note?.trim() ? draft.note.trim() : null,
      };
    });
    try {
      await updateMutation.mutateAsync({
        code,
        body: {
          note: editNote.trim() || null,
          orderDate: editOrderDate.trim() || null,
          lines: bodyLines,
        },
      });
      showToast('success', `Đã cập nhật PO ${code}.`);
      setEditing(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không cập nhật được PO.'));
    }
  };

  const createImportFromPo = async () => {
    setImportWizardOpen(true);
  };

  const runAction = async (
    kind: 'approve' | 'unapprove' | 'place',
  ) => {
    try {
      if (kind === 'approve') {
        await approveMutation.mutateAsync(code);
        showToast('success', `Đã duyệt PO ${code}.`);
      } else if (kind === 'unapprove') {
        await unapproveMutation.mutateAsync(code);
        showToast('success', `Đã hủy duyệt PO ${code}.`);
      } else {
        await placeMutation.mutateAsync(code);
        showToast('success', `Đã đánh dấu đặt hàng PO ${code}.`);
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Thao tác thất bại.'));
    }
  };

  return (
    <div className="hrm-page w-full pur-detail">
      <HrmDetailHeader
        onBack={() => navigate('/purchasing/orders')}
        title={`PO ${code}`}
        subtitle={order?.supplierName || order?.planCode || undefined}
        actions={(
          <div className="pur-detail__actions">
            {order && canUpdate && isDraft && !editing ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={actionBusy}
                onClick={startEdit}
              >
                Sửa
              </button>
            ) : null}
            {order && editing ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={actionBusy}
                  onClick={cancelEdit}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={actionBusy}
                  onClick={() => { void saveEdit(); }}
                >
                  {updateMutation.isPending ? 'Đang lưu…' : 'Lưu'}
                </button>
              </>
            ) : null}
            {order && canApprove && isDraft && !editing ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={actionBusy}
                onClick={() => { void runAction('approve'); }}
              >
                Duyệt
              </button>
            ) : null}
            {order && canUnapprove && isApproved && !isPlaced ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={actionBusy}
                onClick={() => { void runAction('unapprove'); }}
              >
                Hủy duyệt
              </button>
            ) : null}
            {order && canPlace && isApproved && !isPlaced ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={actionBusy}
                onClick={() => { void runAction('place'); }}
              >
                Đã đặt NCC
              </button>
            ) : null}
            {order && canCreateImport && isPlaced && deliveryIncomplete ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={actionBusy}
                onClick={() => { void createImportFromPo(); }}
              >
                Tạo phiếu nhập kho
              </button>
            ) : null}
            {order && canCreatePayment ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={actionBusy}
                onClick={() => navigate(`/purchasing/payments/new?po=${encodeURIComponent(code)}`)}
              >
                Tạo DNTT
              </button>
            ) : null}
          </div>
        )}
      />

      <CreateImportFromPoModal
        isOpen={importWizardOpen}
        poCode={code}
        onClose={() => setImportWizardOpen(false)}
        onCreated={voucherCode => {
          showToast('success', `Đã tạo phiếu nhập ${voucherCode} từ PO ${code}.`);
          navigate('/warehouse/import');
        }}
      />

      {isError ? (
        <EmptyState
          message={getApiErrorMessage(error, 'Không tải được chi tiết đơn hàng.')}
          action={(
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { void refetch(); }}>
              Thử lại
            </button>
          )}
        />
      ) : isLoading || !order ? (
        <section className="pur-detail__card">
          <table className="pur-erp__table"><tbody><TableSkeletonRows rows={5} colSpan={4} /></tbody></table>
        </section>
      ) : (
        <>
          <section className="pur-detail__card" aria-label="Thông tin đơn hàng">
            <div className="pur-detail__meta">
              <Meta label="Mã PO" value={order.code} />
              <Meta label="KHMH" value={order.planCode} />
              <Meta
                label="Dự án"
                value={order.projectName ? `${order.projectCode} — ${order.projectName}` : (order.projectCode || '—')}
                span={2}
              />
              <Meta label="Nhà cung cấp" value={order.supplierName || '—'} span={2} />
              <Meta label="Ngày tạo" value={formatDateTimeVi(order.createdAt) ?? '—'} />
              <Meta label="Người tạo" value={order.createdByName || '—'} />

              <Meta
                label="Duyệt"
                value={<PoStatusPill label={approval.label} tone={approval.tone} />}
              />
              <Meta
                label="Người duyệt"
                value={order.approvedByName
                  ? `${order.approvedByName}${order.approvedAt ? ` · ${formatDateTimeVi(order.approvedAt) ?? ''}` : ''}`
                  : '—'}
                muted={!order.approvedByName}
              />
              <Meta
                label="Trạng thái đặt"
                value={<PoStatusPill label={placement.label} tone={placement.tone} />}
              />
              <Meta
                label="Người đặt NCC"
                value={order.placedByName
                  ? `${order.placedByName}${order.placedAt ? ` · ${formatDateTimeVi(order.placedAt) ?? ''}` : ''}`
                  : '—'}
                muted={!order.placedByName}
              />
              <Meta
                label="Trạng thái giao"
                value={<PoStatusPill label={delivery.label} tone={delivery.tone} />}
              />
              <Meta
                label="Thanh toán"
                value={<PoStatusPill label={payment.label} tone={payment.tone} />}
              />

              <Meta
                label="Cảnh báo thanh toán"
                value={<PoStatusPill label={paymentWarning.label} tone={paymentWarning.tone} />}
              />
              <Meta label="Điều khoản thanh toán" value={`${order.supplierPaymentTermsDays} ngày`} />
              <Meta label="Hạn thanh toán" value={formatDateCell(order.paymentDueDate ?? undefined)} />
              {editing ? (
                <>
                  <Meta
                    label="Ngày đơn"
                    value={(
                      <input
                        className="form-input"
                        type="date"
                        value={editOrderDate}
                        onChange={e => setEditOrderDate(e.target.value)}
                      />
                    )}
                  />
                  <Meta
                    label="Ghi chú"
                    value={(
                      <textarea
                        className="form-input"
                        rows={2}
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                      />
                    )}
                    span="all"
                  />
                </>
              ) : (
                <Meta
                  label="Ghi chú"
                  value={order.note || '—'}
                  span="all"
                  muted={!order.note}
                />
              )}
            </div>

            <div className="pur-detail__totals" aria-label="Tổng tiền">
              <div
                className="pur-detail__total pur-detail__total--purchase"
                style={{ backgroundColor: '#f3e6cc', borderColor: '#dfc28a' }}
              >
                <div className="pur-detail__total-label">Tổng tiền</div>
                <div className="pur-detail__total-value">{formatCurrencyFull(order.totalAmount)}</div>
              </div>
            </div>
          </section>

          <section className="pur-detail__card" aria-label="Dòng hàng">
            <h2 className="purchasing-section-title">Dòng hàng</h2>
            {lines.length === 0 ? (
              <EmptyState message="Đơn hàng chưa có dòng." />
            ) : (
              <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
                <table className="pur-erp__table pur-detail__lines-table pur-detail__lines-table--po">
                  <colgroup>
                    <col className="pur-po-col pur-po-col--name" />
                    <col className="pur-po-col pur-po-col--spec" />
                    <col className="pur-po-col pur-po-col--unit" />
                    <col className="pur-po-col pur-po-col--qty" />
                    <col className="pur-po-col pur-po-col--price" />
                    <col className="pur-po-col pur-po-col--amount" />
                    <col className="pur-po-col pur-po-col--date" />
                    <col className="pur-po-col pur-po-col--recv" />
                    <col className="pur-po-col pur-po-col--note" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="pur-detail__th pur-detail__th--base">Tên hàng</th>
                      <th className="pur-detail__th pur-detail__th--base">Quy cách</th>
                      <th className="pur-detail__th pur-detail__th--base">ĐVT</th>
                      <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">SL</th>
                      <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">Đơn giá</th>
                      <th className="pur-erp__th-num pur-detail__th pur-detail__th--base">Thành tiền</th>
                      <th className="pur-detail__th pur-detail__th--track">Ngày DK giao</th>
                      <th className="pur-erp__th-num pur-detail__th pur-detail__th--track">Đã nhận</th>
                      <th className="pur-detail__th pur-detail__th--track">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(line => {
                      const draft = editLines[line.id];
                      const qty = editing ? Number(draft?.qty ?? line.ordered) : line.ordered;
                      const price = editing ? Number(draft?.unitPrice ?? line.poPrice) : line.poPrice;
                      const amount = Number.isFinite(qty * price) ? qty * price : line.lineAmount;
                      return (
                        <tr key={line.id}>
                          <td>{line.name}</td>
                          <td>{line.spec || '—'}</td>
                          <td>{line.unit || '—'}</td>
                          <td className="pur-erp__td-num">
                            {editing ? (
                              <input
                                className="form-input"
                                type="number"
                                min={0}
                                step="any"
                                value={draft?.qty ?? ''}
                                onChange={e => setEditLines(prev => ({
                                  ...prev,
                                  [line.id]: { ...prev[line.id]!, qty: e.target.value },
                                }))}
                              />
                            ) : line.ordered}
                          </td>
                          <td className="pur-erp__td-num">
                            {editing ? (
                              <input
                                className="form-input"
                                type="number"
                                min={0}
                                step="any"
                                value={draft?.unitPrice ?? ''}
                                onChange={e => setEditLines(prev => ({
                                  ...prev,
                                  [line.id]: { ...prev[line.id]!, unitPrice: e.target.value },
                                }))}
                              />
                            ) : formatCurrency(line.poPrice)}
                          </td>
                          <td className="pur-erp__td-num">{formatCurrency(amount)}</td>
                          <td>
                            {editing ? (
                              <input
                                className="form-input"
                                type="date"
                                value={draft?.expectedDeliveryDate ?? ''}
                                onChange={e => setEditLines(prev => ({
                                  ...prev,
                                  [line.id]: {
                                    ...prev[line.id]!,
                                    expectedDeliveryDate: e.target.value,
                                  },
                                }))}
                              />
                            ) : formatDateCell(line.expectedDeliveryDate ?? undefined)}
                          </td>
                          <td className="pur-erp__td-num">{line.received}</td>
                          <td>
                            {editing ? (
                              <input
                                className="form-input"
                                value={draft?.note ?? ''}
                                onChange={e => setEditLines(prev => ({
                                  ...prev,
                                  [line.id]: { ...prev[line.id]!, note: e.target.value },
                                }))}
                              />
                            ) : (line.note || '—')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="pur-detail__card" aria-label="Phiếu nhập kho liên quan">
            <h2 className="purchasing-section-title">
              Phiếu nhập kho liên quan
              <span className="ml-2 text-xs font-normal text-[var(--md-on-surface-variant)]">
                ({relatedImports.length})
              </span>
            </h2>
            {importsQuery.isLoading ? (
              <table className="pur-erp__table"><tbody><TableSkeletonRows rows={3} colSpan={5} /></tbody></table>
            ) : relatedImports.length === 0 ? (
              <EmptyState message="Chưa có phiếu NK gắn PO này." />
            ) : (
              <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
                <table className="pur-erp__table">
                  <thead>
                    <tr>
                      <th className="pur-detail__th">Mã phiếu NK</th>
                      <th className="pur-detail__th">Kho dự án</th>
                      <th className="pur-detail__th">Trạng thái</th>
                      <th className="pur-detail__th">Ngày</th>
                      <th className="pur-detail__th text-right">Tổng giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedImports.map(imp => (
                      <tr
                        key={imp.id}
                        className="table-row cursor-pointer"
                        onClick={() => navigate('/warehouse/import')}
                      >
                        <td className="table-cell font-semibold">{imp.voucherCode}</td>
                        <td className="table-cell">{imp.project || '—'}</td>
                        <td className="table-cell">
                          <Badge status={imp.status as StatusKey} />
                        </td>
                        <td className="table-cell">{imp.date || '—'}</td>
                        <td className="table-cell text-right tabular-nums">
                          {formatCurrency(imp.totalValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Meta({
  label,
  value,
  span,
  muted,
}: {
  label: string;
  value: ReactNode;
  span?: 2 | 'all';
  muted?: boolean;
}) {
  const spanClass = span === 'all'
    ? ' pur-detail__field--span-all'
    : span === 2
      ? ' pur-detail__field--span-2'
      : '';
  return (
    <div className={`pur-detail__field${spanClass}`}>
      <div className="pur-detail__field-label">{label}</div>
      <div className={`pur-detail__field-value${muted ? ' pur-detail__field-value--muted' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function CreatePurchaseOrderForm({ onCreated }: { onCreated: (code: string) => void }) {
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseOrder();
  const { data: plansPage, isLoading: plansLoading } = usePurchasePlans({ page: 1, pageSize: 200 });
  const { data: suppliersPage } = useQuery({
    queryKey: ['warehouse-suppliers', 'po-create'],
    queryFn: () => suppliersService.list({ page: 1, pageSize: 200 }),
  });

  const [planCode, setPlanCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [note, setNote] = useState('');
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);
  const [qtyByLine, setQtyByLine] = useState<Record<number, string>>({});

  const { data: plan, isLoading: planLoading, isError: planError, error: planErr } = usePurchasePlan(
    planCode || undefined,
  );

  const plans = plansPage?.items ?? [];
  const masterSuppliers = suppliersPage?.items ?? [];
  const allLines = useMemo(() => plan?.lines ?? [], [plan?.lines]);

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    for (const line of allLines) {
      const s = supplierOf(line);
      if (s) set.add(s);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [allLines]);

  const supplierLines = useMemo(() => {
    if (!supplierName) return [];
    return allLines.filter(l => supplierOf(l) === supplierName && l.remainingOrderableQty > 0);
  }, [allLines, supplierName]);

  const matchedSupplier = useMemo(
    () => findSupplierByName(masterSuppliers, supplierName),
    [masterSuppliers, supplierName],
  );

  const selectPlan = (next: string) => {
    setPlanCode(next);
    setSupplierName('');
    setSelectedLineIds([]);
    setQtyByLine({});
  };

  const selectSupplier = (next: string) => {
    setSupplierName(next);
    setSelectedLineIds([]);
    setQtyByLine({});
  };

  const toggleLine = (id: number, checked: boolean) => {
    setSelectedLineIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));
    if (checked) {
      const line = supplierLines.find(l => l.id === id);
      if (line) {
        setQtyByLine(prev => ({ ...prev, [id]: String(line.remainingOrderableQty) }));
      }
    }
  };

  const submit = async () => {
    if (!planCode) {
      showToast('warning', 'Vui lòng chọn mã KHMH.');
      return;
    }
    if (!supplierName) {
      showToast('warning', 'Vui lòng chọn nhà cung cấp theo KHMH.');
      return;
    }
    if (!matchedSupplier) {
      showToast(
        'error',
        `Không đối chiếu được NCC "${supplierName}" với danh mục. Vào Nhà cung cấp → Nhà cung cấp để tạo/sửa NCC (đúng tên + hạn công nợ).`,
      );
      return;
    }
    if (selectedLineIds.length === 0) {
      showToast('warning', 'Chọn ít nhất một dòng hàng.');
      return;
    }

    const lines = selectedLineIds.map(id => {
      const line = supplierLines.find(l => l.id === id)!;
      const qty = Number(String(qtyByLine[id] ?? '').replace(/[^\d.-]/g, '')) || 0;
      return {
        planLineId: id,
        qty,
        unitPrice: unitPriceOf(line),
        note: line.lineNote ?? null,
      };
    });

    if (lines.some(l => l.qty <= 0)) {
      showToast('warning', 'Số lượng đặt phải lớn hơn 0.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        planCode,
        supplierId: matchedSupplier.id,
        note: note.trim() || null,
        lines,
      });
      showToast('success', `Đã tạo PO ${created.code}.`);
      onCreated(created.code);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được đơn hàng.'));
    }
  };

  return (
    <div className="hrm-page w-full pur-detail">
      <HrmDetailHeader
        onBack={() => navigate('/purchasing/orders')}
        title="Tạo đơn hàng"
        subtitle="Chọn KHMH → NCC (theo dòng KHMH) → mặt hàng còn lại"
        actions={(
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={createMutation.isPending}
            onClick={() => { void submit(); }}
          >
            {createMutation.isPending ? 'Đang lưu…' : 'Lưu PO'}
          </button>
        )}
      />

      <section className="pur-detail__card">
        <div className="pur-detail__form-grid">
          <FormField label="Mã KHMH" required>
            <select
              className="form-input form-input-md"
              value={planCode}
              disabled={plansLoading}
              onChange={e => selectPlan(e.target.value)}
              aria-label="Mã KHMH"
            >
              <option value="">{plansLoading ? 'Đang tải…' : 'Chọn KHMH'}</option>
              {plans.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.projectCode}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Nhà cung cấp (theo KHMH)" required>
            <select
              className="form-input form-input-md"
              value={supplierName}
              disabled={!planCode || planLoading}
              onChange={e => selectSupplier(e.target.value)}
              aria-label="Nhà cung cấp theo KHMH"
            >
              <option value="">{!planCode ? 'Chọn KHMH trước' : 'Chọn NCC'}</option>
              {suppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Dự án">
            <input
              className="form-input form-input-md"
              readOnly
              value={plan ? (plan.projectName ? `${plan.projectCode} — ${plan.projectName}` : plan.projectCode) : ''}
              aria-label="Dự án (tự lấy từ KHMH)"
            />
          </FormField>
          <FormField label="Ghi chú">
            <input
              className="form-input form-input-md"
              value={note}
              onChange={e => setNote(e.target.value)}
              aria-label="Ghi chú đơn hàng"
            />
          </FormField>
        </div>
        {planError ? (
          <p role="alert" className="pur-detail__alert">
            {getApiErrorMessage(planErr, 'Không tải được chi tiết KHMH.')}
          </p>
        ) : null}
        {supplierName && !matchedSupplier ? (
          <p role="alert" className="pur-detail__alert">
            Không đối chiếu được NCC với danh mục. Vào <strong>Nhà cung cấp → Nhà cung cấp</strong> để tạo NCC trùng tên và đặt hạn công nợ trước khi lưu PO.
          </p>
        ) : null}
        {matchedSupplier ? (
          <p className="pur-detail__muted">
            Điều khoản thanh toán: {matchedSupplier.maxDebtDays} ngày (theo danh mục NCC).
          </p>
        ) : (
          <p className="pur-detail__muted">
            Công nợ và điều khoản thanh toán hiển thị trên phiếu PO sau khi đối chiếu NCC master.
          </p>
        )}
      </section>

      <section className="pur-detail__card">
        <h2 className="purchasing-section-title">
          Mặt hàng {supplierName ? `- ${supplierName}` : ''}
        </h2>
        {!planCode ? (
          <EmptyState message="Chọn mã KHMH để xem mặt hàng." />
        ) : planLoading ? (
          <table className="pur-erp__table"><tbody><TableSkeletonRows rows={5} colSpan={4} /></tbody></table>
        ) : !supplierName ? (
          <EmptyState message="Chọn nhà cung cấp. Đổi NCC sẽ xóa lựa chọn dòng hiện tại." />
        ) : supplierLines.length === 0 ? (
          <EmptyState message="Không còn dòng hàng khả dụng cho NCC này." />
        ) : (
          <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
            <table className="pur-erp__table">
              <thead>
                <tr>
                  <th className="pur-erp__th-check">Chọn</th>
                  <th>Hệ</th>
                  <th>Danh mục</th>
                  <th>Tên hàng</th>
                  <th>Quy cách</th>
                  <th>ĐVT</th>
                  <th className="pur-erp__th-num">Còn lại</th>
                  <th className="pur-erp__th-num">SL đặt</th>
                  <th className="pur-erp__th-num">Đơn giá</th>
                </tr>
              </thead>
              <tbody>
                {supplierLines.map(line => {
                  const checked = selectedLineIds.includes(line.id);
                  return (
                    <tr key={line.id} className={checked ? 'is-selected' : undefined}>
                      <td className="pur-erp__td-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => toggleLine(line.id, e.target.checked)}
                          aria-label={`Chọn ${line.productName}`}
                        />
                      </td>
                      <td>{line.systemName || '—'}</td>
                      <td>{line.category || '—'}</td>
                      <td>{line.productName}</td>
                      <td>{line.spec || '—'}</td>
                      <td>{line.unit || '—'}</td>
                      <td className="pur-erp__td-num">{line.remainingOrderableQty}</td>
                      <td className="pur-erp__td-num">
                        <input
                          className="pur-erp__planing-input"
                          inputMode="decimal"
                          disabled={!checked}
                          value={qtyByLine[line.id] ?? ''}
                          onChange={e => setQtyByLine(prev => ({ ...prev, [line.id]: e.target.value }))}
                          aria-label={`Số lượng đặt ${line.productName}`}
                        />
                      </td>
                      <td className="pur-erp__td-num">{formatCurrency(unitPriceOf(line))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
