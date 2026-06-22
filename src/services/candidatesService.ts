import { apiClient } from '../lib/apiClient';
import { UI_ERROR } from '../lib/uiMessages';
import { getStoredToken } from '../lib/authSession';
import { fromApi, toApi, compareCandidateAppliedAtNewestFirst, type CandidateApiDto } from '../lib/hrm/candidateApiMapper';
import { createMockLocalStore } from '../lib/mockLocalStore';
import { USE_MOCK, mockDelay } from '../lib/mock';
import type { Candidate, CreateCandidateDto, UpdateCandidateDto } from '../types/hr';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const ENDPOINT = '/api/candidates';

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

export interface CandidateListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  position?: string;
  source?: string;
  hrResponsible?: string;
  status?: string;
}

export interface CandidatePagedResult {
  items: Candidate[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalUnfiltered: number;
  uniquePositionCount: number;
}

interface CandidatePagedApiDto {
  items: CandidateApiDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalUnfiltered: number;
  uniquePositionCount: number;
}

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

export const candidatesService = {
  async list(params: CandidateListParams = {}): Promise<CandidatePagedResult> {
    if (USE_MOCK) return mockDelay(mockList(params));
    const res = await apiClient.get<CandidatePagedApiDto>(ENDPOINT, {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search?.trim() || undefined,
      position: params.position || undefined,
      source: params.source || undefined,
      hrResponsible: params.hrResponsible || undefined,
      status: params.status || undefined,
    });
    return {
      items: res.items.map(fromApi),
      totalCount: res.totalCount,
      page: res.page,
      pageSize: res.pageSize,
      totalPages: res.totalPages,
      totalUnfiltered: res.totalUnfiltered,
      uniquePositionCount: res.uniquePositionCount,
    };
  },

  async getById(id: string): Promise<Candidate> {
    if (USE_MOCK) {
      const found = readStore().find(c => c.id === id);
      if (!found) throw new Error(`Không tìm thấy ứng viên ${id}`);
      return mockDelay(found);
    }
    const dto = await apiClient.get<CandidateApiDto>(`${ENDPOINT}/${id}`);
    return fromApi(dto);
  },

  async create(dto: CreateCandidateDto): Promise<Candidate> {
    if (USE_MOCK) {
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
    const payload = toApi(dto);
    const res = await apiClient.post<CandidateApiDto>(ENDPOINT, payload);
    return fromApi(res);
  },

  async update(id: string, dto: UpdateCandidateDto): Promise<Candidate> {
    if (USE_MOCK) {
      const items = readStore();
      const idx = items.findIndex(c => c.id === id);
      if (idx === -1) throw new Error(`Không tìm thấy ứng viên ${id}`);
      const { appliedAt: _ignored, ...patch } = dto;
      items[idx] = { ...items[idx], ...patch, appliedAt: items[idx].appliedAt };
      writeStore(items);
      return mockDelay(items[idx]);
    }
    const payload = toApi({ ...dto, fullName: dto.fullName ?? '' } as CreateCandidateDto, id);
    const res = await apiClient.put<CandidateApiDto>(`${ENDPOINT}/${id}`, payload);
    return fromApi(res);
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      writeStore(readStore().filter(c => c.id !== id));
      await mockDelay(null);
      return;
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },

  async downloadCv(id: string, fileName?: string): Promise<void> {
    if (USE_MOCK) {
      await mockDelay(null);
      throw new Error(UI_ERROR.loadCv);
    }

    const token = getStoredToken();
    const url = `${BASE_URL}${ENDPOINT}/${id}/cv`;
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text.trim() || `Không thể tải CV (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName?.trim() || `CV-${id}`;
    anchor.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none';
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    }, 500);
  },
};
