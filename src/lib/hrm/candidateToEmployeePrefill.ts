import { toIsoDate } from '../dates';
import type { Candidate } from '../../types/hr';
import type { Employee } from '../../types/hr';

/** Map ứng viên → giá trị khởi tạo form thêm nhân viên (HR điền phần còn lại). */
export function candidateToEmployeePrefill(candidate: Candidate): Partial<Employee> & {
  personalEmail?: string;
  personalPhone?: string;
  permanentAddress?: string;
  joinDate?: string;
} {
  const birthIso = normalizeBirthDate(candidate.birthDate);
  const joinDate = candidate.startDate?.trim()
    ? candidate.startDate
    : toIsoDate(new Date());

  return {
    fullName: candidate.fullName,
    gender: candidate.gender,
    birthDate: birthIso,
    personalEmail: candidate.email,
    personalPhone: candidate.phone,
    permanentAddress: candidate.address,
    education: candidate.education,
    school: candidate.school,
    major: candidate.major,
    position: candidate.position,
    joinDate,
  };
}

function normalizeBirthDate(value: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return '';
  return toIsoDate(d);
}
