/**
 * HR API wire types — aliases of OpenAPI-generated schemas
 * (`src/types/generated/openapi.ts`). Regenerate with `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

/** OpenAPI aliases — Employees (profile wire DTO) */
export type EmployeeApiDto = Schemas['EmployeeDto'];
/** Admin-style create/update bodies (Hr module controllers) */
export type CreateEmployeeRequest = Schemas['CreateEmployeeRequest'];
export type UpdateEmployeeRequest = Schemas['UpdateEmployeeRequest'];

/** OpenAPI aliases — Departments */
export type AssignDepartmentMembersRequest = Schemas['AssignDepartmentMembersRequest'];
export type DepartmentApiDto = Schemas['DepartmentDto'];
export type DepartmentMemberApiDto = Schemas['DepartmentMemberDto'];
export type UpsertDepartmentRequest = Schemas['UpsertDepartmentRequest'];

/** OpenAPI aliases — Branches */
export type BranchApiDto = Schemas['BranchDto'];
export type UpsertBranchRequest = Schemas['UpsertBranchRequest'];

/** OpenAPI aliases — Recruitment plans */
export type RecruitmentPlanApiDto = Schemas['RecruitmentPlanDto'];
export type CreateRecruitmentPlanRequest = Schemas['CreateRecruitmentPlanRequest'];
export type UpdateRecruitmentPlanRequest = Schemas['UpdateRecruitmentPlanRequest'];

/** Public HR staff picker (no internal user id — security) */
export type HrStaffPublicApiDto = Schemas['HrStaffPublicDto'];
