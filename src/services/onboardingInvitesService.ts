import { apiClient } from '../lib/apiClient';

const ENDPOINT = '/api/hr/onboarding-invites';

export interface OnboardingInviteDto {
  id: number;
  expiresAt: string;
  consumedAt?: string | null;
  revokedAt?: string | null;
  createdByUserId: string;
  consumedEmployeeId?: number | null;
  token?: string | null;
}

export interface CreateOnboardingInviteRequest {
  expiresAt?: string;
}

export interface ValidateOnboardingInviteResponse {
  valid: boolean;
  expiresAt?: string | null;
}

export const onboardingInvitesService = {
  list(): Promise<OnboardingInviteDto[]> {
    return apiClient.get<OnboardingInviteDto[]>(ENDPOINT);
  },

  create(request: CreateOnboardingInviteRequest = {}): Promise<OnboardingInviteDto> {
    return apiClient.post<OnboardingInviteDto>(ENDPOINT, request);
  },

  async revoke(id: number): Promise<void> {
    await apiClient.post<void>(`${ENDPOINT}/${encodeURIComponent(id)}/revoke`);
  },

  validate(token: string): Promise<ValidateOnboardingInviteResponse> {
    return apiClient.get<ValidateOnboardingInviteResponse>(`${ENDPOINT}/validate`, { token });
  },
};
