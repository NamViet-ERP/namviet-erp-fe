export interface ImportBudgetExceededApiDto {
  code: string;
  message: string;
  projectCode: string;
  materialBudget: number;
  approvedImportValue: number;
  importValue: number;
  overflowAmount: number;
}

export interface ApproveImportRequestApiDto {
  confirmOverBudget?: boolean;
}
