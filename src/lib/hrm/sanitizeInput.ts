import * as z from 'zod';

/** Bỏ khoảng trắng đầu/cuối. */
export function trimFieldValue(value: string): string {
  return value.trim();
}

/** Chỉ giữ chữ số; chuẩn hóa +84 → 0. */
export function extractPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) {
    digits = `0${digits.slice(2)}`;
  }
  return digits;
}

/** Định dạng SĐT Việt Nam 4-3-3 (vd. 0123 456 789). */
export function formatVietnamPhone(value: string): string {
  const digits = extractPhoneDigits(value);
  if (!digits) return '';
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

/** Trim + format 4-3-3. */
export function sanitizePhoneField(value: string): string {
  return formatVietnamPhone(trimFieldValue(value));
}

function trimOptional(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = trimFieldValue(String(value));
  return trimmed || undefined;
}

function trimRequired(value: string): string {
  return trimFieldValue(value);
}

/** Chuẩn hóa draft ứng viên trước khi lưu (trim + SĐT 4-3-3). */
export function sanitizeCandidateForSave<T extends {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  school?: string;
  major?: string;
  experience?: string;
  targetPosition?: string | null;
  targetDepartment?: string | null;
  contactResult?: string | null;
  evaluator?: string | null;
  offerRejectReason?: string | null;
  onboardingRejectReason?: string | null;
}>(data: T): T {
  return {
    ...data,
    fullName: data.fullName != null ? trimRequired(data.fullName) : data.fullName,
    phone: data.phone != null ? sanitizePhoneField(data.phone) : data.phone,
    email: data.email != null ? trimRequired(data.email) : data.email,
    address: data.address != null ? trimRequired(data.address) : data.address,
    school: data.school != null ? trimRequired(data.school) : data.school,
    major: data.major != null ? trimRequired(data.major) : data.major,
    experience: trimOptional(data.experience) ?? data.experience,
    targetPosition: trimOptional(data.targetPosition) ?? data.targetPosition,
    targetDepartment: trimOptional(data.targetDepartment) ?? data.targetDepartment,
    contactResult: trimOptional(data.contactResult) ?? data.contactResult,
    evaluator: trimOptional(data.evaluator) ?? data.evaluator,
    offerRejectReason: trimOptional(data.offerRejectReason) ?? data.offerRejectReason,
    onboardingRejectReason: trimOptional(data.onboardingRejectReason) ?? data.onboardingRejectReason,
  };
}

/** Chuẩn hóa draft nhân viên trước khi lưu (trim + SĐT 4-3-3). */
export function sanitizeEmployeeForSave(data: Record<string, unknown>): Record<string, unknown> {
  const trimKeys = [
    'fullName', 'code', 'segment', 'branch', 'department', 'position',
    'cmndNumber', 'cmndIssuePlace', 'cccdNumber', 'cccdIssuePlace',
    'personalEmail', 'permanentAddress', 'temporaryAddress',
    'education', 'school', 'major', 'bankAccountName', 'bankAccountNumber',
    'bankName', 'bankBranch', 'siNumber', 'taxCode',
  ] as const;

  const out = { ...data };
  for (const key of trimKeys) {
    const value = out[key];
    if (typeof value === 'string') {
      out[key] = trimFieldValue(value);
    }
  }
  if (typeof out.personalPhone === 'string') {
    out.personalPhone = sanitizePhoneField(out.personalPhone);
  }
  return out;
}

export function validateVietnamPhoneMessage(value: string): string | null {
  const digits = extractPhoneDigits(value);
  if (!digits) return 'Vui lòng nhập số điện thoại';
  if (digits.length !== 10) return 'Vui lòng nhập số điện thoại hợp lệ';
  if (!/^0[35789]\d{8}$/.test(digits)) {
    return 'Vui lòng nhập số điện thoại hợp lệ (ví dụ: 0912345678)';
  }
  return null;
}

export function zTrimmedString() {
  return z.string().trim();
}

export function zPhoneField() {
  return z
    .string()
    .transform(sanitizePhoneField)
    .pipe(
      z.string().superRefine((val, ctx) => {
        const message = validateVietnamPhoneMessage(val);
        if (message) ctx.addIssue({ code: 'custom', message });
      }),
    );
}
