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
  defects: {
    all: ['defects'] as const,
    detail: (id: string) => ['defects', id] as const,
    eligiblePos: ['defects', 'eligiblePos'] as const,
    poPreview: (poCode: string) => ['defects', 'poPreview', poCode] as const,
    stockPreview: (projectCode: string) => ['defects', 'stockPreview', projectCode] as const,
  },
  candidates: {
    all: ['candidates'] as const,
    detail: (id: string) => ['candidates', id] as const,
  },
  recruitmentPlans: {
    all: ['recruitmentPlans'] as const,
  },
  recruitmentDashboard: {
    all: ['recruitmentDashboard'] as const,
    kpi: ['recruitmentDashboard', 'kpi'] as const,
    trend: ['recruitmentDashboard', 'trend'] as const,
    bySource: ['recruitmentDashboard', 'bySource'] as const,
    byPosition: ['recruitmentDashboard', 'byPosition'] as const,
    costBySource: ['recruitmentDashboard', 'costBySource'] as const,
  },
  recruitmentCalendar: {
    all: ['recruitmentCalendar'] as const,
  },
  recruitmentCosts: {
    all: ['recruitmentCosts'] as const,
    summary: ['recruitmentCosts', 'summary'] as const,
  },
  recruitmentReports: {
    all: ['recruitmentReports'] as const,
    summary: ['recruitmentReports', 'summary'] as const,
  },
  recruitmentBudget: {
    all: ['recruitmentBudget'] as const,
    year: (year: number) => ['recruitmentBudget', year] as const,
  },
  employees: {
    all: ['employees'] as const,
    detail: (id: string) => ['employees', id] as const,
  },
  /** Admin identity accounts — separate from HR employees list. */
  adminUsers: {
    all: ['adminUsers'] as const,
    detail: (id: string, source: string) => ['adminUsers', 'detail', id, source] as const,
  },
  onboardingInvites: {
    all: ['onboardingInvites'] as const,
    validate: (token: string) => ['onboardingInvites', 'validate', token] as const,
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
    constructionTasks: (projectCode?: string) =>
      ['projects', 'construction-tasks', projectCode ?? 'all'] as const,
    purchasingProgress: (projectCode?: string) =>
      ['projects', 'purchasing-progress', projectCode ?? 'all'] as const,
  },
  materials: {
    all: ['materials'] as const,
    detail: (code: string) => ['materials', code] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
  },
  supplierGroups: {
    all: ['supplierGroups'] as const,
    members: (groupId: number) => ['supplierGroups', groupId, 'members'] as const,
    ofSupplier: (supplierId: number) => ['supplierGroups', 'ofSupplier', supplierId] as const,
  },
  supplierContacts: {
    all: ['supplierContacts'] as const,
  },
  supplierEvaluations: {
    all: ['supplierEvaluations'] as const,
    detail: (id: number) => ['supplierEvaluations', id] as const,
  },
  supplierDeliveryEvaluations: {
    all: ['supplierDeliveryEvaluations'] as const,
  },
  supplierBlacklist: {
    all: ['supplierBlacklist'] as const,
  },

  supplierModuleSettings: {
    all: ['supplierModuleSettings'] as const,
  },
  suppliersDashboard: {
    all: ['suppliersDashboard'] as const,
    detail: (params: object) => ['suppliersDashboard', params] as const,
  },
  supplierSpend: {
    all: ['supplierSpend'] as const,
  },
  supplierPayables: {
    all: ['supplierPayables'] as const,
    report: (params: object) => ['supplierPayables', 'report', params] as const,
    snapshot: (supplierId: number) => ['supplierPayables', 'snapshot', supplierId] as const,
  },
  supplierPriceHistory: {
    all: ['supplierPriceHistory'] as const,
  },
  purchasePlans: {
    all: ['purchasePlans'] as const,
    detail: (code: string) => ['purchasePlans', code] as const,
    variance: (planCode?: string, projectCode?: string) =>
      ['purchasePlans', 'variance', planCode ?? '', projectCode ?? ''] as const,
  },
  arrivalPlans: {
    list: (
      daysAhead: number,
      params?: { projectCode?: string; lineStatus?: string; overdueLookbackDays?: number },
    ) =>
      [
        'arrivalPlans',
        daysAhead,
        params?.projectCode ?? '',
        params?.lineStatus ?? '',
        params?.overdueLookbackDays ?? '',
      ] as const,
  },
  purchaseOrders: {
    all: ['purchaseOrders'] as const,
    detail: (code: string) => ['purchaseOrders', code] as const,
    attachments: (code: string) => ['purchaseOrders', code, 'attachments'] as const,
    comments: (code: string) => ['purchaseOrders', code, 'comments'] as const,
  },
  purchasePayments: {
    all: ['purchasePayments'] as const,
    detail: (code: string) => ['purchasePayments', code] as const,
  },
  purchasePaymentPlans: {
    all: ['purchasePaymentPlans'] as const,
    nextStage: (poCode: string) => ['purchasePaymentPlans', 'nextStage', poCode] as const,
  },
  wmsNotifications: {
    all: ['wms-notifications'] as const,
    pending: ['wms-notifications', 'pending'] as const,
  },
  purchasingDashboard: {
    all: ['purchasingDashboard'] as const,
    summary: (params: object) => ['purchasingDashboard', 'summary', params] as const,
    chart: (params: object) => ['purchasingDashboard', 'chart', params] as const,
    activity: (params: object) => ['purchasingDashboard', 'activity', params] as const,
    actors: (params: object) => ['purchasingDashboard', 'actors', params] as const,
  },
} as const;
