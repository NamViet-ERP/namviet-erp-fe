import { apiClient } from '../lib/apiClient';
import { getStoredToken } from '../lib/authSession';
import { fromApi, toApi, type CandidateApiDto } from '../lib/hrm/candidateApiMapper';
import type { Candidate, CreateCandidateDto, UpdateCandidateDto } from '../types/hr';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const ENDPOINT = '/api/candidates';

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

export const candidatesService = {
  async list(params: CandidateListParams = {}): Promise<CandidatePagedResult> {
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
    return fromApi(await apiClient.get<CandidateApiDto>(`${ENDPOINT}/${id}`));
  },

  async create(dto: CreateCandidateDto): Promise<Candidate> {
    const payload = toApi(dto);
    const res = await apiClient.post<CandidateApiDto>(ENDPOINT, payload);
    return fromApi(res);
  },

  async update(id: string, dto: UpdateCandidateDto): Promise<Candidate> {
    const payload = toApi({ ...dto, fullName: dto.fullName ?? '' } as CreateCandidateDto, id);
    const res = await apiClient.put<CandidateApiDto>(`${ENDPOINT}/${id}`, payload);
    return fromApi(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },

  async downloadCv(id: string, fileName?: string): Promise<void> {
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
