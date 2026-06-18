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
  taxCode?: string;
  // Account linkage (from Identity module via API)
  linkedAccountStatus?: 'active' | 'locked' | 'none';
}

export type CreateCandidateDto = Omit<Candidate, 'id' | 'appliedAt'>;
export type UpdateCandidateDto = Partial<Omit<Candidate, 'id'>>;
export type CreateEmployeeDto = Omit<Employee, 'id'>;
export type UpdateEmployeeDto = Partial<Omit<Employee, 'id'>>;

export type { Seniority } from '../utils/calcSeniority';
export { calcSeniority } from '../utils/calcSeniority';
export { isActiveEmployee } from '../utils/employeeStatus';
