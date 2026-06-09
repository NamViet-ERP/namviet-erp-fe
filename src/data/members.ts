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

export const initialMembers: Member[] = [
  {
    id: 'm-001',
    code: 'NV-0021',
    name: 'Phan Văn Vỹ',
    role: 'storekeeper',
    roleLabel: 'Thủ kho (Storekeeper)',
    email: 'vy.phan@namviet.vn',
    phone: '0901.234.567',
    status: 'active',
    joinedDate: '12/03/2022'
  },
  {
    id: 'm-002',
    code: 'NV-0043',
    name: 'Nguyễn Văn Hùng',
    role: 'pm',
    roleLabel: 'Quản lý dự án (PM)',
    email: 'hung.nguyen@namviet.vn',
    phone: '0988.765.432',
    status: 'active',
    joinedDate: '15/07/2021'
  },
  {
    id: 'm-003',
    code: 'NV-0012',
    name: 'Lê Thị Hồng',
    role: 'accountant',
    roleLabel: 'Kế toán trưởng',
    email: 'hong.le@namviet.vn',
    phone: '0912.345.678',
    status: 'active',
    joinedDate: '01/01/2020'
  },
  {
    id: 'm-004',
    code: 'NV-0034',
    name: 'Mỹ Chi',
    role: 'procurement',
    roleLabel: 'Phòng mua hàng',
    email: 'chi.my@namviet.vn',
    phone: '0934.567.890',
    status: 'active',
    joinedDate: '10/11/2023'
  },
  {
    id: 'm-005',
    code: 'NV-0089',
    name: 'Trần Huy Hoàng',
    role: 'storekeeper',
    roleLabel: 'Thủ kho (Storekeeper)',
    email: 'hoang.tran@namviet.vn',
    phone: '0909.888.999',
    status: 'active',
    joinedDate: '05/05/2024'
  },
  {
    id: 'm-006',
    code: 'NV-0005',
    name: 'Nguyễn Minh Tuấn',
    role: 'admin',
    roleLabel: 'Quản trị viên',
    email: 'tuan.nguyen@namviet.vn',
    phone: '0902.999.888',
    status: 'active',
    joinedDate: '01/06/2019'
  }
];

export const memberRoles = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'storekeeper', label: 'Thủ kho (Storekeeper)' },
  { value: 'pm', label: 'Quản lý dự án (PM)' },
  { value: 'accountant', label: 'Kế toán trưởng' },
  { value: 'procurement', label: 'Phòng mua hàng' }
];
