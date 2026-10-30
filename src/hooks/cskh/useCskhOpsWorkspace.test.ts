import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cskhService, type ProjectMeetingDto, type ProjectRequestCenterDto } from '../../services/cskhService';
import { projectsService } from '../../services/projectsService';
import { queryKeys } from '../../services/queryKeys';
import { useCskhOpsWorkspace } from './useCskhOpsWorkspace';
import type { ProjectConstructionTaskApiDto } from '../../types/wms';
import { captureSnapshot, removeGanttItem, type CskhGanttItem } from '../../lib/cskh/opsWorkspace';

vi.mock('../../services/cskhService', () => ({ cskhService: {
  listBottlenecks: vi.fn(), listRequests: vi.fn(), listMeetings: vi.fn(), getGanttSnapshots: vi.fn(), createGanttSnapshot: vi.fn(),
  updateRequest: vi.fn(), createRequest: vi.fn(), updateMeeting: vi.fn(),
  updateMeetingMinutes: vi.fn(), toggleMeetingAction: vi.fn(),
} }));
vi.mock('../../services/projectsService', () => ({ projectsService: {
  listConstructionTasks: vi.fn(), syncConstructionTasks: vi.fn(),
} }));

const code = 'AUDIT-PROJECT';
const request: ProjectRequestCenterDto = {
  id: 'request-1', projectCode: code, code: 'YC-1', name: 'Original request', requestType: 'general',
  fromParty: 'cskh', toDept: 'tech', dueDate: '2026-10-27', priority: 'medium',
  status: 'open', createdAt: '2026-10-26', body: 'Original body',
};
const meeting: ProjectMeetingDto = {
  id: 'meeting-1', projectCode: code, code: 'HOP-1', name: 'Review', date: '2026-10-26',
  agenda: 'Agenda', minutes: 'Original minutes', overdueActionCount: 0,
  actions: [{ id: 'action-1', name: 'Follow up', dueDate: '2026-10-27', done: true, generatedBottleneck: false, pic: 'PIC' }],
  attachments: [{ name: 'Minutes.pdf', url: '/existing-file', size: '3 KB' }],
};
const task: ProjectConstructionTaskApiDto = {
  id: 'task-1', projectCode: code, projectName: 'Test project', name: 'Installation',
  plannedStart: '2026-10-01', plannedEnd: '2026-10-31', percentComplete: 20,
  sortOrder: 0, status: 'in_progress', level: 1, wbsCode: '1.1', parentId: 'group-1',
  department: 'Engineering', notes: 'Keep notes', isGroup: false,
};
let client: QueryClient;
let root: Root;
let current: ReturnType<typeof useCskhOpsWorkspace>;
const newTask: CskhGanttItem = {
  id: 'new-local-id', name: 'New task', days: 2,
  startDate: '2026-11-01', endDate: '2026-11-02', actualPct: 0,
};

function Probe({ projectCode }: { projectCode: string }) {
  // eslint-disable-next-line react-hooks/globals
  current = useCskhOpsWorkspace(projectCode);
  return null;
}

async function renderWorkspace(projectCode = code) {
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(Probe, { projectCode }))));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.resetAllMocks();
  vi.mocked(cskhService.listBottlenecks).mockResolvedValue([]);
  vi.mocked(cskhService.listRequests).mockResolvedValue([request]);
  vi.mocked(cskhService.listMeetings).mockResolvedValue([meeting]);
  vi.mocked(cskhService.getGanttSnapshots).mockResolvedValue([]);
  vi.mocked(projectsService.listConstructionTasks).mockResolvedValue([task]);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(queryKeys.cskh.bottlenecks(code), []);
  client.setQueryData(queryKeys.cskh.requests(code), [request]);
  client.setQueryData(queryKeys.cskh.meetings(code), [meeting]);
  client.setQueryData(queryKeys.cskh.snapshots(code), []);
  client.setQueryData(queryKeys.projects.constructionTasks(code), [task]);
  root = createRoot(document.createElement('div'));
  await renderWorkspace();
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
});

describe('CSKH workspace persistence', () => {
  it('rejects replacement after an initial WBS read failure before any part of the update is written', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockRejectedValue(new Error('Temporary task load failure'));
    await renderWorkspace('UNREAD');
    expect(current.isError).toBe(true);
    expect(current.ops.ganttItems).toEqual([]);

    await act(async () => {
      await expect(current.update(ops => ({ ...ops, ganttItems: [newTask],
        requests: ops.requests.map(row => ({ ...row, name: 'Must not write' })),
      }))).rejects.toThrow('WBS');
    });

    expect(projectsService.syncConstructionTasks).not.toHaveBeenCalled();
    expect(cskhService.updateRequest).not.toHaveBeenCalled();
    expect(current.isSaving).toBe(false);
  });

  it('rejects replacement while the initial WBS read has not completed', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockImplementation(() => new Promise(() => {}));
    await renderWorkspace('PENDING');
    expect(current.isLoading).toBe(true);

    await act(async () => {
      await expect(current.update(ops => ({ ...ops, ganttItems: [newTask] }))).rejects.toThrow('WBS');
    });
    expect(projectsService.syncConstructionTasks).not.toHaveBeenCalled();
  });

  it('allows retry after a successful WBS read and includes the recovered server tasks', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockRejectedValueOnce(new Error('Read failed'));
    await renderWorkspace('RECOVERED');
    expect(current.isError).toBe(true);
    vi.mocked(projectsService.listConstructionTasks).mockResolvedValue([task]);
    await act(async () => { await current.refetch(); });
    await renderWorkspace('RECOVERED');

    await act(async () => current.update(ops => ({ ...ops, ganttItems: [...ops.ganttItems, newTask] })));
    expect(projectsService.syncConstructionTasks).toHaveBeenCalledWith('RECOVERED', [
      expect.objectContaining({ id: task.id, name: task.name, parentId: task.parentId }),
      expect.objectContaining({ name: newTask.name }),
    ]);
  });

  it('allows creating the first task after an authoritative empty response', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockResolvedValue([]);
    await renderWorkspace('EMPTY');
    await act(async () => current.update(ops => ({ ...ops, ganttItems: [newTask] })));
    expect(projectsService.syncConstructionTasks).toHaveBeenCalledWith('EMPTY', [expect.objectContaining({ name: newTask.name })]);
  });

  it('blocks replacement and snapshots after a refetch fails even with cached WBS data', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockRejectedValue(new Error('Refresh failed'));
    await act(async () => { await current.refetch(); });
    await renderWorkspace();
    expect(current.ops.ganttItems).toHaveLength(1);
    expect(current.isError).toBe(true);

    await act(async () => {
      await expect(current.update(ops => ({ ...ops, ganttItems: [] }))).rejects.toThrow('WBS');
      await expect(current.update(captureSnapshot)).rejects.toThrow('WBS');
    });
    expect(projectsService.syncConstructionTasks).not.toHaveBeenCalled();
    expect(cskhService.createGanttSnapshot).not.toHaveBeenCalled();
  });

  it('still saves an unrelated request when the WBS read fails', async () => {
    vi.mocked(projectsService.listConstructionTasks).mockRejectedValue(new Error('Read failed'));
    await renderWorkspace('REQUEST-ONLY');
    await act(async () => current.update(ops => ({ ...ops,
      requests: ops.requests.map(row => ({ ...row, name: 'Safe edit' })),
    })));
    expect(cskhService.updateRequest).toHaveBeenCalledWith('REQUEST-ONLY', request.id, expect.objectContaining({ name: 'Safe edit' }));
    expect(projectsService.syncConstructionTasks).not.toHaveBeenCalled();
  });

  it('syncs subtree deletion using canonical parent IDs while preserving sibling branches', async () => {
    const ancestor = { ...task, id: 'ancestor', parentId: undefined, isGroup: true };
    const group = { ...task, id: 'group', parentId: ancestor.id, isGroup: true };
    const nested = { ...task, id: 'nested', parentId: group.id, isGroup: true };
    const leaf = { ...task, id: 'leaf', parentId: nested.id };
    const sibling = { ...task, id: 'sibling', parentId: ancestor.id };
    vi.mocked(projectsService.listConstructionTasks).mockResolvedValue([leaf, sibling, nested, group, ancestor]);
    await renderWorkspace('TREE');
    await act(async () => current.update(ops => removeGanttItem(ops, group.id)));
    expect(projectsService.syncConstructionTasks).toHaveBeenCalledWith('TREE', [
      expect.objectContaining({ id: sibling.id, parentId: ancestor.id }),
      expect.objectContaining({ id: ancestor.id, parentId: undefined }),
    ]);
  });

  it('saves minutes without replacing the agenda or existing actions', async () => {
    await act(async () => current.update(ops => ({ ...ops, meetings: ops.meetings.map(row => ({ ...row, minutes: 'Updated minutes' })) })));
    expect(cskhService.updateMeetingMinutes).toHaveBeenCalledWith(code, meeting.id, { minutes: 'Updated minutes' });
    expect(cskhService.updateMeeting).not.toHaveBeenCalled();
  });

  it('toggles an existing action by its original server ID', async () => {
    await act(async () => current.update(ops => ({ ...ops, meetings: ops.meetings.map(row => ({ ...row, actions: row.actions.map(action => ({ ...action, done: false })) })) })));
    expect(cskhService.toggleMeetingAction).toHaveBeenCalledWith(code, meeting.id, 'action-1', false);
  });

  it('preserves completed actions and attachments when adding another action', async () => {
    await act(async () => current.update(ops => ({ ...ops, meetings: ops.meetings.map(row => ({ ...row,
      actions: [...row.actions, { id: crypto.randomUUID(), name: 'New follow up', dueDate: '2026-11-01', done: false }],
    })) })));
    expect(cskhService.updateMeeting).toHaveBeenCalledWith(code, meeting.id, expect.objectContaining({
      minutes: 'Original minutes', attachments: expect.arrayContaining([expect.objectContaining({ name: 'Minutes.pdf' })]),
      actions: [expect.objectContaining({ id: 'action-1', done: true }), expect.objectContaining({ id: undefined, name: 'New follow up' })],
    }));
  });

  it('sends every editable request field', async () => {
    await act(async () => current.update(ops => ({ ...ops, requests: ops.requests.map(row => ({ ...row,
      name: 'Revised title', dueDate: '2026-11-01', fromDept: 'engineering', toDept: 'warehouse',
      priority: 'urgent', body: 'New content', requestType: 'material',
    })) })));
    expect(cskhService.updateRequest).toHaveBeenCalledWith(code, request.id, expect.objectContaining({
      name: 'Revised title', dueDate: '2026-11-01', fromParty: 'engineering', toDept: 'warehouse',
      priority: 'urgent', body: 'New content', requestType: 'material', status: 'open',
    }));
  });

  it('waits for the server before resolving and rejects duplicate clicks', async () => {
    let resolve!: (result: ProjectRequestCenterDto) => void;
    vi.mocked(cskhService.updateRequest).mockImplementation(() => new Promise(done => { resolve = done; }));
    let completed = false;
    let saving!: Promise<void>;
    await act(async () => { saving = current.update(ops => ({ ...ops, requests: ops.requests.map(row => ({ ...row, status: 'closed' })) })).then(() => { completed = true; }); });
    expect(completed).toBe(false);
    expect(current.isSaving).toBe(true);
    await expect(current.update(ops => ops)).rejects.toThrow();
    await act(async () => { resolve(request); await saving; });
    expect(completed).toBe(true);
    expect(current.isSaving).toBe(false);
  });

  it('propagates failure, reconciles the cache, and allows retry', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(cskhService.updateRequest).mockRejectedValueOnce(new Error('Write failed')).mockResolvedValue(request);
    const update = () => current.update(ops => ({ ...ops, requests: ops.requests.map(row => ({ ...row, name: 'Retry title' })) }));
    await act(async () => { await expect(update()).rejects.toThrow('Write failed'); });
    expect(current.isSaving).toBe(false);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.cskh.requests(code) });
    await act(async () => { await update(); });
    expect(cskhService.updateRequest).toHaveBeenCalledTimes(2);
  });

  it('reads canonical WBS and persists edits without losing hierarchy', async () => {
    expect(current.ops.ganttItems[0]).toMatchObject({ id: task.id, parentId: 'group-1', wbs: '1.1', actualPct: 20 });
    await act(async () => current.update(ops => ({ ...ops, ganttItems: [
      { ...ops.ganttItems[0], actualPct: 45 },
      { id: crypto.randomUUID(), name: 'New task', days: 2, startDate: '2026-11-01', endDate: '2026-11-02', actualPct: 0 },
    ] })));
    expect(projectsService.syncConstructionTasks).toHaveBeenCalledWith(code, [
      expect.objectContaining({ id: task.id, percentComplete: 45, parentId: 'group-1', wbsCode: '1.1', notes: 'Keep notes' }),
      expect.objectContaining({ id: undefined, name: 'New task' }),
    ]);
  });
});
