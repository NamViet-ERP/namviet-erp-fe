import { apiClient } from '../lib/apiClient';

export interface RecruitmentCalendarEventApiDto {
  candidateId: string;
  fullName: string;
  phone: string;
  email: string;
  position: string;
  source: string;
  appliedAt: string;
  status: string;
  interviewDate: string;
  interviewTime?: string;
  evaluator?: string;
  hrResponsible?: string;
}

const ENDPOINT = '/api/recruitment/calendar';

export const recruitmentCalendarService = {
  list(params: { from?: string; to?: string } = {}) {
    return apiClient.get<RecruitmentCalendarEventApiDto[]>(ENDPOINT, {
      from: params.from || undefined,
      to: params.to || undefined,
    });
  },
};
