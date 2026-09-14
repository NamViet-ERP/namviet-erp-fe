import { useQuery } from '@tanstack/react-query';
import { projectPersonnelService, type ProjectPersonnelItem } from '../services/projectPersonnelService';
import { queryKeys } from '../services/queryKeys';

export function useProjectPersonnel() {
  return useQuery<ProjectPersonnelItem[]>({
    queryKey: queryKeys.projects.personnel,
    queryFn: () => projectPersonnelService.getPersonnel(),
    staleTime: 5 * 60 * 1000,
  });
}

export type { ProjectPersonnelItem };
