export const DUPLICATE_MATERIAL_MESSAGE =
  'Vật tư này đã có trong phiếu. Vui lòng sửa số lượng ở dòng hiện có.';

export function findDuplicateMaterialLineIndex(
  items: ReadonlyArray<{ materialCode: string }>,
  materialCode: string,
  excludeIndex: number,
): number | null {
  const code = materialCode.trim();
  if (!code) return null;

  const normalized = code.toLowerCase();
  for (let i = 0; i < items.length; i += 1) {
    if (i === excludeIndex) continue;
    if (items[i].materialCode.trim().toLowerCase() === normalized) return i;
  }
  return null;
}

/** Lỗi trùng mã trên các dòng sau (dòng đầu tiên giữ nguyên). */
export function getDuplicateMaterialLineErrors(
  items: ReadonlyArray<{ materialCode: string }>,
): Record<number, { materialCode: string }> {
  const firstIndexByCode = new Map<string, number>();
  const errors: Record<number, { materialCode: string }> = {};

  items.forEach((line, idx) => {
    const code = line.materialCode.trim();
    if (!code) return;

    const key = code.toLowerCase();
    const firstIdx = firstIndexByCode.get(key);
    if (firstIdx === undefined) {
      firstIndexByCode.set(key, idx);
      return;
    }
    errors[idx] = { materialCode: DUPLICATE_MATERIAL_MESSAGE };
  });

  return errors;
}

export function hasDuplicateMaterialLines(
  items: ReadonlyArray<{ materialCode: string }>,
): boolean {
  return Object.keys(getDuplicateMaterialLineErrors(items)).length > 0;
}
