/** UI-only purchasing domain types + demo seed (user asked). */

import { defaultPurchasingDocTypes } from '../constants/purchasingDocTypes';

export type PurchasingTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
export type OrderChannel = 'domestic' | 'international';
export type OrderKind = 'standard' | 'extra';
export type PlanScope = 'machine' | 'parts';
export type PayStatus = 'unpaid' | 'partial' | 'paid';
export type ReceiveStatus = 'none' | 'partial' | 'full';
export type InvoiceKind = '' | 'tax' | 'retail';

export interface PurchasingSupplier {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: string;
  rating: string;
  status: string;
  statusTone: PurchasingTone;
}

export interface PurchasePlanRow {
  id: string;
  code: string;
  scope: PlanScope;
  project: string;
  itemCode: string;
  item: string;
  itemType: string;
  category: string;
  horsepower: string;
  minQty: string;
  qty: string;
  stockQty: string;
  forecastAvailable: string;
  forecastOutbound: string;
  /** Tab Sản xuất — modal dự kiến có hàng */
  forecastProduction: { commandNo: string; model: string; qty: string; date: string }[];
  /** Tab Mua hàng — modal dự kiến có hàng */
  forecastPurchase: { orderCode: string; orderDate: string; qty: string; expectedDate: string }[];
  stockDetail: { warehouse: string; qty: string }[];
  /** Modal xuất hàng — nhóm đóng/mở kiểu ERP */
  outboundGroups: {
    key: string;
    label: string;
    total: string;
    columns: string[];
    rows: string[][];
  }[];
  /** Modal báo giá > 70% */
  quoteDetail: { date: string; customer: string; quoteCode: string; qty: string }[];
  planning: string;
  quoteOver70: string;
  needBy: string;
  orderBy: string;
  owner: string;
  status: string;
  statusTone: PurchasingTone;
  requestedQty: string;
  remainingQty: string;
  requestId: string | null;
  requestCode: string | null;
}

/** Dòng hàng trong phiếu YCMH (ERP createPurchase). */
export interface PurchaseRequestLine {
  id: string;
  planId: string | null;
  planCode: string | null;
  itemCode: string;
  itemName: string;
  itemType: string;
  unit: string;
  stockQty: string;
  qty: number;
  note: string;
}

export interface PurchaseRequestRow {
  id: string;
  code: string;
  /** Tên phiếu — ERP: "Yêu cầu mua hàng (PR)" */
  title: string;
  project: string;
  item: string;
  requester: string;
  /** Người xác nhận (hiển thị dưới trạng thái) */
  confirmedBy: string;
  /** Ngày giờ chứng từ — ERP: dd/MM/yyyy HH:mm:ss */
  createdAt: string;
  itemCount: number;
  amount: string;
  note: string;
  status: string;
  statusTone: PurchasingTone;
  /** Ví dụ: "Đặt hàng đủ 1 đơn PO" / "Chưa đặt hàng" */
  orderStatusLabel: string;
  planId: string | null;
  planCode: string | null;
  orderId: string | null;
  orderCode: string | null;
  lines: PurchaseRequestLine[];
}

export interface PurchaseOrderLine {
  id: string;
  itemCode: string;
  itemName: string;
  qty: string;
  unit: string;
  unitPrice: string;
  /** Khuyến mãi — ERP line */
  promo: string;
  /** Thuế — ERP line */
  tax: string;
  amount: string;
}

/** Tiến độ logistics trên panel expand ERP (type ngoài nước; TN cũng hiện đủ bước). */
export type OrderShipStage =
  | 'producing'
  | 'loading'
  | 'shipping'
  | 'custom_trucking'
  | 'done';

export interface PurchaseOrderRow {
  id: string;
  code: string;
  channel: OrderChannel;
  kind: OrderKind;
  project: string;
  supplierId: string | null;
  supplier: string;
  orderedAt: string;
  eta: string;
  etd: string;
  etaPort: string;
  etw: string;
  poNumber: string;
  invoiceNo: string;
  buyCompany: string;
  /** Giá trị ngoại tệ / gốc — cột "Tổng giá trị" ERP */
  amountForeign: string;
  currency: string;
  /** Giá trị VNĐ — cột "Tổng giá trị VNĐ" */
  amount: string;
  status: string;
  statusTone: PurchasingTone;
  tracking: boolean;
  invoiceKind: InvoiceKind;
  payStatus: PayStatus;
  receiveStatus: ReceiveStatus;
  lines: PurchaseOrderLine[];
  requestId: string | null;
  requestCode: string | null;
  planId: string | null;
  planCode: string | null;
  deliveryId: string | null;
  paymentId: string | null;
  note: string;
  /** Người duyệt PO — cột Trạng thái ERP */
  approvedBy: string | null;
  /** Thời điểm duyệt — tooltip "Vào lúc: dd/MM/yyyy HH:mm:ss" */
  approvedAt: string | null;
  /** Bước logistics đã đạt (panel expand). */
  shipStage: OrderShipStage;
}

export interface DeliveryRow {
  id: string;
  poId: string;
  poCode: string;
  project: string;
  supplier: string;
  shipment: string;
  plannedDate: string;
  actualDate: string;
  progress: string;
  status: string;
  statusTone: PurchasingTone;
}

export interface PaymentRow {
  id: string;
  code: string;
  poId: string;
  poCode: string;
  supplier: string;
  invoiceNo: string;
  amount: string;
  dueDate: string;
  status: string;
  statusTone: PurchasingTone;
}

export interface DocumentRow {
  id: string;
  name: string;
  project: string;
  poId: string | null;
  poCode: string;
  supplier: string;
  docType: string;
  uploadedAt: string;
  status?: string;
  statusTone?: PurchasingTone;
}

export interface DocumentChecklistConfig {
  domestic: string[];
  international: string[];
}

export const DEFAULT_DOCUMENT_CHECKLIST: DocumentChecklistConfig = {
  domestic: ['Hợp đồng', 'BBGH', 'Hóa đơn'],
  international: ['Hợp đồng', 'Packing list', 'CO / CQ'],
};

export interface PurchasingState {
  suppliers: PurchasingSupplier[];
  plans: PurchasePlanRow[];
  requests: PurchaseRequestRow[];
  orders: PurchaseOrderRow[];
  deliveries: DeliveryRow[];
  payments: PaymentRow[];
  documents: DocumentRow[];
  docTypes: string[];
  documentChecklist: DocumentChecklistConfig;
}

export function createEmptyPurchasingState(): PurchasingState {
  return {
    suppliers: [],
    plans: [],
    requests: [],
    orders: [],
    deliveries: [],
    payments: [],
    documents: [],
    docTypes: defaultPurchasingDocTypes(),
    documentChecklist: {
      domestic: [...DEFAULT_DOCUMENT_CHECKLIST.domestic],
      international: [...DEFAULT_DOCUMENT_CHECKLIST.international],
    },
  };
}

export function orderKindLabel(kind: OrderKind): string {
  return kind === 'extra' ? 'Phát sinh' : 'Theo kế hoạch';
}

export function planScopeLabel(scope: PlanScope): string {
  return scope === 'machine' ? 'Máy' : 'Phụ tùng';
}

/** Parse dd/mm/yyyy → Date | null */
export function parseViDate(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Tab filter ERP — map row → có khớp tab không */
export function orderMatchesTab(row: PurchaseOrderRow, tab: string, today = new Date()): boolean {
  if (!tab) return true;
  const arrival = parseViDate(row.etw || row.eta);
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const daysTo = arrival ? Math.ceil((arrival.getTime() - start.getTime()) / 86400000) : null;

  switch (tab) {
    case 'Đang theo dõi':
      return row.tracking;
    case 'Hóa đơn thuế':
      return row.invoiceKind === 'tax';
    case 'Hóa đơn lẻ':
      return row.invoiceKind === 'retail';
    case 'Đã chi':
      return row.payStatus === 'paid';
    case 'Chi 1 phần':
      return row.payStatus === 'partial';
    case 'Chưa chi':
      return row.payStatus === 'unpaid';
    case 'Sắp đến hạn về':
      return daysTo !== null && daysTo >= 0 && daysTo <= 7 && row.receiveStatus !== 'full';
    case 'Trễ hạn về':
      return daysTo !== null && daysTo < 0 && row.receiveStatus !== 'full';
    case 'Chưa nhập hàng':
      return row.receiveStatus === 'none';
    case 'Nhập 1 phần':
      return row.receiveStatus === 'partial';
    case 'Nhập đủ':
      return row.receiveStatus === 'full';
    case 'Chờ xác nhận NCC':
    case 'Chờ LC':
      return row.status === tab;
    default:
      return row.status === tab;
  }
}

export function createPurchasingSeed(): PurchasingState {
  const suppliers: PurchasingSupplier[] = [
    {
      id: 's1', code: 'NCC-001', name: 'Công ty TNHH Điện Cơ Á Châu',
      contact: 'Nguyễn Văn Hùng', phone: '0903 111 222', email: 'hung@dca.vn',
      category: 'Thiết bị điện', rating: 'A', status: 'Đang hợp tác', statusTone: 'success',
    },
    {
      id: 's2', code: 'NCC-014', name: 'Vật tư Xây dựng Nam Sơn',
      contact: 'Trần Thị Lan', phone: '0912 333 444', email: 'lan@namson.vn',
      category: 'Vật tư', rating: 'B', status: 'Đang hợp tác', statusTone: 'success',
    },
    {
      id: 's3', code: 'NCC-028', name: 'Shanghai Power Equipment Co.',
      contact: 'Li Wei', phone: '+86 21 5555 0101', email: 'sales@spe.cn',
      category: 'Nhập khẩu', rating: 'A', status: 'Đang hợp tác', statusTone: 'success',
    },
  ];

  const plans: PurchasePlanRow[] = [
    {
      id: 'pl1', code: 'KH-2026-018', scope: 'machine', project: 'NV-Hospital Phase 2',
      itemCode: 'VRV-10HP', item: 'Máy lạnh VRV 10HP', itemType: 'Máy', category: 'Nhóm thành phẩm',
      horsepower: '10', minQty: '2', qty: '8', stockQty: '1',
      forecastAvailable: '3', forecastOutbound: '10',
      forecastProduction: [
        { commandNo: 'LSX-2607-012', model: 'VRV-10HP', qty: '2', date: '20/07/2026' },
      ],
      forecastPurchase: [
        { orderCode: 'PO-TN-2607-001', orderDate: '10/07/2026', qty: '1', expectedDate: '25/07/2026' },
      ],
      stockDetail: [
        { warehouse: 'Kho HCM', qty: '1' },
        { warehouse: 'Kho HN', qty: '0' },
      ],
      outboundGroups: [
        {
          key: 'hold', label: 'Giữ kho (3)', total: '4',
          columns: ['Kho hàng', 'Serial', 'Khách hàng', 'Nhân viên', 'Đơn hàng', 'Số lượng'],
          rows: [
            [
              'KHO ĐÃ BÁN (CHỜ XUẤT) - System(VT: SO-19032614705 )',
              '2610021106',
              'CÔNG TY CỔ PHẦN SẢN XUẤT VÀ ĐẦU TƯ ROYAL HOUSE',
              'Trịnh Hồng Muội KP',
              'SO-19032614705',
              '1',
            ],
            [
              'KHO ĐÃ BÁN (CHỜ XUẤT) - System(VT: SO-19032614706 )',
              '25090111200',
              'CÔNG TY TNHH CƠ KHÍ CHẾ TẠO THÀNH ĐẠT VN',
              'Chế Ngọc Cám',
              'SO-19032614706',
              '1',
            ],
            [
              'KHO ĐÃ BÁN (CHỜ XUẤT) - System(VT: SO-19032614707 )',
              '25060111202',
              'CÔNG TY TNHH TM MINH HOÀNG VIỆT NAM',
              'An Đỗ Hoàng',
              'SO-19032614707',
              '1',
            ],
            [
              'KHO ĐÃ BÁN (CHỜ XUẤT) - System(VT: SO-19032614708 )',
              '25060111203',
              'CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ XÂY DỰNG THÀNH NAM',
              'An Đỗ Hoàng',
              'SO-19032614708',
              '1',
            ],
          ],
        },
        {
          key: 'pre', label: 'Đặt hàng trước (4)', total: '6',
          columns: ['Nhân viên (Ngày)', 'Đơn hàng', 'Khách hàng', 'Số lượng'],
          rows: [
            [
              'An Đỗ Hoàng - 24/12/2025',
              'SO-24122513800',
              'CÔNG TY TNHH TM MINH HOÀNG VIỆT NAM',
              '2',
            ],
            [
              'Phan Thị Viên - 24/06/2026',
              'SO-26062415500',
              'CÔNG TY CỔ PHẦN SẢN XUẤT VÀ ĐẦU TƯ ROYAL HOUSE',
              '4',
            ],
          ],
        },
      ],
      quoteDetail: [
        { date: '05/07/2026 09:15:00', customer: 'Bệnh viện NV', quoteCode: 'BBG-260705001', qty: '3' },
        { date: '08/07/2026 14:20:00', customer: 'KCN Long Thành', quoteCode: 'BBG-260708002', qty: '2' },
      ],
      planning: '8', quoteOver70: '5', needBy: '10/08/2026', orderBy: '25/07/2026',
      owner: 'Nguyễn Cung Ứng', status: 'Chưa YCMH', statusTone: 'warning',
      requestedQty: '0', remainingQty: '8', requestId: null, requestCode: null,
    },
    {
      id: 'pl2', code: 'KH-2026-019', scope: 'machine', project: 'KCN Long Thành A',
      itemCode: 'MSB-2500', item: 'Tủ điện MSB 2500A', itemType: 'Máy', category: 'Nhóm thành phẩm',
      horsepower: '—', minQty: '1', qty: '2', stockQty: '0',
      forecastAvailable: '0', forecastOutbound: '0',
      forecastProduction: [],
      forecastPurchase: [
        { orderCode: 'PO-TN-2607-003', orderDate: '02/07/2026', qty: '2', expectedDate: '01/08/2026' },
      ],
      stockDetail: [{ warehouse: 'Kho HCM', qty: '0' }],
      outboundGroups: [],
      quoteDetail: [
        { date: '01/07/2026 10:00:00', customer: 'KCN Long Thành A', quoteCode: 'BBG-260701010', qty: '2' },
      ],
      planning: '2', quoteOver70: '2', needBy: '15/08/2026', orderBy: '28/07/2026',
      owner: 'Trần Thị Mua', status: 'YCMH 1 phần', statusTone: 'primary',
      requestedQty: '1', remainingQty: '1', requestId: 'pr1', requestCode: 'YCMH-2607-012',
    },
    {
      id: 'pl3', code: 'KH-2026-020', scope: 'parts', project: 'Resort Biển Đông',
      itemCode: 'CAB-XLPE-240', item: 'Cáp XLPE 3x240', itemType: 'Phụ tùng', category: 'Phụ tùng',
      horsepower: '—', minQty: '100', qty: '1200', stockQty: '80',
      forecastAvailable: '200', forecastOutbound: '50',
      forecastProduction: [],
      forecastPurchase: [
        { orderCode: 'PO-TN-2607-004', orderDate: '15/07/2026', qty: '120', expectedDate: '05/08/2026' },
      ],
      stockDetail: [
        { warehouse: 'Kho VT', qty: '50' },
        { warehouse: 'Kho Dự án', qty: '30' },
      ],
      outboundGroups: [
        {
          key: 'stock', label: 'Tồn kho (1)', total: '30',
          columns: ['Kho hàng', 'Số lượng'],
          rows: [['Kho Dự án', '30']],
        },
        {
          key: 'pre', label: 'Đặt hàng trước (1)', total: '20',
          columns: ['Nhân viên (Ngày)', 'Đơn hàng', 'Khách hàng', 'Số lượng'],
          rows: [['Lê Thị Kế - 10/07/2026', 'SO-PT-01', 'Resort Biển Đông', '20']],
        },
      ],
      quoteDetail: [
        { date: '12/06/2026 08:30:00', customer: 'Resort Biển Đông', quoteCode: 'BBG-260612020', qty: '500' },
        { date: '20/06/2026 11:00:00', customer: 'Resort Biển Đông', quoteCode: 'BBG-260620021', qty: '300' },
      ],
      planning: '1200', quoteOver70: '800', needBy: '01/09/2026', orderBy: '05/08/2026',
      owner: 'Lê Thị Kế', status: 'Đã YCMH đủ', statusTone: 'success',
      requestedQty: '1200', remainingQty: '0', requestId: 'pr2', requestCode: 'YCMH-2607-009',
    },
    {
      id: 'pl4', code: 'KH-2026-021', scope: 'parts', project: 'NV-Hospital Phase 2',
      itemCode: 'ONG-DN50', item: 'Ống thép đen Φ114', itemType: 'Vật tư', category: 'Nguyên liệu',
      horsepower: '—', minQty: '50', qty: '450', stockQty: '20',
      forecastAvailable: '40', forecastOutbound: '10',
      forecastProduction: [],
      forecastPurchase: [
        { orderCode: 'PO-TN-2607-005', orderDate: '18/07/2026', qty: '40', expectedDate: '12/08/2026' },
      ],
      stockDetail: [{ warehouse: 'Kho VT', qty: '20' }],
      outboundGroups: [
        {
          key: 'stock', label: 'Tồn kho (1)', total: '10',
          columns: ['Kho hàng', 'Số lượng'],
          rows: [['Kho VT', '10']],
        },
      ],
      quoteDetail: [],
      planning: '450', quoteOver70: '0', needBy: '22/08/2026', orderBy: '01/08/2026',
      owner: 'Nguyễn Cung Ứng', status: 'Chưa YCMH', statusTone: 'warning',
      requestedQty: '0', remainingQty: '450', requestId: null, requestCode: null,
    },
  ];

  const requests: PurchaseRequestRow[] = [
    {
      id: 'pr1', code: 'YCMH-2607-012', title: 'Yêu cầu mua hàng (PR)',
      project: 'KCN Long Thành A', item: 'Tủ điện MSB 2500A',
      requester: 'Kỹ thuật – An', confirmedBy: 'Kỹ thuật – An',
      createdAt: '08/07/2026 09:15:00', itemCount: 1, amount: '485.000.000', note: '',
      status: 'Đã Duyệt', statusTone: 'success', orderStatusLabel: 'Chưa đặt hàng',
      planId: 'pl2', planCode: 'KH-2026-019', orderId: null, orderCode: null,
      lines: [{
        id: 'pr1-l1', planId: 'pl2', planCode: 'KH-2026-019',
        itemCode: 'MSB-2500', itemName: 'Tủ điện MSB 2500A', itemType: 'Thành phẩm',
        unit: 'Máy', stockQty: '0', qty: 1, note: '',
      }],
    },
    {
      id: 'pr2', code: 'YCMH-2607-009', title: 'Yêu cầu mua hàng (PR)',
      project: 'Resort Biển Đông', item: 'Cáp XLPE 3x240',
      requester: 'Dự án – Bình', confirmedBy: 'Dự án – Bình',
      createdAt: '05/07/2026 14:20:53', itemCount: 12, amount: '1.120.000.000', note: '',
      status: 'Kết thúc', statusTone: 'danger', orderStatusLabel: 'Đặt hàng đủ 1 đơn PO',
      planId: 'pl3', planCode: 'KH-2026-020', orderId: 'po2', orderCode: 'PO-TN-2607-003',
      lines: [{
        id: 'pr2-l1', planId: 'pl3', planCode: 'KH-2026-020',
        itemCode: 'CAB-XLPE-240', itemName: 'Cáp XLPE 3x240', itemType: 'Nguyên liệu',
        unit: 'Mét', stockQty: '80', qty: 1200, note: '',
      }],
    },
    {
      id: 'pr3', code: 'YCMH-2605-004', title: 'Yêu cầu mua hàng (PR)',
      project: 'NV-Hospital Phase 2', item: 'Máy cắt nhập khẩu',
      requester: 'Kỹ thuật – An', confirmedBy: 'Kỹ thuật – An',
      createdAt: '12/05/2026 10:05:00', itemCount: 2, amount: '1.250.000.000', note: '',
      status: 'Đã Duyệt', statusTone: 'success', orderStatusLabel: 'Đặt hàng 1 phần 1 đơn PO',
      planId: null, planCode: null, orderId: 'poi1', orderCode: 'PO-TN-2605-004',
      lines: [{
        id: 'pr3-l1', planId: null, planCode: null,
        itemCode: 'MCB-IMP', itemName: 'Máy cắt nhập khẩu', itemType: 'Thành phẩm',
        unit: 'Máy', stockQty: '0', qty: 2, note: '',
      }],
    },
  ];

  const orders: PurchaseOrderRow[] = [
    {
      id: 'po2', code: 'PO-TN-2607-003', channel: 'domestic', kind: 'standard',
      project: 'Resort Biển Đông', supplierId: 's2', supplier: 'Vật tư Xây dựng Nam Sơn',
      orderedAt: '02/07/2026', eta: '18/07/2026', etd: '', etaPort: '', etw: '18/07/2026',
      poNumber: 'PO-NS-003', invoiceNo: '', buyCompany: 'CÔNG TY CP GIẢI PHÁP KỸ THUẬT NAM VIỆT',
      amountForeign: '890.000.000', currency: 'VNĐ', amount: '890.000.000',
      status: 'Chờ xác nhận NCC', statusTone: 'warning',
      tracking: true, invoiceKind: '', payStatus: 'unpaid', receiveStatus: 'none',
      shipStage: 'producing',
      lines: [
        {
          id: 'l1', itemCode: 'CAB-XLPE-240', itemName: 'Cáp XLPE 3x240', qty: '1200',
          unit: 'Mét', unitPrice: '741.667', promo: '0', tax: '0', amount: '890.000.000',
        },
      ],
      requestId: 'pr2', requestCode: 'YCMH-2607-009', planId: 'pl3', planCode: 'KH-2026-020',
      deliveryId: 'd4', paymentId: null, note: '',
      approvedBy: null, approvedAt: null,
    },
    {
      id: 'po3', code: 'PS-TN-2607-011', channel: 'domestic', kind: 'extra',
      project: 'NV-Hospital Phase 2', supplierId: 's1', supplier: 'Công ty TNHH Điện Cơ Á Châu',
      orderedAt: '10/07/2026', eta: '22/07/2026', etd: '', etaPort: '', etw: '22/07/2026',
      poNumber: 'PS-011', invoiceNo: 'HD-99102', buyCompany: 'CÔNG TY CP GIẢI PHÁP KỸ THUẬT NAM VIỆT',
      amountForeign: '45.000.000', currency: 'VNĐ', amount: '45.000.000',
      status: 'Đang giao', statusTone: 'primary',
      tracking: true, invoiceKind: 'tax', payStatus: 'partial', receiveStatus: 'partial',
      shipStage: 'shipping',
      lines: [
        {
          id: 'l2', itemCode: 'APT-MCB-63', itemName: 'Aptomat MCB 63A (phát sinh)', qty: '20',
          unit: 'Cái', unitPrice: '2.250.000', promo: '0', tax: '0', amount: '45.000.000',
        },
      ],
      requestId: null, requestCode: null, planId: null, planCode: null,
      deliveryId: null, paymentId: 'pay2', note: 'Phát sinh thay MCB tại tủ MSB tầng 3',
      approvedBy: 'Nguyễn Thị Ngộ Tranh', approvedAt: '15/07/2026 11:34:04',
    },
    {
      id: 'poi1', code: 'PO-TN-2605-004', channel: 'domestic', kind: 'standard',
      project: 'NV-Hospital Phase 2', supplierId: 's3', supplier: 'Shanghai Power Equipment Co.',
      orderedAt: '12/05/2026', eta: '30/08/2026', etd: '', etaPort: '', etw: '30/08/2026',
      poNumber: 'SPE-2605-004', invoiceNo: 'INV-CN-902', buyCompany: 'CÔNG TY CP GIẢI PHÁP KỸ THUẬT NAM VIỆT',
      amountForeign: '1.250.000.000', currency: 'VNĐ', amount: '1.250.000.000',
      status: 'Chờ xác nhận NCC', statusTone: 'warning',
      tracking: true, invoiceKind: 'tax', payStatus: 'partial', receiveStatus: 'none',
      shipStage: 'loading',
      lines: [
        {
          id: 'l3', itemCode: 'ACB-3200', itemName: 'Máy cắt ACB 3200A', qty: '2',
          unit: 'Máy', unitPrice: '625.000.000', promo: '0', tax: '0', amount: '1.250.000.000',
        },
      ],
      requestId: 'pr3', requestCode: 'YCMH-2605-004', planId: null, planCode: null,
      deliveryId: 'd3', paymentId: 'pay3', note: '',
      approvedBy: 'Nguyễn Thị Ngộ Tranh', approvedAt: '20/05/2026 09:12:30',
    },
    {
      id: 'poi2', code: 'PS-TN-2606-008', channel: 'domestic', kind: 'extra',
      project: 'KCN Long Thành A', supplierId: 's1', supplier: 'Công ty TNHH Điện Cơ Á Châu',
      orderedAt: '01/06/2026', eta: '10/07/2026', etd: '', etaPort: '', etw: '08/07/2026',
      poNumber: 'PS-008', invoiceNo: 'HD-88210', buyCompany: 'CÔNG TY CP GIẢI PHÁP KỸ THUẬT NAM VIỆT',
      amountForeign: '158.000.000', currency: 'VNĐ', amount: '158.000.000',
      status: 'Đã nhận đủ', statusTone: 'success',
      tracking: false, invoiceKind: 'retail', payStatus: 'paid', receiveStatus: 'full',
      shipStage: 'done',
      lines: [
        {
          id: 'l4', itemCode: 'SENSOR-PT', itemName: 'Cảm biến áp suất (phát sinh DA)', qty: '12',
          unit: 'Cái', unitPrice: '13.166.667', promo: '0', tax: '0', amount: '158.000.000',
        },
      ],
      requestId: null, requestCode: null, planId: null, planCode: null,
      deliveryId: null, paymentId: null, note: 'Phát sinh đo lường tuyến ống',
      approvedBy: 'Lê Yến Vy', approvedAt: '02/06/2026 14:20:11',
    },
  ];

  const deliveries: DeliveryRow[] = [
    {
      id: 'd4', poId: 'po2', poCode: 'PO-TN-2607-003', project: 'Resort Biển Đông',
      supplier: 'Vật tư Nam Sơn', shipment: 'Đợt 1/3', plannedDate: '12/07/2026',
      actualDate: '—', progress: '0/3', status: 'Trễ dự kiến', statusTone: 'danger',
    },
    {
      id: 'd3', poId: 'poi1', poCode: 'PO-TN-2605-004', project: 'NV-Hospital Phase 2',
      supplier: 'Shanghai Power', shipment: 'Đợt 1/1', plannedDate: '28/08/2026',
      actualDate: '—', progress: '0%', status: 'Sắp giao', statusTone: 'primary',
    },
  ];

  const payments: PaymentRow[] = [
    {
      id: 'pay2', code: 'DNTT-2607-030', poId: 'po3', poCode: 'PS-TN-2607-011',
      supplier: 'Điện Cơ Á Châu', invoiceNo: 'HD-99102', amount: '20.000.000',
      dueDate: '25/07/2026', status: 'Đã chi 1 phần', statusTone: 'warning',
    },
    {
      id: 'pay3', code: 'DNTT-2607-018', poId: 'poi1', poCode: 'PO-TN-2605-004',
      supplier: 'Shanghai Power Equipment', invoiceNo: 'INV-CN-902', amount: '375.000.000',
      dueDate: '15/07/2026', status: 'Sắp đến hạn', statusTone: 'danger',
    },
  ];

  return {
    suppliers,
    plans,
    requests,
    orders,
    deliveries,
    payments,
    documents: [],
    docTypes: defaultPurchasingDocTypes(),
    documentChecklist: {
      domestic: [...DEFAULT_DOCUMENT_CHECKLIST.domestic],
      international: [...DEFAULT_DOCUMENT_CHECKLIST.international],
    },
  };
}
