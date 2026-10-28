import type { WarehouseProjectApiDto } from '../../types/wms';

export const CSKH_PHASES = [
  { id: 'survey', label: 'Khảo sát và thiết kế' },
  { id: 'fabricate', label: 'Chế tạo thiết bị tại xưởng' },
  { id: 'transport', label: 'Vận chuyển đến công trình' },
  { id: 'mech', label: 'Lắp đặt cơ khí' },
  { id: 'elec', label: 'Lắp đặt điện điều khiển' },
  { id: 'commission', label: 'Vận hành thử' },
] as const;

export type CskhPhaseId = (typeof CSKH_PHASES)[number]['id'];

export const CSKH_BOILER_TYPES = [
  { id: 'cfb', label: 'Tầng sôi' },
  { id: 'chain', label: 'Ghi xích' },
  { id: 'oil', label: 'Đốt dầu' },
  { id: 'gas', label: 'Đốt gas' },
] as const;

export const CSKH_INDUSTRIES = [
  { id: 'industrial', label: 'Công nghiệp' },
  { id: 'food', label: 'Thực phẩm' },
  { id: 'paper', label: 'Giấy' },
  { id: 'textile', label: 'Dệt nhuộm' },
  { id: 'chemical', label: 'Hóa chất' },
  { id: 'other', label: 'Khác' },
] as const;

export const CSKH_PRIORITIES = [
  { id: 'high', label: 'Cao' },
  { id: 'normal', label: 'Bình thường' },
  { id: 'low', label: 'Thấp' },
] as const;

export type CskhProgressStatus = 'on_track' | 'slight_delay' | 'blocked';

export type CskhPhaseMode = 'manual' | 'auto';

export interface CskhCommandProject {
  code: string;
  name: string;
  year: number;
  phaseId: string;
  planPct: number;
  actualPct: number;
  bottleneckCount: number;
  pendingDocs: number;
  warrantyWatch: boolean;
  pmName?: string;
  clientName?: string | null;
  source: 'wms' | 'local';
  boilerType?: string;
  capacity?: string;
  targetCodDate?: string;
}

export interface CskhProjectDraft {
  code: string;
  name: string;
  year: number;
  phaseId: string;
  planPct: number;
  actualPct: number;
  bottleneckCount: number;
  pendingDocs: number;
  warrantyWatch: boolean;
  clientName?: string | null;
  pmName?: string;
  salesName?: string;
  startDate?: string;
  contractSignedDate?: string;
  advanceDate?: string;
  boilerType?: string;
  industry?: string;
  capacity?: string;
  priority?: string;
  acceptanceDate?: string;
  warrantyMonths?: number;
  phaseMode?: CskhPhaseMode;
  notes?: string;
  targetCodDate?: string;
}

export interface CskhProjectRecord extends CskhCommandProject {
  startDate?: string;
  contractSignedDate?: string;
  advanceDate?: string;
  acceptanceDate?: string;
  warrantyMonths?: number;
  phaseMode: CskhPhaseMode;
  salesName?: string;
  boilerType?: string;
  industry?: string;
  capacity?: string;
  priority?: string;
  notes?: string;
  targetCodDate?: string;
}

export interface CskhProjectPatch {
  phaseId?: string;
  phaseMode?: CskhPhaseMode;
  acceptanceDate?: string | null;
  warrantyMonths?: number | null;
  bottleneckCount?: number;
  planPct?: number;
  actualPct?: number;
  name?: string;
  clientName?: string | null;
  pmName?: string;
  salesName?: string;
  startDate?: string | null;
  contractSignedDate?: string | null;
  advanceDate?: string | null;
  boilerType?: string | null;
  industry?: string | null;
  capacity?: string | null;
  priority?: string | null;
  targetCodDate?: string | null;
  notes?: string | null;
}

interface CskhOverlay {
  phaseId?: string;
  planPct?: number;
  actualPct?: number;
  bottleneckCount?: number;
  pendingDocs?: number;
  warrantyWatch?: boolean;
  year?: number;
  acceptanceDate?: string;
  warrantyMonths?: number;
  phaseMode?: CskhPhaseMode;
  name?: string;
  clientName?: string | null;
  pmName?: string;
  salesName?: string;
  startDate?: string;
  contractSignedDate?: string;
  advanceDate?: string;
  boilerType?: string;
  industry?: string;
  capacity?: string;
  priority?: string;
  targetCodDate?: string;
  notes?: string;
}

export interface CskhCommandStore {
  overlays: Record<string, CskhOverlay>;
  localProjects: CskhProjectDraft[];
  deletedCodes?: string[];
}

const STORAGE_KEY = 'nv-cskh-command-center';

export function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function nextProjectCode(existingCodes: string[], now: Date | number = new Date()): string {
  const year = typeof now === 'number' ? now : now.getFullYear();
  const prefix = `DA-${year}-`;
  const used = new Set(existingCodes.map(code => code.trim().toUpperCase()));
  let n = 1;
  while (used.has(`${prefix}${String(n).padStart(3, '0')}`)) n += 1;
  return `${prefix}${String(n).padStart(3, '0')}`;
}

export function listFilterYears(projectYears: number[], now = new Date()): number[] {
  const current = now.getFullYear();
  const years = new Set(projectYears.filter(year => Number.isFinite(year) && year >= 2000 && year <= 2100));
  years.add(current);
  return [...years].sort((a, b) => b - a);
}

export function planPctFromDates(startDate?: string | null, endDate?: string | null, now = Date.now()): number {
  if (!startDate) return 0;
  const start = Date.parse(startDate);
  if (!Number.isFinite(start)) return 0;
  const end = endDate ? Date.parse(endDate) : start + 365 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(end) || end <= start) return now >= start ? 100 : 0;
  return clampPct(((now - start) / (end - start)) * 100);
}

export function actualPctFromStock(actualQty: number, plannedQty: number): number {
  if (!plannedQty || plannedQty <= 0) return 0;
  return clampPct((actualQty / plannedQty) * 100);
}

export function progressDelta(planPct: number, actualPct: number): number {
  return actualPct - planPct;
}

export function progressStatus(project: Pick<CskhCommandProject, 'planPct' | 'actualPct' | 'bottleneckCount'>): CskhProgressStatus {
  if (project.bottleneckCount > 0 || progressDelta(project.planPct, project.actualPct) <= -20) {
    return 'blocked';
  }
  if (progressDelta(project.planPct, project.actualPct) < 0) return 'slight_delay';
  return 'on_track';
}

export function progressStatusCopy(status: CskhProgressStatus): { label: string; badge: 'approved' | 'pending' | 'rejected' } {
  if (status === 'blocked') return { label: 'Đang nghẽn', badge: 'rejected' };
  if (status === 'slight_delay') return { label: 'Chậm nhẹ', badge: 'pending' };
  return { label: 'Đúng / vượt', badge: 'approved' };
}

export function progressTone(status: CskhProgressStatus): 'ok' | 'warn' | 'danger' {
  if (status === 'blocked') return 'danger';
  if (status === 'slight_delay') return 'warn';
  return 'ok';
}

export function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}%`;
}

export function phaseLabel(
  phaseId: string,
  catalog: readonly { id: string; name: string }[] = [],
): string {
  const named = catalog.find(item => item.id === phaseId)?.name;
  if (named) return named;
  return CSKH_PHASES.find(item => item.id === phaseId)?.label ?? phaseId;
}

export function progressGridCopy(status: CskhProgressStatus): { badge: string; summary: string } {
  if (status === 'blocked') return { badge: 'Nghẽn nặng', summary: 'Đang nghẽn' };
  if (status === 'slight_delay') return { badge: 'Chậm nhẹ', summary: 'Chậm nhẹ' };
  return { badge: 'Đúng tiến độ', summary: 'Đúng / vượt tiến độ' };
}

export function loadCommandStore(): CskhCommandStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        overlays: {},
        localProjects: [],
      };
    }
    const parsed = JSON.parse(raw) as CskhCommandStore;
    const local = Array.isArray(parsed.localProjects) ? parsed.localProjects : [];
    return {
      overlays: parsed.overlays ?? {},
      localProjects: local,
      deletedCodes: Array.isArray(parsed.deletedCodes) ? parsed.deletedCodes : [],
    };
  } catch {
    return {
      overlays: {},
      localProjects: [],
    };
  }
}

export function saveCommandStore(store: CskhCommandStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function mergeCommandProjects(
  warehouseProjects: WarehouseProjectApiDto[],
  store: CskhCommandStore,
): CskhCommandProject[] {
  const deleted = new Set(store.deletedCodes ?? []);
  const wmsCodes = new Set(warehouseProjects.map(p => p.projectCode));
  const fromWms = warehouseProjects
    .filter(row => !deleted.has(row.projectCode))
    .map(row => {
      const overlay = store.overlays[row.projectCode] ?? {};
      const year = overlay.year ?? (row.startDate ? new Date(row.startDate).getFullYear() : new Date().getFullYear());
      return {
        code: row.projectCode,
        name: row.projectName,
        year,
        phaseId: row.stage ?? 'survey',
        planPct: overlay.planPct ?? planPctFromDates(row.startDate, row.endDate),
        actualPct: overlay.actualPct ?? actualPctFromStock(row.stockActualQty, row.stockPlannedQty),
        bottleneckCount: overlay.bottleneckCount ?? 0,
        pendingDocs: overlay.pendingDocs ?? 0,
        warrantyWatch: overlay.warrantyWatch ?? false,
        pmName: row.pmName,
        clientName: row.clientName,
        source: 'wms' as const,
        boilerType: overlay.boilerType,
        capacity: overlay.capacity,
        targetCodDate: overlay.targetCodDate,
      };
    });

  const localOnly = store.localProjects
    .filter(row => !wmsCodes.has(row.code) && !deleted.has(row.code))
    .map(row => ({ ...row, source: 'local' as const }));

  return [...fromWms, ...localOnly];
}

export function summarizeCommandKpis(projects: CskhCommandProject[]) {
  const total = projects.length;
  const blocked = projects.filter(p => progressStatus(p) === 'blocked').length;
  const slight = projects.filter(p => progressStatus(p) === 'slight_delay').length;
  const onTrack = projects.filter(p => progressStatus(p) === 'on_track').length;
  const bottleneckOpen = projects.reduce((sum, p) => sum + p.bottleneckCount, 0);
  const pendingDocs = projects.reduce((sum, p) => sum + p.pendingDocs, 0);
  const warrantyWatch = projects.filter(p => p.warrantyWatch).length;
  const planAvg = total ? clampPct(projects.reduce((sum, p) => sum + p.planPct, 0) / total) : 0;
  const actualAvg = total ? clampPct(projects.reduce((sum, p) => sum + p.actualPct, 0) / total) : 0;
  return { total, blocked, slight, onTrack, bottleneckOpen, pendingDocs, warrantyWatch, planAvg, actualAvg };
}

export function upsertOverlay(store: CskhCommandStore, code: string, patch: CskhOverlay): CskhCommandStore {
  return {
    ...store,
    overlays: {
      ...store.overlays,
      [code]: { ...store.overlays[code], ...patch },
    },
  };
}

function applyOverlayPatch(prev: CskhOverlay, patch: CskhProjectPatch): CskhOverlay {
  const next: CskhOverlay = { ...prev };
  if (patch.phaseId !== undefined) next.phaseId = patch.phaseId;
  if (patch.phaseMode !== undefined) next.phaseMode = patch.phaseMode;
  if (patch.acceptanceDate !== undefined) {
    if (patch.acceptanceDate) next.acceptanceDate = patch.acceptanceDate;
    else delete next.acceptanceDate;
  }
  if (patch.warrantyMonths !== undefined) {
    if (patch.warrantyMonths == null) delete next.warrantyMonths;
    else next.warrantyMonths = patch.warrantyMonths;
  }
  if (patch.bottleneckCount !== undefined) next.bottleneckCount = patch.bottleneckCount;
  if (patch.planPct !== undefined) next.planPct = clampPct(patch.planPct);
  if (patch.actualPct !== undefined) next.actualPct = clampPct(patch.actualPct);
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.clientName !== undefined) next.clientName = patch.clientName;
  if (patch.pmName !== undefined) next.pmName = patch.pmName;
  if (patch.salesName !== undefined) next.salesName = patch.salesName;
  if (patch.startDate !== undefined) next.startDate = patch.startDate || undefined;
  if (patch.contractSignedDate !== undefined) next.contractSignedDate = patch.contractSignedDate || undefined;
  if (patch.advanceDate !== undefined) next.advanceDate = patch.advanceDate || undefined;
  if (patch.boilerType !== undefined) next.boilerType = patch.boilerType || undefined;
  if (patch.industry !== undefined) next.industry = patch.industry || undefined;
  if (patch.capacity !== undefined) next.capacity = patch.capacity || undefined;
  if (patch.priority !== undefined) next.priority = patch.priority || undefined;
  if (patch.targetCodDate !== undefined) next.targetCodDate = patch.targetCodDate || undefined;
  if (patch.notes !== undefined) next.notes = patch.notes || undefined;
  return next;
}

function applyDraftPatch(draft: CskhProjectDraft, patch: CskhProjectPatch): CskhProjectDraft {
  const next: CskhProjectDraft = { ...draft };
  if (patch.phaseId !== undefined) next.phaseId = patch.phaseId;
  if (patch.phaseMode !== undefined) next.phaseMode = patch.phaseMode;
  if (patch.acceptanceDate !== undefined) next.acceptanceDate = patch.acceptanceDate || undefined;
  if (patch.warrantyMonths !== undefined) next.warrantyMonths = patch.warrantyMonths ?? undefined;
  if (patch.bottleneckCount !== undefined) next.bottleneckCount = patch.bottleneckCount;
  if (patch.planPct !== undefined) next.planPct = clampPct(patch.planPct);
  if (patch.actualPct !== undefined) next.actualPct = clampPct(patch.actualPct);
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.clientName !== undefined) next.clientName = patch.clientName;
  if (patch.pmName !== undefined) next.pmName = patch.pmName;
  if (patch.salesName !== undefined) next.salesName = patch.salesName;
  if (patch.startDate !== undefined) next.startDate = patch.startDate || undefined;
  if (patch.contractSignedDate !== undefined) next.contractSignedDate = patch.contractSignedDate || undefined;
  if (patch.advanceDate !== undefined) next.advanceDate = patch.advanceDate || undefined;
  if (patch.boilerType !== undefined) next.boilerType = patch.boilerType || undefined;
  if (patch.industry !== undefined) next.industry = patch.industry || undefined;
  if (patch.capacity !== undefined) next.capacity = patch.capacity || undefined;
  if (patch.priority !== undefined) next.priority = patch.priority || undefined;
  if (patch.targetCodDate !== undefined) next.targetCodDate = patch.targetCodDate || undefined;
  if (patch.notes !== undefined) next.notes = patch.notes || undefined;
  return next;
}

export function getProjectRecord(
  warehouseProjects: WarehouseProjectApiDto[],
  store: CskhCommandStore,
  code: string,
): CskhProjectRecord | null {
  const base = mergeCommandProjects(warehouseProjects, store).find(row => row.code === code);
  if (!base) return null;
  const overlay = store.overlays[code] ?? {};
  const local = store.localProjects.find(row => row.code === code);
  const wms = warehouseProjects.find(row => row.projectCode === code);
  return {
    ...base,
    name: wms?.projectName ?? overlay.name ?? local?.name ?? base.name,
    clientName: wms ? wms.clientName : (overlay.clientName !== undefined ? overlay.clientName : (local?.clientName ?? base.clientName)),
    pmName: wms?.pmName ?? overlay.pmName ?? local?.pmName ?? base.pmName,
    startDate: wms?.startDate ?? overlay.startDate ?? local?.startDate ?? undefined,
    contractSignedDate: overlay.contractSignedDate ?? local?.contractSignedDate,
    advanceDate: overlay.advanceDate ?? local?.advanceDate,
    acceptanceDate: overlay.acceptanceDate ?? local?.acceptanceDate,
    warrantyMonths: overlay.warrantyMonths ?? local?.warrantyMonths,
    phaseMode: overlay.phaseMode ?? local?.phaseMode ?? 'auto',
    salesName: overlay.salesName ?? local?.salesName,
    boilerType: overlay.boilerType ?? local?.boilerType ?? base.boilerType,
    industry: overlay.industry ?? local?.industry,
    capacity: overlay.capacity ?? local?.capacity ?? base.capacity,
    priority: overlay.priority ?? local?.priority,
    notes: overlay.notes ?? local?.notes,
    targetCodDate: overlay.targetCodDate ?? local?.targetCodDate ?? base.targetCodDate,
  };
}

export function patchProjectRecord(
  store: CskhCommandStore,
  code: string,
  patch: CskhProjectPatch,
): CskhCommandStore {
  const overlays = {
    ...store.overlays,
    [code]: applyOverlayPatch(store.overlays[code] ?? {}, patch),
  };
  const localProjects = store.localProjects.some(row => row.code === code)
    ? store.localProjects.map(row => (row.code === code ? applyDraftPatch(row, patch) : row))
    : store.localProjects;
  return { ...store, overlays, localProjects };
}

export function deleteProjectRecord(store: CskhCommandStore, code: string): CskhCommandStore {
  const localProjects = store.localProjects.filter(p => p.code !== code);
  const overlays = { ...store.overlays };
  delete overlays[code];
  const deletedCodes = Array.from(new Set([...(store.deletedCodes ?? []), code]));
  return { ...store, localProjects, overlays, deletedCodes };
}

export function addLocalProject(store: CskhCommandStore, draft: CskhProjectDraft): CskhCommandStore {
  const exists = store.localProjects.some(p => p.code === draft.code);
  const nextDeleted = (store.deletedCodes ?? []).filter(c => c !== draft.code);
  return {
    ...store,
    deletedCodes: nextDeleted,
    overlays: {
      ...store.overlays,
      [draft.code]: {
        name: draft.name,
        clientName: draft.clientName,
        pmName: draft.pmName,
        salesName: draft.salesName,
        startDate: draft.startDate,
        contractSignedDate: draft.contractSignedDate,
        advanceDate: draft.advanceDate,
        boilerType: draft.boilerType,
        industry: draft.industry,
        capacity: draft.capacity,
        priority: draft.priority,
        targetCodDate: draft.targetCodDate,
        notes: draft.notes,
        phaseId: draft.phaseId,
        planPct: draft.planPct,
        actualPct: draft.actualPct,
        bottleneckCount: draft.bottleneckCount,
        pendingDocs: draft.pendingDocs,
        warrantyWatch: draft.warrantyWatch,
        year: draft.year,
        acceptanceDate: draft.acceptanceDate,
        warrantyMonths: draft.warrantyMonths,
        phaseMode: draft.phaseMode ?? 'auto',
      },
    },
    localProjects: exists
      ? store.localProjects.map(p => (p.code === draft.code ? draft : p))
      : [...store.localProjects, draft],
  };
}

export function toCsv(projects: CskhCommandProject[]): string {
  const header = ['Ma', 'Ten', 'Nam', 'Giai doan', '% KH', '% TT', 'Chenh lech', 'Trang thai', 'Diem nghen'];
  const lines = projects.map(p => {
    const status = progressStatusCopy(progressStatus(p)).label;
    const phase = phaseLabel(p.phaseId);
    return [p.code, p.name, p.year, phase, p.planPct, p.actualPct, progressDelta(p.planPct, p.actualPct), status, p.bottleneckCount]
      .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',');
  });
  return `\uFEFF${[header.join(','), ...lines].join('\n')}`;
}
