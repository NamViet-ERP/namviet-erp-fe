import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProjectPersonnel } from '../useProjectPersonnel';
import { adminUsersService } from '../../services/adminUsersService';

export interface CskhUserOption {
  value: string;
  label: string;
}

export function useCskhUserOptions(extraNames: (string | undefined | null)[] = []): {
  options: CskhUserOption[];
  isLoading: boolean;
} {
  const { data: personnel = [], isLoading: loadingPersonnel } = useProjectPersonnel();

  const { data: adminUsers, isLoading: loadingAdmin } = useQuery({
    queryKey: ['adminUsers', 'cskh-select'],
    queryFn: async () => {
      try {
        const res = await adminUsersService.list({ pageSize: 100 });
        return res?.items ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const options = useMemo(() => {
    // Map theo tên chuẩn hóa (lowercase) để tránh trùng lặp
    const map = new Map<string, { value: string; label: string }>();

    // 1. Nạp từ danh sách người dùng hệ thống (identity.users)
    if (adminUsers && adminUsers.length > 0) {
      for (const u of adminUsers) {
        if (!u.fullName?.trim()) continue;
        const name = u.fullName.trim();
        const key = name.toLowerCase();
        const code = u.employeeCode ? ` (${u.employeeCode})` : '';
        map.set(key, {
          value: name,
          label: `${name}${code}`,
        });
      }
    }

    // 2. Nạp từ API nhân sự dự án (/api/warehouse/projects/personnel)
    if (personnel && personnel.length > 0) {
      for (const p of personnel) {
        if (!p.name?.trim()) continue;
        const name = p.name.trim();
        const key = name.toLowerCase();
        const code = p.code ? ` (${p.code})` : p.email ? ` (${p.email})` : '';
        map.set(key, {
          value: name,
          label: `${name}${code}`,
        });
      }
    }

    // 3. Đảm bảo các tên đang được gán trên form (extraNames) luôn tồn tại trong dropdown
    for (const raw of extraNames) {
      if (!raw?.trim()) continue;
      const name = raw.trim();
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          value: name,
          label: name,
        });
      }
    }

    // Chuyển thành danh sách và sắp xếp theo tiếng Việt
    return Array.from(map.values()).sort((a, b) =>
      a.value.localeCompare(b.value, 'vi'),
    );
  }, [personnel, adminUsers, extraNames]);

  return {
    options,
    isLoading: loadingPersonnel || loadingAdmin,
  };
}
