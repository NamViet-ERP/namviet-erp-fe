import { purchaseOrdersService } from './purchaseOrdersService';
import { suppliersService } from './suppliersService';
import {
  buildSupplierPriceHistoryRows,
  buildSupplierSpendRows,
  type SupplierPriceHistoryRow,
  type SupplierSpendRow,
} from '../lib/suppliers/supplierPoAnalytics';
import type { PurchaseOrderApiDto, PurchaseOrderDetailApiDto } from '../types/api/purchasingApi';

const PAGE_SIZE = 100;

async function listAllPurchaseOrders(): Promise<PurchaseOrderApiDto[]> {
  const first = await purchaseOrdersService.list({ page: 1, pageSize: PAGE_SIZE });
  const items = [...first.items];
  const totalPages = Math.max(1, first.totalPages || 1);
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await purchaseOrdersService.list({ page, pageSize: PAGE_SIZE });
    items.push(...next.items);
  }
  return items;
}

async function loadOrderDetails(codes: string[]): Promise<PurchaseOrderDetailApiDto[]> {
  const unique = [...new Set(codes.filter(Boolean))];
  const chunkSize = 8;
  const details: PurchaseOrderDetailApiDto[] = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const part = await Promise.all(chunk.map(code => purchaseOrdersService.getByCode(code)));
    details.push(...part);
  }
  return details;
}

export const supplierPoAnalyticsService = {
  async getSpend(): Promise<{ rows: SupplierSpendRow[]; grandTotal: number }> {
    const [suppliersPage, orders] = await Promise.all([
      suppliersService.list({ page: 1, pageSize: 500 }),
      listAllPurchaseOrders(),
    ]);
    return buildSupplierSpendRows(suppliersPage.items, orders);
  },

  async getPriceHistory(): Promise<SupplierPriceHistoryRow[]> {
    const orders = await listAllPurchaseOrders();
    if (orders.length === 0) return [];
    const details = await loadOrderDetails(orders.map(o => o.code));
    return buildSupplierPriceHistoryRows(details);
  },
};
