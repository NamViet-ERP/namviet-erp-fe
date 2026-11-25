import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveMarkupPercent, useMarkupSettings } from './useMarkupSettings';
import {
  DEFAULT_MARKUP_CONFIG,
  markupSettingsService,
  normalizeMarkupSettings,
} from '../services/markupSettingsService';

vi.mock('../auth/AuthProvider', () => ({
  useSession: () => ({
    user: { id: 'u-boss', username: 'boss@mayzer.vn', name: 'Giam Doc', role: 'Admin' },
    permissions: ['purchasing.pricebook.view', 'purchasing.pricebook.update'],
  }),
}));

vi.mock('../services/markupSettingsService', async () => {
  const actual = await vi.importActual<typeof import('../services/markupSettingsService')>(
    '../services/markupSettingsService',
  );
  return {
    ...actual,
    markupSettingsService: {
      get: vi.fn(),
      update: vi.fn(),
    },
  };
});

async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('useMarkupSettings', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads config from API without reading or writing localStorage', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    vi.mocked(markupSettingsService.get).mockResolvedValueOnce({
      globalMarkupPercent: 14,
      categories: [{ id: 'PIPE', name: 'Hệ ống thép', percent: 12 }],
      itemOverrides: { 'VT-001': 22 },
    });

    let latestHook!: ReturnType<typeof useMarkupSettings>;
    function Harness() {
      latestHook = useMarkupSettings();
      return null;
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await act(async () => {
      root.render(
        createElement(QueryClientProvider, { client: queryClient }, createElement(Harness)),
      );
    });
    await flush();

    expect(markupSettingsService.get).toHaveBeenCalledTimes(1);
    expect(getItemSpy).not.toHaveBeenCalledWith('mayzer_boss_markup_settings');
    expect(setItemSpy).not.toHaveBeenCalledWith('mayzer_boss_markup_settings', expect.anything());
    expect(latestHook.getMarkupPercent('VT-001', 'Hệ ống thép')).toBe(22);
    expect(latestHook.getMarkupPercent('VT-002', 'Hệ ống thép')).toBe(12);
    expect(latestHook.getMarkupPercent('VT-003', 'Nhóm khác')).toBe(14);
  });

  it('persists item markup override through API update endpoint', async () => {
    vi.mocked(markupSettingsService.get).mockResolvedValue({
      globalMarkupPercent: 15,
      categories: [],
      itemOverrides: {},
    });
    vi.mocked(markupSettingsService.update).mockResolvedValueOnce({
      globalMarkupPercent: 15,
      categories: [],
      itemOverrides: { 'VT-009': 25 },
    });

    let latestHook: ReturnType<typeof useMarkupSettings> | null = null;
    function Harness() {
      latestHook = useMarkupSettings();
      return null;
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await act(async () => {
      root.render(
        createElement(QueryClientProvider, { client: queryClient }, createElement(Harness)),
      );
    });
    await flush();

    await act(async () => {
      await latestHook!.saveItemMarkup('VT-009', 25);
    });

    expect(markupSettingsService.update).toHaveBeenCalledWith({
      globalMarkupPercent: 15,
      categories: [],
      itemOverrides: { 'VT-009': 25 },
    });
  });

  it('resolves category names and hierarchy paths accurately', () => {
    const config = {
      globalMarkupPercent: 15,
      categories: [{ id: 'VAN', name: 'Van công nghiệp', percent: 18 }],
      itemOverrides: { 'VAN-01': 30 },
    };
    expect(resolveMarkupPercent(config, 'VAN-01', 'Van công nghiệp')).toBe(30);
    expect(resolveMarkupPercent(config, 'VAN-02', 'Van công nghiệp > Van bướm')).toBe(18);
    expect(resolveMarkupPercent(config, 'KHAC-01', 'Phụ kiện khác')).toBe(15);
  });

  it('defaults unconfigured markup config to 0% matching backend Defaults', () => {
    expect(DEFAULT_MARKUP_CONFIG).toEqual({
      globalMarkupPercent: 0,
      categories: [],
      itemOverrides: {},
    });
    expect(normalizeMarkupSettings(null).globalMarkupPercent).toBe(0);
    expect(normalizeMarkupSettings({}).globalMarkupPercent).toBe(0);
  });
});
