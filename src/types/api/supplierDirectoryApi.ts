/**
 * Supplier directory API wire types — aliases of OpenAPI-generated schemas
 * (`src/types/generated/openapi.ts`). Regenerate with `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

/** Nhóm NCC */
export type SupplierGroupApiDto = Schemas['SupplierGroupDto'];
export type SupplierGroupPagedApiDto = Schemas['SupplierGroupPagedResponse'];
export type UpsertSupplierGroupRequest = Schemas['UpsertSupplierGroupRequest'];
export type SupplierGroupMemberApiDto = Schemas['SupplierGroupMemberDto'];
export type SetSupplierGroupMembersRequest = Schemas['SetSupplierGroupMembersRequest'];
export type SupplierGroupRefApiDto = Schemas['SupplierGroupRefDto'];
export type SetSupplierGroupsRequest = Schemas['SetSupplierGroupsRequest'];

/** Liên hệ NCC */
export type SupplierContactApiDto = Schemas['SupplierContactDto'];
export type SupplierContactPagedApiDto = Schemas['SupplierContactPagedResponse'];
export type UpsertSupplierContactRequest = Schemas['UpsertSupplierContactRequest'];

/** Đánh giá NCC */
export type SupplierEvaluationApiDto = Schemas['SupplierEvaluationDto'];
export type SupplierEvaluationPagedApiDto = Schemas['SupplierEvaluationPagedResponse'];
export type UpsertSupplierEvaluationRequest = Schemas['UpsertSupplierEvaluationRequest'];

/** Thiết lập module NCC */
export type SupplierModuleSettingsApiDto = Schemas['SupplierModuleSettingsDto'];
export type UpdateSupplierModuleSettingsRequest = Schemas['UpdateSupplierModuleSettingsRequest'];

/** Dashboard NCC */
export type SuppliersDashboardApiDto = Schemas['SuppliersDashboardDto'];
export type SupplierDebtRowApiDto = Schemas['SupplierDebtRowDto'];
export type SupplierTrendPointApiDto = Schemas['SupplierTrendPointDto'];
