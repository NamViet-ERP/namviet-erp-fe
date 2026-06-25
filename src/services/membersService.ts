import { apiClient } from '../lib/apiClient';
import type { Member } from '../types/members';
import { resolveMock } from '../mocks';

export type CreateMemberDto = Omit<Member, 'id'>;
export type UpdateMemberDto = Partial<CreateMemberDto>;

const ENDPOINT = '/api/members';

export const membersService = {
  async list(): Promise<Member[]> {
    return resolveMock(
      () => import('../mocks/services/membersService.mock').then((m) => m.listMembersMock()),
      () => apiClient.get<Member[]>(ENDPOINT),
    );
  },
  async getById(id: string): Promise<Member> {
    return resolveMock(
      () => import('../mocks/services/membersService.mock').then((m) => m.getMemberMock(id)),
      () => apiClient.get<Member>(`${ENDPOINT}/${id}`),
    );
  },
  async create(dto: CreateMemberDto): Promise<Member> {
    return resolveMock(
      () => import('../mocks/services/membersService.mock').then((m) => m.createMemberMock(dto)),
      () => apiClient.post<Member>(ENDPOINT, dto),
    );
  },
  async update(id: string, dto: UpdateMemberDto): Promise<Member> {
    return resolveMock(
      () => import('../mocks/services/membersService.mock').then((m) => m.updateMemberMock(id, dto)),
      () => apiClient.put<Member>(`${ENDPOINT}/${id}`, dto),
    );
  },
  async remove(id: string): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/membersService.mock').then((m) => m.removeMemberMock(id)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${id}`); },
    );
  },
};
