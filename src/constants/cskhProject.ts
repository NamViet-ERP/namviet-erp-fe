import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Archive,
  BarChart3,
  CalendarDays,
  FileCheck,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
} from 'lucide-react';
import { CSKH_VIEW_PERMISSION } from './cskh';
import type { SidebarChildItem, SidebarMenuItem } from '../types';

export const CSKH_PROJECT_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard Điều Hành',
    group: 'overview',
    title: 'Bảng Điều Hành Tiến Độ Dự Án',
    subtitle: 'Tổng quan tiến độ mốc EPC, điểm nghẽn và tiến trình dự án.',
    empty: '',
    icon: LayoutDashboard,
  },
  {
    id: 'docs',
    label: 'Hồ sơ & Phản hồi CĐT',
    group: 'ops',
    title: 'Hồ Sơ & Phản Hồi CĐT',
    subtitle: 'Gộp 3 khâu: Soạn duyệt nội bộ ➔ Giao nhận hiện trường ➔ Theo dõi phản hồi SLA CĐT.',
    empty: 'Chưa có hồ sơ đệ trình trên dự án này.',
    icon: FileCheck,
    tag: 'GỘP',
  },
  {
    id: 'docs-archive',
    label: 'Lưu trữ chính thức',
    group: 'ops',
    title: 'Lưu Trữ Chính Thức & Hoàn Công',
    subtitle: 'Hồ sơ nghiệm thu, chứng chỉ CO/CQ, bản vẽ As-built & bảo hành 48 tháng.',
    empty: 'Chưa có hồ sơ lưu trữ chính thức.',
    icon: Archive,
  },
  {
    id: 'bottlenecks',
    label: 'Điểm nghẽn & Tiến độ',
    group: 'other',
    title: 'Điểm Nghẽn & Tiến Độ',
    subtitle: 'Ma trận rủi ro gắn mã Gantt, điều phối người chịu trách nhiệm và giải tỏa đường găng.',
    empty: 'Chưa có điểm nghẽn trên dự án này.',
    icon: AlertTriangle,
  },
  {
    id: 'gantt',
    label: '2 Gantt Chart Tiến độ',
    group: 'other',
    title: '2 Gantt Chart Tiến Độ',
    subtitle: 'Dual Gantt: Hợp đồng CĐT (mốc thanh toán) & Kick-off nội bộ (170 ngày chi tiết).',
    empty: 'Chưa lập Gantt cho dự án này.',
    icon: BarChart3,
  },
  {
    id: 'requests',
    label: 'Trung tâm Yêu cầu',
    group: 'other',
    title: 'Trung Tâm Yêu Cầu (Request Center)',
    subtitle: 'Xử lý phát sinh kỹ thuật, nhân lực thợ hàn 6G, máy móc cẩu từ công trường.',
    empty: 'Chưa có yêu cầu trên dự án này.',
    icon: Lightbulb,
  },
  {
    id: 'meetings',
    label: 'Cuộc họp công trường',
    group: 'other',
    title: 'Cuộc Họp Công Trường & Giao Ban',
    subtitle: 'Biên bản giao ban tuần, danh sách việc cần làm sau họp & tự động sinh điểm nghẽn.',
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
  tag?: string;
}[];

export type CskhProjectTabId = (typeof CSKH_PROJECT_TABS)[number]['id'];

export const CSKH_PROJECT_DEFAULT_TAB: CskhProjectTabId = 'dashboard';

const TAB_IDS = new Set<string>(CSKH_PROJECT_TABS.map(tab => tab.id));
const LEGACY_ALIASES: Record<string, CskhProjectTabId> = {
  'docs-draft': 'docs',
  'docs-handover': 'docs',
  'docs-feedback': 'docs',
};

export function isCskhProjectTab(tab: string | undefined): tab is CskhProjectTabId {
  if (!tab) return false;
  return TAB_IDS.has(tab) || tab in LEGACY_ALIASES;
}

export function normalizeCskhProjectTab(tab: string | undefined): CskhProjectTabId {
  if (!tab) return CSKH_PROJECT_DEFAULT_TAB;
  if (tab in LEGACY_ALIASES) return LEGACY_ALIASES[tab];
  if (TAB_IDS.has(tab)) return tab as CskhProjectTabId;
  return CSKH_PROJECT_DEFAULT_TAB;
}

export function cskhProjectTabMeta(tab: CskhProjectTabId) {
  const norm = normalizeCskhProjectTab(tab);
  return CSKH_PROJECT_TABS.find(item => item.id === norm) ?? CSKH_PROJECT_TABS[0];
}

export function cskhProjectPath(code: string, tab: CskhProjectTabId | string = CSKH_PROJECT_DEFAULT_TAB): string {
  const norm = normalizeCskhProjectTab(tab);
  return `/cskh/projects/${encodeURIComponent(code)}/${norm}`;
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
      label: 'Hồ sơ & Vận hành',
      icon: FileCheck,
      path: cskhProjectPath(code, 'docs'),
      permission: CSKH_VIEW_PERMISSION,
      children: ops.map(tab => leaf(tab, code)),
    },
    {
      id: 'cskh-proj-other',
      label: 'Điều phối & Rủi ro',
      icon: FolderKanban,
      path: cskhProjectPath(code, 'bottlenecks'),
      permission: CSKH_VIEW_PERMISSION,
      children: other.map(tab => leaf(tab, code)),
    },
  ];
}
