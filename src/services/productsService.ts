import type { Product } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';

export type CreateProductDto = Omit<Product, 'id'>;
export type UpdateProductDto = Partial<CreateProductDto>;

const ENDPOINT = '/api/products';

export const productsService = {
  async list(): Promise<Product[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/productsService.mock');
      return mock.listProductsMock();
    }
    return apiClient.get<Product[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Product> {
    if (USE_MOCK) {
      const mock = await import('./mocks/productsService.mock');
      return mock.getProductMock(id);
    }
    return apiClient.get<Product>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateProductDto): Promise<Product> {
    if (USE_MOCK) {
      const mock = await import('./mocks/productsService.mock');
      return mock.createProductMock(dto);
    }
    return apiClient.post<Product>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (USE_MOCK) {
      const mock = await import('./mocks/productsService.mock');
      return mock.updateProductMock(id, dto);
    }
    return apiClient.put<Product>(`${ENDPOINT}/${id}`, dto);
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/productsService.mock');
      return mock.removeProductMock(id);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
