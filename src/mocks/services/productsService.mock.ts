import type { Product } from '../../types';
import { mockDelay, mockId } from '../index';
import { products as seed } from '../data/products';
import type { CreateProductDto, UpdateProductDto } from '../../services/productsService';

let store: Product[] = [...seed];

export async function listProductsMock(): Promise<Product[]> {
  return mockDelay(store);
}

export async function getProductMock(id: string): Promise<Product> {
  const found = store.find((x) => x.id === id);
  if (!found) throw new Error(`Không tìm thấy sản phẩm ${id}`);
  return mockDelay(found);
}

export async function createProductMock(dto: CreateProductDto): Promise<Product> {
  const created: Product = { ...dto, id: mockId('p') };
  store = [created, ...store];
  return mockDelay(created);
}

export async function updateProductMock(id: string, dto: UpdateProductDto): Promise<Product> {
  store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
  const updated = store.find((x) => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy sản phẩm ${id}`);
  return mockDelay(updated);
}

export async function removeProductMock(id: string): Promise<void> {
  store = store.filter((x) => x.id !== id);
  await mockDelay(null);
}
