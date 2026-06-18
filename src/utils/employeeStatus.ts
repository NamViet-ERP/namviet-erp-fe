import type { Employee } from '../types/hr';

/** Nhân viên còn hoạt động — được chọn ở dropdown và đăng nhập (nếu có tài khoản). */
export function isActiveEmployee(employee: Pick<Employee, 'status'>): boolean {
  return employee.status === 'Đang làm' || employee.status === 'Thai sản';
}
