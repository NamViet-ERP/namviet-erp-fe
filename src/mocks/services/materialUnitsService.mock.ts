import { normalizeMaterialUnitName } from '../../lib/wms/materialUnitFormat';
import type { MaterialUnitApiDto } from '../../types/wms';
import type { UpsertMaterialUnitRequest } from '../../services/materialUnitsService';
import { mockDelay, mockId } from '../index';

let store: MaterialUnitApiDto[] = [];

export async function listMaterialUnitsMock(activeOnly: boolean): Promise<MaterialUnitApiDto[]> {
  const list = store
    .filter(u => !activeOnly || u.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  return mockDelay(list);
}

export async function createMaterialUnitMock(body: UpsertMaterialUnitRequest): Promise<MaterialUnitApiDto> {
  const name = normalizeMaterialUnitName(body.name);
  if (!name) throw new Error('Vui lòng nhập tên đơn vị tính.');
  if (store.some(u => u.name === name)) throw new Error(`Đơn vị tính '${name}' đã tồn tại.`);

  const created: MaterialUnitApiDto = {
    id: Number(mockId('u').replace(/\D/g, '').slice(-6)) || store.length + 1,
    name,
    sortOrder: body.sortOrder ?? store.length + 1,
    isActive: body.isActive ?? true,
  };
  store = [...store, created];
  return mockDelay(created);
}

export async function updateMaterialUnitMock(id: number, body: UpsertMaterialUnitRequest): Promise<void> {
  const name = normalizeMaterialUnitName(body.name);
  if (!name) throw new Error('Vui lòng nhập tên đơn vị tính.');
  if (store.some(u => u.id !== id && u.name === name)) throw new Error(`Đơn vị tính '${name}' đã tồn tại.`);

  store = store.map(u =>
    u.id === id
      ? { ...u, name, sortOrder: body.sortOrder ?? u.sortOrder, isActive: body.isActive ?? u.isActive }
      : u,
  );
  await mockDelay(null);
}

export async function removeMaterialUnitMock(id: number): Promise<void> {
  store = store.filter(u => u.id !== id);
  await mockDelay(null);
}
