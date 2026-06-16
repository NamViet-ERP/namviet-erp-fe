import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sortVi } from '../lib/sortVi';
import { hrStaffService } from '../services/hrStaffService';
import { queryKeys } from '../services/queryKeys';

export function useHrStaff() {
  return useQuery({
    queryKey: queryKeys.hrStaff.all,
    queryFn: () => hrStaffService.list(),
  });
}

export function useHrStaffSelectOptions(currentValue?: string) {
  const { data: hrStaff = [] } = useHrStaff();
  return useMemo(() => {
    const names = hrStaff.map(h => h.name);
    const current = currentValue?.trim();
    if (current && !names.includes(current)) names.push(current);
    return sortVi(names);
  }, [hrStaff, currentValue]);
}
