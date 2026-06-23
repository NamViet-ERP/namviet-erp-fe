import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
import type { Member } from '../data/members';

export type CreateMemberDto = Omit<Member, 'id'>;
export type UpdateMemberDto = Partial<CreateMemberDto>;

const ENDPOINT = '/api/members';

export const membersService = {
  async list(): Promise<Member[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/membersService.mock');
      return mock.listMembersMock();
    }
    return apiClient.get<Member[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Member> {
    if (USE_MOCK) {
      const mock = await import('./mocks/membersService.mock');
      return mock.getMemberMock(id);
    }
    return apiClient.get<Member>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateMemberDto): Promise<Member> {
    if (USE_MOCK) {
      const mock = await import('./mocks/membersService.mock');
      return mock.createMemberMock(dto);
    }
    return apiClient.post<Member>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateMemberDto): Promise<Member> {
    if (USE_MOCK) {
      const mock = await import('./mocks/membersService.mock');
      return mock.updateMemberMock(id, dto);
    }
    return apiClient.put<Member>(`${ENDPOINT}/${id}`, dto);
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/membersService.mock');
      return mock.removeMemberMock(id);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
