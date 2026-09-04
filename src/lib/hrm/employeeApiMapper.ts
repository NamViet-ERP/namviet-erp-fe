import type { CreateEmployeeDto, Employee, UpdateEmployeeDto } from '../../types/hr';
import type { EmployeeApiDto } from '../../types/api/hrApi';

export type { EmployeeApiDto };

function apiDateToInput(value?: string | null): string | undefined {
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

function urlToAttachment(url?: string | null, fallbackName = 'file') {
  if (!url) return undefined;
  const name = url.split('/').pop() ?? fallbackName;
  return { fileName: name, fileSize: '', previewUrl: resolveMediaUrl(url) };
}

export function resolveMediaUrl(url?: string | null): string | undefined {
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
    segment: dto.segment ?? undefined,
    branch: dto.branch ?? undefined,
    department: dto.department ?? undefined,
    departmentId: dto.departmentId ?? null,
    position: dto.position ?? undefined,
    personalEmail: dto.personalEmail ?? undefined,
    personalPhone: dto.personalPhone ?? undefined,
    permanentAddress: dto.permanentAddress ?? undefined,
    temporaryAddress: dto.temporaryAddress ?? undefined,
    education: dto.education ?? undefined,
    school: dto.school ?? undefined,
    major: dto.major ?? undefined,
    bankAccountName: dto.bankAccountName ?? undefined,
    bankAccountNumber: dto.bankAccountNumber ?? undefined,
    bankName: dto.bankName ?? undefined,
    bankBranch: dto.bankBranch ?? undefined,
    hadSocialInsurance: (dto.hadSocialInsurance ?? undefined) as Employee['hadSocialInsurance'],
    siNumber: dto.siNumber ?? undefined,
    cmndNumber: dto.cmndNumber ?? undefined,
    cmndIssueDate: apiDateToInput(dto.cmndIssueDate),
    cmndIssuePlace: dto.cmndIssuePlace ?? undefined,
    cccdNumber: dto.cccdNumber ?? undefined,
    cccdIssueDate: apiDateToInput(dto.cccdIssueDate),
    cccdIssuePlace: dto.cccdIssuePlace ?? undefined,
    maritalStatus: dto.maritalStatus ?? undefined,
    // Pass-through nguyên trạng: null giữ null, undefined giữ undefined (round-trip với toApi).
    taxCode: dto.taxCode as Employee['taxCode'],
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
    departmentId: e.departmentId ?? null,
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
    photoUrl: e.profilePhoto?.previewUrl ? toStoredUrl(e.profilePhoto.previewUrl) ?? null : null,
    cccdFrontUrl: e.cccdFront?.previewUrl ? toStoredUrl(e.cccdFront.previewUrl) ?? null : null,
    cccdBackUrl: e.cccdBack?.previewUrl ? toStoredUrl(e.cccdBack.previewUrl) ?? null : null,
    degreePhotoUrl: e.degreePhoto?.previewUrl ? toStoredUrl(e.degreePhoto.previewUrl) ?? null : null,
  };
}
