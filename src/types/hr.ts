export type CandidateGender = 'Nam' | 'Nữ';
export type CandidateEducation = 'Đại học' | 'Cao đẳng' | 'THPT' | 'Khác';
export type CandidateSource = 'Facebook' | 'Zalo' | '24h - lọc' | '24h - ứng tuyển' | 'TopCV' | 'Glints';

export interface Candidate {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  gender: CandidateGender;
  address: string;
  birthDate: string;
  education: CandidateEducation | string;
  school: string;
  major: string;
  position: string;
  experience: string;
  source: CandidateSource | string;
  hrResponsible: string;
  cvFileName: string;
  cvFileSize: string;
  cvFileUrl?: string;
  appliedAt: string;
  // HR workflow
  screeningType?: string;
  targetPosition?: string;
  targetDepartment?: string;
  preScreenResult?: string;
  contactResult?: string;
  interviewDate?: string;
  interviewAttended?: 'Đến' | 'Không đến' | '';
  evaluator?: string;
  evaluationResult?: 'Đạt' | 'Không đạt' | '';
  offerStatus?: 'Đồng ý' | 'Từ chối' | '';
  offerRejectReason?: string;
  startDate?: string;
  onboardingAttended?: 'Đến' | 'Không đến' | '';
  onboardingRejectReason?: string;
}

export type EmployeeGender = 'Nam' | 'Nữ';
export type EmployeeStatus = 'Đang làm' | 'Nghỉ việc' | 'Thai sản';

/** Nhân viên còn hoạt động — được chọn ở dropdown và đăng nhập (nếu có tài khoản). */
export function isActiveEmployee(employee: Pick<Employee, 'status'>): boolean {
  return employee.status === 'Đang làm' || employee.status === 'Thai sản';
}
export type MaritalStatus = 'Độc thân' | 'Đã kết hôn' | 'Ly hôn' | 'Khác';

export interface FileAttachment {
  fileName: string;
  fileSize: string;
  previewUrl?: string;
}

export interface Employee {
  id: string;
  code?: string;
  fullName: string;
  gender: EmployeeGender;
  birthDate: string;
  joinDate: string;
  officialDate?: string;
  status: EmployeeStatus;
  resignDate?: string;
  segment?: string;
  branch?: string;
  department?: string;
  position?: string;
  profilePhoto?: FileAttachment;
  // CMND
  cmndNumber?: string;
  cmndIssueDate?: string;
  cmndIssuePlace?: string;
  // CCCD
  cccdNumber?: string;
  cccdIssueDate?: string;
  cccdIssuePlace?: string;
  cccdFront?: FileAttachment;
  cccdBack?: FileAttachment;
  // Contact
  personalEmail?: string;
  personalPhone?: string;
  permanentAddress?: string;
  temporaryAddress?: string;
  // Education
  education?: string;
  school?: string;
  major?: string;
  degreePhoto?: FileAttachment;
  maritalStatus?: MaritalStatus | string;
  // Bank
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  // BHXH
  hadSocialInsurance?: 'Đã từng tham gia' | 'Chưa từng tham gia' | '';
  siNumber?: string;
}

export interface Seniority {
  years: number;
  months: number;
  days: number;
}

export function calcSeniority(joinDate: string): Seniority {
  const start = new Date(joinDate);
  const now = new Date();
  if (Number.isNaN(start.getTime())) return { years: 0, months: 0, days: 0 };

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

export type CreateCandidateDto = Omit<Candidate, 'id' | 'appliedAt'>;
export type UpdateCandidateDto = Partial<Omit<Candidate, 'id'>>;
export type CreateEmployeeDto = Omit<Employee, 'id'>;
export type UpdateEmployeeDto = Partial<Omit<Employee, 'id'>>;
