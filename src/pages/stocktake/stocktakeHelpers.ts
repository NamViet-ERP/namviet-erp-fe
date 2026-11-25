import { showToast } from '../../components/ui/Toast';
import { statusConfig } from '../../constants/statusConfig';
import { downloadCsv } from '../../lib/csvExport';
import { computeStocktakeDiff } from '../../lib/wms/stockQtyFormat';
import type { CreateStocktakeDto } from '../../services/stocktakesService';
import type { Material, Stocktake, StocktakeItem, TabItem } from '../../types';

export interface FormItem {
  materialCode: string;
  systemQty: string;
  actualQty: string;
  reason: string;
}

export interface StocktakeForm {
  projectCode: string;
  note: string;
  items: FormItem[];
}

export interface FormErrors {
  projectCode?: string;
  items?: string;
  [key: string]: string | undefined;
}

export const EMPTY_STOCKTAKE_FORM: StocktakeForm = {
  projectCode: '',
  note: '',
  items: [{ materialCode: '', systemQty: '', actualQty: '', reason: '' }],
};

export function createEmptyStocktakeForm(): StocktakeForm {
  return {
    projectCode: '',
    note: '',
    items: [{ materialCode: '', systemQty: '', actualQty: '', reason: '' }],
  };
}

export function diffTone(systemQty: number, actualQty: number): string {
  const diff = computeStocktakeDiff(systemQty, actualQty);
  if (Number.isNaN(diff)) return '';
  if (diff > 0) return 'text-[var(--md-success)]';
  if (diff < 0) return 'text-[var(--md-error)]';
  return 'text-[var(--md-on-surface-variant)]';
}

export function buildStocktakeItem(
  materialCode: string,
  systemQty: number,
  actualQty: number,
  materials: Material[],
  fallbackName?: string,
  reason?: string,
): StocktakeItem {
  const mat = materials.find(m => m.materialCode === materialCode);
  return {
    productId: materialCode,
    sku: materialCode,
    name: mat?.materialName ?? fallbackName ?? materialCode,
    systemQty,
    actualQty,
    diff: actualQty - systemQty,
    reason: reason?.trim() ? reason.trim() : undefined,
  };
}

export function validateStocktakeForm(form: StocktakeForm): FormErrors {
  const errs: FormErrors = {};
  if (!form.projectCode) errs.projectCode = 'Vui lòng chọn kho dự án kiểm kê';
  const validItems = form.items.filter(it => it.materialCode);
  if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 vật tư kiểm kê';
  const seen = new Set<string>();
  form.items.forEach((it, i) => {
    if (!it.materialCode) return;
    if (seen.has(it.materialCode)) {
      errs.items = `Vật tư ${it.materialCode} bị trùng lặp trong danh sách kiểm kê`;
    }
    seen.add(it.materialCode);
    if (it.systemQty === '' || Number(it.systemQty) < 0) {
      errs[`sysqty_${i}`] = 'Tồn hệ thống phải ≥ 0';
    }
    if (it.actualQty === '' || Number(it.actualQty) < 0) {
      errs[`actqty_${i}`] = 'Số đếm thực tế phải ≥ 0';
    }
  });
  return errs;
}

export function buildStocktakeCreateDto(
  form: StocktakeForm,
  warehouseName: string,
  materials: Material[],
  inventoryNameByCode: Map<string, string>,
): CreateStocktakeDto {
  const mappedItems = form.items
    .filter(it => it.materialCode)
    .map(it =>
      buildStocktakeItem(
        it.materialCode,
        Number(it.systemQty),
        Number(it.actualQty),
        materials,
        inventoryNameByCode.get(it.materialCode),
        it.reason,
      ),
    );

  return {
    date: new Date().toLocaleDateString('vi-VN'),
    status: 'pending',
    warehouseId: form.projectCode,
    warehouseName,
    condition: 'counting',
    isFrozen: true,
    note: form.note,
    items: mappedItems,
  };
}

export function buildStocktakeTabs(list: Stocktake[]): TabItem[] {
  return [
    { id: 'all', label: 'Tất cả', count: list.length },
    { id: 'approved', label: 'Đã duyệt', count: list.filter(s => s.status === 'approved').length },
    { id: 'pending', label: 'Chưa duyệt', count: list.filter(s => s.status === 'pending').length },
    { id: 'cancelled', label: 'Đã hủy', count: list.filter(s => s.status === 'cancelled').length },
  ];
}

export function filterStocktakes(list: Stocktake[], activeTab: string, search: string): Stocktake[] {
  let rows = activeTab === 'all' ? list : list.filter(s => s.status === activeTab);
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  rows = rows.filter(
    s =>
      s.voucherCode.toLowerCase().includes(q) ||
      s.createdBy.toLowerCase().includes(q) ||
      s.warehouseName.toLowerCase().includes(q) ||
      s.warehouseId.toLowerCase().includes(q),
  );
  return rows;
}

export function toStocktakeUpdateDto(
  item: Stocktake,
  patch: Partial<CreateStocktakeDto> = {},
): CreateStocktakeDto & { id: string } {
  return {
    id: item.id,
    voucherCode: item.voucherCode,
    date: item.date,
    createdBy: item.createdBy,
    status: item.status,
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseName,
    condition: item.condition,
    isFrozen: item.isFrozen,
    note: item.note ?? '',
    items: item.items,
    ...patch,
  };
}

export async function exportStocktakesCsv(rows: Stocktake[]): Promise<boolean> {
  if (rows.length === 0) {
    showToast('warning', 'Không có phiếu kiểm kê nào để xuất.');
    return false;
  }

  const fileName = `KiemKe_KhoDuAn_${new Date().toISOString().slice(0, 10)}.csv`;
  const ok = await downloadCsv(
    fileName,
    [
      'Ngày chứng từ',
      'Mã chứng từ',
      'Người tạo',
      'Trạng thái',
      'Mã kho dự án',
      'Kho dự án',
      'Tình trạng',
      'Đóng băng',
      'Số mặt hàng',
      'Ghi chú',
    ],
    rows.map(item => [
      item.date,
      item.voucherCode,
      item.createdBy,
      statusConfig[item.status]?.label ?? item.status,
      item.warehouseId,
      item.warehouseName,
      statusConfig[item.condition]?.label ?? item.condition,
      item.status === 'pending' ? (item.isFrozen ? 'Đóng băng' : 'Mở băng') : '—',
      String(item.items?.length ?? 0),
      item.note ?? '',
    ]),
  );

  if (ok) {
    showToast('success', `Đã xuất ${rows.length} phiếu kiểm kê ra CSV.`);
  }
  return ok;
}
