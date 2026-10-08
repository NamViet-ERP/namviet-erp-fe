import { useState, useCallback, useMemo } from 'react';
import { projectsService } from '../../services/projectsService';
import { showToast } from '../../components/ui/Toast';
import { toIsoDate } from '../../lib/dates';

export interface CskhMeetingAction {
  id: string;
  name: string;
  dueDate: string;
  done: boolean;
  pic: string;
  generatedBottleneck: boolean;
}

export interface CskhMeetingAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
}

export interface CskhMeeting {
  id: string;
  code: string;
  projectCode: string;
  name: string;
  date: string;
  attendees: string;
  agenda: string;
  minutes: string;
  actions: CskhMeetingAction[];
  attachments: CskhMeetingAttachment[];
}

export function isPastDate(iso: string) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export function overdueActionCount(row: CskhMeeting): number {
  return (row.actions || []).filter(action => !action.done && isPastDate(action.dueDate)).length;
}

export function useMeetingsData(projectCode: string) {
  const [meetings, setMeetings] = useState<CskhMeeting[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsService.listMeetings(projectCode);
      setMeetings(data || []);
    } catch {
      showToast('error', 'Lỗi tải danh sách cuộc họp');
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  const kpis = useMemo(() => {
    const total = meetings.length;
    let openActions = 0;
    let overdueActions = 0;
    meetings.forEach(m => {
      (m.actions || []).forEach(a => {
        if (!a.done) {
          openActions++;
          if (isPastDate(a.dueDate)) overdueActions++;
        }
      });
    });
    return { total, openActions, overdueActions };
  }, [meetings]);

  const createMeeting = async (form: Partial<CskhMeeting>) => {
    await projectsService.createMeeting(projectCode, {
      name: form.name?.trim(),
      date: form.date,
      attendees: form.attendees?.trim(),
      agenda: form.agenda?.trim(),
      attachments: form.attachments || [],
    });
    showToast('success', 'Đã tạo biên bản giao ban');
    await loadData();
  };

  const updateMeeting = async (id: string, form: Partial<CskhMeeting>) => {
    await projectsService.updateMeeting(projectCode, id, {
      name: form.name?.trim(),
      date: form.date,
      attendees: form.attendees?.trim(),
      agenda: form.agenda?.trim(),
      attachments: form.attachments || [],
    });
    showToast('success', 'Đã cập nhật cuộc họp');
    await loadData();
  };

  const deleteMeeting = async (id: string) => {
    await projectsService.deleteMeeting(projectCode, id);
    showToast('success', 'Đã xóa biên bản');
    await loadData();
  };

  const updateMinutes = async (id: string, minutes: string) => {
    await projectsService.updateMeetingMinutes(projectCode, id, { minutes });
    showToast('success', 'Đã lưu biên bản chi tiết');
    await loadData();
  };

  const toggleAction = async (meetingId: string, actionId: string, done: boolean) => {
    await projectsService.toggleMeetingAction(projectCode, meetingId, actionId, { done });
    await loadData();
  };

  const triggerBottleneck = async (meetingId: string, action: CskhMeetingAction, meetingCode: string) => {
    await projectsService.createBottleneck(projectCode, {
      name: `[Họp] ${action.name}`,
      severity: 'medium',
      startedAt: toIsoDate(new Date()),
      expectedAt: action.dueDate,
      reason: 'Quá hạn / Vướng mắc từ cuộc họp ' + meetingCode,
      pic: action.pic,
      source: 'meeting',
    });
    await projectsService.toggleMeetingAction(projectCode, meetingId, action.id, { generatedBottleneck: true });
    showToast('success', 'Đã sinh điểm nghẽn thành công');
    await loadData();
  };

  return {
    meetings,
    loading,
    kpis,
    loadData,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateMinutes,
    toggleAction,
    triggerBottleneck,
  };
}
