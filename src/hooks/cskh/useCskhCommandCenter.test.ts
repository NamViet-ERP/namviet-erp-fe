import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cskhService } from '../../services/cskhService';
import { projectsService } from '../../services/projectsService';
import { queryKeys } from '../../services/queryKeys';
import { useCskhCommandCenter } from './useCskhCommandCenter';
import { loadCommandStore, type CskhCommandStore } from '../../lib/cskh/commandCenter';
import type { WarehouseProjectApiDto } from '../../types/wms';

vi.mock('../../services/cskhService', () => ({ cskhService: {
  getProjectProfiles: vi.fn(), saveProjectProfiles: vi.fn(),
} }));
vi.mock('../../services/projectsService', () => ({ projectsService: {
  list: vi.fn(), getByCode: vi.fn(), update: vi.fn(), updateStage: vi.fn(), deleteProject: vi.fn(),
} }));
const project: WarehouseProjectApiDto = {
  projectCode: 'AUDIT-PROJECT', projectName: 'Canonical name', stage: 'procurement', projectType: 'EPC',
  pmId: '11111111-1111-1111-1111-111111111111', pmName: 'Canonical PM', startDate: '2026-10-01',
  status: 'Active', materialBudget: 100000, clientName: 'Canonical client', scMembers: 'Keep members',
  stockActualQty: 0, stockPlannedQty: 0, stockReservedQty: 0, stockMaterialCount: 0,
  approvedImportValue: 0, materialBudgetRemaining: 100000, warehouseKeepers: [],
};
let serverProjects: WarehouseProjectApiDto[];
let profiles: CskhCommandStore;
let client: QueryClient;
let root: Root;
let current: ReturnType<typeof useCskhCommandCenter>;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.resetAllMocks();
  localStorage.clear();
  serverProjects = [{ ...project }];
  profiles = { overlays: { [project.projectCode]: { name: 'Stale name', phaseId: 'survey', pmName: 'Stale PM' } }, localProjects: [], deletedCodes: [project.projectCode] };
  vi.mocked(projectsService.list).mockImplementation(async () => ({
    items: serverProjects, page: 1, pageSize: 200, totalCount: serverProjects.length,
    totalPages: 1, hasNextPage: false, hasPreviousPage: false,
  }));
  vi.mocked(projectsService.getByCode).mockImplementation(async () => serverProjects[0]);
  vi.mocked(projectsService.update).mockImplementation(async (_code, body) => {
    serverProjects = [{ ...serverProjects[0], ...body, startDate: body.startDate ?? serverProjects[0].startDate }];
  });
  vi.mocked(projectsService.deleteProject).mockImplementation(async () => { serverProjects = []; });
  vi.mocked(projectsService.updateStage).mockImplementation(async (_code, stage) => { serverProjects = [{ ...serverProjects[0], stage }]; });
  vi.mocked(cskhService.getProjectProfiles).mockImplementation(async () => profiles);
  vi.mocked(cskhService.saveProjectProfiles).mockImplementation(async value => { profiles = value as CskhCommandStore; });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData([...queryKeys.projects.all, { page: 1, pageSize: 200 }], { items: serverProjects, totalCount: 1 });
  client.setQueryData(queryKeys.cskh.profiles, profiles);
  function Probe() { current = useCskhCommandCenter(); return null; }
  root = createRoot(document.createElement('div'));
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(Probe))));
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  localStorage.clear();
});

describe('CSKH uses the shared project record', () => {
  it('uses canonical names, people, and stage despite stale profile overrides or deletion markers', () => {
    expect(current.projects).toHaveLength(1);
    expect(current.getProject(project.projectCode)).toMatchObject({ name: 'Canonical name', phaseId: 'procurement', pmName: 'Canonical PM' });
  });

  it('writes canonical edits, keeps unrelated fields, saves CSKH extras, and invalidates shared views', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => current.patchProject(project.projectCode, {
      name: 'Changed name', pmName: 'Changed PM', clientName: 'Changed client', startDate: '2026-10-02', notes: 'CSKH note',
    }));
    expect(projectsService.update).toHaveBeenCalledWith(project.projectCode, expect.objectContaining({
      projectName: 'Changed name', pmName: 'Changed PM', pmId: project.pmId, startDate: '2026-10-02',
      materialBudget: 100000, status: 'Active', warehouseKeepers: [], scMembers: 'Keep members',
    }));
    expect(profiles.overlays[project.projectCode].notes).toBe('CSKH note');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.projects.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.stock.matrix });
    expect(serverProjects[0].projectName).toBe('Changed name');
  });

  it('does not publish a local success when the canonical update fails and allows retry', async () => {
    vi.mocked(projectsService.update).mockRejectedValueOnce(new Error('Project validation failed'));
    await act(async () => { await expect(current.patchProject(project.projectCode, { name: 'Rejected', notes: 'Do not save' })).rejects.toThrow('Project validation failed'); });
    expect(cskhService.saveProjectProfiles).not.toHaveBeenCalled();
    expect(current.getProject(project.projectCode)?.name).toBe('Canonical name');
    await act(async () => current.patchProject(project.projectCode, { name: 'Retry name' }));
    expect(serverProjects[0].projectName).toBe('Retry name');
  });

  it('respects canonical deletion validation, then deletes from every shared view', async () => {
    vi.mocked(projectsService.deleteProject).mockRejectedValueOnce(new Error('Project has inventory'));
    await act(async () => { await expect(current.deleteProject(project.projectCode)).rejects.toThrow('Project has inventory'); });
    expect(current.projects).toHaveLength(1);
    expect(cskhService.saveProjectProfiles).not.toHaveBeenCalled();
    await act(async () => current.deleteProject(project.projectCode));
    expect(projectsService.deleteProject).toHaveBeenCalledWith(project.projectCode);
    expect(serverProjects).toEqual([]);
    expect(profiles.overlays[project.projectCode]).toBeUndefined();
  });

  it('persists a stage move to the canonical API', async () => {
    await act(async () => current.moveProject(project.projectCode, 'mech'));
    expect(projectsService.updateStage).toHaveBeenCalledWith(project.projectCode, 'mech');
    expect(serverProjects[0].stage).toBe('mech');
  });

  it('does not resurrect browser-only projects or sample data after an empty server response', async () => {
    expect(loadCommandStore().localProjects).toEqual([]);
    profiles.localProjects = [{ code: 'LOCAL-ONLY', name: 'Old browser draft', year: 2026,
      phaseId: 'survey', planPct: 0, actualPct: 0, bottleneckCount: 0, pendingDocs: 0, warrantyWatch: false }];
    serverProjects = [];
    await act(async () => {
      client.setQueryData([...queryKeys.projects.all, { page: 1, pageSize: 200 }], { items: [], totalCount: 0 });
      client.setQueryData(queryKeys.cskh.profiles, { ...profiles });
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(current.projects).toEqual([]);
  });
});
