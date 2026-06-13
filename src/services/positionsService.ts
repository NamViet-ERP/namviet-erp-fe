import { RECRUITMENT_POSITIONS } from '../constants/recruitment';

export interface RecruitmentPosition {
  name: string;
  isActive: boolean;
}

const STORAGE_KEY = 'nv-recruitment-positions-v2';

function readStore(): RecruitmentPosition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RecruitmentPosition[];
  } catch {
    /* ignore */
  }
  const initial: RecruitmentPosition[] = RECRUITMENT_POSITIONS.map(name => ({
    name,
    isActive: true
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function writeStore(items: RecruitmentPosition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const positionsService = {
  list(): RecruitmentPosition[] {
    return readStore();
  },

  listActiveNames(): string[] {
    return readStore()
      .filter(p => p.isActive)
      .map(p => p.name);
  },

  create(name: string): RecruitmentPosition {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Tên vị trí không được để trống');
    const items = readStore();
    if (items.some(item => item.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Vị trí này đã tồn tại');
    }
    const created: RecruitmentPosition = { name: trimmed, isActive: true };
    items.push(created);
    writeStore(items);
    return created;
  },

  toggleStatus(name: string): RecruitmentPosition {
    const items = readStore();
    const idx = items.findIndex(item => item.name === name);
    if (idx === -1) throw new Error(`Không tìm thấy vị trí "${name}"`);
    items[idx].isActive = !items[idx].isActive;
    writeStore(items);
    return items[idx];
  },

  remove(name: string): void {
    const items = readStore();
    const updated = items.filter(item => item.name !== name);
    writeStore(updated);
  }
};
