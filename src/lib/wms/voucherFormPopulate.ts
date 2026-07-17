import type { Export, Import, Transfer } from '../../types';
import {
  emptyQtyLine,
  emptyQtyPhaseLine,
  emptyQtyPriceLine,
  type MaterialQtyLine,
  type MaterialQtyPhaseLine,
  type MaterialQtyPriceLine,
} from '../../pages/warehouse/voucher/voucherFormTypes';

export function importToFormLines(items: Import['items']): MaterialQtyPriceLine[] {
  if (!items.length) return [{ ...emptyQtyPriceLine }];
  return items.map(it => ({
    materialCode: it.sku || it.productId,
    qty: String(it.qty),
    unitPrice: String(it.unitPrice ?? 0),
  }));
}

export function exportToFormLines(items: Export['items']): MaterialQtyLine[] {
  if (!items.length) return [{ ...emptyQtyLine }];
  return items.map(it => ({
    materialCode: it.sku || it.productId,
    qty: String(it.qty),
  }));
}

export function transferToFormLines(items: Transfer['items']): MaterialQtyPhaseLine[] {
  if (!items.length) return [{ ...emptyQtyPhaseLine }];
  return items.map(it => ({
    materialCode: it.sku || it.productId,
    qty: String(it.qty),
    constructionPhase: typeof it.constructionPhase === 'string' ? it.constructionPhase : '',
  }));
}
