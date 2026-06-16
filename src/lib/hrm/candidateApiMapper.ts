import type { Candidate, CreateCandidateDto, UpdateCandidateDto } from '../../types/hr';

export interface FeCandidateApiDto {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  address: string;
  birthDate: string;
  education: string;
  school: string;
  major: string;
  position: string;
  experience: string;
  source: string;
  hrResponsible: string;
  cvFileName: string;
  cvFileSize: string;
  cvFileUrl?: string;
  appliedAt: string;
  screeningType?: string;
  targetPosition?: string;
  targetDepartment?: string;
  preScreenResult?: string;
  contactResult?: string;
  interviewDate?: string;
  interviewAttended?: string;
  evaluator?: string;
  evaluationResult?: string;
  offerStatus?: string;
  offerRejectReason?: string;
  startDate?: string;
  onboardingAttended?: string;
  onboardingRejectReason?: string;
}

function apiDateToInput(value?: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

function inputDateToApi(value?: string): string {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return value;
}

function mapEducationFromApi(value?: string): string {
  const v = value?.trim() ?? '';
  const map: Record<string, string> = {
    University: 'Đại học',
    College: 'Cao đẳng',
    HighSchool: 'THPT',
    Other: 'Khác',
  };
  return map[v] ?? v;
}

function mapSourceFromApi(value?: string): string {
  const v = value?.trim() ?? '';
  const map: Record<string, string> = {
    JobPortal24h: '24h - ứng tuyển',
    Internal: 'Khác',
    Referral: 'Khác',
  };
  return map[v] ?? v;
}

function readApiField(dto: FeCandidateApiDto, camel: keyof FeCandidateApiDto, pascal: string): string {
  const raw = dto as FeCandidateApiDto & Record<string, unknown>;
  const v = raw[camel] ?? raw[pascal];
  return typeof v === 'string' ? v.trim() : '';
}

/** Parse ngày nhận hồ sơ (ISO hoặc dd/MM/yyyy[ HH:mm]). */
export function parseCandidateAppliedAt(value?: string): number {
  if (!value?.trim()) return 0;
  const vi = /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value.trim());
  if (vi) {
    const [, d, mo, y, h = '0', mi = '0', s = '0'] = vi;
    return new Date(`${y}-${mo}-${d}T${h.padStart(2, '0')}:${mi.padStart(2, '0')}:${s.padStart(2, '0')}`).getTime();
  }
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function formatCandidateAppliedAt(value?: string): string {
  if (!value?.trim()) return '';
  const t = parseCandidateAppliedAt(value);
  if (!t) return value.trim();
  return new Date(t).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function compareCandidateAppliedAtNewestFirst(
  a: { id: string; appliedAt: string },
  b: { id: string; appliedAt: string },
): number {
  const diff = parseCandidateAppliedAt(b.appliedAt) - parseCandidateAppliedAt(a.appliedAt);
  if (diff !== 0) return diff;
  return Number(b.id) - Number(a.id);
}

export function fromApi(dto: FeCandidateApiDto): Candidate {
  return {
    id: dto.id,
    fullName: dto.fullName,
    phone: dto.phone,
    email: dto.email,
    gender: (dto.gender === 'Nữ' ? 'Nữ' : 'Nam') as Candidate['gender'],
    address: dto.address,
    birthDate: apiDateToInput(dto.birthDate),
    education: mapEducationFromApi(dto.education),
    school: dto.school ?? '',
    major: dto.major ?? '',
    position: dto.position ?? '',
    experience: dto.experience ?? '',
    source: mapSourceFromApi(dto.source),
    hrResponsible: dto.hrResponsible ?? '',
    cvFileName: dto.cvFileName ?? '',
    cvFileSize: dto.cvFileSize ?? '',
    cvFileUrl: dto.cvFileUrl,
    appliedAt: readApiField(dto, 'appliedAt', 'AppliedAt'),
    screeningType: dto.screeningType,
    targetPosition: dto.targetPosition,
    targetDepartment: dto.targetDepartment,
    preScreenResult: dto.preScreenResult,
    contactResult: dto.contactResult,
    interviewDate: dto.interviewDate ? apiDateToInput(dto.interviewDate) : undefined,
    interviewAttended: dto.interviewAttended as Candidate['interviewAttended'],
    evaluator: dto.evaluator,
    evaluationResult: dto.evaluationResult as Candidate['evaluationResult'],
    offerStatus: dto.offerStatus as Candidate['offerStatus'],
    offerRejectReason: dto.offerRejectReason,
    startDate: dto.startDate ? apiDateToInput(dto.startDate) : undefined,
    onboardingAttended: dto.onboardingAttended as Candidate['onboardingAttended'],
    onboardingRejectReason: dto.onboardingRejectReason,
  };
}

export function toApi(candidate: CreateCandidateDto | UpdateCandidateDto, id = ''): FeCandidateApiDto {
  const c = candidate as Partial<Candidate>;
  return {
    id,
    fullName: c.fullName ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    gender: c.gender ?? 'Nam',
    address: c.address ?? '',
    birthDate: inputDateToApi(c.birthDate),
    education: c.education ?? '',
    school: c.school ?? '',
    major: c.major ?? '',
    position: c.position ?? '',
    experience: c.experience ?? '',
    source: c.source ?? '',
    hrResponsible: c.hrResponsible ?? '',
    cvFileName: c.cvFileName ?? '',
    cvFileSize: c.cvFileSize ?? '',
    cvFileUrl: c.cvFileUrl,
    // appliedAt do server ghi khi nộp form — client không gửi khi create/update
    appliedAt: '',
    screeningType: c.screeningType,
    targetPosition: c.targetPosition,
    targetDepartment: c.targetDepartment,
    preScreenResult: c.preScreenResult,
    contactResult: c.contactResult,
    interviewDate: c.interviewDate ? inputDateToApi(c.interviewDate) : undefined,
    interviewAttended: c.interviewAttended,
    evaluator: c.evaluator,
    evaluationResult: c.evaluationResult,
    offerStatus: c.offerStatus,
    offerRejectReason: c.offerRejectReason,
    startDate: c.startDate ? inputDateToApi(c.startDate) : undefined,
    onboardingAttended: c.onboardingAttended,
    onboardingRejectReason: c.onboardingRejectReason,
  };
}
