import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CreateServiceExpenseItemRequest,
  ServiceExpenseItemApiDto,
  UpdateServiceExpenseItemRequest,
} from '../types/api/serviceExpenseItem';

const get = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());
const put = vi.hoisted(() => vi.fn());
const patch = vi.hoisted(() => vi.fn());
const del = vi.hoisted(() => vi.fn());

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get,
    post,
    put,
    patch,
    delete: del,
  },
}));

import { serviceExpenseItemsService } from './serviceExpenseItemsService';

const mockItem: ServiceExpenseItemApiDto = {
  id: 1,
  code: 'DV-VC-01',
  name: 'Chi phí cẩu tháp, vận chuyển vật tư',
  type: 'service',
  unit: 'Chuyến',
  referencePrice: 3500000,
  description: 'Xe cẩu 25 tấn',
  isActive: true,
  sortOrder: 1,
  createdAt: '2026-11-16T00:00:00Z',
  updatedAt: '2026-11-16T00:00:00Z',
};

describe('serviceExpenseItemsService', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    patch.mockReset();
    del.mockReset();
  });

  it('lists items with query params', async () => {
    get.mockResolvedValueOnce({
      items: [mockItem],
      total: 1,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    });

    const result = await serviceExpenseItemsService.list({
      page: 1,
      pageSize: 15,
      search: 'DV-VC',
      type: 'service',
      isActive: true,
    });

    expect(get).toHaveBeenCalledWith('/api/purchasing/service-items', {
      page: 1,
      pageSize: 15,
      search: 'DV-VC',
      type: 'service',
      isActive: true,
      all: undefined,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].code).toBe('DV-VC-01');
  });

  it('gets an item by id', async () => {
    get.mockResolvedValueOnce(mockItem);

    const result = await serviceExpenseItemsService.getById(1);

    expect(get).toHaveBeenCalledWith('/api/purchasing/service-items/1');
    expect(result.id).toBe(1);
  });

  it('creates a new service item', async () => {
    const payload: CreateServiceExpenseItemRequest = {
      code: 'DV-VC-01',
      name: 'Chi phí cẩu tháp',
      type: 'service',
      unit: 'Chuyến',
      referencePrice: 3500000,
    };
    post.mockResolvedValueOnce(mockItem);

    const result = await serviceExpenseItemsService.create(payload);

    expect(post).toHaveBeenCalledWith('/api/purchasing/service-items', payload);
    expect(result.id).toBe(1);
  });

  it('updates an existing service item', async () => {
    const updatePayload: UpdateServiceExpenseItemRequest = {
      code: 'DV-VC-01',
      name: 'Chi phí cẩu tháp cập nhật',
      type: 'service',
      unit: 'Chuyến',
      referencePrice: 3800000,
      description: 'Xe cẩu 25 tấn',
      isActive: true,
      sortOrder: 1,
    };
    put.mockResolvedValueOnce({ ...mockItem, name: 'Chi phí cẩu tháp cập nhật' });

    const result = await serviceExpenseItemsService.update(1, updatePayload);

    expect(put).toHaveBeenCalledWith('/api/purchasing/service-items/1', updatePayload);
    expect(result.name).toBe('Chi phí cẩu tháp cập nhật');
  });

  it('toggles active state', async () => {
    patch.mockResolvedValueOnce({ ...mockItem, isActive: false });

    const result = await serviceExpenseItemsService.toggleActive(1);

    expect(patch).toHaveBeenCalledWith('/api/purchasing/service-items/1/toggle-active');
    expect(result.isActive).toBe(false);
  });

  it('deletes an item', async () => {
    del.mockResolvedValueOnce(undefined);

    await serviceExpenseItemsService.delete(1);

    expect(del).toHaveBeenCalledWith('/api/purchasing/service-items/1');
  });
});
