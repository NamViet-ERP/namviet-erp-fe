import { priceBooksService } from '../../services/priceBooksService';

export async function suggestImportUnitPrice(
  materialCode: string,
  supplierId: number | undefined,
): Promise<number | null> {
  if (!materialCode || !supplierId) return null;
  try {
    const lookup = await priceBooksService.lookup(materialCode, supplierId);
    return lookup.unitPrice > 0 ? lookup.unitPrice : null;
  } catch {
    return null;
  }
}
