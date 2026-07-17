import { useSyncExternalStore } from 'react';
import {
  createPurchasingSeed,
  type DeliveryRow,
  type DocumentChecklistConfig,
  type DocumentRow,
  type OrderKind,
  type PaymentRow,
  type PlanScope,
  type PurchaseOrderLine,
  type PurchaseOrderRow,
  type PurchasePlanRow,
  type PurchaseRequestRow,
  type PurchasingState,
  type PurchasingSupplier,
} from '../../data/purchasingMock';
import { attachPurchasingDocumentBlob, buildMockPdfBlob } from './downloadPurchasingDocument';

/** Bảo toàn field chi tiết modal khi state cũ (HMR) thiếu mảng. */
function normalizePlan(p: PurchasePlanRow): PurchasePlanRow {
  return {
    ...p,
    forecastProduction: p.forecastProduction ?? [],
    forecastPurchase: p.forecastPurchase ?? [],
    stockDetail: p.stockDetail ?? [],
    outboundGroups: p.outboundGroups ?? [],
    quoteDetail: p.quoteDetail ?? [],
  };
}

function normalizeOrder(o: PurchaseOrderRow): PurchaseOrderRow {
  const shipStage = o.shipStage
    ?? (o.receiveStatus === 'full' ? 'done'
      : o.receiveStatus === 'partial' ? 'shipping'
        : 'producing');
  return {
    ...o,
    amountForeign: o.amountForeign ?? o.amount ?? '',
    currency: o.currency ?? 'VNĐ',
    etd: o.etd ?? '',
    etaPort: o.etaPort ?? '',
    etw: o.etw ?? o.eta ?? '',
    note: o.note ?? '',
    approvedBy: o.approvedBy ?? null,
    approvedAt: o.approvedAt ?? null,
    shipStage,
    lines: (o.lines ?? []).map(l => ({
      ...l,
      unit: l.unit ?? 'Cái',
      promo: l.promo ?? '0',
      tax: l.tax ?? '0',
    })),
  };
}

function withNormalizedState(s: PurchasingState): PurchasingState {
  return {
    ...s,
    plans: s.plans.map(normalizePlan),
    orders: s.orders.map(normalizeOrder),
  };
}

let state: PurchasingState = withNormalizedState(createPurchasingSeed());
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

function patch(next: PurchasingState) {
  state = withNormalizedState(next);
  emit();
}

export function getPurchasingState() {
  return state;
}

export function subscribePurchasing(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePurchasingStore(): PurchasingState {
  return useSyncExternalStore(subscribePurchasing, getPurchasingState, getPurchasingState);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function seqCode(prefix: string) {
  return `${prefix}-${String(Date.now()).slice(-4)}`;
}

function todayDisplay() {
  return new Date().toLocaleDateString('vi-VN');
}

function nowDisplayDateTime() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function planUnit(plan: PurchasePlanRow): string {
  if (plan.scope === 'machine' || plan.itemType === 'Máy') return 'Máy';
  if (plan.itemType === 'Vật tư') return 'Cái';
  return 'Cái';
}

function planItemTypeLabel(plan: PurchasePlanRow): string {
  if (plan.category === 'Nhóm thành phẩm' || plan.scope === 'machine') return 'Thành phẩm';
  return plan.category || plan.itemType;
}

/** ——— Mutations (workflow) ——— */

export function addSupplier(input: Omit<PurchasingSupplier, 'id' | 'status' | 'statusTone'>): PurchasingSupplier {
  const row: PurchasingSupplier = {
    ...input,
    id: uid('s'),
    status: 'Đang hợp tác',
    statusTone: 'success',
  };
  patch({ ...state, suppliers: [row, ...state.suppliers] });
  return row;
}

export function addPlan(input: {
  scope?: PlanScope;
  project: string;
  itemCode?: string;
  item: string;
  itemType?: string;
  category?: string;
  horsepower?: string;
  minQty?: string;
  qty: string;
  stockQty?: string;
  forecastAvailable?: string;
  forecastOutbound?: string;
  planning?: string;
  quoteOver70?: string;
  needBy: string;
  orderBy: string;
  owner: string;
}): PurchasePlanRow {
  const qty = input.qty.trim() || '1';
  const row: PurchasePlanRow = {
    id: uid('pl'),
    code: seqCode('KH-2026'),
    scope: input.scope ?? 'parts',
    project: input.project,
    itemCode: input.itemCode?.trim() || '—',
    item: input.item,
    itemType: input.itemType?.trim() || '',
    category: input.category?.trim() || '',
    horsepower: input.horsepower?.trim() || '—',
    minQty: input.minQty?.trim() || qty,
    qty,
    stockQty: input.stockQty?.trim() || '0',
    forecastAvailable: input.forecastAvailable?.trim() || '0',
    forecastOutbound: input.forecastOutbound?.trim() || '0',
    forecastProduction: [],
    forecastPurchase: [],
    stockDetail: input.stockQty ? [{ warehouse: 'Kho mặc định', qty: input.stockQty.trim() || '0' }] : [],
    outboundGroups: [],
    quoteDetail: [],
    planning: input.planning?.trim() || qty,
    quoteOver70: input.quoteOver70?.trim() || '0',
    needBy: input.needBy,
    orderBy: input.orderBy,
    owner: input.owner,
    status: 'Chưa YCMH',
    statusTone: 'warning',
    requestedQty: '0',
    remainingQty: qty,
    requestId: null,
    requestCode: null,
  };
  patch({ ...state, plans: [row, ...state.plans] });
  return row;
}

/** ERP: đổi số Planing trên bảng (input quantity). */
export function updatePlanPlanning(planId: string, planning: string): boolean {
  const raw = planning.trim();
  if (!state.plans.some(p => p.id === planId)) return false;
  patch({
    ...state,
    plans: state.plans.map(p => (p.id === planId ? { ...p, planning: raw || '0' } : p)),
  });
  return true;
}

export interface CreateYcmhLineInput {
  planId: string;
  qty: number;
  note: string;
}

export interface CreateYcmhFromPlansInput {
  title: string;
  note: string;
  createdAt?: string;
  requester?: string;
  lines: CreateYcmhLineInput[];
}

/** Một phiếu YCMH (nhiều dòng) từ kế hoạch đã chọn — giống ERP createPurchase. */
export function createYcmhFromPlans(input: CreateYcmhFromPlansInput): PurchaseRequestRow | null {
  const linesIn = input.lines.filter(l => l.qty > 0);
  if (linesIn.length === 0) return null;

  const planMap = new Map(state.plans.map(p => [p.id, p]));
  const resolved = linesIn
    .map(l => {
      const plan = planMap.get(l.planId);
      if (!plan) return null;
      const remaining = Math.max(0, Number(plan.remainingQty) || 0);
      if (remaining <= 0) return null;
      return { plan, qty: Math.min(l.qty, remaining), note: l.note.trim() };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  if (resolved.length === 0) return null;

  const first = resolved[0].plan;
  const requester = input.requester?.trim() || first.owner;
  const code = seqCode('YCMH-2607');
  const id = uid('pr');
  const lines = resolved.map(({ plan, qty, note }, i) => ({
    id: `${id}-l${i + 1}`,
    planId: plan.id,
    planCode: plan.code,
    itemCode: plan.itemCode,
    itemName: plan.item,
    itemType: planItemTypeLabel(plan),
    unit: planUnit(plan),
    stockQty: plan.stockQty,
    qty,
    note,
  }));

  const itemSummary = lines.length === 1
    ? lines[0].itemName
    : `${lines[0].itemName} (+${lines.length - 1})`;

  const row: PurchaseRequestRow = {
    id,
    code,
    title: input.title.trim() || 'Yêu cầu mua hàng (PR)',
    project: first.project,
    item: itemSummary,
    requester,
    confirmedBy: requester,
    createdAt: input.createdAt?.trim() || nowDisplayDateTime(),
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
    amount: '0',
    note: input.note.trim(),
    status: 'Đã Duyệt',
    statusTone: 'success',
    orderStatusLabel: 'Chưa đặt hàng',
    planId: first.id,
    planCode: first.code,
    orderId: null,
    orderCode: null,
    lines,
  };

  const qtyByPlan = new Map<string, number>();
  for (const { plan, qty } of resolved) {
    qtyByPlan.set(plan.id, (qtyByPlan.get(plan.id) ?? 0) + qty);
  }

  patch({
    ...state,
    requests: [row, ...state.requests],
    plans: state.plans.map(p => {
      const addQty = qtyByPlan.get(p.id);
      if (!addQty) return p;
      const nextRequested = (Number(p.requestedQty) || 0) + addQty;
      const nextRemaining = Math.max(0, (Number(p.remainingQty) || 0) - addQty);
      const fullyDone = nextRemaining <= 0;
      return {
        ...p,
        requestId: row.id,
        requestCode: row.code,
        status: fullyDone ? 'Đã YCMH đủ' : 'YCMH 1 phần',
        statusTone: fullyDone ? 'success' as const : 'primary' as const,
        requestedQty: String(nextRequested),
        remainingQty: String(nextRemaining),
      };
    }),
  });
  return row;
}

/** Kế hoạch → YCMH (1 dòng) — form standalone / prefill. */
export function createRequestFromPlan(
  planId: string,
  extras?: { requester?: string; amount?: string; itemCount?: number },
): PurchaseRequestRow | null {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return null;
  const remaining = Math.max(0, Number(plan.remainingQty) || 0);
  if (remaining <= 0) return state.requests.find(r => r.id === plan.requestId) ?? null;

  return createYcmhFromPlans({
    title: 'Yêu cầu mua hàng (PR)',
    note: '',
    requester: extras?.requester,
    lines: [{
      planId,
      qty: extras?.itemCount != null ? extras.itemCount : (remaining || 1),
      note: '',
    }],
  });
}

export function addStandaloneRequest(input: {
  project: string;
  item?: string;
  requester: string;
  itemCount: number;
  amount: string;
}): PurchaseRequestRow {
  const id = uid('pr');
  const itemName = input.item?.trim() || '—';
  const row: PurchaseRequestRow = {
    id,
    code: seqCode('YCMH-2607'),
    title: 'Yêu cầu mua hàng (PR)',
    project: input.project,
    item: itemName,
    requester: input.requester,
    confirmedBy: input.requester,
    createdAt: nowDisplayDateTime(),
    itemCount: input.itemCount,
    amount: input.amount,
    note: '',
    status: 'Chờ duyệt',
    statusTone: 'warning',
    orderStatusLabel: 'Chưa đặt hàng',
    planId: null,
    planCode: null,
    orderId: null,
    orderCode: null,
    lines: [{
      id: `${id}-l1`,
      planId: null,
      planCode: null,
      itemCode: '—',
      itemName,
      itemType: '—',
      unit: 'Cái',
      stockQty: '0',
      qty: input.itemCount,
      note: '',
    }],
  };
  patch({ ...state, requests: [row, ...state.requests] });
  return row;
}

export function approveRequest(requestId: string): boolean {
  const req = state.requests.find(r => r.id === requestId);
  if (!req) return false;
  if (req.status === 'Đã Duyệt' || req.status === 'Kết thúc') return true;
  if (req.status !== 'Chờ duyệt' && req.status !== 'Nháp') return false;
  patch({
    ...state,
    requests: state.requests.map(r => (
      r.id === requestId
        ? { ...r, status: 'Đã Duyệt', statusTone: 'success', confirmedBy: r.requester }
        : r
    )),
  });
  return true;
}

export interface UpdateYcmhRequestInput {
  title: string;
  note: string;
  createdAt: string;
  lines: {
    id: string;
    qty: number;
    note: string;
    planId?: string | null;
    planCode?: string | null;
    itemCode?: string;
    itemName?: string;
    itemType?: string;
    unit?: string;
    stockQty?: string;
  }[];
}

/** Cập nhật phiếu YCMH — ERP editPurchaseMachines. */
export function updateYcmhRequest(requestId: string, input: UpdateYcmhRequestInput): PurchaseRequestRow | null {
  const req = state.requests.find(r => r.id === requestId);
  if (!req) return null;

  const nextLines = input.lines
    .filter(l => l.qty > 0)
    .map(draft => {
      const existing = req.lines.find(l => l.id === draft.id);
      if (existing) {
        return { ...existing, qty: draft.qty, note: draft.note.trim() };
      }
      return {
        id: draft.id,
        planId: draft.planId ?? null,
        planCode: draft.planCode ?? null,
        itemCode: draft.itemCode?.trim() || '—',
        itemName: draft.itemName?.trim() || '—',
        itemType: draft.itemType?.trim() || 'Thành phẩm',
        unit: draft.unit?.trim() || 'Máy',
        stockQty: draft.stockQty?.trim() || '0',
        qty: draft.qty,
        note: draft.note.trim(),
      };
    });

  if (nextLines.length === 0) return null;

  const itemSummary = nextLines.length === 1
    ? nextLines[0].itemName
    : `${nextLines[0].itemName} (+${nextLines.length - 1})`;

  const updated: PurchaseRequestRow = {
    ...req,
    title: input.title.trim() || req.title,
    note: input.note.trim(),
    createdAt: input.createdAt.trim() || req.createdAt,
    item: itemSummary,
    itemCount: nextLines.reduce((s, l) => s + l.qty, 0),
    lines: nextLines,
  };

  patch({
    ...state,
    requests: state.requests.map(r => (r.id === requestId ? updated : r)),
  });
  return updated;
}

export { nowDisplayDateTime };

/** YCMH → PO (+ stub theo dõi giao) — chỉ đơn trong nước. */
export function createOrderFromRequest(
  requestId: string,
  extras: { supplier: string; supplierId?: string | null; orderedAt: string; eta: string; amount?: string },
): PurchaseOrderRow | null {
  let s = getPurchasingState();
  const req = s.requests.find(r => r.id === requestId);
  if (!req) return null;
  if (req.orderId) return s.orders.find(o => o.id === req.orderId) ?? null;

  if (req.status === 'Nháp' || req.status === 'Chờ duyệt') {
    approveRequest(requestId);
    s = getPurchasingState();
  }

  const latest = s.requests.find(r => r.id === requestId);
  if (!latest) return null;

  const deliveryId = uid('d');
  const row: PurchaseOrderRow = {
    id: uid('po'),
    code: seqCode('PO-2607'),
    channel: 'domestic',
    kind: 'standard',
    project: latest.project,
    supplierId: extras.supplierId ?? null,
    supplier: extras.supplier,
    orderedAt: extras.orderedAt,
    eta: extras.eta,
    amount: extras.amount?.trim() || latest.amount,
    status: 'Chờ xác nhận NCC',
    statusTone: 'warning',
    tracking: true,
    invoiceKind: '',
    payStatus: 'unpaid',
    receiveStatus: 'none',
    lines: [
      {
        id: uid('ol'),
        itemCode: '—',
        itemName: latest.item,
        qty: String(latest.itemCount),
        unit: 'Cái',
        unitPrice: '0',
        promo: '0',
        tax: '0',
        amount: extras.amount?.trim() || latest.amount,
      },
    ],
    requestId: latest.id,
    requestCode: latest.code,
    planId: latest.planId,
    planCode: latest.planCode,
    note: '',
    etd: '',
    etaPort: '',
    etw: extras.eta,
    poNumber: '',
    invoiceNo: '',
    buyCompany: '',
    amountForeign: extras.amount?.trim() || latest.amount,
    currency: 'VNĐ',
    shipStage: 'producing',
    deliveryId,
    paymentId: null,
    approvedBy: null,
    approvedAt: null,
  };

  const delivery: DeliveryRow = {
    id: deliveryId,
    poId: row.id,
    poCode: row.code,
    project: row.project,
    supplier: row.supplier,
    shipment: 'Đợt 1/1',
    plannedDate: row.eta,
    actualDate: '—',
    progress: '0%',
    status: 'Sắp giao',
    statusTone: 'primary',
  };

  patch({
    ...s,
    orders: [row, ...s.orders],
    deliveries: [delivery, ...s.deliveries],
    requests: s.requests.map(r => (
      r.id === requestId
        ? {
            ...r,
            status: 'Đã Duyệt',
            statusTone: 'success' as const,
            orderId: row.id,
            orderCode: row.code,
            orderStatusLabel: 'Đặt hàng đủ 1 đơn PO',
          }
        : r
    )),
  });
  return row;
}

export function addStandaloneOrder(input: {
  kind?: OrderKind;
  project: string;
  supplier: string;
  supplierId?: string | null;
  orderedAt: string;
  eta: string;
  etd?: string;
  etaPort?: string;
  etw?: string;
  poNumber?: string;
  invoiceNo?: string;
  buyCompany?: string;
  amount: string;
  note?: string;
  lines?: Omit<PurchaseOrderLine, 'id'>[];
}): PurchaseOrderRow {
  const kind = input.kind ?? 'standard';
  const prefix = kind === 'extra' ? 'PS-2607' : 'PO-2607';
  const lines: PurchaseOrderLine[] = (input.lines?.length
    ? input.lines
    : [{
        itemCode: '—', itemName: 'Hàng hóa', qty: '1', unit: 'Cái',
        unitPrice: '0', promo: '0', tax: '0', amount: input.amount,
      }]
  ).map(l => ({
    ...l,
    id: uid('ol'),
  }));
  const row: PurchaseOrderRow = {
    id: uid('po'),
    code: seqCode(prefix),
    channel: 'domestic',
    kind,
    project: input.project,
    supplier: input.supplier,
    supplierId: input.supplierId ?? null,
    orderedAt: input.orderedAt,
    eta: input.eta,
    etd: '',
    etaPort: '',
    etw: input.etw?.trim() || input.eta,
    poNumber: input.poNumber?.trim() || '',
    invoiceNo: input.invoiceNo?.trim() || '',
    buyCompany: input.buyCompany?.trim() || '',
    amountForeign: input.amount,
    currency: 'VNĐ',
    amount: input.amount,
    status: 'Chờ xác nhận NCC',
    statusTone: 'warning',
    tracking: true,
    invoiceKind: '',
    payStatus: 'unpaid',
    receiveStatus: 'none',
    shipStage: 'producing',
    lines,
    requestId: null,
    requestCode: null,
    planId: null,
    planCode: null,
    deliveryId: null,
    paymentId: null,
    note: input.note?.trim() || '',
    approvedBy: null,
    approvedAt: null,
  };
  const delivery: DeliveryRow = {
    id: uid('d'),
    poId: row.id,
    poCode: row.code,
    project: row.project,
    supplier: row.supplier,
    shipment: 'Đợt 1/1',
    plannedDate: row.eta,
    actualDate: '—',
    progress: '0%',
    status: 'Sắp giao',
    statusTone: 'primary',
  };
  row.deliveryId = delivery.id;
  patch({
    ...state,
    orders: [row, ...state.orders],
    deliveries: [delivery, ...state.deliveries],
  });
  return row;
}

/** Duyệt phiếu PO (UI — giống confirm ERP). */
export function approveOrder(orderId: string, by = 'System Admin'): boolean {
  const order = state.orders.find(o => o.id === orderId);
  if (!order || order.approvedBy?.trim()) return false;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const approvedAt = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  patch({
    ...state,
    orders: state.orders.map(o =>
      o.id === orderId ? { ...o, approvedBy: by, approvedAt } : o,
    ),
  });
  return true;
}

/** Cập nhật phiếu PO (Sửa phiếu — UI). */
export function updateOrder(
  orderId: string,
  patchFields: {
    supplier?: string;
    orderedAt?: string;
    eta?: string;
    etd?: string;
    etaPort?: string;
    etw?: string;
    poNumber?: string;
    invoiceNo?: string;
    buyCompany?: string;
    currency?: string;
    note?: string;
    amount?: string;
    amountForeign?: string;
    lines?: PurchaseOrderLine[];
  },
): PurchaseOrderRow | null {
  const idx = state.orders.findIndex(o => o.id === orderId);
  if (idx < 0) return null;
  const prev = state.orders[idx];
  const next: PurchaseOrderRow = {
    ...prev,
    ...patchFields,
    supplier: patchFields.supplier?.trim() ?? prev.supplier,
    poNumber: patchFields.poNumber?.trim() ?? prev.poNumber,
    invoiceNo: patchFields.invoiceNo?.trim() ?? prev.invoiceNo,
    buyCompany: patchFields.buyCompany?.trim() ?? prev.buyCompany,
    currency: patchFields.currency?.trim() || prev.currency,
    note: patchFields.note?.trim() ?? prev.note,
    lines: patchFields.lines ?? prev.lines,
  };
  const orders = [...state.orders];
  orders[idx] = next;
  patch({ ...state, orders });
  return next;
}

export function markDeliveryReceived(deliveryId: string): boolean {
  const delivery = state.deliveries.find(d => d.id === deliveryId);
  if (!delivery || delivery.status === 'Đã giao') return false;

  const doc: DocumentRow = {
    id: uid('doc'),
    name: `BBGH ${delivery.shipment} – ${delivery.poCode}.pdf`,
    project: delivery.project,
    poId: delivery.poId,
    poCode: delivery.poCode,
    supplier: delivery.supplier,
    docType: 'BBGH',
    uploadedAt: todayDisplay(),
  };
  attachPurchasingDocumentBlob(doc.id, buildMockPdfBlob(doc));

  patch({
    ...state,
    deliveries: state.deliveries.map(d => (
      d.id === deliveryId
        ? { ...d, status: 'Đã giao', statusTone: 'success', actualDate: todayDisplay(), progress: '100%' }
        : d
    )),
    orders: state.orders.map(o => (
      o.id === delivery.poId
        ? { ...o, status: 'Đã nhận đủ', statusTone: 'success' }
        : o
    )),
    documents: [doc, ...state.documents],
  });
  return true;
}

/** PO đã nhận → DNTT */
export function createPaymentFromOrder(
  orderId: string,
  extras?: { invoiceNo?: string; dueDate?: string; amount?: string },
): PaymentRow | null {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return null;
  if (order.paymentId) return state.payments.find(p => p.id === order.paymentId) ?? null;

  const row: PaymentRow = {
    id: uid('pay'),
    code: seqCode('DNTT-2607'),
    poId: order.id,
    poCode: order.code,
    supplier: order.supplier,
    invoiceNo: extras?.invoiceNo?.trim() || '—',
    amount: extras?.amount?.trim() || order.amount,
    dueDate: extras?.dueDate || order.eta,
    status: 'Nháp',
    statusTone: 'neutral',
  };

  patch({
    ...state,
    payments: [row, ...state.payments],
    orders: state.orders.map(o => (o.id === orderId ? { ...o, paymentId: row.id } : o)),
  });
  return row;
}

export function addDocument(
  input: Omit<DocumentRow, 'id' | 'uploadedAt' | 'status' | 'statusTone'>,
  file?: Blob | null,
): DocumentRow {
  const row: DocumentRow = {
    ...input,
    id: uid('doc'),
    uploadedAt: todayDisplay(),
  };
  attachPurchasingDocumentBlob(row.id, file ?? buildMockPdfBlob(row));
  patch({ ...state, documents: [row, ...state.documents] });
  return row;
}

/** User sửa checklist trên màn Thiết lập. */
export function updateDocumentChecklist(next: Partial<DocumentChecklistConfig>) {
  const s = getPurchasingState();
  patch({
    ...s,
    documentChecklist: {
      domestic: next.domestic ?? s.documentChecklist.domestic,
      international: next.international ?? s.documentChecklist.international,
    },
  });
}

/** Thêm loại giấy tờ vào danh mục (Thiết lập). Chỉ thêm tên — chưa bắt buộc. */
export function addPurchasingDocType(rawLabel: string): { ok: true; label: string } | { ok: false; reason: string } {
  const label = rawLabel.trim().replace(/\s+/g, ' ');
  if (!label) return { ok: false, reason: 'Nhập tên loại giấy tờ.' };
  if (label.length > 40) return { ok: false, reason: 'Tên tối đa 40 ký tự.' };

  const s = getPurchasingState();
  const exists = s.docTypes.some(t => t.toLowerCase() === label.toLowerCase());
  if (exists) return { ok: false, reason: 'Loại này đã có trong danh sách.' };

  patch({ ...s, docTypes: [...s.docTypes, label] });
  return { ok: true, label };
}

/** Đổi tên loại giấy tờ (cập nhật danh mục + checklist). */
export function renamePurchasingDocType(
  fromLabel: string,
  rawTo: string,
): { ok: true; label: string } | { ok: false; reason: string } {
  const to = rawTo.trim().replace(/\s+/g, ' ');
  if (!to) return { ok: false, reason: 'Nhập tên mới.' };
  if (to.length > 40) return { ok: false, reason: 'Tên tối đa 40 ký tự.' };

  const s = getPurchasingState();
  if (!s.docTypes.includes(fromLabel)) {
    return { ok: false, reason: 'Không tìm thấy loại này.' };
  }
  if (to.toLowerCase() !== fromLabel.toLowerCase()
    && s.docTypes.some(t => t.toLowerCase() === to.toLowerCase())) {
    return { ok: false, reason: 'Tên mới trùng loại khác.' };
  }

  const mapName = (t: string) => (t === fromLabel ? to : t);
  patch({
    ...s,
    docTypes: s.docTypes.map(mapName),
    documentChecklist: {
      domestic: s.documentChecklist.domestic.map(mapName),
      international: s.documentChecklist.international.map(mapName),
    },
  });
  return { ok: true, label: to };
}

/** Xóa loại khỏi danh mục (+ gỡ khỏi checklist). */
export function removePurchasingDocType(label: string): { ok: true } | { ok: false; reason: string } {
  const s = getPurchasingState();
  if (!s.docTypes.includes(label)) {
    return { ok: false, reason: 'Không tìm thấy loại này.' };
  }
  if (s.docTypes.length <= 1) {
    return { ok: false, reason: 'Phải giữ ít nhất một loại giấy tờ.' };
  }
  patch({
    ...s,
    docTypes: s.docTypes.filter(t => t !== label),
    documentChecklist: {
      domestic: s.documentChecklist.domestic.filter(t => t !== label),
      international: s.documentChecklist.international.filter(t => t !== label),
    },
  });
  return { ok: true };
}

/** Lưu cấu hình giấy tờ bắt buộc cho PO. */
export function savePurchasingDocSettings(input: {
  domestic: string[];
  /** Giữ API cũ — đồng bộ với domestic nếu không truyền. */
  international?: string[];
}): { ok: true } | { ok: false; reason: string } {
  if (input.domestic.length === 0) {
    return { ok: false, reason: 'Cần ít nhất một giấy tờ bắt buộc.' };
  }
  const required = input.domestic;
  updateDocumentChecklist({
    domestic: required,
    international: input.international?.length ? input.international : required,
  });
  return { ok: true };
}

export function selectDashboard(s: PurchasingState) {
  const openPlans = s.plans.filter(p => p.status === 'Chưa YCMH' || p.status === 'YCMH 1 phần').length;
  const openOrders = s.orders.filter(o => o.status !== 'Đã nhận đủ').length;
  const extraOrders = s.orders.filter(o => o.kind === 'extra').length;
  const waitingConfirm = s.orders.filter(o => o.status === 'Chờ xác nhận NCC').length;

  const alerts: { id: string; text: string; tone: 'danger' | 'warning' }[] = [];
  for (const p of s.plans) {
    if (p.status === 'Chưa YCMH') {
      alerts.push({ id: `al-plan-${p.id}`, text: `${p.code} chưa YCMH — ${p.project} / ${p.item}`, tone: 'warning' });
    }
  }
  for (const o of s.orders) {
    if (o.status === 'Chờ xác nhận NCC' || o.status === 'Chờ LC') {
      alerts.push({ id: `al-po-${o.id}`, text: `${o.code} chờ xử lý`, tone: 'warning' });
    }
  }

  return {
    stats: [
      { id: 'st1', label: 'Kế hoạch mở', value: openPlans, hint: 'Chưa / YCMH 1 phần', tone: 'warning' as const },
      { id: 'st2', label: 'Đơn đang mở', value: openOrders, hint: 'Chưa nhận đủ', tone: 'primary' as const },
      { id: 'st3', label: 'Phiếu phát sinh', value: extraOrders, hint: 'Gắn dự án', tone: 'neutral' as const },
      { id: 'st4', label: 'Chờ NCC xác nhận', value: waitingConfirm, hint: 'Cần theo dõi', tone: 'primary' as const },
    ],
    alerts,
    recentOrders: s.orders.slice(0, 5),
  };
}
