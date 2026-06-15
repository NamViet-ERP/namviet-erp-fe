import type { EmployeeStatus } from '../types/hr';

/** Status cho phép đăng nhập / tài khoản active (khớp BE HrEmployeeMapper). */
export const ACTIVE_EMPLOYEE_STATUSES: readonly EmployeeStatus[] = ['Đang làm', 'Thai sản'] as const;

export const RESIGNED_EMPLOYEE_STATUS: EmployeeStatus = 'Nghỉ việc';

export function isActiveEmployeeStatus(status?: string | null): boolean {
  if (!status) return true;
  return (ACTIVE_EMPLOYEE_STATUSES as readonly string[]).includes(status);
}

export function getEmployeeLockReason(status?: string | null): string | null {
  if (!status || isActiveEmployeeStatus(status)) return null;
  if (status === RESIGNED_EMPLOYEE_STATUS) {
    return 'Tài khoản đã bị khóa vì nhân viên đã nghỉ việc.';
  }
  return 'Tài khoản không còn hoạt động.';
}
