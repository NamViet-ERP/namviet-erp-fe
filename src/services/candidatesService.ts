import type { Candidate, CreateCandidateDto, UpdateCandidateDto } from '../types/hr';

const STORAGE_KEY = 'nv-candidate-data';

const MOCK_INITIAL: Candidate[] = [
  {
    id: 'cand_1',
    fullName: 'Nguyễn Văn An',
    phone: '0987654321',
    email: 'an.nguyen@gmail.com',
    gender: 'Nam',
    address: 'Q. Ninh Kiều, Cần Thơ',
    birthDate: '1998-05-15',
    education: 'Đại học',
    school: 'ĐH Cần Thơ',
    major: 'Quản trị kinh doanh',
    position: 'Quản lý trang trại',
    experience: '3 năm',
    source: 'TopCV',
    hrResponsible: 'Nguyễn Thị Lan',
    cvFileName: 'CV_NguyenVanAn.pdf',
    cvFileSize: '1.85 MB',
    appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cand_2',
    fullName: 'Lê Thị Bình',
    phone: '0912345678',
    email: 'binh.le@outlook.com',
    gender: 'Nữ',
    address: 'Hải Châu, Đà Nẵng',
    birthDate: '1995-10-24',
    education: 'Đại học',
    school: 'ĐH Kinh tế Đà Nẵng',
    major: 'Kế toán',
    position: 'Kế toán',
    experience: '5 năm',
    source: 'Facebook',
    hrResponsible: 'Trần Văn Minh',
    cvFileName: 'CV_LeThiBinh.docx',
    cvFileSize: '2.12 MB',
    appliedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function readStore(): Candidate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Candidate[];
  } catch {
    /* ignore */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INITIAL));
  return [...MOCK_INITIAL];
}

function writeStore(items: Candidate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const candidatesService = {
  list(): Candidate[] {
    return readStore();
  },

  getById(id: string): Candidate | undefined {
    return readStore().find(c => c.id === id);
  },

  create(dto: CreateCandidateDto): Candidate {
    const created: Candidate = {
      ...dto,
      id: 'cand_' + Date.now(),
      appliedAt: new Date().toISOString(),
    };
    const items = readStore();
    items.unshift(created);
    writeStore(items);
    return created;
  },

  update(id: string, dto: UpdateCandidateDto): Candidate {
    const items = readStore();
    const idx = items.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Không tìm thấy ứng viên ${id}`);
    items[idx] = { ...items[idx], ...dto };
    writeStore(items);
    return items[idx];
  },

  remove(id: string): void {
    writeStore(readStore().filter(c => c.id !== id));
  },
};
