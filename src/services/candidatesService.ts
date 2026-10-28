import { apiClient, saveBlob } from '../lib/apiClient';
import { fromApi, inputDateToApi, toApi, type CandidateApiDto } from '../lib/hrm/candidateApiMapper';
import type { Candidate, CreateCandidateDto, UpdateCandidateDto, CandidatePipelineStatus } from '../types/hr';
const ENDPOINT = '/api/candidates';

export interface CandidateListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  position?: string;
  source?: string;
  hrResponsible?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CandidatePagedResult {
  items: Candidate[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalUnfiltered: number;
  uniquePositionCount: number;
  newCvCount: number;
}

interface CandidatePagedApiDto {
  items: CandidateApiDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalUnfiltered: number;
  uniquePositionCount: number;
  newCvCount: number;
}

export interface UpdateCandidateStatusPayload {
  status: CandidatePipelineStatus;
  interviewDate?: string;
  interviewTime?: string;
  evaluator?: string;
  startDate?: string;
  offerSalary?: string;
  offerNote?: string;
  rejectReason?: string;
  recruitmentPlanId?: string | null;
}

export type PublicCandidateApplication = Pick<
  CreateCandidateDto,
  | 'fullName'
  | 'phone'
  | 'email'
  | 'gender'
  | 'address'
  | 'birthDate'
  | 'education'
  | 'school'
  | 'major'
  | 'position'
  | 'experience'
  | 'source'
  | 'hrResponsible'
  | 'cvFileName'
  | 'cvFileSize'
  | 'cvFileUrl'
>;

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
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
    });
    return {
      items: res.items.map(fromApi),
      totalCount: res.totalCount,
      page: res.page,
      pageSize: res.pageSize,
      totalPages: res.totalPages,
      totalUnfiltered: res.totalUnfiltered,
      uniquePositionCount: res.uniquePositionCount,
      newCvCount: res.newCvCount ?? 0,
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

  async applyPublic(dto: PublicCandidateApplication): Promise<Candidate> {
    const res = await apiClient.post<CandidateApiDto>(`${ENDPOINT}/apply`, {
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      gender: dto.gender,
      address: dto.address,
      birthDate: inputDateToApi(dto.birthDate),
      education: dto.education,
      school: dto.school,
      major: dto.major,
      position: dto.position,
      experience: dto.experience,
      source: dto.source,
      hrResponsible: dto.hrResponsible,
      cvFileName: dto.cvFileName,
      cvFileSize: dto.cvFileSize,
      cvFileUrl: dto.cvFileUrl,
    });
    return fromApi(res);
  },

  async update(id: string, dto: UpdateCandidateDto): Promise<Candidate> {
    const payload = toApi({ ...dto, fullName: dto.fullName ?? '' } as CreateCandidateDto, id);
    const res = await apiClient.put<CandidateApiDto>(`${ENDPOINT}/${id}`, payload);
    return fromApi(res);
  },

  async updateStatus(id: string, payload: UpdateCandidateStatusPayload): Promise<Candidate> {
    const res = await apiClient.patch<CandidateApiDto>(`${ENDPOINT}/${id}/status`, {
      status: payload.status,
      interviewDate: payload.interviewDate,
      interviewTime: payload.interviewTime,
      evaluator: payload.evaluator,
      startDate: payload.startDate,
      offerSalary: payload.offerSalary,
      offerNote: payload.offerNote,
      rejectReason: payload.rejectReason,
      recruitmentPlanId: payload.recruitmentPlanId,
    });
    return fromApi(res);
  },

  async downloadCv(id: string, fileName?: string): Promise<void> {
    const blob = await apiClient.getBlob(`${ENDPOINT}/${id}/cv`);
    saveBlob(blob, fileName?.trim() || `CV-${id}`);
  },
};
