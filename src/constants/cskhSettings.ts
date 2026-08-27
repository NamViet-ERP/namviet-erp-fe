import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Factory,
  Flag,
  Flame,
  ListOrdered,
} from 'lucide-react';
import { CSKH_VIEW_PERMISSION } from './cskh';
import type { SidebarMenuItem } from '../types';

export const CSKH_SETTINGS_TABS = [
  {
    id: 'industries',
    label: 'Ngành nghề / Lĩnh vực',
    path: '/cskh/settings/industries',
    icon: Factory,
  },
  {
    id: 'boiler-types',
    label: 'Loại lò',
    path: '/cskh/settings/boiler-types',
    icon: Flame,
  },
  {
    id: 'status-priority',
    label: 'Trạng thái & Ưu tiên',
    path: '/cskh/settings/status-priority',
    icon: Flag,
  },
  {
    id: 'schedule',
    label: 'Bảng tiến độ chuẩn',
    path: '/cskh/settings/schedule',
    icon: CalendarDays,
  },
  {
    id: 'phases',
    label: 'Giai đoạn chuẩn dự án',
    path: '/cskh/settings/phases',
    icon: ListOrdered,
  },
] as const satisfies readonly {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}[];

export type CskhSettingsTabId = (typeof CSKH_SETTINGS_TABS)[number]['id'];

export const CSKH_SETTINGS_DEFAULT_TAB = CSKH_SETTINGS_TABS[0].id;

export const cskhSettingsMenu: SidebarMenuItem[] = CSKH_SETTINGS_TABS.map(tab => ({
  id: `cskh-set-${tab.id}`,
  label: tab.label,
  icon: tab.icon,
  path: tab.path,
  permission: CSKH_VIEW_PERMISSION,
}));
