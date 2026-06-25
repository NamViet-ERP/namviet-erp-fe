import { createMockLocalStore } from '../localStore';
import type { SystemRole } from '../../services/rolesService';

export const SEED_ROLES: SystemRole[] = [
  { code: 'admin', label: 'Quản trị viên', isActive: true },
  { code: 'storekeeper', label: 'Thủ kho (Storekeeper)', isActive: true },
  { code: 'accountant', label: 'Kế toán trưởng', isActive: true },
  { code: 'procurement', label: 'Phòng mua hàng', isActive: true },
  { code: 'pm', label: 'Quản lý dự án (PM)', isActive: true },
  { code: 'hr', label: 'Nhân sự (HR)', isActive: true },
];

export const { readStore, writeStore } = createMockLocalStore('nv-system-roles', SEED_ROLES);
