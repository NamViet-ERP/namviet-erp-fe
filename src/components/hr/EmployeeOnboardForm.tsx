import { useState, useRef, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { showToast } from '../ui/Toast';
import { employeesService, getSuggestedEmployeeCode, validateUniqueCode } from '../../services/employeesService';
import { employeeCodeNextHint } from '../../lib/hrm/suggestedEmployeeCode';
import { filesService } from '../../services/filesService';
import { USE_MOCK } from '../../lib/mock';
import { removeVietnameseTones } from '../../lib/vietnamese';
import FormSectionHeader from './FormSectionHeader';
import HrmDatePicker from './HrmDatePicker';
import HrmFieldLabel, { hrmFieldClass } from './HrmFieldLabel';
import HrmSelect from './HrmSelect';
import { EDUCATION_LEVELS } from '../../constants/recruitment';
import type { Employee } from '../../types/hr';
import { readProfileImageFile } from '../../lib/hrm/attachments';
import { validateFullName } from '../../lib/hrm/validateFullName';
import { zPhoneField, zTrimmedString } from '../../lib/hrm/sanitizeInput';
import { registerHrmPhone, registerHrmText } from '../../lib/hrm/registerHrmField';

const employeeSchema = z.object({
  fullName: zTrimmedString().superRefine((val, ctx) => {
    const message = validateFullName(val);
    if (message) ctx.addIssue({ code: 'custom', message });
  }),
  gender: z.enum(['Nam', 'Nữ'], { message: 'Vui lòng chọn giới tính' }),
  birthDate: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  joinDate: z.string().min(1, 'Vui lòng chọn ngày vào làm'),
  cmndNumber: zTrimmedString().optional(),
  cmndIssueDate: zTrimmedString().optional(),
  cmndIssuePlace: zTrimmedString().optional(),
  cccdNumber: zTrimmedString().min(1, 'Vui lòng nhập số CCCD'),
  cccdIssueDate: z.string().min(1, 'Vui lòng chọn ngày cấp CCCD'),
  cccdIssuePlace: zTrimmedString().min(1, 'Vui lòng nhập nơi cấp CCCD'),
  personalEmail: zTrimmedString().min(1, 'Vui lòng nhập email').email('Vui lòng nhập email hợp lệ'),
  personalPhone: zPhoneField(),
  permanentAddress: zTrimmedString().min(5, 'Vui lòng nhập địa chỉ thường trú'),
  temporaryAddress: zTrimmedString().optional(),
  education: zTrimmedString().min(1, 'Vui lòng chọn trình độ'),
  school: zTrimmedString().min(2, 'Vui lòng nhập trường đào tạo'),
  major: zTrimmedString().min(2, 'Vui lòng nhập chuyên ngành'),
  maritalStatus: z.enum(['Độc thân', 'Đã kết hôn', 'Ly hôn', 'Khác'], { message: 'Vui lòng chọn tình trạng hôn nhân' }),
  bankAccountName: zTrimmedString().min(2, 'Vui lòng nhập tên chủ tài khoản'),
  bankAccountNumber: zTrimmedString().min(5, 'Vui lòng nhập số tài khoản'),
  bankName: zTrimmedString().min(2, 'Vui lòng nhập tên ngân hàng'),
  bankBranch: zTrimmedString().min(2, 'Vui lòng nhập chi nhánh'),
  hadSocialInsurance: z.enum(['Đã từng tham gia', 'Chưa từng tham gia'], { message: 'Vui lòng chọn tình trạng BHXH' }),
  siNumber: zTrimmedString().optional(),
  taxCode: zTrimmedString().optional(),
  code: zTrimmedString().optional(),
  segment: zTrimmedString().optional(),
  branch: zTrimmedString().optional(),
  department: zTrimmedString().optional(),
  position: zTrimmedString().optional(),
});

type FormValues = z.infer<typeof employeeSchema>;

interface EmployeeOnboardFormProps {
  mode?: 'public' | 'hr';
  onCreated?: (employee: Employee) => void;
}

interface FileState {
  file: File;
  preview?: string;
}

function ImageUpload({ label, required, file, onFile, onRemove, cropProfile = false }: {
  label: string; required?: boolean; file: FileState | null;
  onFile: (f: FileState) => void; onRemove: () => void;
  cropProfile?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (f: File) => {
    if (cropProfile) {
      void readProfileImageFile(f, onFile, msg => showToast('error', msg));
      return;
    }
    if (f.size > 5 * 1024 * 1024) { showToast('error', 'File vượt quá 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => onFile({ file: f, preview: reader.result as string });
    reader.readAsDataURL(f);
  };
  return (
    <div>
      <HrmFieldLabel required={required}>{label}</HrmFieldLabel>
      {!file ? (
        <button type="button" onClick={() => ref.current?.click()} className="hrm-upload-zone w-full">
          <Upload size={20} className="mx-auto mb-1 text-[var(--md-on-surface-variant)]" />
          <span className="text-sm text-[var(--md-on-surface-variant)]">Chọn ảnh (tối đa 5MB)</span>
        </button>
      ) : (
        <div className="hrm-upload-file">
          {file.preview && <img src={file.preview} alt="" className="w-16 h-16 object-cover rounded-lg" />}
          <span className="text-sm flex-1 truncate text-[var(--md-on-surface)]">{file.file.name}</span>
          <button type="button" onClick={onRemove} className="text-[var(--md-error)] bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-[var(--md-error-container)]"><Trash2 size={16} /></button>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && pick(e.target.files[0])} />
    </div>
  );
}

export default function EmployeeOnboardForm({ mode = 'public', onCreated }: EmployeeOnboardFormProps) {
  const isHr = mode === 'hr';
  const [profilePhoto, setProfilePhoto] = useState<FileState | null>(null);
  const [cccdFront, setCccdFront] = useState<FileState | null>(null);
  const [cccdBack, setCccdBack] = useState<FileState | null>(null);
  const [degreePhoto, setDegreePhoto] = useState<FileState | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [codeHint, setCodeHint] = useState('');

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: '',
      birthDate: '',
      joinDate: '',
      cmndNumber: '',
      cmndIssueDate: '',
      cmndIssuePlace: '',
      cccdNumber: '',
      cccdIssueDate: '',
      cccdIssuePlace: '',
      personalEmail: '',
      personalPhone: '',
      permanentAddress: '',
      temporaryAddress: '',
      education: '',
      school: '',
      major: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankName: '',
      bankBranch: '',
      siNumber: '',
      taxCode: '',
      code: '',
      segment: '',
      branch: '',
      department: '',
      position: '',
      gender: undefined,
      maritalStatus: undefined,
      hadSocialInsurance: undefined,
    },
  });

  useEffect(() => {
    if (!isHr) return;
    let cancelled = false;
    getSuggestedEmployeeCode()
      .then(code => {
        if (cancelled) return;
        setValue('code', code);
        setCodeHint(employeeCodeNextHint(code));
      })
      .catch(() => {
        if (!cancelled) setCodeHint('');
      });
    return () => { cancelled = true; };
  }, [isHr, setValue]);

  const gender = useWatch({ control, name: 'gender' });
  const hadSi = useWatch({ control, name: 'hadSocialInsurance' });
  const bankAccountName = useWatch({ control, name: 'bankAccountName' }) ?? '';
  const birthDate = useWatch({ control, name: 'birthDate' }) ?? '';
  const joinDate = useWatch({ control, name: 'joinDate' }) ?? '';
  const cmndIssueDate = useWatch({ control, name: 'cmndIssueDate' }) ?? '';
  const cccdIssueDate = useWatch({ control, name: 'cccdIssueDate' }) ?? '';

  const toAttachment = (f: FileState | null) =>
    f ? { fileName: f.file.name, fileSize: (f.file.size / 1024).toFixed(0) + ' KB', previewUrl: f.preview } : undefined;

  const onSubmit = async (data: FormValues) => {
    if (!profilePhoto) { showToast('error', 'Vui lòng tải ảnh hồ sơ'); return; }
    if (!cccdFront || !cccdBack) { showToast('error', 'Vui lòng tải ảnh CCCD mặt trước và mặt sau'); return; }
    if (isHr && !data.code?.trim()) {
      showToast('error', 'Vui lòng nhập mã nhân viên');
      return;
    }
    if (isHr && data.code?.trim()) {
      const ok = await validateUniqueCode(data.code);
      if (!ok) { showToast('error', 'Mã nhân viên đã tồn tại'); return; }
    }

    try {
      const sessionId = crypto.randomUUID();
      let profileAtt = toAttachment(profilePhoto);
      let cccdFrontAtt = toAttachment(cccdFront);
      let cccdBackAtt = toAttachment(cccdBack);
      let degreeAtt = degreePhoto ? toAttachment(degreePhoto) : undefined;

      if (!USE_MOCK) {
        const [profileUp, frontUp, backUp, degreeUp] = await Promise.all([
          filesService.upload(profilePhoto.file, 'profile', { sessionId }),
          filesService.upload(cccdFront.file, 'cccd-front', { sessionId }),
          filesService.upload(cccdBack.file, 'cccd-back', { sessionId }),
          degreePhoto
            ? filesService.upload(degreePhoto.file, 'degree', { sessionId })
            : Promise.resolve(null),
        ]);
        profileAtt = { fileName: profileUp.fileName, fileSize: `${Math.round(profileUp.fileSize / 1024)} KB`, previewUrl: profileUp.url };
        cccdFrontAtt = { fileName: frontUp.fileName, fileSize: `${Math.round(frontUp.fileSize / 1024)} KB`, previewUrl: frontUp.url };
        cccdBackAtt = { fileName: backUp.fileName, fileSize: `${Math.round(backUp.fileSize / 1024)} KB`, previewUrl: backUp.url };
        if (degreeUp) {
          degreeAtt = { fileName: degreeUp.fileName, fileSize: `${Math.round(degreeUp.fileSize / 1024)} KB`, previewUrl: degreeUp.url };
        }
      }

      const payload = {
        fullName: data.fullName,
        gender: data.gender,
        birthDate: data.birthDate,
        joinDate: data.joinDate,
        status: 'Đang làm' as const,
        code: data.code?.trim() || undefined,
        segment: data.segment?.trim() || undefined,
        branch: data.branch?.trim() || undefined,
        department: data.department?.trim() || undefined,
        position: data.position?.trim() || undefined,
        profilePhoto: profileAtt,
        cmndNumber: data.cmndNumber,
        cmndIssueDate: data.cmndIssueDate,
        cmndIssuePlace: data.cmndIssuePlace,
        cccdNumber: data.cccdNumber,
        cccdIssueDate: data.cccdIssueDate,
        cccdIssuePlace: data.cccdIssuePlace,
        cccdFront: cccdFrontAtt,
        cccdBack: cccdBackAtt,
        personalEmail: data.personalEmail,
        personalPhone: data.personalPhone,
        permanentAddress: data.permanentAddress,
        temporaryAddress: data.temporaryAddress,
        education: data.education,
        school: data.school,
        major: data.major,
        degreePhoto: degreeAtt,
        maritalStatus: data.maritalStatus,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        hadSocialInsurance: data.hadSocialInsurance,
        siNumber: data.siNumber,
        taxCode: data.taxCode,
      };

      const created = isHr
        ? await employeesService.create(payload)
        : await employeesService.createOnboard(payload);

      if (isHr) {
        onCreated?.(created);
      } else {
        setIsSubmitted(true);
        showToast('success', 'Thông tin đã được gửi thành công!');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại';
      showToast('error', msg);
    }
  };

  if (isSubmitted) {
    return (
      <div className="hrm-success-state">
        <div className="hrm-success-state__icon"><CheckCircle2 size={64} /></div>
        <h3 className="hrm-success-state__title">Gửi thông tin thành công!</h3>
        <p className="hrm-success-state__desc">Phòng Nhân sự sẽ xem xét và liên hệ với bạn sớm nhất.</p>
        <button type="button" onClick={() => { reset(); setProfilePhoto(null); setCccdFront(null); setCccdBack(null); setDegreePhoto(null); setIsSubmitted(false); }} className="btn btn-primary rounded-full px-8">
          Gửi hồ sơ khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      {isHr && (
        <>
          <FormSectionHeader step={1} title="Thông tin HR (Mã NV, Tổ chức)" />
          <div className="hrm-form-grid">
            <div>
              <HrmFieldLabel>Mã nhân viên</HrmFieldLabel>
              <input
                className="hrm-field-input font-mono"
                placeholder="VD: NV-0101"
                maxLength={7}
                {...registerHrmText(register, setValue, 'code')}
              />
              {codeHint && <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">{codeHint}</p>}
            </div>
            <div>
              <HrmFieldLabel>Mảng</HrmFieldLabel>
              <input className="hrm-field-input" {...registerHrmText(register, setValue, 'segment')} />
            </div>
            <div>
              <HrmFieldLabel>Chi nhánh</HrmFieldLabel>
              <input className="hrm-field-input" {...registerHrmText(register, setValue, 'branch')} />
            </div>
            <div>
              <HrmFieldLabel>Bộ phận</HrmFieldLabel>
              <input className="hrm-field-input" {...registerHrmText(register, setValue, 'department')} />
            </div>
            <div>
              <HrmFieldLabel>Chức vụ</HrmFieldLabel>
              <input className="hrm-field-input" {...registerHrmText(register, setValue, 'position')} />
            </div>
          </div>
        </>
      )}

      <FormSectionHeader step={isHr ? 2 : 1} title="Thông tin cơ bản" />
      <div className="hrm-form-grid">
        <div>
          <HrmFieldLabel required>Họ và tên</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.fullName))} {...registerHrmText(register, setValue, 'fullName')} />
          {errors.fullName && <p className="hrm-field__error">{errors.fullName.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Giới tính</HrmFieldLabel>
          <div className="hrm-radio-row">
            {(['Nam', 'Nữ'] as const).map(g => (
              <label key={g}>
                <input type="radio" checked={gender === g} onChange={() => setValue('gender', g, { shouldValidate: true })} />
                {g}
              </label>
            ))}
          </div>
          {errors.gender && <p className="hrm-field__error">{errors.gender.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Ngày sinh</HrmFieldLabel>
          <HrmDatePicker
            value={birthDate}
            onChange={v => setValue('birthDate', v, { shouldValidate: true })}
            error={Boolean(errors.birthDate)}
            max={new Date().toISOString().slice(0, 10)}
            yearFrom={1940}
          />
          {errors.birthDate && <p className="hrm-field__error">{errors.birthDate.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Ngày vào làm</HrmFieldLabel>
          <HrmDatePicker
            value={joinDate}
            onChange={v => setValue('joinDate', v, { shouldValidate: true })}
            error={Boolean(errors.joinDate)}
          />
          {errors.joinDate && <p className="hrm-field__error">{errors.joinDate.message}</p>}
        </div>
      </div>
      <ImageUpload label="Ảnh hồ sơ" required file={profilePhoto} onFile={setProfilePhoto} onRemove={() => setProfilePhoto(null)} cropProfile />

      <FormSectionHeader step={isHr ? 3 : 2} title="CMND (nếu có)" className="hrm-form-section-header--spaced" />
      <div className="hrm-form-grid hrm-form-grid--3">
        <div><HrmFieldLabel>Số CMND</HrmFieldLabel><input className="hrm-field-input" {...registerHrmText(register, setValue, 'cmndNumber')} /></div>
        <div><HrmFieldLabel>Ngày cấp</HrmFieldLabel><HrmDatePicker value={cmndIssueDate} onChange={v => setValue('cmndIssueDate', v)} /></div>
        <div><HrmFieldLabel>Nơi cấp</HrmFieldLabel><input className="hrm-field-input" {...registerHrmText(register, setValue, 'cmndIssuePlace')} /></div>
      </div>

      <FormSectionHeader step={isHr ? 4 : 3} title="CCCD" className="hrm-form-section-header--spaced" />
      <div className="hrm-form-grid hrm-form-grid--3">
        <div>
          <HrmFieldLabel required>Số CCCD</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.cccdNumber))} {...registerHrmText(register, setValue, 'cccdNumber')} />
          {errors.cccdNumber && <p className="hrm-field__error">{errors.cccdNumber.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Ngày cấp</HrmFieldLabel>
          <HrmDatePicker
            value={cccdIssueDate}
            onChange={v => setValue('cccdIssueDate', v, { shouldValidate: true })}
            error={Boolean(errors.cccdIssueDate)}
          />
          {errors.cccdIssueDate && <p className="hrm-field__error">{errors.cccdIssueDate.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Nơi cấp</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.cccdIssuePlace))} {...registerHrmText(register, setValue, 'cccdIssuePlace')} />
          {errors.cccdIssuePlace && <p className="hrm-field__error">{errors.cccdIssuePlace.message}</p>}
        </div>
      </div>
      <div className="hrm-form-grid">
        <ImageUpload label="Ảnh CCCD mặt trước" required file={cccdFront} onFile={setCccdFront} onRemove={() => setCccdFront(null)} />
        <ImageUpload label="Ảnh CCCD mặt sau" required file={cccdBack} onFile={setCccdBack} onRemove={() => setCccdBack(null)} />
      </div>

      <FormSectionHeader step={isHr ? 5 : 4} title="Liên hệ" className="hrm-form-section-header--spaced" />
      <div className="hrm-form-grid">
        <div>
          <HrmFieldLabel required>Email cá nhân</HrmFieldLabel>
          <input type="email" className={hrmFieldClass(Boolean(errors.personalEmail))} {...registerHrmText(register, setValue, 'personalEmail')} />
          {errors.personalEmail && <p className="hrm-field__error">{errors.personalEmail.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Số điện thoại cá nhân</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.personalPhone))} {...registerHrmPhone(register, setValue, 'personalPhone')} />
          {errors.personalPhone && <p className="hrm-field__error">{errors.personalPhone.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Địa chỉ thường trú</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.permanentAddress))} {...registerHrmText(register, setValue, 'permanentAddress')} />
          {errors.permanentAddress && <p className="hrm-field__error">{errors.permanentAddress.message}</p>}
        </div>
        <div>
          <HrmFieldLabel>Địa chỉ tạm trú</HrmFieldLabel>
          <input className="hrm-field-input" {...registerHrmText(register, setValue, 'temporaryAddress')} />
        </div>
      </div>

      <FormSectionHeader step={isHr ? 6 : 5} title="Học vấn" className="hrm-form-section-header--spaced" />
      <div className="hrm-form-grid">
        <div>
          <HrmFieldLabel required>Trình độ</HrmFieldLabel>
          <Controller
            name="education"
            control={control}
            render={({ field }) => (
              <HrmSelect
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={EDUCATION_LEVELS}
                placeholder="-- Chọn --"
                error={Boolean(errors.education)}
              />
            )}
          />
          {errors.education && <p className="hrm-field__error">{errors.education.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Trường đào tạo</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.school))} {...registerHrmText(register, setValue, 'school')} />
          {errors.school && <p className="hrm-field__error">{errors.school.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Chuyên ngành</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.major))} {...registerHrmText(register, setValue, 'major')} />
          {errors.major && <p className="hrm-field__error">{errors.major.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Tình trạng hôn nhân</HrmFieldLabel>
          <Controller
            name="maritalStatus"
            control={control}
            render={({ field }) => (
              <HrmSelect
                value={field.value ?? ''}
                onChange={v => field.onChange(v as FormValues['maritalStatus'])}
                onBlur={field.onBlur}
                options={['Độc thân', 'Đã kết hôn', 'Ly hôn', 'Khác']}
                placeholder="-- Chọn --"
                error={Boolean(errors.maritalStatus)}
              />
            )}
          />
          {errors.maritalStatus && <p className="hrm-field__error">{errors.maritalStatus.message}</p>}
        </div>
      </div>
      <ImageUpload label="Ảnh bằng cấp đính kèm" file={degreePhoto} onFile={setDegreePhoto} onRemove={() => setDegreePhoto(null)} />

      <FormSectionHeader step={isHr ? 7 : 6} title="Ngân hàng" className="hrm-form-section-header--spaced" />
      <div className="hrm-form-grid">
        <div>
          <HrmFieldLabel required>Tên chủ tài khoản (IN HOA KHÔNG DẤU)</HrmFieldLabel>
          <input
            className={`${hrmFieldClass(Boolean(errors.bankAccountName))} uppercase`}
            value={bankAccountName}
            onChange={e => setValue('bankAccountName', removeVietnameseTones(e.target.value).toUpperCase(), { shouldValidate: true })}
            onBlur={e => {
              const trimmed = removeVietnameseTones(e.target.value).trim().toUpperCase();
              if (trimmed !== bankAccountName) {
                setValue('bankAccountName', trimmed, { shouldValidate: true, shouldDirty: true });
              }
            }}
          />
          {errors.bankAccountName && <p className="hrm-field__error">{errors.bankAccountName.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Số tài khoản</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.bankAccountNumber))} {...registerHrmText(register, setValue, 'bankAccountNumber')} />
          {errors.bankAccountNumber && <p className="hrm-field__error">{errors.bankAccountNumber.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Tên ngân hàng</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.bankName))} {...registerHrmText(register, setValue, 'bankName')} />
          {errors.bankName && <p className="hrm-field__error">{errors.bankName.message}</p>}
        </div>
        <div>
          <HrmFieldLabel required>Chi nhánh</HrmFieldLabel>
          <input className={hrmFieldClass(Boolean(errors.bankBranch))} {...registerHrmText(register, setValue, 'bankBranch')} />
          {errors.bankBranch && <p className="hrm-field__error">{errors.bankBranch.message}</p>}
        </div>
      </div>

      <FormSectionHeader step={isHr ? 8 : 7} title="BHXH & Thuế" className="hrm-form-section-header--spaced" />
      <div className="hrm-form-grid">
        <div>
          <HrmFieldLabel required>Đã tham gia BHXH chưa</HrmFieldLabel>
          <div className="hrm-radio-row">
            {(['Đã từng tham gia', 'Chưa từng tham gia'] as const).map(v => (
              <label key={v}>
                <input type="radio" checked={hadSi === v} onChange={() => setValue('hadSocialInsurance', v, { shouldValidate: true })} />
                {v}
              </label>
            ))}
          </div>
          {errors.hadSocialInsurance && <p className="hrm-field__error">{errors.hadSocialInsurance.message}</p>}
        </div>
        <div>
          <HrmFieldLabel>Số BHXH</HrmFieldLabel>
          <input className="hrm-field-input" {...registerHrmText(register, setValue, 'siNumber')} />
        </div>
        <div>
          <HrmFieldLabel>Mã số thuế</HrmFieldLabel>
          <input className="hrm-field-input" {...registerHrmText(register, setValue, 'taxCode')} />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full h-12 rounded-full font-bold flex items-center justify-center gap-2 hrm-form-submit-spaced">
        {isSubmitting
          ? (isHr ? 'ĐANG LƯU...' : 'ĐANG GỬI...')
          : (isHr ? 'LƯU NHÂN VIÊN' : 'GỬI THÔNG TIN')}
        <ChevronRight size={18} />
      </button>
    </form>
  );
}
