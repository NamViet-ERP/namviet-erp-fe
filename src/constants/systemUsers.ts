import { isAccountActiveForEmployee } from '../services/employeesService';

export type SystemUserRole = 'admin' | 'storekeeper' | 'accountant' | 'procurement' | 'pm' | 'hr';

export interface SystemUser {
  id: string;
  username: string;
  role: SystemUserRole;
  name: string;
  initials: string;
  roleLabel: string;
  email: string;
  /** Liên kết hồ sơ nhân viên — trạng thái Nghỉ việc sẽ khóa đăng nhập */
  employeeId?: string;
}

export const systemUsers: SystemUser[] = [
  { id: 'admin', username: 'tuan.nguyen', role: 'admin', name: 'Nguyễn Minh Tuấn', initials: 'AD', roleLabel: 'Quản trị viên', email: 'admin@namviet.vn' },
  { id: 'storekeeper', username: 'vy.phan', role: 'storekeeper', name: 'Phan Văn Vỹ', initials: 'VV', roleLabel: 'Thủ kho (Storekeeper)', email: 'vy.phan@namviet.vn', employeeId: 'emp_1' },
  { id: 'accountant', username: 'hong.le', role: 'accountant', name: 'Lê Thị Hồng', initials: 'LH', roleLabel: 'Kế toán trưởng', email: 'hong.le@namviet.vn' },
  { id: 'procurement', username: 'chi.my', role: 'procurement', name: 'Mỹ Chi', initials: 'MC', roleLabel: 'Phòng mua hàng', email: 'chi.my@namviet.vn' },
  { id: 'pm', username: 'hung.nguyen', role: 'pm', name: 'Nguyễn Văn Hùng', initials: 'NH', roleLabel: 'Quản lý dự án (PM)', email: 'hung.nguyen@namviet.vn' },
  { id: 'hr1', username: 'lan.nguyen', role: 'hr', name: 'Nguyễn Thị Lan', initials: 'NL', roleLabel: 'Nhân sự (HR)', email: 'lan.nguyen@namviet.vn' },
  { id: 'hr2', username: 'minh.tran', role: 'hr', name: 'Trần Văn Minh', initials: 'TM', roleLabel: 'Nhân sự (HR)', email: 'minh.tran@namviet.vn' },
];

export function getHrStaff(): SystemUser[] {
  return systemUsers.filter(u => u.role === 'hr' && isAccountActiveForEmployee(u.employeeId));
}

export function canUserLogin(user: SystemUser): boolean {
  return isAccountActiveForEmployee(user.employeeId);
}

export function getLoginEligibleUsers(): SystemUser[] {
  return systemUsers.filter(canUserLogin);
}

export function getUserByRole(role: string): SystemUser | undefined {
  return systemUsers.find(u => u.role === role);
}

export function getUserByUsername(username: string): SystemUser | undefined {
  return systemUsers.find(u => u.username === username);
}

export function getRolesMap(): Record<string, Pick<SystemUser, 'name' | 'initials' | 'roleLabel' | 'email'>> {
  return Object.fromEntries(
    systemUsers.map(u => [u.role, { name: u.name, initials: u.initials, roleLabel: u.roleLabel, email: u.email }])
  );
}
