/** Centralized TanStack Query keys — keeps cache invalidation consistent. */
export const queryKeys = {
  imports: {
    all: ['imports'] as const,
    detail: (id: string) => ['imports', id] as const,
  },
  exports: {
    all: ['exports'] as const,
    detail: (id: string) => ['exports', id] as const,
  },
  transfers: {
    all: ['transfers'] as const,
    detail: (id: string) => ['transfers', id] as const,
  },
  exportReturns: {
    all: ['exportReturns'] as const,
    detail: (id: string) => ['exportReturns', id] as const,
    returnableExports: (projectCode: string, excludeReturnId?: string) =>
      ['exportReturns', 'returnable', 'exports', projectCode, excludeReturnId ?? ''] as const,
    returnableLines: (sourceExportId: string, excludeReturnId?: string) =>
      ['exportReturns', 'returnable', 'lines', sourceExportId, excludeReturnId ?? ''] as const,
  },
  candidates: {
    all: ['candidates'] as const,
    detail: (id: string) => ['candidates', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    detail: (id: string) => ['employees', id] as const,
  },
  stocktakes: {
    all: ['stocktakes'] as const,
    detail: (id: string) => ['stocktakes', id] as const,
  },
  positions: {
    all: ['positions'] as const,
  },
  hrStaff: {
    all: ['hrStaff'] as const,
  },
  roles: {
    all: ['roles'] as const,
  },
  rolePermissions: {
    catalog: ['rolePermissions', 'catalog'] as const,
    role: (code: string) => ['rolePermissions', code] as const,
  },
  stock: {
    matrix: ['stock', 'matrix'] as const,
  },
  categories: {
    tree: ['categories', 'tree'] as const,
  },
  materialUnits: {
    all: ['materialUnits'] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (code: string) => ['projects', code] as const,
    inventory: (code: string) => ['projects', code, 'inventory'] as const,
    ledger: (code: string) => ['projects', code, 'ledger'] as const,
  },
  materials: {
    all: ['materials'] as const,
    detail: (code: string) => ['materials', code] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
  },
  priceBooks: {
    all: ['priceBooks'] as const,
  },
} as const;
