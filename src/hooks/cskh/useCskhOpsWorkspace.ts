import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/queryKeys';
import {
  cskhService,
  type ProjectBottleneckDto,
  type ProjectRequestCenterDto,
  type ProjectMeetingDto,
} from '../../services/cskhService';
import {
  type CskhProjectOps,
  type CskhBottleneck,
  type CskhInternalRequest,
  type CskhMeeting,
  type CskhSeverity,
  DEFAULT_SEED_OPS,
} from '../../lib/cskh/opsWorkspace';

function mapBottleneckDto(dto: ProjectBottleneckDto): CskhBottleneck {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    severity: dto.severity as CskhSeverity,
    status: dto.status,
    startedAt: dto.startedAt,
    expectedAt: dto.expectedAt,
    reason: dto.reason,
    departmentId: dto.departmentId ?? undefined,
    source: (dto.source as 'manual' | 'gantt' | 'meeting') || 'manual',
    history: (dto.history || []).map(h => ({
      id: h.id,
      at: h.at,
      text: h.text,
    })),
    ganttTask: dto.ganttTask ?? undefined,
    pic: dto.pic ?? undefined,
    resolution: dto.resolution ?? undefined,
  };
}

function mapRequestDto(dto: ProjectRequestCenterDto): CskhInternalRequest {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    requestType: dto.requestType,
    body: dto.body ?? undefined,
    fromDept: dto.fromParty || 'cskh',
    toDept: dto.toDept || 'tech',
    dueDate: dto.dueDate || dto.createdAt,
    priority: dto.priority as CskhSeverity,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

function mapMeetingDto(dto: ProjectMeetingDto, projectCode: string): CskhMeeting {
  return {
    id: dto.id,
    code: dto.code,
    projectCode: dto.projectCode || projectCode,
    name: dto.name,
    date: dto.date,
    attendees: dto.attendees || '',
    agenda: dto.agenda || '',
    minutes: dto.minutes || '',
    actions: (dto.actions || []).map(a => ({
      id: a.id,
      name: a.name,
      dueDate: a.dueDate,
      done: a.done,
      pic: a.pic || '',
      generatedBottleneck: a.generatedBottleneck,
    })),
    attachments: (dto.attachments || []).map(att => ({
      name: att.name,
      size: att.size || undefined,
      url: att.url || undefined,
      uploadedAt: att.uploadedAt || undefined,
    })),
  };
}

export function useCskhOpsWorkspace(projectCode: string) {
  const queryClient = useQueryClient();

  // 1. Fetch Bottlenecks
  const bottlenecksQuery = useQuery({
    queryKey: queryKeys.cskh.bottlenecks(projectCode),
    queryFn: () => cskhService.listBottlenecks(projectCode),
    enabled: Boolean(projectCode),
  });

  // 2. Fetch Requests
  const requestsQuery = useQuery({
    queryKey: queryKeys.cskh.requests(projectCode),
    queryFn: () => cskhService.listRequests(projectCode),
    enabled: Boolean(projectCode),
  });

  // 3. Fetch Meetings
  const meetingsQuery = useQuery({
    queryKey: queryKeys.cskh.meetings(projectCode),
    queryFn: () => cskhService.listMeetings(projectCode),
    enabled: Boolean(projectCode),
  });

  // 4. Fetch Gantt Snapshots from DB
  const snapshotsQuery = useQuery({
    queryKey: queryKeys.cskh.snapshots(projectCode),
    queryFn: () => cskhService.getGanttSnapshots(projectCode),
    enabled: Boolean(projectCode),
  });

  // Assemble unified CskhProjectOps from queries
  const ops: CskhProjectOps = useMemo(() => {
    const bottlenecks = (bottlenecksQuery.data || []).map(mapBottleneckDto);
    const requests = (requestsQuery.data || []).map(mapRequestDto);
    const meetings = (meetingsQuery.data || []).map(m => mapMeetingDto(m, projectCode));

    const dbSnapshots = (snapshotsQuery.data || []).map(s => ({
      id: s.id,
      at: s.createdAt,
      planPct: Number(s.planPct),
      actualPct: Number(s.actualPct),
      itemCount: s.itemCount,
      items: (s.items || []).map(i => ({
        id: i.taskId || i.id,
        name: i.taskName,
        planPct: Number(i.planPct),
        actualPct: Number(i.actualPct),
      })),
    }));

    const seed = DEFAULT_SEED_OPS[projectCode];
    const ganttItems = seed?.ganttItems ?? [];
    const snapshots = dbSnapshots;

    return {
      bottlenecks,
      requests,
      ganttItems,
      snapshots,
      meetings,
      handovers: [],
      weeklyReports: [],
      monthlyReports: [],
    };
  }, [bottlenecksQuery.data, requestsQuery.data, meetingsQuery.data, snapshotsQuery.data, projectCode]);

  // Update handler: performs mutation against backend REST API and invalidates cache
  const update = useCallback(
    async (fn: (current: CskhProjectOps) => CskhProjectOps) => {
      const next = fn(ops);

      // --- Diff Snapshots ---
      const oldSnapIds = new Set(ops.snapshots.map(s => s.id));
      for (const snap of next.snapshots) {
        if (!oldSnapIds.has(snap.id) || snap.id.startsWith('ops-')) {
          cskhService.createGanttSnapshot(projectCode, {
            planPct: snap.planPct,
            actualPct: snap.actualPct,
            items: snap.items.map(it => ({
              taskId: it.id,
              taskName: it.name,
              planPct: it.planPct,
              actualPct: it.actualPct,
            })),
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cskh.snapshots(projectCode) });
          });
        }
      }

      // --- Diff Bottlenecks ---
      const oldB = ops.bottlenecks;
      const nextB = next.bottlenecks;
      const oldBIds = new Set(oldB.map(b => b.id));
      const nextBIds = new Set(nextB.map(b => b.id));

      // Deleted bottlenecks
      for (const b of oldB) {
        if (!nextBIds.has(b.id)) {
          cskhService.deleteBottleneck(projectCode, b.id).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cskh.bottlenecks(projectCode) });
          });
        }
      }

      // Added or modified bottlenecks
      for (const b of nextB) {
        if (!oldBIds.has(b.id) || b.id.startsWith('ops-')) {
          cskhService.createBottleneck(projectCode, {
            name: b.name,
            severity: b.severity,
            startedAt: b.startedAt,
            expectedAt: b.expectedAt,
            reason: b.reason,
            departmentId: b.departmentId ?? null,
            pic: b.pic ?? null,
            resolution: b.resolution ?? null,
            source: b.source || 'manual',
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cskh.bottlenecks(projectCode) });
          });
        } else {
          const prev = oldB.find(x => x.id === b.id);
          if (prev && JSON.stringify(prev) !== JSON.stringify(b)) {
            const noteText = b.history.length > prev.history.length
              ? b.history[b.history.length - 1]?.text
              : null;
            cskhService.updateBottleneck(projectCode, b.id, {
              name: b.name,
              severity: b.severity,
              status: b.status,
              expectedAt: b.expectedAt,
              reason: b.reason,
              departmentId: b.departmentId ?? null,
              pic: b.pic ?? null,
              resolution: b.resolution ?? null,
              noteText,
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.cskh.bottlenecks(projectCode) });
            });
          }
        }
      }

      // --- Diff Requests ---
      const oldR = ops.requests;
      const nextR = next.requests;
      const oldRIds = new Set(oldR.map(r => r.id));
      const nextRIds = new Set(nextR.map(r => r.id));

      for (const r of oldR) {
        if (!nextRIds.has(r.id)) {
          cskhService.deleteRequest(projectCode, r.id).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cskh.requests(projectCode) });
          });
        }
      }

      for (const r of nextR) {
        if (!oldRIds.has(r.id) || r.id.startsWith('ops-')) {
          cskhService.createRequest(projectCode, {
            name: r.name,
            requestType: r.requestType || 'general',
            fromParty: r.fromDept,
            toDept: r.toDept,
            dueDate: r.dueDate,
            priority: r.priority || 'medium',
            body: r.body,
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cskh.requests(projectCode) });
          });
        } else {
          const prev = oldR.find(x => x.id === r.id);
          if (prev && JSON.stringify(prev) !== JSON.stringify(r)) {
            cskhService.updateRequest(projectCode, r.id, {
              status: r.status,
              notes: r.body,
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.cskh.requests(projectCode) });
            });
          }
        }
      }

      // --- Diff Meetings ---
      const oldM = ops.meetings;
      const nextM = next.meetings;
      const oldMIds = new Set(oldM.map(m => m.id));
      const nextMIds = new Set(nextM.map(m => m.id));

      for (const m of oldM) {
        if (!nextMIds.has(m.id)) {
          cskhService.deleteMeeting(projectCode, m.id).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cskh.meetings(projectCode) });
          });
        }
      }

      for (const m of nextM) {
        if (!oldMIds.has(m.id) || m.id.startsWith('ops-')) {
          cskhService.createMeeting(projectCode, {
            name: m.name,
            date: m.date,
            attendees: m.attendees,
            agenda: m.agenda,
            actions: (m.actions || []).map(a => ({
              name: a.name,
              dueDate: a.dueDate,
              pic: a.pic,
            })),
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cskh.meetings(projectCode) });
          });
        } else {
          const prev = oldM.find(x => x.id === m.id);
          if (prev && JSON.stringify(prev) !== JSON.stringify(m)) {
            cskhService.updateMeeting(projectCode, m.id, {
              name: m.name,
              date: m.date,
              attendees: m.attendees,
              agenda: m.agenda,
              actions: (m.actions || []).map(a => ({
                name: a.name,
                dueDate: a.dueDate,
                pic: a.pic,
              })),
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.cskh.meetings(projectCode) });
            });
          }
        }
      }
    },
    [ops, projectCode, queryClient]
  );

  return {
    ops,
    update,
    isLoading: bottlenecksQuery.isLoading || requestsQuery.isLoading || meetingsQuery.isLoading || snapshotsQuery.isLoading,
  };
}
