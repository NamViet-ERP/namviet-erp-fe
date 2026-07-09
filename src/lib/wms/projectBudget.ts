import { ApiError } from '../apiClient';
import type { ImportBudgetExceededApiDto } from '../../types/api/importBudgetApi';

export type ProjectBudgetTone = 'success' | 'warning' | 'neutral';

export function resolveMaterialBudgetRemaining(
  materialBudget: number,
  approvedImportValue: number,
): number {
  return materialBudget - approvedImportValue;
}

export function getBudgetRemainingTone(
  materialBudget: number,
  remaining: number,
): ProjectBudgetTone {
  if (materialBudget <= 0) return 'neutral';
  if (remaining < 0) return 'warning';
  const ratio = remaining / materialBudget;
  if (ratio <= 0.2) return 'warning';
  return 'success';
}

export function getBudgetRemainingHint(
  materialBudget: number,
  remaining: number,
): string {
  if (materialBudget <= 0) return 'Chưa thiết lập hạn mức';
  const usedPct = Math.min(100, Math.max(0, ((materialBudget - remaining) / materialBudget) * 100));
  const pctLabel = Number.isFinite(usedPct) ? `${usedPct.toFixed(0)}% hạn mức đã dùng` : '';
  if (remaining < 0) {
    return pctLabel ? `Đã vượt hạn mức · ${pctLabel}` : 'Đã vượt hạn mức';
  }
  return pctLabel || 'Theo phiếu nhập đã duyệt';
}

function isBudgetExceededPayload(value: unknown): value is ImportBudgetExceededApiDto {
  if (!value || typeof value !== 'object') return false;
  const obj = value as ImportBudgetExceededApiDto;
  return obj.code === 'IMPORT_BUDGET_EXCEEDED'
    && typeof obj.projectCode === 'string'
    && typeof obj.overflowAmount === 'number';
}

export function parseImportBudgetExceeded(err: unknown): ImportBudgetExceededApiDto | null {
  if (!(err instanceof ApiError) || err.status !== 409) return null;
  return isBudgetExceededPayload(err.payload) ? err.payload : null;
}
