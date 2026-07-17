import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  onboardingInvitesService,
  type CreateOnboardingInviteRequest,
} from '../services/onboardingInvitesService';
import { queryKeys } from '../services/queryKeys';

export function useOnboardingInvites() {
  return useQuery({
    queryKey: queryKeys.onboardingInvites.all,
    queryFn: () => onboardingInvitesService.list(),
  });
}

export function useValidateOnboardingInvite(token: string) {
  return useQuery({
    queryKey: queryKeys.onboardingInvites.validate(token),
    queryFn: () => onboardingInvitesService.validate(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useCreateOnboardingInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateOnboardingInviteRequest) =>
      onboardingInvitesService.create(request),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.onboardingInvites.all }),
  });
}

export function useRevokeOnboardingInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onboardingInvitesService.revoke(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.onboardingInvites.all }),
  });
}
