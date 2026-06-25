import type { Product } from '../types';
import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';

export type CreateProductDto = Omit<Product, 'id'>;
export type UpdateProductDto = Partial<CreateProductDto>;

const ENDPOINT = '/api/products';

export const productsService = {
  async list(): Promise<Product[]> {
    return resolveMock(
      () => import('../mocks/services/productsService.mock').then((m) => m.listProductsMock()),
      () => apiClient.get<Product[]>(ENDPOINT),
    );
  },
  async getById(id: string): Promise<Product> {
    return resolveMock(
      () => import('../mocks/services/productsService.mock').then((m) => m.getProductMock(id)),
      () => apiClient.get<Product>(`${ENDPOINT}/${id}`),
    );
  },
  async create(dto: CreateProductDto): Promise<Product> {
    return resolveMock(
      () => import('../mocks/services/productsService.mock').then((m) => m.createProductMock(dto)),
      () => apiClient.post<Product>(ENDPOINT, dto),
    );
  },
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    return resolveMock(
      () => import('../mocks/services/productsService.mock').then((m) => m.updateProductMock(id, dto)),
      () => apiClient.put<Product>(`${ENDPOINT}/${id}`, dto),
    );
  },
  async remove(id: string): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/productsService.mock').then((m) => m.removeProductMock(id)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${id}`); },
    );
  },
};
