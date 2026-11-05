import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../auth/AuthProvider';

export interface CategoryMarkupItem {
  id: string;
  name: string;
  percent: number;
  note?: string;
}

export interface MarkupSettingsConfig {
  globalMarkupPercent: number;
  categories: CategoryMarkupItem[];
  itemOverrides?: Record<string, number>;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_MARKUP_CATEGORIES: CategoryMarkupItem[] = [
  { id: 'HE_THEP', name: 'Hệ ống thép & phụ kiện hàn', percent: 12, note: 'Tỷ trọng lớn, cạnh tranh cao' },
  { id: 'HE_VAN', name: 'Hệ van công nghiệp & phụ kiện mặt bích', percent: 15, note: 'Van cơ, van điều khiển, khớp nối' },
  { id: 'HE_BOM', name: 'Hệ máy bơm & tủ điện điều khiển', percent: 18, note: 'Bơm cứu hỏa, bơm cấp nước, biến tần' },
  { id: 'PCCC', name: 'Hệ thiết bị PCCC & báo cháy tự động', percent: 15, note: 'Đầu phun, cuộn vòi, tủ trung tâm' },
  { id: 'DIEN_LANH', name: 'Hệ điều hòa Chiller & thông gió VRV', percent: 16, note: 'Ống gió, miệng gió, bảo ôn' },
  { id: 'VAT_TU_PHU', name: 'Vật tư phụ, bu lông neo, que hàn & giá đỡ', percent: 20, note: 'Hao hụt thi công công trường' },
  { id: 'NHAN_CONG', name: 'Chi phí nhân công thi công & lắp đặt thầu phụ', percent: 25, note: 'Quản lý nhân công khoán' },
  { id: 'VAN_CHUYEN', name: 'Chi phí cẩu tháp, vận chuyển & bốc xếp', percent: 10, note: 'Logistics vật tư nặng' },
  { id: 'KHAC', name: 'Vật tư & dịch vụ kỹ thuật khác', percent: 15, note: 'Dự phòng rủi ro biến động giá' },
];

const STORAGE_KEY = 'mayzer_boss_markup_settings';
const MARKUP_CHANGED_EVENT = 'nv-markup-settings-changed';

export function readStoredMarkupConfig(): MarkupSettingsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MarkupSettingsConfig;
      if (typeof parsed?.globalMarkupPercent === 'number' && Array.isArray(parsed?.categories)) {
        return {
          ...parsed,
          itemOverrides: parsed.itemOverrides || {},
        };
      }
    }
  } catch {
    /* fallback default */
  }
  return {
    globalMarkupPercent: 15,
    categories: DEFAULT_MARKUP_CATEGORIES,
    itemOverrides: {},
    updatedAt: new Date().toISOString(),
    updatedBy: 'Hệ thống (Mặc định)',
  };
}

export function useMarkupSettings() {
  const { user } = useSession();
  const [config, setConfig] = useState<MarkupSettingsConfig>(readStoredMarkupConfig);

  const refresh = useCallback(() => {
    setConfig(readStoredMarkupConfig());
  }, []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(MARKUP_CHANGED_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(MARKUP_CHANGED_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, [refresh]);

  const saveConfig = useCallback(
    (newConfig: MarkupSettingsConfig) => {
      const payload: MarkupSettingsConfig = {
        ...newConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.name || user?.username || 'Sếp / Ban Lãnh Đạo',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setConfig(payload);
      window.dispatchEvent(new Event(MARKUP_CHANGED_EVENT));
    },
    [user],
  );

  const getMarkupPercent = useCallback(
    (materialCodeOrCategoryKey?: string | number | null, categoryKey?: string | number | null): number => {
      if (materialCodeOrCategoryKey) {
        const code = String(materialCodeOrCategoryKey).trim();
        if (config.itemOverrides && config.itemOverrides[code] !== undefined) {
          return config.itemOverrides[code];
        }
      }
      const targetCategory = categoryKey !== undefined ? categoryKey : materialCodeOrCategoryKey;
      if (!targetCategory) return config.globalMarkupPercent;
      const keyStr = String(targetCategory).trim().toUpperCase();
      const found = config.categories.find(
        c => c.id.toUpperCase() === keyStr || c.name.toUpperCase().includes(keyStr),
      );
      return found ? found.percent : config.globalMarkupPercent;
    },
    [config],
  );

  const saveItemMarkup = useCallback(
    (materialCode: string, percent: number) => {
      const trimmed = materialCode.trim();
      if (!trimmed) return;
      const clamped = Math.max(0, Math.min(100, Math.round(percent)));
      const nextOverrides = {
        ...(config.itemOverrides || {}),
        [trimmed]: clamped,
      };
      saveConfig({
        ...config,
        itemOverrides: nextOverrides,
      });
    },
    [config, saveConfig],
  );

  return {
    config,
    saveConfig,
    getMarkupPercent,
    saveItemMarkup,
    refresh,
  };
}
