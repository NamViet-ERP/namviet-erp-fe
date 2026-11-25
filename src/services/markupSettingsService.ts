import { apiClient } from '../lib/apiClient';

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

export interface UpdateMarkupSettingsRequest {
  globalMarkupPercent: number;
  categories: CategoryMarkupItem[];
  itemOverrides?: Record<string, number>;
}

const ENDPOINT = '/api/purchasing/markup-settings';

export const DEFAULT_MARKUP_CONFIG: MarkupSettingsConfig = {
  globalMarkupPercent: 0,
  categories: [],
  itemOverrides: {},
};

export function normalizeMarkupSettings(
  data?: Partial<MarkupSettingsConfig> | null,
): MarkupSettingsConfig {
  return {
    globalMarkupPercent:
      typeof data?.globalMarkupPercent === 'number' && Number.isFinite(data.globalMarkupPercent)
        ? data.globalMarkupPercent
        : DEFAULT_MARKUP_CONFIG.globalMarkupPercent,
    categories: Array.isArray(data?.categories) ? data.categories : [],
    itemOverrides:
      data?.itemOverrides && typeof data.itemOverrides === 'object' ? data.itemOverrides : {},
    updatedAt: data?.updatedAt,
    updatedBy: data?.updatedBy,
  };
}

export const markupSettingsService = {
  async get(): Promise<MarkupSettingsConfig> {
    const data = await apiClient.get<MarkupSettingsConfig>(ENDPOINT);
    return normalizeMarkupSettings(data);
  },

  async update(body: UpdateMarkupSettingsRequest): Promise<MarkupSettingsConfig> {
    const data = await apiClient.put<MarkupSettingsConfig>(ENDPOINT, {
      globalMarkupPercent: body.globalMarkupPercent,
      categories: body.categories,
      itemOverrides: body.itemOverrides ?? {},
    });
    return normalizeMarkupSettings(data);
  },
};
