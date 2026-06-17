import type { CreateEmployeeDto, Employee, UpdateEmployeeDto } from '../../types/hr';

/** API payload shape (camelCase from ASP.NET JSON). */
export interface EmployeeApiDto {
  id: string;
  code?: string;
  fullName: string;
  gender: string;
  birthDate: string;
  joinDate: string;
  officialDate?: string;
  status: string;
  resignDate?: string;
  segment?: string;
  branch?: string;
  department?: string;
  position?: string;
  personalEmail?: string;
  personalPhone?: string;
  permanentAddress?: string;
  temporaryAddress?: string;
  education?: string;
  school?: string;
  major?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  hadSocialInsurance?: string;
  siNumber?: string;
  cccdNumber?: string;
  cccdIssueDate?: string;
  cccdIssuePlace?: string;
  cmndNumber?: string;
  cmndIssueDate?: string;
  cmndIssuePlace?: string;
  maritalStatus?: string;
  taxCode?: string;
  photoUrl?: string;
  cccdFrontUrl?: string;
  cccdBackUrl?: string;
  degreePhotoUrl?: string;
  linkedAccountStatus?: string;
}

function apiDateToInput(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function inputDateToApi(value?: string): string {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return value;
}

function urlToAttachment(url?: string, fallbackName = 'file') {
  if (!url) return undefined;
  const name = url.split('/').pop() ?? fallbackName;
  return { fileName: name, fileSize: '', previewUrl: resolveMediaUrl(url) };
}

export function resolveMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:'))
    return url;
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

export function fromApi(dto: EmployeeApiDto): Employee {
  return {
    id: dto.id,
    code: dto.code?.trim() || undefined,
    fullName: dto.fullName,
    gender: dto.gender as Employee['gender'],
    birthDate: apiDateToInput(dto.birthDate) ?? dto.birthDate,
    joinDate: apiDateToInput(dto.joinDate) ?? dto.joinDate,
    officialDate: apiDateToInput(dto.officialDate),
    status: dto.status as Employee['status'],
    resignDate: apiDateToInput(dto.resignDate),
    segment: dto.segment,
    branch: dto.branch,
    department: dto.department,
    position: dto.position,
    personalEmail: dto.personalEmail,
    personalPhone: dto.personalPhone,
    permanentAddress: dto.permanentAddress,
    temporaryAddress: dto.temporaryAddress,
    education: dto.education,
    school: dto.school,
    major: dto.major,
    bankAccountName: dto.bankAccountName,
    bankAccountNumber: dto.bankAccountNumber,
    bankName: dto.bankName,
    bankBranch: dto.bankBranch,
    hadSocialInsurance: dto.hadSocialInsurance as Employee['hadSocialInsurance'],
    siNumber: dto.siNumber,
    cmndNumber: dto.cmndNumber,
    cmndIssueDate: apiDateToInput(dto.cmndIssueDate),
    cmndIssuePlace: dto.cmndIssuePlace,
    cccdNumber: dto.cccdNumber,
    cccdIssueDate: apiDateToInput(dto.cccdIssueDate),
    cccdIssuePlace: dto.cccdIssuePlace,
    maritalStatus: dto.maritalStatus,
    taxCode: dto.taxCode,
    profilePhoto: urlToAttachment(dto.photoUrl, 'profile'),
    cccdFront: urlToAttachment(dto.cccdFrontUrl, 'cccd-front'),
    cccdBack: urlToAttachment(dto.cccdBackUrl, 'cccd-back'),
    degreePhoto: urlToAttachment(dto.degreePhotoUrl, 'degree'),
    linkedAccountStatus: (dto.linkedAccountStatus as Employee['linkedAccountStatus']) ?? undefined,
  };
}

function toStoredUrl(preview?: string): string | undefined {
  if (!preview) return undefined;
  if (preview.startsWith('/uploads')) return preview;
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  if (base && preview.startsWith(base)) return preview.slice(base.length);
  return preview;
}

export function toApi(employee: CreateEmployeeDto | UpdateEmployeeDto, id = ''): EmployeeApiDto {
  const e = employee as Partial<Employee>;
  return {
    id,
    code: e.code,
    fullName: e.fullName ?? '',
    gender: e.gender ?? 'Nam',
    birthDate: inputDateToApi(e.birthDate),
    joinDate: inputDateToApi(e.joinDate),
    officialDate: e.officialDate ? inputDateToApi(e.officialDate) : undefined,
    status: e.status ?? 'Đang làm',
    resignDate: e.resignDate ? inputDateToApi(e.resignDate) : undefined,
    segment: e.segment,
    branch: e.branch,
    department: e.department,
    position: e.position,
    personalEmail: e.personalEmail,
    personalPhone: e.personalPhone,
    permanentAddress: e.permanentAddress,
    temporaryAddress: e.temporaryAddress,
    education: e.education,
    school: e.school,
    major: e.major,
    bankAccountName: e.bankAccountName,
    bankAccountNumber: e.bankAccountNumber,
    bankName: e.bankName,
    bankBranch: e.bankBranch,
    hadSocialInsurance: e.hadSocialInsurance,
    siNumber: e.siNumber,
    cccdNumber: e.cccdNumber,
    cccdIssueDate: e.cccdIssueDate ? inputDateToApi(e.cccdIssueDate) : undefined,
    cccdIssuePlace: e.cccdIssuePlace,
    cmndNumber: e.cmndNumber,
    cmndIssueDate: e.cmndIssueDate ? inputDateToApi(e.cmndIssueDate) : undefined,
    cmndIssuePlace: e.cmndIssuePlace,
    maritalStatus: e.maritalStatus,
    taxCode: e.taxCode,
    photoUrl: toStoredUrl(e.profilePhoto?.previewUrl),
    cccdFrontUrl: toStoredUrl(e.cccdFront?.previewUrl),
    cccdBackUrl: toStoredUrl(e.cccdBack?.previewUrl),
    degreePhotoUrl: toStoredUrl(e.degreePhoto?.previewUrl),
  };
}
