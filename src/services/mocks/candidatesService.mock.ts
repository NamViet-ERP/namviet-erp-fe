import { mockDelay } from '../../lib/mock';
import { compareCandidateAppliedAtNewestFirst } from '../../lib/hrm/candidateApiMapper';
import { createMockLocalStore } from '../../lib/mockLocalStore';
import type { Candidate, CreateCandidateDto, UpdateCandidateDto } from '../../types/hr';
import type { CandidateListParams, CandidatePagedResult } from '../candidatesService';

const MOCK_INITIAL: Candidate[] = [
  {
    id: 'cand_1',
    fullName: 'Nguyễn Văn An',
    phone: '0987654321',
    email: 'an.nguyen@gmail.com',
    gender: 'Nam',
    address: 'Q. Ninh Kiều, Cần Thơ',
    birthDate: '1998-05-15',
    education: 'Đại học',
    school: 'ĐH Cần Thơ',
    major: 'Quản trị kinh doanh',
    position: 'Kế toán',
    experience: '3 năm',
    source: 'TopCV',
    hrResponsible: 'Thùy Dương',
    cvFileName: 'CV_NguyenVanAn.pdf',
    cvFileSize: '1.85 MB',
    appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cand_2',
    fullName: 'Lê Thị Bình',
    phone: '0912345678',
    email: 'binh.le@outlook.com',
    gender: 'Nữ',
    address: 'Hải Châu, Đà Nẵng',
    birthDate: '1995-10-24',
    education: 'Đại học',
    school: 'ĐH Kinh tế Đà Nẵng',
    major: 'Kế toán',
    position: 'Kế toán',
    experience: '5 năm',
    source: 'Facebook',
    hrResponsible: 'Phương Thảo',
    cvFileName: 'CV_LeThiBinh.docx',
    cvFileSize: '2.12 MB',
    appliedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const { readStore, writeStore } = createMockLocalStore('nv-candidate-data', MOCK_INITIAL);

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
