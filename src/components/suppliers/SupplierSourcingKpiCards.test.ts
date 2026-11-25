import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SupplierSourcingKpiCards from './SupplierSourcingKpiCards';
import { suppliersService } from '../../services/suppliersService';

vi.mock('../../services/suppliersService', () => ({
  suppliersService: {
    getSourcingKpi: vi.fn(),
  },
}));

async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('SupplierSourcingKpiCards', () => {
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

  it('renders error alert and allows retry when KPI request fails', async () => {
    vi.mocked(suppliersService.getSourcingKpi)
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce({
        totalSuppliers: 12,
        totalNewThisMonth: 2,
        totalPromotedThisMonth: 1,
        promotionRatePercent: 8.3,
        gradeACount: 3,
        gradeBCount: 4,
        gradeCCount: 3,
        gradeDCount: 2,
        otherGradeCount: 0,
      });

    await act(async () => {
      root.render(createElement(SupplierSourcingKpiCards));
    });
    await flush();

    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Network down');

    const retryBtn = Array.from(container.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Thử lại'),
    )!;
    expect(retryBtn).toBeDefined();

    await act(async () => {
      retryBtn.click();
    });
    await flush();

    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain('12');
  });
});
