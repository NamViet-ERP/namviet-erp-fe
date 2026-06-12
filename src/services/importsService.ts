import type { Import } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { imports as mockImports } from '../data/imports';

/**
 * Imports (Nhập kho) data service.
 *
 * Every page/hook depends on THIS interface, never on the mock array or the
 * apiClient directly. Today it serves mock data; switch VITE_USE_MOCK to 'false'
 * and the same calls hit the .NET Core API — no page changes required.
 */

export type CreateImportDto = Omit<Import, 'id'>;
export type UpdateImportDto = Partial<CreateImportDto>;

const ENDPOINT = '/api/imports';

// In-memory store so mock create/update/delete feel real within a session.
let store: Import[] = [...mockImports];

export const importsService = {
  async list(): Promise<Import[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Import[]>(ENDPOINT);
  },

  async getById(id: string): Promise<Import> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy phiếu nhập ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Import>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateImportDto): Promise<Import> {
    if (USE_MOCK) {
      const created: Import = { ...dto, id: mockId('im') };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Import>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateImportDto): Promise<Import> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy phiếu nhập ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Import>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Import> {
    if (USE_MOCK) {
      return this.update(id, { status: 'approved' });
    }
    return apiClient.post<Import>(`${ENDPOINT}/${id}/approve`);
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      store = store.filter((x) => x.id !== id);
      await mockDelay(null);
      return;
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
