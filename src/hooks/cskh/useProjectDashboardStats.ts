import { useState, useEffect } from 'react';
import { projectsService } from '../../services/projectsService';

export function useProjectDashboardStats(code: string) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [urgentBottlenecks, setUrgentBottlenecks] = useState<any[]>([]);
  const [overdueDocs, setOverdueDocs] = useState<any[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    let mounted = true;

    Promise.all([
      projectsService.listConstructionTasks(code).catch(() => []),
      projectsService.listBottlenecks(code).catch(() => []),
      projectsService.listDocuments(code).catch(() => []),
      projectsService.listRequests(code).catch(() => []),
    ]).then(([tasksData, bottlenecksData, docsData, requestsData]) => {
      if (!mounted) return;
      
      setTasks(tasksData.map((t: any) => ({
        id: t.id,
        name: t.name,
        actualPct: t.percentComplete,
        startDate: t.plannedStart,
        endDate: t.plannedEnd,
        notes: t.notes || t.status,
      })));
      setUrgentBottlenecks(bottlenecksData.filter((b: any) => b.status === 'open' && b.severity === 'urgent'));
      
      // We don't have unifiedDocs, so just filter directly
      setOverdueDocs(docsData.filter((d: any) => d.status === 'overdue' || (d.overdueDays != null && d.overdueDays > 0)));
      
      setUrgentRequests(requestsData.filter((r: any) => r.status !== 'closed' && (r.priority === 'urgent' || r.status === 'open')));
      
      setIsLoading(false);
    });

    return () => { mounted = false; };
  }, [code]);

  return { tasks, urgentBottlenecks, overdueDocs, urgentRequests, isLoading };
}
