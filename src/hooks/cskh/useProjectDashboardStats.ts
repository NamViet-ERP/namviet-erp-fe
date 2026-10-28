import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../../services/projectsService';
import { queryKeys } from '../../services/queryKeys';
import { useCskhOpsWorkspace } from './useCskhOpsWorkspace';
import { applyDynamicSla, type CskhUnifiedDoc } from '../../lib/cskh/docsPipeline';

export function useProjectDashboardStats(code: string) {
  const workspace = useCskhOpsWorkspace(code);
  const documents = useQuery({
    queryKey: queryKeys.cskh.documents(code),
    queryFn: async (): Promise<CskhUnifiedDoc[]> => (await projectsService.listDocuments(code)).map(doc => applyDynamicSla(doc)),
    enabled: Boolean(code),
  });
  return {
    tasks: workspace.ops.ganttItems,
    urgentBottlenecks: workspace.ops.bottlenecks.filter(row => row.status === 'open' && row.severity === 'urgent'),
    overdueDocs: (documents.data ?? []).filter(row => row.status === 'overdue'),
    urgentRequests: workspace.ops.requests.filter(row => row.status !== 'closed' && (row.priority === 'urgent' || row.status === 'open')),
    isLoading: workspace.isLoading || documents.isLoading,
    isError: workspace.isError || documents.isError,
    refetch: () => Promise.all([workspace.refetch(), documents.refetch()]),
  };
}
