import type { CreateEmployeeDto, Employee, UpdateEmployeeDto } from '../types/hr';
import { isActiveEmployee } from '../types/hr';

const STORAGE_KEY = 'nv-employee-data';

const MOCK_INITIAL: Employee[] = [
  {
    id: 'emp_1',
    code: 'NV-0001',
    fullName: 'Phan Văn Vỹ',
    gender: 'Nam',
    birthDate: '1990-03-12',
    joinDate: '2022-03-12',
    officialDate: '2022-09-12',
    status: 'Đang làm',
    segment: 'Sản xuất',
    branch: 'Cần Thơ',
    department: 'Kho bãi',
    position: 'Thủ kho',
    personalEmail: 'vy.phan@gmail.com',
    personalPhone: '0901234567',
  },
  {
    id: 'emp_2',
    fullName: 'Nguyễn Thị Mai',
    gender: 'Nữ',
    birthDate: '1995-08-20',
    joinDate: '2024-01-15',
    status: 'Đang làm',
    segment: 'Hành chính',
    branch: 'TP. HCM',
    department: 'Nhân sự',
    position: 'Chuyên viên HCNS',
    personalEmail: 'mai.nguyen@gmail.com',
    personalPhone: '0988776655',
  },
];

function readStore(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Employee[];
  } catch {
    /* ignore */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INITIAL));
  return [...MOCK_INITIAL];
}

function writeStore(items: Employee[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function validateUniqueCode(code: string, excludeId?: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return true;
  return !readStore().some(
    e => e.id !== excludeId && e.code?.trim().toUpperCase() === normalized
  );
}

/** Kiểm tra tài khoản hệ thống còn được đăng nhập (theo hồ sơ nhân viên liên kết). */
export function isAccountActiveForEmployee(employeeId?: string): boolean {
  if (!employeeId) return true;
  const emp = readStore().find(e => e.id === employeeId);
  if (!emp) return true;
  return isActiveEmployee(emp);
}

export function getAccountLockReason(employeeId?: string): string | null {
  if (!employeeId) return null;
  const emp = readStore().find(e => e.id === employeeId);
  if (!emp || isActiveEmployee(emp)) return null;
  if (emp.status === 'Nghỉ việc') return 'Tài khoản đã bị khóa vì nhân viên đã nghỉ việc.';
  return 'Tài khoản không còn hoạt động.';
}

export const employeesService = {
  list(): Employee[] {
    return readStore();
  },

  getById(id: string): Employee | undefined {
    return readStore().find(e => e.id === id);
  },

  create(dto: CreateEmployeeDto): Employee {
    const created: Employee = {
      ...dto,
      id: 'emp_' + Date.now(),
      status: dto.status ?? 'Đang làm',
    };
    const items = readStore();
    items.unshift(created);
    writeStore(items);
    return created;
  },

  update(id: string, dto: UpdateEmployeeDto): Employee {
    if (dto.code?.trim()) {
      if (!validateUniqueCode(dto.code, id)) {
        throw new Error('Mã nhân viên đã tồn tại');
      }
    }
    const items = readStore();
    const idx = items.findIndex(e => e.id === id);
    if (idx === -1) throw new Error(`Không tìm thấy nhân viên ${id}`);

    const next: Employee = { ...items[idx], ...dto };
    if (next.status === 'Nghỉ việc' && !next.resignDate) {
      next.resignDate = new Date().toISOString().slice(0, 10);
    }
    if (next.status === 'Đang làm') {
      next.resignDate = undefined;
    }

    items[idx] = next;
    writeStore(items);
    return items[idx];
  },

  /** Chỉ nhân viên đang làm / thai sản — dùng cho dropdown chọn người. */
  listActive(): Employee[] {
    return readStore().filter(isActiveEmployee);
  },

  getByIdIfActive(id: string): Employee | undefined {
    const emp = readStore().find(e => e.id === id);
    return emp && isActiveEmployee(emp) ? emp : undefined;
  },
};
