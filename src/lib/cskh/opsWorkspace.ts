import { newMasterId, upsertById, removeById } from './masterData';
import { clampPct, progressDelta, progressStatus, type CskhProgressStatus } from './commandCenter';

export const CSKH_OPS_STORAGE_KEY = 'nv-cskh-ops-workspace';

export const CSKH_SEVERITIES = [
  { id: 'urgent', label: 'Khẩn cấp' },
  { id: 'medium', label: 'Trung bình' },
  { id: 'low', label: 'Thấp' },
] as const;

export type CskhSeverity = (typeof CSKH_SEVERITIES)[number]['id'];
export type CskhBottleneckStatus = 'open' | 'closed';
export type CskhBottleneckFilter = 'all' | 'urgent' | 'medium' | 'low' | 'closed';
export type CskhRequestStatus = 'open' | 'processing' | 'closed';
export type CskhRequestFilter = 'all' | 'open' | 'processing' | 'overdue' | 'closed';
export type CskhReportPeriod = 'week' | 'month';

export interface CskhHistoryNote {
  id: string;
  at: string;
  text: string;
}

export interface CskhBottleneck {
  id: string;
  code: string;
  name: string;
  severity: CskhSeverity;
  status: CskhBottleneckStatus;
  startedAt: string;
  expectedAt: string;
  reason: string;
  departmentId?: string;
  source?: 'manual' | 'gantt' | 'meeting';
  history: CskhHistoryNote[];
  ganttTask?: string;
  pic?: string;
  resolution?: string;
}

export interface CskhMeetingAttachment {
  name: string;
  size?: string;
  url?: string;
  uploadedAt?: string;
}

export interface CskhInternalRequest {
  id: string;
  code?: string;
  name: string;
  requestType?: string;
  body?: string;
  fromDept: string;
  toDept: string;
  dueDate: string;
  priority?: CskhSeverity;
  status: CskhRequestStatus;
  createdAt: string;
  attachments?: CskhMeetingAttachment[];
}

export interface CskhGanttItem {
  id: string;
  name: string;
  days: number;
  startDate: string;
  endDate: string;
  actualPct: number;
  department?: string;
  statusLabel?: string;
  statusTone?: 'ok' | 'danger' | 'warn' | 'muted' | 'info';
  notes?: string;
  wbs?: string;
  level?: number;
  parentId?: string;
  isGroup?: boolean;
}

export interface CskhSnapshotItem {
  id: string;
  name: string;
  planPct: number;
  actualPct: number;
}

export interface CskhProgressSnapshot {
  id: string;
  at: string;
  planPct: number;
  actualPct: number;
  itemCount: number;
  items: CskhSnapshotItem[];
}

export interface CskhMeetingAction {
  id: string;
  name: string;
  dueDate: string;
  done: boolean;
  pic?: string;
  generatedBottleneck?: boolean;
}

export interface CskhMeeting {
  id: string;
  name: string;
  date: string;
  attendees?: string;
  agenda?: string;
  minutes?: string;
  actions: CskhMeetingAction[];
  attachments?: CskhMeetingAttachment[];
}

export interface CskhProjectOps {
  bottlenecks: CskhBottleneck[];
  requests: CskhInternalRequest[];
  ganttItems: CskhGanttItem[];
  snapshots: CskhProgressSnapshot[];
  meetings: CskhMeeting[];
}

export const DEFAULT_SEED_OPS: Record<string, CskhProjectOps> = {
  'LH-01': {
    bottlenecks: [
      {
        id: 'bn-1',
        code: 'BN-104',
        name: 'Cẩu 80 tấn bị hỏng cụm thủy lực tại công trường, tạm dừng cẩu lắp balong trên',
        severity: 'urgent',
        status: 'open',
        startedAt: '2026-09-18',
        expectedAt: '2026-09-23',
        reason: 'Hỏng cụm van thủy lực bơm chính xe cẩu chuyên dụng 80T',
        ganttTask: 'Gantt #3 · Lắp thân lò',
        departmentId: 'tech',
        pic: 'Nguyễn Văn Hải (Chỉ huy trưởng)',
        resolution: 'Thuê cẩu 100T thay thế',
        source: 'gantt',
        history: [
          { id: 'h1', at: '2026-09-18T08:30:00Z', text: 'Phát hiện sự cố rò rỉ dầu thủy lực cẩu' },
          { id: 'h2', at: '2026-09-19T14:00:00Z', text: 'Đã duyệt phương án thuê cẩu 100T từ Hải Phòng' },
        ],
      },
      {
        id: 'bn-2',
        code: 'BN-105',
        name: 'Thiếu 12 thợ hàn 6G áp lực cao, tổ thợ phụ tự ý nghỉ việc không báo trước',
        severity: 'urgent',
        status: 'open',
        startedAt: '2026-09-19',
        expectedAt: '2026-09-24',
        reason: 'Tổ thợ hàn phụ tự ý nghỉ việc',
        ganttTask: 'Gantt #4 · Hàn ống hơi',
        departmentId: 'hr',
        pic: 'Trần Văn C (Phòng Nhân sự)',
        resolution: 'Điều thợ xưởng ra CT',
        source: 'meeting',
        history: [
          { id: 'h3', at: '2026-09-20T10:00:00Z', text: 'Sinh tự động từ cuộc họp giao ban MT-08 khi việc tăng ca bị trễ hạn' },
        ],
      },
      {
        id: 'bn-3',
        code: 'BN-106',
        name: 'CĐT ngâm duyệt phương án thử áp (HS-301) quá 12 ngày so với cam kết',
        severity: 'urgent',
        status: 'open',
        startedAt: '2026-09-10',
        expectedAt: '2026-09-24',
        reason: 'Tư vấn giám sát CĐT chậm ký nháy đệ trình',
        ganttTask: 'Gantt #5 · Thử áp thủy lực',
        departmentId: 'ops',
        pic: 'Phan Văn Nam (Giám đốc Dự án)',
        resolution: 'Họp khẩn cấp CĐT',
        source: 'manual',
        history: [
          { id: 'h4', at: '2026-09-15T09:00:00Z', text: 'Gửi công văn đôn đốc CĐT lần 1' },
          { id: 'h5', at: '2026-09-21T15:30:00Z', text: 'Đã liên hệ trực tiếp Tổng giám đốc CĐT An Phát' },
        ],
      },
      {
        id: 'bn-4',
        code: 'BN-102',
        name: 'Đường nước khử khoáng RO của nhà máy chưa kéo kịp tới bồn chứa tạm',
        severity: 'medium',
        status: 'open',
        startedAt: '2026-09-15',
        expectedAt: '2026-09-26',
        reason: 'CĐT thi công đường ống cấp nước chậm tiến độ',
        ganttTask: 'Gantt #5 · Nguồn nước thử áp',
        departmentId: 'ops',
        pic: 'Đại diện CĐT An Phát',
        resolution: 'Đôn đốc CĐT kéo ống',
        source: 'manual',
        history: [],
      },
    ],
    requests: [
      {
        id: 'rc-1',
        code: 'RC-12',
        name: 'Yêu cầu bổ sung 2 máy hàn TIG công suất lớn',
        requestType: 'Thiết bị thi công',
        fromDept: 'Chỉ huy trưởng Nguyễn Văn Hải',
        toDept: 'Phòng Thiết bị Máy',
        createdAt: '2026-09-22',
        dueDate: '2026-09-23',
        priority: 'urgent',
        status: 'open',
        body: 'Phục vụ tăng ca ca đêm tổ hàn ống hơi bức xạ thân lò',
      },
      {
        id: 'rc-2',
        code: 'RC-11',
        name: 'Bổ sung 50 bao vữa chịu lửa chịu mài mòn cho buồng đốt',
        requestType: 'Vật tư phát sinh',
        fromDept: 'Kỹ sư giám sát Tuấn',
        toDept: 'Phòng Cung ứng',
        createdAt: '2026-09-19',
        dueDate: '2026-09-25',
        priority: 'medium',
        status: 'processing',
        body: 'Do thiết kế điều chỉnh kích thước phễu tro đáy lò',
      },
      {
        id: 'rc-3',
        code: 'RC-09',
        name: 'Yêu cầu làm rõ bản vẽ tuyến ống xả đáy balong dưới',
        requestType: 'Làm rõ thiết kế',
        fromDept: 'Đội lắp kết cấu',
        toDept: 'Phòng Kỹ thuật',
        createdAt: '2026-09-12',
        dueDate: '2026-09-14',
        priority: 'low',
        status: 'closed',
        body: 'Bản vẽ bị vướng cột dầm kết cấu trục C3',
      },
    ],
    ganttItems: [
      {
        id: 'g-1',
        name: '1. Khảo sát & Đệ trình bản vẽ',
        department: 'Phòng Kỹ thuật',
        days: 15,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        actualPct: 100,
        statusLabel: 'Hoàn thành',
        statusTone: 'ok',
        notes: 'Hoàn thành 100% hồ sơ thiết kế kỹ thuật',
      },
      {
        id: 'g-2',
        name: '2. Cuốn Balong & Hàn màng ống',
        department: 'Xưởng Cơ khí',
        days: 45,
        startDate: '2026-06-15',
        endDate: '2026-07-30',
        actualPct: 100,
        statusLabel: 'Đã nghiệm thu',
        statusTone: 'ok',
        notes: 'Balong D1400 đã nghiệm thu xưởng, ống hơi đạt 100%',
      },
      {
        id: 'g-3',
        name: '3. Lắp đặt khung thép & Thân lò',
        department: 'Đội Lắp 1 (CT)',
        days: 40,
        startDate: '2026-07-20',
        endDate: '2026-08-30',
        actualPct: 65,
        statusLabel: 'Nghẽn BN-104',
        statusTone: 'danger',
        notes: 'Đang vướng sự cố cẩu 80T (BN-104)',
      },
      {
        id: 'g-4',
        name: '4. Lắp đặt ống hơi & Van áp lực',
        department: 'Đội Hàn 6G (CT)',
        days: 25,
        startDate: '2026-08-15',
        endDate: '2026-09-10',
        actualPct: 45,
        statusLabel: 'Nghẽn BN-105',
        statusTone: 'danger',
        notes: 'Tiến độ chậm do thiếu 12 thợ hàn 6G áp lực (BN-105)',
      },
      {
        id: 'g-5',
        name: '5. Thử áp lực nước (Hydrostatic)',
        department: 'Đội Kiểm định',
        days: 5,
        startDate: '2026-09-15',
        endDate: '2026-09-20',
        actualPct: 0,
        statusLabel: 'Chờ xong mục 4',
        statusTone: 'warn',
        notes: 'Đang chờ CĐT phê duyệt phương án thử áp HS-301 (BN-106)',
      },
      {
        id: 'g-6',
        name: '6. Đốt lò sấy & Hiệu chỉnh COD',
        department: 'Chuyên gia Vận hành',
        days: 15,
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        actualPct: 0,
        statusLabel: 'Chưa bắt đầu',
        statusTone: 'muted',
        notes: 'Mốc về đích phát điện thương mại theo hợp đồng',
      },
    ],
    snapshots: [
      {
        id: 'snap-w36',
        at: '2026-09-15T09:00:00.000Z',
        planPct: 90,
        actualPct: 58,
        itemCount: 6,
        items: [
          { id: 'g-1', name: 'Thiết kế cơ sở & Bóc tách xưởng', planPct: 100, actualPct: 100 },
          { id: 'g-2', name: 'Gia công chế tạo Balong & Thân lò tại xưởng', planPct: 100, actualPct: 100 },
          { id: 'g-3', name: 'Lắp đặt kết cấu thép & Đặt Balong lên khung móng', planPct: 100, actualPct: 65 },
          { id: 'g-4', name: 'Hàn thân lò, ống sinh hơi & đường ống áp lực', planPct: 70, actualPct: 45 },
          { id: 'g-5', name: 'Thử áp lực thủy lực (Hydrostatic test 1.5x)', planPct: 0, actualPct: 0 },
          { id: 'g-6', name: 'Sấy lò, kiểm định an toàn & Bàn giao COD', planPct: 0, actualPct: 0 },
        ],
      },
      {
        id: 'snap-w35',
        at: '2026-09-08T09:00:00.000Z',
        planPct: 75,
        actualPct: 50,
        itemCount: 6,
        items: [
          { id: 'g-1', name: 'Thiết kế cơ sở & Bóc tách xưởng', planPct: 100, actualPct: 100 },
          { id: 'g-2', name: 'Gia công chế tạo Balong & Thân lò tại xưởng', planPct: 100, actualPct: 90 },
          { id: 'g-3', name: 'Lắp đặt kết cấu thép & Đặt Balong lên khung móng', planPct: 80, actualPct: 50 },
          { id: 'g-4', name: 'Hàn thân lò, ống sinh hơi & đường ống áp lực', planPct: 30, actualPct: 10 },
          { id: 'g-5', name: 'Thử áp lực thủy lực (Hydrostatic test 1.5x)', planPct: 0, actualPct: 0 },
          { id: 'g-6', name: 'Sấy lò, kiểm định an toàn & Bàn giao COD', planPct: 0, actualPct: 0 },
        ],
      },
    ],
    meetings: [
      {
        id: 'mt-1',
        name: 'MT-08 · Giao ban tiến độ tuần 37',
        date: '2026-09-20',
        attendees: 'Ban QLDA Tổng thầu Nam Việt & Đại diện CĐT An Phát, TVGS An Phát, Các tổ trưởng',
        agenda: 'Kiểm điểm tiến độ thân lò, kế hoạch thử áp hydrostatic và giải tỏa các vướng mắc hiện trường',
        minutes: 'Đã thống nhất: CĐT cam kết ký duyệt phương án thử áp trước 24/09; Nam Việt bố trí thêm thợ hàn tăng ca đêm để bù 3 ngày chậm trễ.',
        actions: [
          {
            id: 'act-1',
            name: 'Tăng ca ca đêm tổ hàn ống hơi balong',
            dueDate: '2026-09-21',
            done: false,
            pic: 'Chỉ huy trưởng Nguyễn Văn Hải',
            generatedBottleneck: true,
          },
          {
            id: 'act-2',
            name: 'Bàn giao mặt bằng khu vực xử lý nước cấp RO',
            dueDate: '2026-09-24',
            done: false,
            pic: 'Trưởng BQL CĐT An Phát',
            generatedBottleneck: false,
          },
          {
            id: 'act-3',
            name: 'Phê duyệt phương án thử áp thủy lực (HS-301)',
            dueDate: '2026-09-24',
            done: false,
            pic: 'TVGS An Phát',
            generatedBottleneck: false,
          },
        ],
        attachments: [
          {
            name: 'BB_GiaoBan_Tuan37_AnPhat_Signed.pdf',
            size: '2.8 MB',
            url: '#',
            uploadedAt: '2026-09-20',
          },
          {
            name: 'Hinh_Anh_Hien_Truong_Balong_Tuan37.zip',
            size: '14.5 MB',
            url: '#',
            uploadedAt: '2026-09-20',
          },
        ],
      },
      {
        id: 'mt-2',
        name: 'MT-07 · Giao ban tiến độ tuần 36',
        date: '2026-09-13',
        attendees: 'Nam Việt & CĐT An Phát',
        agenda: 'Rà soát mốc lắp móng lò và gia công balong tại xưởng',
        minutes: 'Nghiệm thu đạt 100% balong Đình Vũ; móng lò cơ bản hoàn thành.',
        actions: [],
        attachments: [
          {
            name: 'Bien_Ban_Hop_Tuan_36_Full.pdf',
            size: '1.9 MB',
            url: '#',
            uploadedAt: '2026-09-13',
          },
        ],
      },
      {
        id: 'mt-3',
        name: 'MT-06 · Họp giải quyết sự cố mặt bằng móng lò',
        date: '2026-09-06',
        attendees: 'Nam Việt, CĐT, Nhà thầu phụ móng',
        agenda: 'Xử lý lún đầu cọc trục A2',
        minutes: 'Đã gia cố ép thêm 2 cọc phụ, nghiệm thu tải trọng đạt yêu cầu.',
        actions: [],
        attachments: [
          {
            name: 'BB_Xu_Ly_Su_Co_Coc_A2_Signed.pdf',
            size: '3.1 MB',
            url: '#',
            uploadedAt: '2026-09-06',
          },
        ],
      },
    ],
  },
};

export interface CskhOpsStore {
  byProject: Record<string, CskhProjectOps>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SNAPSHOTS = 50;

export function emptyProjectOps(projectCode?: string): CskhProjectOps {
  const seed = projectCode && DEFAULT_SEED_OPS[projectCode] ? DEFAULT_SEED_OPS[projectCode] : null;
  if (seed) {
    return {
      bottlenecks: [...seed.bottlenecks],
      requests: [...seed.requests],
      ganttItems: [...seed.ganttItems],
      snapshots: [...seed.snapshots],
      meetings: [...seed.meetings],
    };
  }
  return {
    bottlenecks: [],
    requests: [],
    ganttItems: [],
    snapshots: [],
    meetings: [],
  };
}

export function loadOpsStore(): CskhOpsStore {
  try {
    const raw = localStorage.getItem(CSKH_OPS_STORAGE_KEY);
    if (!raw) {
      return {
        byProject: {
          'LH-01': emptyProjectOps('LH-01'),
        },
      };
    }
    const parsed = JSON.parse(raw) as CskhOpsStore;
    const byProject = parsed.byProject ?? {};
    if (!byProject['LH-01'] || !byProject['LH-01'].bottlenecks || byProject['LH-01'].bottlenecks.length === 0 || !byProject['LH-01'].ganttItems[0]?.department) {
      byProject['LH-01'] = emptyProjectOps('LH-01');
    }
    return { byProject };
  } catch {
    return {
      byProject: {
        'LH-01': emptyProjectOps('LH-01'),
      },
    };
  }
}

export function saveOpsStore(store: CskhOpsStore): void {
  localStorage.setItem(CSKH_OPS_STORAGE_KEY, JSON.stringify(store));
}

export function projectOps(store: CskhOpsStore, code: string): CskhProjectOps {
  return store.byProject[code] ?? emptyProjectOps(code);
}

export function patchProjectOps(store: CskhOpsStore, code: string, next: CskhProjectOps): CskhOpsStore {
  return { byProject: { ...store.byProject, [code]: next } };
}

export function newOpsId(): string {
  return newMasterId();
}

export function nextOpsCode(prefix: string, existing: string[]): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let max = 0;
  for (const code of existing) {
    const match = re.exec(code.trim());
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function severityLabel(id: string): string {
  return CSKH_SEVERITIES.find(item => item.id === id)?.label ?? id;
}

export function daysBetween(fromIso: string, to = Date.now()): number {
  const start = Date.parse(fromIso);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((to - start) / DAY_MS));
}

export function isPastDate(iso: string | undefined, now = Date.now()): boolean {
  if (!iso) return false;
  const due = Date.parse(iso);
  return Number.isFinite(due) && due < now;
}

export function openBottleneckCount(rows: CskhBottleneck[]): number {
  return rows.filter(row => row.status === 'open').length;
}

export function bottleneckKpis(rows: CskhBottleneck[], now = Date.now()) {
  return {
    open: openBottleneckCount(rows),
    urgent: rows.filter(row => row.status === 'open' && row.severity === 'urgent').length,
    overdue: rows.filter(row => row.status === 'open' && isPastDate(row.expectedAt, now)).length,
    closed: rows.filter(row => row.status === 'closed').length,
  };
}

export function filterBottlenecks(rows: CskhBottleneck[], filter: CskhBottleneckFilter): CskhBottleneck[] {
  return rows.filter(row => {
    if (filter === 'closed') return row.status === 'closed';
    if (filter === 'urgent' || filter === 'medium' || filter === 'low') {
      return row.status === 'open' && row.severity === filter;
    }
    return true;
  });
}

export function upsertBottleneck(ops: CskhProjectOps, item: CskhBottleneck): CskhProjectOps {
  return { ...ops, bottlenecks: upsertById(ops.bottlenecks, item) };
}

export function removeBottleneck(ops: CskhProjectOps, id: string): CskhProjectOps {
  return { ...ops, bottlenecks: removeById(ops.bottlenecks, id) };
}

export function closeBottleneck(ops: CskhProjectOps, id: string, at = new Date().toISOString()): CskhProjectOps {
  return {
    ...ops,
    bottlenecks: ops.bottlenecks.map(row => (
      row.id === id
        ? {
            ...row,
            status: 'closed' as const,
            history: [...row.history, { id: newOpsId(), at, text: 'Đã xử lý xong.' }],
          }
        : row
    )),
  };
}

export function appendBottleneckNote(ops: CskhProjectOps, id: string, text: string, at = new Date().toISOString()): CskhProjectOps {
  return {
    ...ops,
    bottlenecks: ops.bottlenecks.map(row => (
      row.id === id
        ? { ...row, history: [...row.history, { id: newOpsId(), at, text }] }
        : row
    )),
  };
}

export function requestRuntimeStatus(row: CskhInternalRequest, now = Date.now()): CskhRequestFilter {
  if (row.status === 'closed') return 'closed';
  if (isPastDate(row.dueDate, now)) return 'overdue';
  return row.status;
}

export function requestKpis(rows: CskhInternalRequest[], now = Date.now()) {
  const open = rows.filter(row => requestRuntimeStatus(row, now) !== 'closed').length;
  const needAction = rows.filter(row => {
    const status = requestRuntimeStatus(row, now);
    return status === 'open' || status === 'overdue';
  }).length;
  return { total: rows.length, open, needAction };
}

export function filterRequests(rows: CskhInternalRequest[], filter: CskhRequestFilter, now = Date.now()): CskhInternalRequest[] {
  return rows.filter(row => {
    const status = requestRuntimeStatus(row, now);
    if (filter === 'all') return true;
    return status === filter;
  });
}

export function upsertRequest(ops: CskhProjectOps, item: CskhInternalRequest): CskhProjectOps {
  return { ...ops, requests: upsertById(ops.requests, item) };
}

export function removeRequest(ops: CskhProjectOps, id: string): CskhProjectOps {
  return { ...ops, requests: removeById(ops.requests, id) };
}

export function requestsToCsv(rows: CskhInternalRequest[]): string {
  const header = ['Ten', 'Tu phong', 'Den phong', 'Han', 'Trang thai'];
  const lines = rows.map(row => (
    [row.name, row.fromDept, row.toDept, row.dueDate, requestRuntimeStatus(row)]
      .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  ));
  return `\uFEFF${[header.join(','), ...lines].join('\n')}`;
}

export function ganttItemPlanPct(item: Pick<CskhGanttItem, 'startDate' | 'endDate'>, now = Date.now()): number {
  const start = Date.parse(item.startDate);
  const end = Date.parse(item.endDate);
  if (!Number.isFinite(start)) return 0;
  if (!Number.isFinite(end) || end <= start) return now >= start ? 100 : 0;
  return clampPct(((now - start) / (end - start)) * 100);
}

export function ganttItemStatus(item: CskhGanttItem, now = Date.now()): CskhProgressStatus | 'done' {
  if (item.actualPct >= 100) return 'done';
  return progressStatus({
    planPct: ganttItemPlanPct(item, now),
    actualPct: item.actualPct,
    bottleneckCount: 0,
  });
}

export function ganttKpis(items: CskhGanttItem[] = [], now = Date.now()) {
  const safeItems = Array.isArray(items) ? items : [];
  const hasGroups = safeItems.some(row => row.isGroup);
  const targetItems = hasGroups ? safeItems.filter(row => !row.isGroup) : safeItems;
  const completed = targetItems.filter(row => row.actualPct >= 100).length;
  const delayed = targetItems.filter(row => {
    const status = ganttItemStatus(row, now);
    return status === 'slight_delay' || status === 'blocked';
  }).length;
  const weight = targetItems.map(row => Math.max(1, row.days));
  const totalW = weight.reduce((sum, value) => sum + value, 0);
  const planPct = totalW
    ? clampPct(targetItems.reduce((sum, row, i) => sum + ganttItemPlanPct(row, now) * (weight[i] ?? 1), 0) / totalW)
    : 0;
  const actualPct = totalW
    ? clampPct(targetItems.reduce((sum, row, i) => sum + row.actualPct * (weight[i] ?? 1), 0) / totalW)
    : 0;
  const lastEnd = safeItems.reduce((max, row) => {
    const end = Date.parse(row.endDate);
    return Number.isFinite(end) && end > max ? end : max;
  }, 0);
  return {
    total: targetItems.length,
    completed,
    delayed,
    planPct,
    actualPct,
    delta: progressDelta(planPct, actualPct),
    expectedEnd: lastEnd ? new Date(lastEnd).toISOString().slice(0, 10) : '',
  };
}

export function upsertGanttItem(ops: CskhProjectOps, item: CskhGanttItem): CskhProjectOps {
  return { ...ops, ganttItems: upsertById(ops.ganttItems, item) };
}

export function removeGanttItem(ops: CskhProjectOps, id: string): CskhProjectOps {
  return { ...ops, ganttItems: removeById(ops.ganttItems, id) };
}

export function captureSnapshot(ops: CskhProjectOps, at = new Date().toISOString(), now = Date.now()): CskhProjectOps {
  const kpis = ganttKpis(ops.ganttItems, now);
  const snapshot: CskhProgressSnapshot = {
    id: newOpsId(),
    at,
    planPct: kpis.planPct,
    actualPct: kpis.actualPct,
    itemCount: ops.ganttItems.length,
    items: ops.ganttItems.map(row => ({
      id: row.id,
      name: row.name,
      planPct: ganttItemPlanPct(row, now),
      actualPct: row.actualPct,
    })),
  };
  return {
    ...ops,
    snapshots: [snapshot, ...ops.snapshots].slice(0, MAX_SNAPSHOTS),
  };
}

export function snapshotCompare(snapshots: CskhProgressSnapshot[]) {
  const current = snapshots[0];
  const previous = snapshots[1];
  return {
    current,
    previous,
    delta: current && previous ? current.actualPct - previous.actualPct : 0,
    count: snapshots.length,
  };
}

export function isoWeekNumber(date: Date): number {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

export function reportWindow(period: CskhReportPeriod, now = new Date()): { start: Date; end: Date; label: string } {
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end, label: `Tháng ${now.getMonth() + 1}/${now.getFullYear()}` };
  }
  const day = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end, label: `Tuần ${isoWeekNumber(now)}` };
}

export function meetingKpis(rows: CskhMeeting[], now = Date.now()) {
  let openActions = 0;
  let overdueActions = 0;
  for (const meeting of rows) {
    for (const action of meeting.actions) {
      if (action.done) continue;
      openActions += 1;
      if (isPastDate(action.dueDate, now)) overdueActions += 1;
    }
  }
  return { total: rows.length, openActions, overdueActions };
}

export function upsertMeeting(ops: CskhProjectOps, item: CskhMeeting): CskhProjectOps {
  return { ...ops, meetings: upsertById(ops.meetings, item) };
}

export function removeMeeting(ops: CskhProjectOps, id: string): CskhProjectOps {
  return { ...ops, meetings: removeById(ops.meetings, id) };
}
