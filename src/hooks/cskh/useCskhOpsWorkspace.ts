import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../../services/projectsService';
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
  type CskhGanttItem,
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

  const tasksQuery = useQuery({
    queryKey: queryKeys.projects.constructionTasks(projectCode),
    queryFn: () => projectsService.listConstructionTasks(projectCode),
    enabled: Boolean(projectCode),
  });
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const canEditGantt = Boolean(projectCode) && tasksQuery.isSuccess && !tasksQuery.isFetching;

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

    const ganttItems: CskhGanttItem[] = (tasksQuery.data ?? []).map(task => ({
      id: task.id, name: task.name,
      startDate: task.plannedStart.slice(0, 10), endDate: task.plannedEnd.slice(0, 10),
      days: Math.max(1, Math.round((Date.parse(task.plannedEnd) - Date.parse(task.plannedStart)) / 86400000) + 1),
      actualPct: task.percentComplete, department: task.department ?? undefined,
      notes: task.notes ?? undefined, wbs: task.wbsCode ?? undefined,
      level: task.level, parentId: task.parentId ?? undefined, isGroup: task.isGroup,
      statusLabel: task.statusLabel ?? undefined, statusTone: task.statusTone as CskhGanttItem['statusTone'],
    }));
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
  }, [bottlenecksQuery.data, requestsQuery.data, meetingsQuery.data, snapshotsQuery.data, tasksQuery.data, projectCode]);

  // A mutation is complete only after the server writes and caches are reconciled.
  const update = useCallback(async (fn: (current: CskhProjectOps) => CskhProjectOps) => {
    if (saving.current) throw new Error('Đang lưu thay đổi. Vui lòng chờ.');
    if (!projectCode) throw new Error('Chưa chọn dự án.');
    const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
    const next = fn(ops);
    const ganttChanged = changed(ops.ganttItems, next.ganttItems);
    const newSnapshots = next.snapshots.filter(s => !ops.snapshots.some(old => old.id === s.id));
    // WBS sync replaces the entire tree. Never derive a write from an unread or failed fallback.
    // Validate before any API call so a mixed update cannot be partially written first.
    if ((ganttChanged || newSnapshots.length > 0) && !canEditGantt) {
      throw new Error('Dữ liệu WBS chưa sẵn sàng. Vui lòng tải lại thành công trước khi lưu tiến độ.');
    }
    saving.current = true;
    setIsSaving(true);
    try {
      for (const snap of newSnapshots) {
        await cskhService.createGanttSnapshot(projectCode, {
          planPct: snap.planPct, actualPct: snap.actualPct,
          items: snap.items.map(item => ({ taskId: item.id, taskName: item.name, planPct: item.planPct, actualPct: item.actualPct })),
        });
      }
      for (const old of ops.bottlenecks.filter(b => !next.bottlenecks.some(row => row.id === b.id))) {
        await cskhService.deleteBottleneck(projectCode, old.id);
      }
      for (const row of next.bottlenecks) {
        const old = ops.bottlenecks.find(b => b.id === row.id);
        const body = { name: row.name, severity: row.severity, startedAt: row.startedAt,
          expectedAt: row.expectedAt, reason: row.reason, departmentId: row.departmentId ?? null,
          ganttTask: row.ganttTask ?? null, pic: row.pic ?? null, resolution: row.resolution ?? null };
        if (!old) await cskhService.createBottleneck(projectCode, { ...body, source: row.source || 'manual' });
        else if (changed(old, row)) await cskhService.updateBottleneck(projectCode, row.id, {
          ...body, status: row.status,
          noteText: row.history.length > old.history.length ? row.history[row.history.length - 1]?.text : null,
        });
      }
      for (const old of ops.requests.filter(r => !next.requests.some(row => row.id === r.id))) {
        await cskhService.deleteRequest(projectCode, old.id);
      }
      for (const row of next.requests) {
        const old = ops.requests.find(r => r.id === row.id);
        const body = { name: row.name, requestType: row.requestType || 'general', fromParty: row.fromDept,
          toDept: row.toDept, dueDate: row.dueDate, priority: row.priority || 'medium', body: row.body ?? '' };
        if (!old) await cskhService.createRequest(projectCode, body);
        else if (changed(old, row)) await cskhService.updateRequest(projectCode, row.id, { ...body, status: row.status });
      }
      for (const old of ops.meetings.filter(m => !next.meetings.some(row => row.id === m.id))) {
        await cskhService.deleteMeeting(projectCode, old.id);
      }
      for (const row of next.meetings) {
        const old = ops.meetings.find(m => m.id === row.id);
        const body = { name: row.name, date: row.date, attendees: row.attendees, agenda: row.agenda,
          minutes: row.minutes ?? '', attachments: row.attachments,
          actions: row.actions.map(action => ({ ...action, id: old?.actions.some(previous => previous.id === action.id) ? action.id : undefined })) };
        if (!old) await cskhService.createMeeting(projectCode, body);
        else if (changed(old, row)) {
          // Dedicated endpoints preserve the identity and other fields of existing actions.
          const withoutMinutesAndDone = (meeting: CskhMeeting) => ({ ...meeting, minutes: undefined,
            actions: meeting.actions.map(action => ({ ...action, done: undefined })) });
          if (changed(withoutMinutesAndDone(old), withoutMinutesAndDone(row))) {
            await cskhService.updateMeeting(projectCode, row.id, body);
          } else {
            if (old.minutes !== row.minutes) await cskhService.updateMeetingMinutes(projectCode, row.id, { minutes: row.minutes ?? '' });
            for (const action of row.actions) {
              if (old.actions.find(a => a.id === action.id)?.done !== action.done) {
                await cskhService.toggleMeetingAction(projectCode, row.id, action.id, action.done);
              }
            }
          }
        }
      }
      if (ganttChanged) {
        await projectsService.syncConstructionTasks(projectCode, next.ganttItems.map((task, index) => ({
          id: ops.ganttItems.some(previous => previous.id === task.id) ? task.id : undefined,
          name: task.name, plannedStart: task.startDate, plannedEnd: task.endDate,
          percentComplete: task.actualPct, sortOrder: index, wbsCode: task.wbs,
          level: task.level, parentId: task.parentId, isGroup: task.isGroup,
          department: task.department, statusLabel: task.statusLabel, statusTone: task.statusTone, notes: task.notes,
        })));
      }
    } finally {
      // A multi-resource operation may partially succeed: always reload the authoritative state.
      try { await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cskh.bottlenecks(projectCode) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cskh.requests(projectCode) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cskh.meetings(projectCode) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cskh.snapshots(projectCode) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.constructionTasks(projectCode) }),
      ]); } finally {
        saving.current = false;
        setIsSaving(false);
      }
    }
  }, [ops, projectCode, queryClient, canEditGantt]);

  const queries = [bottlenecksQuery, requestsQuery, meetingsQuery, snapshotsQuery, tasksQuery];
  return {
    ops, update, isSaving, canEditGantt,
    isLoading: queries.some(query => query.isLoading),
    isError: queries.some(query => query.isError),
    error: queries.find(query => query.isError)?.error,
    refetch: () => Promise.all(queries.map(query => query.refetch())),
    bottlenecksQuery,
    tasksQuery,
  };
}
