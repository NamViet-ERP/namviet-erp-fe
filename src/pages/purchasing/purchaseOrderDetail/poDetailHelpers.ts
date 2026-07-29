import type { PurchasePlanLineApiDto } from '../../../types/api/purchasingApi';

export function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function supplierOf(line: PurchasePlanLineApiDto): string {
  return (
    line.selectedSupplierName
    || line.purchaseSupplierName
    || line.proposalSupplierName
    || ''
  ).trim();
}

export function unitPriceOf(line: PurchasePlanLineApiDto): number {
  return line.selectedUnitPrice ?? line.purchaseUnitPrice ?? line.proposalUnitPrice ?? 0;
}
