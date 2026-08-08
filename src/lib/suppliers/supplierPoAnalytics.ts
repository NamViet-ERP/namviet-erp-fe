import type { PurchaseOrderApiDto, PurchaseOrderDetailApiDto } from '../../types/api/purchasingApi';
import type { SupplierApiDto } from '../../types/wms';

export interface SupplierSpendRow {
  supplierId: number | null;
  supplierCode: string;
  supplierName: string;
  poCount: number;
  totalAmount: number;
  sharePercent: number;
}

export interface SupplierPriceHistoryRow {
  id: string;
  orderDate: string;
  materialCode: string;
  materialName: string;
  supplierName: string;
  unitPrice: number;
  poCode: string;
  projectCode: string;
}

function supplierKey(order: Pick<PurchaseOrderApiDto, 'supplierId' | 'supplierName'>): string {
  if (order.supplierId != null) return `id:${order.supplierId}`;
  return `name:${(order.supplierName ?? '').trim().toLowerCase()}`;
}

/** Tổng hợp số PO + tổng giá trị theo NCC (kèm NCC chưa có PO). */
export function buildSupplierSpendRows(
  suppliers: SupplierApiDto[],
  orders: PurchaseOrderApiDto[],
): { rows: SupplierSpendRow[]; grandTotal: number } {
  const byKey = new Map<
    string,
    { supplierId: number | null; supplierCode: string; supplierName: string; poCount: number; totalAmount: number }
  >();

  for (const s of suppliers) {
    byKey.set(`id:${s.id}`, {
      supplierId: s.id,
      supplierCode: s.supplierCode,
      supplierName: s.supplierName,
      poCount: 0,
      totalAmount: 0,
    });
  }

  for (const order of orders) {
    const key = supplierKey(order);
    const existing = byKey.get(key);
    if (existing) {
      existing.poCount += 1;
      existing.totalAmount += order.totalAmount ?? 0;
    } else {
      byKey.set(key, {
        supplierId: order.supplierId ?? null,
        supplierCode: order.supplierId != null ? `NCC-${order.supplierId}` : '—',
        supplierName: order.supplierName?.trim() || '—',
        poCount: 1,
        totalAmount: order.totalAmount ?? 0,
      });
    }
  }

  const grandTotal = [...byKey.values()].reduce((sum, r) => sum + r.totalAmount, 0);
  const rows = [...byKey.values()]
    .map(r => ({
      ...r,
      sharePercent: grandTotal > 0 ? Math.round((r.totalAmount / grandTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount || a.supplierName.localeCompare(b.supplierName, 'vi'));

  return { rows, grandTotal };
}

/** Mỗi dòng = đơn giá (poPrice) của 1 vật tư trên 1 PO. */
export function buildSupplierPriceHistoryRows(
  details: PurchaseOrderDetailApiDto[],
): SupplierPriceHistoryRow[] {
  const rows: SupplierPriceHistoryRow[] = [];
  for (const po of details) {
    for (const line of po.lines ?? []) {
      rows.push({
        id: `${po.code}-${line.id}`,
        orderDate: po.orderDate || po.createdAt,
        materialCode: (line.materialCode || line.sku || '').trim() || '—',
        materialName: line.name?.trim() || '—',
        supplierName: po.supplierName?.trim() || '—',
        unitPrice: line.poPrice ?? 0,
        poCode: po.code,
        projectCode: (po.projectCode ?? '').trim() || '—',
      });
    }
  }
  return rows.sort((a, b) => b.orderDate.localeCompare(a.orderDate) || b.poCode.localeCompare(a.poCode));
}
