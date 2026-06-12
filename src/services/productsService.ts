import type { Product } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { products as mockProducts } from '../data/products';

export type CreateProductDto = Omit<Product, 'id'>;
export type UpdateProductDto = Partial<CreateProductDto>;

const ENDPOINT = '/api/products';
let store: Product[] = [...mockProducts];

export const productsService = {
  async list(): Promise<Product[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Product[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Product> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy sản phẩm ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Product>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateProductDto): Promise<Product> {
    if (USE_MOCK) {
      const created: Product = { ...dto, id: mockId('p') };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Product>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy sản phẩm ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Product>(`${ENDPOINT}/${id}`, dto);
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
