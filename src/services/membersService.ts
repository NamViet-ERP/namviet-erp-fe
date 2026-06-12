import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { initialMembers, type Member } from '../data/members';

export type CreateMemberDto = Omit<Member, 'id'>;
export type UpdateMemberDto = Partial<CreateMemberDto>;

const ENDPOINT = '/api/members';
let store: Member[] = [...initialMembers];

export const membersService = {
  async list(): Promise<Member[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Member[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Member> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy nhân viên ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Member>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateMemberDto): Promise<Member> {
    if (USE_MOCK) {
      const created: Member = { ...dto, id: mockId('mb') };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Member>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateMemberDto): Promise<Member> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy nhân viên ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Member>(`${ENDPOINT}/${id}`, dto);
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      store = store.filter((x) => x.id !== id);
      await mockDelay(null);
      return;
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
