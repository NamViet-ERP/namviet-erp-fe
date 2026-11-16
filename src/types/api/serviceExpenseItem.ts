export type ServiceExpenseType = 'service' | 'expense';

export interface ServiceExpenseItemApiDto {
  id: number;
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice: number | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceExpenseItemPagedResponse {
  items: ServiceExpenseItemApiDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateServiceExpenseItemRequest {
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice?: number | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateServiceExpenseItemRequest {
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice?: number | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ServiceExpenseItemQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: ServiceExpenseType | '';
  isActive?: boolean;
  all?: boolean;
}
