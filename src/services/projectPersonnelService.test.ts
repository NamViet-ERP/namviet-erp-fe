import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectPersonnelService } from './projectPersonnelService';
import { apiClient } from '../lib/apiClient';
import { adminUsersService } from './adminUsersService';

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('./adminUsersService', () => ({
  adminUsersService: {
    list: vi.fn(),
  },
}));

vi.mock('./employeesService', () => ({
  employeesService: {
    listActive: vi.fn(),
  },
}));

describe('projectPersonnelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches personnel from /api/warehouse/projects/personnel when available', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { id: '1', name: 'Trần Thị Mai An', code: 'NV002' },
      { id: '2', name: 'Nguyễn Văn Khoa', code: 'NV001' },
    ]);

    const result = await projectPersonnelService.getPersonnel();
    expect(result).toHaveLength(2);
    // Should be sorted alphabetically in Vietnamese
    expect(result[0].name).toBe('Nguyễn Văn Khoa');
    expect(result[1].name).toBe('Trần Thị Mai An');
  });

  it('falls back to adminUsersService when primary endpoint fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('404 Not Found'));
    vi.mocked(adminUsersService.list).mockResolvedValueOnce({
      items: [
        {
          id: 'u1',
          toggleId: 'u1',
          source: 'manual',
          hasAccount: true,
          employeeCode: 'ADMIN01',
          fullName: 'Admin NamViet',
          email: 'admin@namviet.vn',
          phone: '',
          department: '',
          position: '',
          role: 'Admin',
          roleCode: 'admin',
          statusLabel: 'Hoạt động',
          isActive: true,
          canToggle: true,
          canProvision: false,
          createdAt: '',
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      summary: { total: 1, pending: 0, active: 1, inactive: 0 },
    });

    const result = await projectPersonnelService.getPersonnel();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Admin NamViet');
  });

  it('deduplicates items with the same name case-insensitively', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { id: '1', name: 'Nguyễn Văn Khoa' },
      { id: '2', name: 'nguyễn văn khoa' },
    ]);

    const result = await projectPersonnelService.getPersonnel();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nguyễn Văn Khoa');
  });
});
