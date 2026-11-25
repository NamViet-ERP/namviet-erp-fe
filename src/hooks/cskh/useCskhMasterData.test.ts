import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCskhMasterData } from './useCskhMasterData';
import { cskhService } from '../../services/cskhService';
import { EMPTY_MASTER_STORE, type CskhMasterStore } from '../../lib/cskh/masterData';

vi.mock('../../services/cskhService', () => ({
  cskhService: {
    getMasterData: vi.fn(),
    saveMasterData: vi.fn(),
  },
}));

async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('useCskhMasterData', () => {
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

  it('loads from server without localStorage and rejects when saveMasterData fails', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const initial: CskhMasterStore = {
      ...EMPTY_MASTER_STORE,
      boilerTypes: [{ id: 'b-1', code: 'LO-01', name: 'Lò tầng sôi' }],
    };

    vi.mocked(cskhService.getMasterData).mockResolvedValue(initial);
    vi.mocked(cskhService.saveMasterData).mockRejectedValueOnce(new Error('Save rejected'));

    let latestHook!: ReturnType<typeof useCskhMasterData>;
    function Harness() {
      latestHook = useCskhMasterData();
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

    expect(cskhService.getMasterData).toHaveBeenCalledTimes(1);
    expect(latestHook.store.boilerTypes).toHaveLength(1);
    expect(getItemSpy).not.toHaveBeenCalledWith('nv-cskh-master-data');
    expect(setItemSpy).not.toHaveBeenCalledWith('nv-cskh-master-data', expect.anything());

    await expect(
      act(async () => {
        await latestHook.persist(prev => ({
          ...prev,
          industries: [{ id: 'i-1', code: 'NG-01', name: 'Dệt nhuộm' }],
        }));
      }),
    ).rejects.toThrow('Save rejected');

    expect(setItemSpy).not.toHaveBeenCalledWith('nv-cskh-master-data', expect.anything());
  });
});
