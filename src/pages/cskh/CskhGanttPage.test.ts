import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cskhService } from '../../services/cskhService';
import { projectsService } from '../../services/projectsService';
import { queryKeys } from '../../services/queryKeys';
import { EMPTY_MASTER_STORE } from '../../lib/cskh/masterData';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';
import type { ProjectConstructionTaskApiDto } from '../../types/wms';
import CskhGanttPage from './CskhGanttPage';

vi.mock('../../services/cskhService', () => ({ cskhService: {
  listBottlenecks: vi.fn(), listRequests: vi.fn(), listMeetings: vi.fn(), getGanttSnapshots: vi.fn(),
} }));
vi.mock('../../services/projectsService', () => ({ projectsService: {
  listConstructionTasks: vi.fn(), syncConstructionTasks: vi.fn(),
} }));
vi.mock('../../hooks/cskh/useCskhCommandCenter', () => ({
  useCskhCommandCenter: () => ({ patchProject: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock('../../hooks/cskh/useCskhMasterData', () => ({
  useCskhMasterData: () => ({ store: EMPTY_MASTER_STORE }),
}));
vi.mock('../../components/ui/Toast', () => ({ showToast: vi.fn() }));

const project: CskhProjectRecord = {
  code: 'WBS-PAGE', name: 'Regression project', year: 2026, phaseId: 'mech', phaseMode: 'manual',
  planPct: 0, actualPct: 0, bottleneckCount: 0, pendingDocs: 0, warrantyWatch: false, source: 'wms',
  startDate: '2026-10-01',
};
const task = (id: string, parentId?: string, isGroup = false): ProjectConstructionTaskApiDto => ({
  id, parentId, isGroup, name: id, projectCode: project.code, projectName: project.name,
  plannedStart: '2026-10-01', plannedEnd: '2026-10-03', percentComplete: 0,
  sortOrder: 0, status: 'planned', level: 0,
});

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  vi.mocked(cskhService.listBottlenecks).mockResolvedValue([]);
  vi.mocked(cskhService.listRequests).mockResolvedValue([]);
  vi.mocked(cskhService.listMeetings).mockResolvedValue([]);
  vi.mocked(cskhService.getGanttSnapshots).mockResolvedValue([]);
  vi.mocked(projectsService.listConstructionTasks).mockResolvedValue([]);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  client.clear();
  vi.unstubAllGlobals();
});

async function flushQueries() {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
}

async function renderPage() {
  await act(async () => root.render(createElement(QueryClientProvider, { client },
    createElement(MemoryRouter, null, createElement(CskhGanttPage, { project })),
  )));
  await flushQueries();
}

function button(label: string): HTMLButtonElement {
  const found = [...document.querySelectorAll('button')].find(row => row.textContent?.trim() === label);
  if (!found) throw new Error(`Button not found: ${label}`);
  return found;
}

async function click(element: HTMLElement) {
  await act(async () => element.click());
  await flushQueries();
}

async function openDelete(name: string) {
  const row = [...container.querySelectorAll('tbody tr')].find(element => element.querySelector('td')?.textContent === name);
  if (!(row instanceof HTMLElement)) throw new Error(`Task row not found: ${name}`);
  await click(row);
  await click(button('Xóa hạng mục'));
}

describe('WBS write controls', () => {
  it('disables writes after a failed read and unlocks them only after a successful retry', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockRejectedValueOnce(new Error('Read failed'));
    await renderPage();
    expect(container.textContent).toContain('Không tải được WBS. Đã khóa thay đổi tiến độ');
    for (const label of ['Thêm hạng mục', 'Áp dụng bảng chuẩn', 'Snapshot Tuần']) {
      expect(button(label).disabled).toBe(true);
    }
    expect(button('Xuất Báo Cáo PDF').disabled).toBe(false);
    await click(button('Thêm hạng mục'));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(projectsService.syncConstructionTasks).not.toHaveBeenCalled();

    await click(button('Thử lại'));
    expect(button('Thêm hạng mục').disabled).toBe(false);
    expect(button('Áp dụng bảng chuẩn').disabled).toBe(false);
    await click(button('Thêm hạng mục'));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('disables writes while the initial WBS request is still pending', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockImplementation(() => new Promise(() => {}));
    await renderPage();
    expect(container.textContent).toContain('Đang tải WBS. Có thể chỉnh sửa tiến độ sau khi tải thành công.');
    expect(button('Thêm hạng mục').disabled).toBe(true);
    expect(button('Áp dụng bảng chuẩn').disabled).toBe(true);
    expect(button('Snapshot Tuần').disabled).toBe(true);
  });

  it('keeps WBS editing available when an unrelated request list fails', async () => {
    vi.mocked(cskhService.listRequests).mockRejectedValue(new Error('Request list failed'));
    await renderPage();
    expect(container.textContent).toContain('Không tải được dữ liệu.');
    expect(button('Thêm hạng mục').disabled).toBe(false);
  });

  it('discloses all descendants and deletes the whole subtree while keeping siblings', async () => {
    let stored = [task('group', undefined, true), task('nested', 'group', true), task('leaf', 'nested'), task('sibling')];
    vi.mocked(projectsService.listConstructionTasks).mockImplementation(async () => stored);
    vi.mocked(projectsService.syncConstructionTasks).mockImplementation(async (_code, rows) => {
      stored = stored.filter(existing => rows.some(row => row.id === existing.id));
      return stored;
    });
    await renderPage();
    await openDelete('group');
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('cùng toàn bộ 2 hạng mục con (tổng 3 hạng mục)');
    await click(button('Xóa 3 hạng mục'));

    expect(projectsService.syncConstructionTasks).toHaveBeenCalledWith(project.code, [expect.objectContaining({ id: 'sibling' })]);
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect([...container.querySelectorAll('tbody tr')].map(row => row.querySelector('td')?.textContent)).toEqual(['sibling']);
  });

  it('disables an already open confirmation when refreshing WBS fails', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockResolvedValue([task('leaf')]);
    await renderPage();
    await openDelete('leaf');
    vi.mocked(projectsService.listConstructionTasks).mockRejectedValue(new Error('Refresh failed'));
    await act(async () => { await client.refetchQueries({ queryKey: queryKeys.projects.constructionTasks(project.code) }); });
    await flushQueries();

    expect(button('Xóa').disabled).toBe(true);
    await click(button('Xóa'));
    expect(projectsService.syncConstructionTasks).not.toHaveBeenCalled();
  });
});
