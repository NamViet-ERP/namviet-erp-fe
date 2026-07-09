import type { Stocktake } from '../../types';

export type FrozenProjectInfo = {
  projectCode: string;
  voucherCode: string;
  warehouseName: string;
};

export type FrozenProjectMap = Map<string, FrozenProjectInfo>;

export function buildFrozenProjectMap(stocktakes: Stocktake[]): FrozenProjectMap {
  const map: FrozenProjectMap = new Map();
  for (const stocktake of stocktakes) {
    if (!stocktake.isFrozen || stocktake.status !== 'pending') continue;
    const code = stocktake.warehouseId?.trim();
    if (!code) continue;
    map.set(code.toLowerCase(), {
      projectCode: code,
      voucherCode: stocktake.voucherCode,
      warehouseName: stocktake.warehouseName?.trim() || code,
    });
  }
  return map;
}

export function isProjectFrozen(map: FrozenProjectMap, projectCode: string): boolean {
  const code = projectCode.trim();
  if (!code) return false;
  return map.has(code.toLowerCase());
}

export function getFrozenProjectInfo(
  map: FrozenProjectMap,
  projectCode: string,
): FrozenProjectInfo | undefined {
  const code = projectCode.trim();
  if (!code) return undefined;
  return map.get(code.toLowerCase());
}

export function formatFrozenProjectMessage(info: FrozenProjectInfo): string {
  return (
    `Kho dự án ${info.warehouseName} đang đóng băng kiểm kê (phiếu ${info.voucherCode}). ` +
    'Hãy mở băng hoặc duyệt/hủy phiếu kiểm kê trước khi nhập, xuất, chuyển hoặc hoàn trả vật tư.'
  );
}

export function getFrozenProjectError(
  map: FrozenProjectMap | undefined,
  projectCode: string,
): string | undefined {
  if (!map) return undefined;
  const info = getFrozenProjectInfo(map, projectCode);
  return info ? formatFrozenProjectMessage(info) : undefined;
}
