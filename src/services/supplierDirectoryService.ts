import { apiClient } from '../lib/apiClient';
import type {
  BlacklistSupplierRequest,
  CompleteSupplierDeliveryEvaluationRequest,
  SetSupplierGroupMembersRequest,
  SetSupplierGroupsRequest,
  SupplierBlacklistApiDto,
  SupplierContactApiDto,
  SupplierContactPagedApiDto,
  SupplierDeliveryEvaluationApiDto,
  SupplierDeliveryEvaluationPagedApiDto,
  SupplierEvaluationApiDto,
  SupplierEvaluationPagedApiDto,
  SupplierGroupApiDto,
  SupplierGroupMemberApiDto,
  SupplierGroupPagedApiDto,
  SupplierGroupRefApiDto,
  SupplierModuleSettingsApiDto,
  SuppliersDashboardApiDto,
  UpdateSupplierModuleSettingsRequest,
  UpsertSupplierContactRequest,
  UpsertSupplierEvaluationRequest,
  UpsertSupplierGroupRequest,
} from '../types/api/supplierDirectoryApi';
import type { SupplierApiDto } from '../types/wms';

const GROUPS = '/api/warehouse/supplier-groups';
const CONTACTS = '/api/warehouse/supplier-contacts';
const EVALUATIONS = '/api/warehouse/supplier-evaluations';
const DELIVERY_EVALUATIONS = '/api/warehouse/supplier-delivery-evaluations';
const SETTINGS = '/api/warehouse/supplier-settings';
const DASHBOARD = '/api/warehouse/suppliers/dashboard';
const SUPPLIERS = '/api/warehouse/suppliers';

export interface SupplierDirectoryListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SupplierDashboardParams {
  period?: string;
  supplierId?: number;
}

export const supplierGroupsService = {
  list(params: SupplierDirectoryListParams = {}) {
    const { search, page = 1, pageSize = 50 } = params;
    return apiClient.get<SupplierGroupPagedApiDto>(GROUPS, {
      search: search || undefined,
      page,
      pageSize,
    });
  },

  create(body: UpsertSupplierGroupRequest) {
    return apiClient.post<SupplierGroupApiDto>(GROUPS, body);
  },

  update(id: number, body: UpsertSupplierGroupRequest) {
    return apiClient.put<SupplierGroupApiDto>(`${GROUPS}/${id}`, body);
  },

  remove(id: number) {
    return apiClient.delete(`${GROUPS}/${id}`);
  },

  members(id: number) {
    return apiClient.get<SupplierGroupMemberApiDto[]>(`${GROUPS}/${id}/members`);
  },

  setMembers(id: number, body: SetSupplierGroupMembersRequest) {
    return apiClient.put<SupplierGroupMemberApiDto[]>(`${GROUPS}/${id}/members`, body);
  },

  groupsOfSupplier(supplierId: number) {
    return apiClient.get<SupplierGroupRefApiDto[]>(`${SUPPLIERS}/${supplierId}/groups`);
  },

  setGroupsOfSupplier(supplierId: number, body: SetSupplierGroupsRequest) {
    return apiClient.put<SupplierGroupRefApiDto[]>(`${SUPPLIERS}/${supplierId}/groups`, body);
  },
};

export const supplierContactsService = {
  list(params: SupplierDirectoryListParams & { supplierId?: number } = {}) {
    const { supplierId, search, page = 1, pageSize = 50 } = params;
    return apiClient.get<SupplierContactPagedApiDto>(CONTACTS, {
      supplierId: supplierId ?? undefined,
      search: search || undefined,
      page,
      pageSize,
    });
  },

  create(body: UpsertSupplierContactRequest) {
    return apiClient.post<SupplierContactApiDto>(CONTACTS, body);
  },

  update(id: number, body: UpsertSupplierContactRequest) {
    return apiClient.put<SupplierContactApiDto>(`${CONTACTS}/${id}`, body);
  },

  remove(id: number) {
    return apiClient.delete(`${CONTACTS}/${id}`);
  },
};

export const supplierEvaluationsService = {
  list(params: SupplierDirectoryListParams & { supplierId?: number; period?: string } = {}) {
    const { supplierId, period, search, page = 1, pageSize = 50 } = params;
    return apiClient.get<SupplierEvaluationPagedApiDto>(EVALUATIONS, {
      supplierId: supplierId ?? undefined,
      period: period || undefined,
      search: search || undefined,
      page,
      pageSize,
    });
  },

  getById(id: number) {
    return apiClient.get<SupplierEvaluationApiDto>(`${EVALUATIONS}/${id}`);
  },

  create(body: UpsertSupplierEvaluationRequest) {
    return apiClient.post<SupplierEvaluationApiDto>(EVALUATIONS, body);
  },

  update(id: number, body: UpsertSupplierEvaluationRequest) {
    return apiClient.put<SupplierEvaluationApiDto>(`${EVALUATIONS}/${id}`, body);
  },

  remove(id: number) {
    return apiClient.delete(`${EVALUATIONS}/${id}`);
  },
};

export const supplierBlacklistService = {
  list() {
    return apiClient.get<SupplierBlacklistApiDto[]>(`${SUPPLIERS}/blacklist`);
  },

  add(id: number, body: BlacklistSupplierRequest) {
    return apiClient.post<SupplierApiDto>(`${SUPPLIERS}/${id}/blacklist`, body);
  },

  remove(id: number) {
    return apiClient.delete<SupplierApiDto>(`${SUPPLIERS}/${id}/blacklist`);
  },
};

export const supplierDeliveryEvaluationsService = {
  list(params: SupplierDirectoryListParams & {
    supplierId?: number;
    poCode?: string;
    status?: string;
  } = {}) {
    const { supplierId, poCode, status, search, page = 1, pageSize = 50 } = params;
    return apiClient.get<SupplierDeliveryEvaluationPagedApiDto>(DELIVERY_EVALUATIONS, {
      supplierId: supplierId ?? undefined,
      poCode: poCode || undefined,
      status: status || undefined,
      search: search || undefined,
      page,
      pageSize,
    });
  },

  complete(id: number, body: CompleteSupplierDeliveryEvaluationRequest) {
    return apiClient.put<SupplierDeliveryEvaluationApiDto>(
      `${DELIVERY_EVALUATIONS}/${id}/complete`,
      body,
    );
  },
};

export const supplierModuleSettingsService = {
  get() {
    return apiClient.get<SupplierModuleSettingsApiDto>(SETTINGS);
  },

  update(body: UpdateSupplierModuleSettingsRequest) {
    return apiClient.put<SupplierModuleSettingsApiDto>(SETTINGS, body);
  },
};

export const suppliersDashboardService = {
  get(params: SupplierDashboardParams = {}) {
    const { period, supplierId } = params;
    return apiClient.get<SuppliersDashboardApiDto>(DASHBOARD, {
      period: period || undefined,
      supplierId: supplierId ?? undefined,
    });
  },
};
