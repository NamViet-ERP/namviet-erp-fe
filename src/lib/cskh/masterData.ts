export const CSKH_MASTER_STORAGE_KEY = 'nv-cskh-master-data';

export type CskhColorToken = 'ok' | 'warn' | 'danger';

export type CskhTimeRelation = 'from_advance' | 'after_end' | 'end_with';

export interface CskhCatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface CskhColorItem extends CskhCatalogItem {
  color: CskhColorToken;
}

export interface CskhPhaseItem extends CskhCatalogItem {
  order: number;
  active: boolean;
}

export interface CskhScheduleRow {
  id: string;
  name: string;
  days: number;
  relation: CskhTimeRelation;
  dependsOnId: string | null;
  offsetDays: number;
}

export interface CskhCapacityBand {
  id: string;
  minTon: number | null;
  maxTon: number | null;
  rows: CskhScheduleRow[];
}

export interface CskhScheduleCombo {
  boilerTypeId: string;
  priorityId: string;
  bands: CskhCapacityBand[];
}

export interface CskhMasterStore {
  industries: CskhCatalogItem[];
  boilerTypes: CskhCatalogItem[];
  statuses: CskhColorItem[];
  priorities: CskhColorItem[];
  phases: CskhPhaseItem[];
  schedules: CskhScheduleCombo[];
}

export const EMPTY_MASTER_STORE: CskhMasterStore = {
  industries: [],
  boilerTypes: [],
  statuses: [],
  priorities: [],
  phases: [],
  schedules: [],
};

export const CSKH_COLOR_OPTIONS: { value: CskhColorToken; label: string; tone: CskhColorToken }[] = [
  { value: 'ok', label: 'Xanh', tone: 'ok' },
  { value: 'warn', label: 'Cam', tone: 'warn' },
  { value: 'danger', label: 'Đỏ', tone: 'danger' },
];

export const CSKH_TIME_RELATION_OPTIONS: { value: CskhTimeRelation; label: string }[] = [
  { value: 'from_advance', label: 'Từ ngày nhận tạm ứng' },
  { value: 'after_end', label: 'Sau khi hạng mục khác kết thúc' },
  { value: 'end_with', label: 'Kết thúc theo hạng mục khác' },
];

export function newMasterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nextCatalogCode(prefix: string, existing: string[]): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let max = 0;
  for (const code of existing) {
    const match = re.exec(code.trim());
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(2, '0')}`;
}

export function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex(row => row.id === item.id);
  if (index < 0) return [...list, item];
  return list.map((row, i) => (i === index ? item : row));
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter(row => row.id !== id);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asColor(value: unknown): CskhColorToken {
  return value === 'warn' || value === 'danger' ? value : 'ok';
}

function asRelation(value: unknown): CskhTimeRelation {
  return value === 'after_end' || value === 'end_with' ? value : 'from_advance';
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseRows(value: unknown): CskhScheduleRow[] {
  return asArray<Partial<CskhScheduleRow>>(value).map(row => ({
    id: typeof row.id === 'string' && row.id ? row.id : newMasterId(),
    name: typeof row.name === 'string' ? row.name : '',
    days: Number.isFinite(Number(row.days)) ? Number(row.days) : 0,
    relation: asRelation(row.relation),
    dependsOnId: typeof row.dependsOnId === 'string' && row.dependsOnId ? row.dependsOnId : null,
    offsetDays: Number.isFinite(Number(row.offsetDays)) ? Number(row.offsetDays) : 0,
  }));
}

function parseBands(value: unknown): CskhCapacityBand[] {
  return asArray<Partial<CskhCapacityBand>>(value).map(band => ({
    id: typeof band.id === 'string' && band.id ? band.id : newMasterId(),
    minTon: asNullableNumber(band.minTon),
    maxTon: asNullableNumber(band.maxTon),
    rows: parseRows(band.rows),
  }));
}

export function loadMasterStore(): CskhMasterStore {
  try {
    const raw = localStorage.getItem(CSKH_MASTER_STORAGE_KEY);
    if (!raw) return EMPTY_MASTER_STORE;
    const parsed = JSON.parse(raw) as Partial<CskhMasterStore>;
    return {
      industries: asArray(parsed.industries),
      boilerTypes: asArray(parsed.boilerTypes),
      statuses: asArray<CskhColorItem>(parsed.statuses).map(row => ({ ...row, color: asColor(row.color) })),
      priorities: asArray<CskhColorItem>(parsed.priorities).map(row => ({ ...row, color: asColor(row.color) })),
      phases: asArray<CskhPhaseItem>(parsed.phases).map(row => ({
        ...row,
        order: Number.isFinite(Number(row.order)) ? Number(row.order) : 0,
        active: row.active !== false,
      })),
      schedules: asArray<Partial<CskhScheduleCombo>>(parsed.schedules).map(row => ({
        boilerTypeId: typeof row.boilerTypeId === 'string' ? row.boilerTypeId : '',
        priorityId: typeof row.priorityId === 'string' ? row.priorityId : '',
        bands: parseBands(row.bands),
      })),
    };
  } catch {
    return EMPTY_MASTER_STORE;
  }
}

export function saveMasterStore(store: CskhMasterStore): void {
  localStorage.setItem(CSKH_MASTER_STORAGE_KEY, JSON.stringify(store));
}

export function findScheduleCombo(
  store: CskhMasterStore,
  boilerTypeId: string,
  priorityId: string,
): CskhScheduleCombo | undefined {
  return store.schedules.find(
    row => row.boilerTypeId === boilerTypeId && row.priorityId === priorityId,
  );
}

export function upsertScheduleCombo(store: CskhMasterStore, combo: CskhScheduleCombo): CskhMasterStore {
  const rest = store.schedules.filter(
    row => !(row.boilerTypeId === combo.boilerTypeId && row.priorityId === combo.priorityId),
  );
  return { ...store, schedules: [...rest, combo] };
}

export function emptyScheduleCombo(boilerTypeId: string, priorityId: string): CskhScheduleCombo {
  return {
    boilerTypeId,
    priorityId,
    bands: [{ id: newMasterId(), minTon: null, maxTon: null, rows: [] }],
  };
}

export function optionsFromCatalog(
  items: { id: string; name: string }[],
  fallback: readonly { id: string; label: string }[],
): { value: string; label: string }[] {
  if (items.length > 0) {
    return items.map(item => ({ value: item.id, label: item.name }));
  }
  return fallback.map(item => ({ value: item.id, label: item.label }));
}

export function parseCapacityTons(value?: string): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function findCapacityBand(combo: CskhScheduleCombo, tons: number | null): CskhCapacityBand | undefined {
  if (combo.bands.length === 0) return undefined;
  if (tons == null) {
    return combo.bands.find(band => band.minTon == null && band.maxTon == null) ?? combo.bands[0];
  }
  return combo.bands.find(band => {
    const minOk = band.minTon == null || tons >= band.minTon;
    const maxOk = band.maxTon == null || tons <= band.maxTon;
    return minOk && maxOk;
  }) ?? combo.bands[0];
}

export function scheduleRowTimeline(rows: CskhScheduleRow[]): { id: string; startDay: number; endDay: number }[] {
  const byId = new Map(rows.map(row => [row.id, row]));
  const start = new Map<string, number>();
  const end = new Map<string, number>();

  const compute = (id: string, stack: Set<string>): { start: number; end: number } => {
    const cachedStart = start.get(id);
    const cachedEnd = end.get(id);
    if (cachedStart !== undefined && cachedEnd !== undefined) {
      return { start: cachedStart, end: cachedEnd };
    }
    const row = byId.get(id);
    if (!row) return { start: 0, end: 0 };
    if (stack.has(id)) {
      return { start: 0, end: Math.max(0, row.days) };
    }

    stack.add(id);
    const duration = Math.max(0, row.days);
    const depId = row.dependsOnId;
    const hasDep = Boolean(depId && byId.has(depId) && depId !== id);

    let s: number;
    let e: number;
    if (row.relation === 'from_advance' || !hasDep) {
      s = row.offsetDays;
      e = s + duration;
    } else {
      const dep = compute(depId as string, stack);
      if (row.relation === 'after_end') {
        s = dep.end + row.offsetDays;
        e = s + duration;
      } else {
        e = dep.end + row.offsetDays;
        s = e - duration;
      }
    }
    stack.delete(id);
    start.set(id, s);
    end.set(id, e);
    return { start: s, end: e };
  };

  return rows.map(row => {
    const span = compute(row.id, new Set());
    return { id: row.id, startDay: span.start, endDay: span.end };
  });
}

export function scheduleSpan(rows: CskhScheduleRow[]): { timelineDays: number; effortDays: number } {
  const timeline = scheduleRowTimeline(rows);
  const maxEnd = timeline.reduce((max, row) => Math.max(max, row.endDay), 0);
  const effort = rows.reduce((sum, row) => sum + Math.max(0, row.days), 0);
  return {
    timelineDays: Math.max(0, Math.round(maxEnd)),
    effortDays: effort,
  };
}
