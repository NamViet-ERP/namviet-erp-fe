export interface Member {
  id: string;
  code: string;
  name: string;
  role: 'admin' | 'storekeeper' | 'accountant' | 'procurement' | 'pm';
  roleLabel: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export const memberRoles = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'storekeeper', label: 'Thủ kho (Storekeeper)' },
  { value: 'pm', label: 'Quản lý dự án (PM)' },
  { value: 'accountant', label: 'Kế toán trưởng' },
  { value: 'procurement', label: 'Phòng mua hàng' },
] as const;
