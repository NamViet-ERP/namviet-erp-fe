import { test, expect, type Page } from '@playwright/test';
import type { components } from '../src/types/generated/openapi';

type Task = components['schemas']['ProjectConstructionTaskDto'];
type WbsWrite = components['schemas']['SyncProjectConstructionTasksRequest'];

const project: components['schemas']['ProjectDto'] = {
  projectCode: 'WBS-E2E-REGRESSION', projectName: 'Dự án kiểm thử WBS', projectType: 'Project',
  pmId: 'c2000000-0000-4000-8000-000000000001', pmName: 'Người phụ trách kiểm thử',
  startDate: '2026-10-01', endDate: '2026-11-30', materialBudget: 0, status: 'Active', stage: 'mech',
  stockActualQty: 0, stockPlannedQty: 0, stockReservedQty: 0, stockMaterialCount: 0,
  approvedImportValue: 0, materialBudgetRemaining: 0,
};
const projectPath = `/cskh/projects/${project.projectCode}/gantt`;
const apiProjects = '/api/warehouse/projects';
const syncPath = `${apiProjects}/${project.projectCode}/construction-tasks/sync-wbs`;

function task(index: number, name: string, parentId?: string, isGroup = false): Task {
  return {
    id: `c1000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    projectCode: project.projectCode, projectName: project.projectName, name, parentId, isGroup,
    plannedStart: '2026-10-01', plannedEnd: '2026-10-31', percentComplete: 20,
    sortOrder: index, status: 'in_progress', level: parentId ? 1 : 0,
  };
}

// Exercise the real page, hooks and API client with controlled reads and writes.
// The fixture owns these project endpoints; test mutations never reach the database.
async function installWorkspace(page: Page, initialTasks: Task[], failReads = false) {
  const state = { tasks: initialTasks, failReads, writes: [] as WbsWrite[] };
  let profiles: unknown = { overlays: {}, localProjects: [] };

  await page.route('**/api/cskh/master-data**', async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith('/profiles')) {
      if (route.request().method() === 'PUT') profiles = route.request().postDataJSON();
      await route.fulfill({ json: profiles });
      return;
    }
    await route.fulfill({ json: { industries: [], boilerTypes: [], statuses: [], priorities: [], phases: [], schedules: [] } });
  });

  await page.route('**/api/warehouse/projects**', async route => {
    const { pathname, searchParams } = new URL(route.request().url());
    const method = route.request().method();
    if (pathname === apiProjects && method === 'GET') {
      await route.fulfill({ json: {
        items: [project], totalCount: 1, page: 1, pageSize: 200, totalPages: 1,
        hasNextPage: false, hasPreviousPage: false,
      } });
      return;
    }
    if (pathname === `${apiProjects}/construction-tasks` && method === 'GET') {
      expect(searchParams.get('projectCode')).toBe(project.projectCode);
      await route.fulfill(state.failReads
        ? { status: 503, json: { title: 'WBS unavailable', detail: 'Controlled WBS read failure' } }
        : { json: state.tasks });
      return;
    }
    if (pathname === syncPath && method === 'POST') {
      const body = route.request().postDataJSON() as WbsWrite;
      state.writes.push(body);
      const ids = new Set(body.tasks.map(row => row.id).filter(Boolean));
      if (body.tasks.some(row => row.parentId && !ids.has(row.parentId))) {
        await route.fulfill({ status: 400, json: { detail: 'WBS contains an orphan task' } });
        return;
      }
      state.tasks = body.tasks.map((row, index) => ({
        ...row, id: row.id ?? `c3000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        projectCode: project.projectCode, projectName: project.projectName,
        level: row.level ?? 0, isGroup: row.isGroup ?? false, status: 'in_progress',
      }));
      await route.fulfill({ json: state.tasks });
      return;
    }
    if (method === 'GET' && [
      'bottlenecks', 'requests', 'meetings', 'gantt/snapshots',
    ].some(suffix => pathname === `${apiProjects}/${project.projectCode}/${suffix}`)) {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({ status: 501, json: { detail: `Unexpected fixture request: ${method} ${pathname}` } });
  });
  return state;
}

test('WBS read failure locks writes; retry preserves server tasks when adding an item', async ({ page }) => {
  const group = task(1, 'Nhóm đang có trên máy chủ', undefined, true);
  const existing = task(2, 'Công việc đang có trên máy chủ', group.id);
  const state = await installWorkspace(page, [group, existing], true);
  await page.goto(projectPath);

  await expect(page.getByRole('alert')).toContainText('Không tải được WBS. Đã khóa thay đổi tiến độ');
  for (const name of ['Thêm hạng mục', 'Áp dụng bảng chuẩn', 'Snapshot Tuần']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
  }
  expect(state.writes).toHaveLength(0);

  state.failReads = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('cell', { name: existing.name, exact: true })).toBeVisible();
  const add = page.getByRole('button', { name: 'Thêm hạng mục', exact: true });
  await expect(add).toBeEnabled();
  await add.click();
  const dialog = page.getByRole('dialog', { name: 'Thêm hạng mục tiến độ' });
  await dialog.getByPlaceholder('VD: Lắp đặt khung thép & Thân lò', { exact: true }).fill('Công việc bổ sung sau khi phục hồi');
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(dialog).toHaveCount(0);

  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].tasks).toEqual([
    expect.objectContaining({ id: group.id, name: group.name }),
    expect.objectContaining({ id: existing.id, parentId: group.id, name: existing.name }),
    expect.objectContaining({ name: 'Công việc bổ sung sau khi phục hồi' }),
  ]);
  await page.reload();
  await expect(page.getByRole('cell', { name: existing.name, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Công việc bổ sung sau khi phục hồi', exact: true })).toBeVisible();
});

test('deleting a WBS group discloses its descendants and preserves the other branch', async ({ page }) => {
  const ancestor = task(1, 'Hạng mục tổng', undefined, true);
  const group = task(2, 'Nhóm cần xóa', ancestor.id, true);
  const nested = task(3, 'Nhóm con cần xóa', group.id, true);
  const leaf = task(4, 'Công việc cháu cần xóa', nested.id);
  const sibling = task(5, 'Công việc cần giữ', ancestor.id);
  const state = await installWorkspace(page, [ancestor, group, nested, leaf, sibling]);
  await page.goto(projectPath);
  await page.getByRole('cell', { name: group.name, exact: true }).click();
  await page.getByRole('dialog', { name: 'Sửa hạng mục tiến độ' })
    .getByRole('button', { name: 'Xóa hạng mục', exact: true }).click();

  const confirmation = page.getByRole('alertdialog', { name: 'Xóa nhóm hạng mục' });
  await expect(confirmation).toContainText('cùng toàn bộ 2 hạng mục con (tổng 3 hạng mục)');
  await confirmation.getByRole('button', { name: 'Xóa 3 hạng mục', exact: true }).click();
  await expect(confirmation).toHaveCount(0);

  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].tasks).toEqual([
    expect.objectContaining({ id: ancestor.id }),
    expect.objectContaining({ id: sibling.id, parentId: ancestor.id }),
  ]);
  await page.reload();
  await expect(page.getByRole('cell', { name: sibling.name, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: ancestor.name, exact: true })).toBeVisible();
  for (const deleted of [group, nested, leaf]) {
    await expect(page.getByRole('cell', { name: deleted.name, exact: true })).toHaveCount(0);
  }
});
