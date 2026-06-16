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
  members: {
    all: ['members'] as const,
    detail: (id: string) => ['members', id] as const,
  },
  candidates: {
    all: ['candidates'] as const,
    detail: (id: string) => ['candidates', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    detail: (id: string) => ['employees', id] as const,
  },
  warehouses: {
    all: ['warehouses'] as const,
    detail: (id: string) => ['warehouses', id] as const,
  },
  products: {
    all: ['products'] as const,
    detail: (id: string) => ['products', id] as const,
  },
  stocktakes: {
    all: ['stocktakes'] as const,
    detail: (id: string) => ['stocktakes', id] as const,
  },
  adjustments: {
    all: ['adjustments'] as const,
    detail: (id: string) => ['adjustments', id] as const,
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
} as const;
