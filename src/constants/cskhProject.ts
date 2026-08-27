import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  CalendarDays,
  FileCheck,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Send,
} from 'lucide-react';
import { CSKH_VIEW_PERMISSION } from './cskh';
import type { SidebarChildItem, SidebarMenuItem } from '../types';

export const CSKH_PROJECT_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    group: 'overview',
    title: 'Dashboard dự án',
    subtitle: 'Tổng quan tiến độ, điểm nghẽn và hồ sơ của dự án đang chọn.',
    empty: '',
    icon: LayoutDashboard,
  },
  {
    id: 'docs-draft',
    label: 'Soạn & duyệt nội bộ',
    group: 'ops',
    title: 'Soạn và duyệt nội bộ',
    subtitle: 'Bước 1/4 của pipeline hồ sơ: soạn thảo, xác nhận, trình ký, sẵn sàng gửi.',
    empty: 'Chưa có hồ sơ soạn thảo hoặc duyệt nội bộ trên dự án này.',
    icon: FileCheck,
  },
  {
    id: 'docs-handover',
    label: 'Giao nhận hồ sơ',
    group: 'ops',
    title: 'Giao nhận hồ sơ',
    subtitle: 'Bước 2/4 của pipeline hồ sơ. Nhật ký đi/về, luôn có bằng chứng đã ký.',
    empty: 'Chưa có hồ sơ giao nhận trên dự án này.',
    icon: Send,
  },
  {
    id: 'docs-feedback',
    label: 'Theo dõi phản hồi',
    group: 'ops',
    title: 'Theo dõi phản hồi',
    subtitle: 'Bước 3/4 của pipeline hồ sơ. Hồ sơ đã gửi, đang chờ phản hồi. Escalate nếu quá hạn.',
    empty: 'Chưa có hồ sơ đang theo dõi phản hồi.',
    icon: Bell,
  },
  {
    id: 'docs-archive',
    label: 'Lưu trữ chính thức',
    group: 'ops',
    title: 'Lưu trữ chính thức',
    subtitle: 'Bước 4/4 của pipeline hồ sơ. Hợp đồng, phụ lục và mốc thanh toán.',
    empty: 'Chưa có hồ sơ lưu trữ chính thức.',
    icon: Archive,
  },
  {
    id: 'bottlenecks',
    label: 'Điểm nghẽn và tiến độ',
    group: 'other',
    title: 'Điểm nghẽn và tiến độ',
    subtitle: 'Theo dõi lệch kế hoạch, giao việc và đóng khi đã xử lý xong.',
    empty: 'Chưa có điểm nghẽn trên dự án này.',
    icon: AlertTriangle,
  },
  {
    id: 'requests',
    label: 'Yêu cầu',
    group: 'other',
    title: 'Yêu cầu',
    subtitle: 'Trung tâm yêu cầu nội bộ, điều phối giữa các phòng ban.',
    empty: 'Chưa có yêu cầu trên dự án này.',
    icon: Lightbulb,
  },
  {
    id: 'gantt',
    label: 'Gantt và báo cáo',
    group: 'other',
    title: 'Gantt và báo cáo tiến độ',
    subtitle: 'WBS, mốc, đường găng, snapshot và báo cáo CĐT.',
    empty: 'Chưa lập Gantt cho dự án này.',
    icon: BarChart3,
  },
  {
    id: 'meetings',
    label: 'Cuộc họp',
    group: 'other',
    title: 'Cuộc họp',
    subtitle: 'Agenda, biên bản và hành động sau họp.',
    empty: 'Chưa có cuộc họp trên dự án này.',
    icon: CalendarDays,
  },
] as const satisfies readonly {
  id: string;
  label: string;
  group: 'overview' | 'ops' | 'other';
  title: string;
  subtitle: string;
  empty: string;
  icon: LucideIcon;
}[];

export type CskhProjectTabId = (typeof CSKH_PROJECT_TABS)[number]['id'];

export const CSKH_PROJECT_DEFAULT_TAB: CskhProjectTabId = 'dashboard';

const TAB_IDS = new Set<string>(CSKH_PROJECT_TABS.map(tab => tab.id));

export function isCskhProjectTab(tab: string | undefined): tab is CskhProjectTabId {
  return Boolean(tab && TAB_IDS.has(tab));
}

export function cskhProjectTabMeta(tab: CskhProjectTabId) {
  return CSKH_PROJECT_TABS.find(item => item.id === tab) ?? CSKH_PROJECT_TABS[0];
}

export function cskhProjectPath(code: string, tab: CskhProjectTabId = CSKH_PROJECT_DEFAULT_TAB): string {
  return `/cskh/projects/${encodeURIComponent(code)}/${tab}`;
}

export function cskhProjectCodeFromPath(pathname: string): string | null {
  const match = /^\/cskh\/projects\/([^/]+)/.exec(pathname);
  if (!match?.[1] || pathname.startsWith('/cskh/settings')) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function leaf(tab: (typeof CSKH_PROJECT_TABS)[number], code: string): SidebarChildItem {
  return {
    id: `cskh-proj-${tab.id}`,
    label: tab.label,
    path: cskhProjectPath(code, tab.id),
    icon: tab.icon,
    permission: CSKH_VIEW_PERMISSION,
  };
}

export function cskhProjectMenu(code: string): SidebarMenuItem[] {
  const overview = CSKH_PROJECT_TABS.filter(tab => tab.group === 'overview');
  const ops = CSKH_PROJECT_TABS.filter(tab => tab.group === 'ops');
  const other = CSKH_PROJECT_TABS.filter(tab => tab.group === 'other');
  return [
    {
      id: 'cskh-proj-overview',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      path: cskhProjectPath(code, 'dashboard'),
      permission: CSKH_VIEW_PERMISSION,
      children: overview.map(tab => leaf(tab, code)),
    },
    {
      id: 'cskh-proj-ops',
      label: 'Vận hành',
      icon: FileCheck,
      path: cskhProjectPath(code, 'docs-draft'),
      permission: CSKH_VIEW_PERMISSION,
      children: ops.map(tab => leaf(tab, code)),
    },
    {
      id: 'cskh-proj-other',
      label: 'Khác',
      icon: FolderKanban,
      path: cskhProjectPath(code, 'bottlenecks'),
      permission: CSKH_VIEW_PERMISSION,
      children: other.map(tab => leaf(tab, code)),
    },
  ];
}
