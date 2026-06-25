import { mockDelay } from '../index';
import { compareCandidateAppliedAtNewestFirst } from '../../lib/hrm/candidateApiMapper';
import { createMockLocalStore } from '../localStore';
import { MOCK_CANDIDATES } from '../data/candidates';
import type { Candidate, CreateCandidateDto, UpdateCandidateDto } from '../../types/hr';
import type { CandidateListParams, CandidatePagedResult } from '../../services/candidatesService';

const { readStore, writeStore } = createMockLocalStore('nv-candidate-data', MOCK_CANDIDATES);

function mockList(params: CandidateListParams): CandidatePagedResult {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const all = readStore();
  const totalUnfiltered = all.length;
  const uniquePositionCount = new Set(all.map(c => c.position?.trim()).filter(Boolean)).size;

  let filtered = all;
  const q = params.search?.trim();
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(c =>
      c.fullName.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower) ||
      c.phone.includes(q),
    );
  }
  if (params.position) filtered = filtered.filter(c => c.position === params.position);
  if (params.source) filtered = filtered.filter(c => c.source === params.source);
  if (params.hrResponsible) filtered = filtered.filter(c => c.hrResponsible === params.hrResponsible);

  filtered = [...filtered].sort(compareCandidateAppliedAtNewestFirst);
  const totalCount = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    totalUnfiltered,
    uniquePositionCount,
  };
}

export async function listCandidatesMock(params: CandidateListParams = {}): Promise<CandidatePagedResult> {
  return mockDelay(mockList(params));
}

export async function getCandidateMock(id: string): Promise<Candidate> {
  const found = readStore().find(c => c.id === id);
  if (!found) throw new Error(`Không tìm thấy ứng viên ${id}`);
  return mockDelay(found);
}

export async function createCandidateMock(dto: CreateCandidateDto): Promise<Candidate> {
  const created: Candidate = {
    ...dto,
    id: 'cand_' + Date.now(),
    appliedAt: new Date().toISOString(),
  };
  const items = readStore();
  items.unshift(created);
  writeStore(items);
  return mockDelay(created);
}

export async function updateCandidateMock(id: string, dto: UpdateCandidateDto): Promise<Candidate> {
  const items = readStore();
  const idx = items.findIndex(c => c.id === id);
  if (idx === -1) throw new Error(`Không tìm thấy ứng viên ${id}`);
  const { appliedAt, ...patch } = dto;
  void appliedAt;
  items[idx] = { ...items[idx], ...patch, appliedAt: items[idx].appliedAt };
  writeStore(items);
  return mockDelay(items[idx]);
}

export async function removeCandidateMock(id: string): Promise<void> {
  writeStore(readStore().filter(c => c.id !== id));
  await mockDelay(null);
}
