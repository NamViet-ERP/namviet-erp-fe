import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth/AuthProvider';
import {
  DEFAULT_MARKUP_CONFIG,
  markupSettingsService,
  type CategoryMarkupItem,
  type MarkupSettingsConfig,
} from '../services/markupSettingsService';
import { queryKeys } from '../services/queryKeys';

export type { CategoryMarkupItem, MarkupSettingsConfig };

export function resolveMarkupPercent(
  config: MarkupSettingsConfig,
  materialCodeOrCategoryKey?: string | number | null,
  categoryKey?: string | number | null,
): number {
  if (
    materialCodeOrCategoryKey !== undefined &&
    materialCodeOrCategoryKey !== null &&
    materialCodeOrCategoryKey !== ''
  ) {
    const code = String(materialCodeOrCategoryKey).trim();
    if (config.itemOverrides && config.itemOverrides[code] !== undefined) {
      return config.itemOverrides[code];
    }
  }

  const targetCategory = categoryKey !== undefined ? categoryKey : materialCodeOrCategoryKey;
  if (targetCategory === undefined || targetCategory === null || targetCategory === '') {
    return config.globalMarkupPercent;
  }

  const keyStr = String(targetCategory).trim().toUpperCase();
  if (!keyStr) return config.globalMarkupPercent;

  const found = config.categories.find(c => {
    const idUpper = c.id.trim().toUpperCase();
    const nameUpper = c.name.trim().toUpperCase();
    return (
      idUpper === keyStr ||
      nameUpper === keyStr ||
      (nameUpper.length > 0 && keyStr.includes(nameUpper)) ||
      (keyStr.length > 0 && nameUpper.includes(keyStr))
    );
  });

  return found ? found.percent : config.globalMarkupPercent;
}

export function useMarkupSettings() {
  const { user, permissions } = useSession();
  const qc = useQueryClient();
  const canViewMarkup =
    Boolean(user) && (permissions?.includes('purchasing.pricebook.view') ?? false);

  const query = useQuery({
    queryKey: queryKeys.purchasePriceBook.markupSettings,
    queryFn: () => markupSettingsService.get(),
    enabled: canViewMarkup,
  });

  const config = query.data ?? DEFAULT_MARKUP_CONFIG;

  const mutation = useMutation({
    mutationFn: (newConfig: MarkupSettingsConfig) =>
      markupSettingsService.update({
        globalMarkupPercent: newConfig.globalMarkupPercent,
        categories: newConfig.categories,
        itemOverrides: newConfig.itemOverrides ?? config.itemOverrides ?? {},
      }),
    onSuccess: updated => {
      qc.setQueryData(queryKeys.purchasePriceBook.markupSettings, updated);
      void qc.invalidateQueries({ queryKey: queryKeys.purchasePriceBook.markupSettings });
    },
  });

  const refresh = useCallback(() => query.refetch(), [query]);

  const saveConfig = useCallback(
    async (newConfig: MarkupSettingsConfig): Promise<void> => {
      await mutation.mutateAsync(newConfig);
    },
    [mutation],
  );

  const getMarkupPercent = useCallback(
    (
      materialCodeOrCategoryKey?: string | number | null,
      categoryKey?: string | number | null,
    ): number => resolveMarkupPercent(config, materialCodeOrCategoryKey, categoryKey),
    [config],
  );

  const saveItemMarkup = useCallback(
    async (materialCode: string, percent: number): Promise<void> => {
      const trimmed = materialCode.trim();
      if (!trimmed) return;
      const clamped = Math.max(0, Math.min(100, Math.round(percent)));
      const nextOverrides = {
        ...(config.itemOverrides || {}),
        [trimmed]: clamped,
      };
      await saveConfig({
        ...config,
        itemOverrides: nextOverrides,
      });
    },
    [config, saveConfig],
  );

  return {
    config,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSaving: mutation.isPending,
    saveConfig,
    getMarkupPercent,
    saveItemMarkup,
    refresh,
  };
}
