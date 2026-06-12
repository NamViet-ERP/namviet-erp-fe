import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService, type CreateMemberDto, type UpdateMemberDto } from '../services/membersService';
import { queryKeys } from '../services/queryKeys';

export function useMembers() {
  return useQuery({ queryKey: queryKeys.members.all, queryFn: () => membersService.list() });
}

export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members.detail(id ?? ''),
    queryFn: () => membersService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMemberDto) => membersService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members.all }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMemberDto }) => membersService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members.all }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members.all }),
  });
}
