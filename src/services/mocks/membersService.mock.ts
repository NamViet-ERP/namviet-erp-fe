import { mockDelay, mockId } from '../../lib/mock';
import { initialMembers, type Member } from '../../data/members';
import type { CreateMemberDto, UpdateMemberDto } from '../membersService';

let store: Member[] = [...initialMembers];

export async function listMembersMock(): Promise<Member[]> {
  return mockDelay(store);
}

export async function getMemberMock(id: string): Promise<Member> {
  const found = store.find((x) => x.id === id);
  if (!found) throw new Error(`Không tìm thấy nhân viên ${id}`);
  return mockDelay(found);
}

export async function createMemberMock(dto: CreateMemberDto): Promise<Member> {
  const created: Member = { ...dto, id: mockId('mb') };
  store = [created, ...store];
  return mockDelay(created);
}

export async function updateMemberMock(id: string, dto: UpdateMemberDto): Promise<Member> {
  store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
  const updated = store.find((x) => x.id === id);
  if (!updated) throw new Error(`Không tìm thấy nhân viên ${id}`);
  return mockDelay(updated);
}

export async function removeMemberMock(id: string): Promise<void> {
  store = store.filter((x) => x.id !== id);
  await mockDelay(null);
}
