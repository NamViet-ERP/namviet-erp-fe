/** Mã vai trò hệ thống — danh sách động từ Thiết lập Admin */
export type SystemUserRole = string;

export interface SystemUser {
  id: string;
  username: string;
  role: SystemUserRole;
  name: string;
  initials: string;
  roleLabel: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  createdAt: string;
  /** Liên kết hồ sơ nhân viên — trạng thái Nghỉ việc sẽ khóa đăng nhập */
  employeeId?: string;
  /** Effective permission keys from role (RBAC pilot). */
  permissions?: string[];
}

export interface CreateSystemUserDto {
  name: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  role: SystemUserRole;
  username?: string;
  /** Liên kết hồ sơ nhân viên khi cấp tài khoản từ HR */
  employeeId?: string;
}
