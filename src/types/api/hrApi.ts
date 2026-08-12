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

/**
 * Department list/detail responses are anonymous on BE (not in components.schemas).
 * Keep a hand wire shape until BE publishes DepartmentDto (+ employeeCount).
 */
export type DepartmentApiDto = {
  id: number;
  code: string;
  name: string;
  parentId?: number | null;
  block?: string | null;
  isActive: boolean;
  employeeCount?: number;
  children?: Array<{
    id: number;
    code: string;
    name: string;
    isActive: boolean;
    employeeCount?: number;
  }>;
};

export type DepartmentMemberApiDto = {
  id: number;
  code: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  positionName?: string | null;
};

/** OpenAPI aliases — Recruitment plans */
export type RecruitmentPlanApiDto = Schemas['RecruitmentPlanDto'];
export type CreateRecruitmentPlanRequest = Schemas['CreateRecruitmentPlanRequest'];
export type UpdateRecruitmentPlanRequest = Schemas['UpdateRecruitmentPlanRequest'];
