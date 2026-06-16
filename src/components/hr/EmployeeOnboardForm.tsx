import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { EDUCATION_LEVELS } from '../../constants/recruitment';
import type { Employee } from '../../types/hr';

const employeeSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  gender: z.enum(['Nam', 'Nữ'], { message: 'Vui lòng chọn giới tính' }),
  birthDate: z.string().min(1, 'Ngày sinh là bắt buộc'),
  joinDate: z.string().min(1, 'Ngày vào làm là bắt buộc'),
  cmndNumber: z.string().optional(),
  cmndIssueDate: z.string().optional(),
  cmndIssuePlace: z.string().optional(),
  cccdNumber: z.string().min(1, 'Số CCCD là bắt buộc'),
  cccdIssueDate: z.string().min(1, 'Ngày cấp CCCD là bắt buộc'),
  cccdIssuePlace: z.string().min(1, 'Nơi cấp CCCD là bắt buộc'),
  personalEmail: z.string().email('Email không hợp lệ'),
  personalPhone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  permanentAddress: z.string().min(5, 'Địa chỉ thường trú là bắt buộc'),
  temporaryAddress: z.string().optional(),
  education: z.string().min(1, 'Trình độ là bắt buộc'),
  school: z.string().min(2, 'Trường đào tạo là bắt buộc'),
  major: z.string().min(2, 'Chuyên ngành là bắt buộc'),
  maritalStatus: z.enum(['Độc thân', 'Đã kết hôn', 'Ly hôn', 'Khác'], { message: 'Vui lòng chọn tình trạng hôn nhân' }),
  bankAccountName: z.string().min(2, 'Tên chủ tài khoản là bắt buộc'),
  bankAccountNumber: z.string().min(5, 'Số tài khoản là bắt buộc'),
  bankName: z.string().min(2, 'Tên ngân hàng là bắt buộc'),
  bankBranch: z.string().min(2, 'Chi nhánh là bắt buộc'),
  hadSocialInsurance: z.enum(['Đã từng tham gia', 'Chưa từng tham gia'], { message: 'Vui lòng chọn' }),
  siNumber: z.string().optional(),
  code: z.string().optional(),
  segment: z.string().optional(),
  branch: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
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

function ImageUpload({ label, file, onFile, onRemove }: {
  label: string; file: FileState | null;
  onFile: (f: FileState) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (f: File) => {
    if (f.size > 5 * 1024 * 1024) { showToast('error', 'File vượt quá 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => onFile({ file: f, preview: reader.result as string });
    reader.readAsDataURL(f);
  };
  return (
    <div>
      <label className="hrm-field__label">{label}</label>
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

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { gender: undefined, maritalStatus: undefined, hadSocialInsurance: undefined },
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

  const gender = watch('gender');
  const maritalStatus = watch('maritalStatus');
  const hadSi = watch('hadSocialInsurance');
  const bankAccountName = watch('bankAccountName') ?? '';

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
              <label className="hrm-field__label">Mã nhân viên</label>
              <input
                className="hrm-field-input font-mono"
                placeholder="VD: NV-0101"
                maxLength={7}
                {...register('code')}
              />
              {codeHint && <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">{codeHint}</p>}
            </div>
            <div>
              <label className="hrm-field__label">Mảng</label>
              <input className="hrm-field-input" {...register('segment')} />
            </div>
            <div>
              <label className="hrm-field__label">Chi nhánh</label>
              <input className="hrm-field-input" {...register('branch')} />
            </div>
            <div>
              <label className="hrm-field__label">Bộ phận</label>
              <input className="hrm-field-input" {...register('department')} />
            </div>
            <div>
              <label className="hrm-field__label">Chức vụ</label>
              <input className="hrm-field-input" {...register('position')} />
            </div>
          </div>
        </>
      )}

      <FormSectionHeader step={isHr ? 2 : 1} title="Thông tin cơ bản" />
      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Họ và tên *</label>
          <input className="hrm-field-input" {...register('fullName')} />
          {errors.fullName && <p className="hrm-field__error">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Giới tính *</label>
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
          <label className="hrm-field__label">Ngày sinh *</label>
          <HrmDatePicker
            value={watch('birthDate') ?? ''}
            onChange={v => setValue('birthDate', v, { shouldValidate: true })}
            error={Boolean(errors.birthDate)}
            max={new Date().toISOString().slice(0, 10)}
            yearFrom={1940}
          />
          {errors.birthDate && <p className="hrm-field__error">{errors.birthDate.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Ngày vào làm *</label>
          <HrmDatePicker
            value={watch('joinDate') ?? ''}
            onChange={v => setValue('joinDate', v, { shouldValidate: true })}
            error={Boolean(errors.joinDate)}
          />
          {errors.joinDate && <p className="hrm-field__error">{errors.joinDate.message}</p>}
        </div>
      </div>
      <ImageUpload label="Ảnh hồ sơ *" file={profilePhoto} onFile={setProfilePhoto} onRemove={() => setProfilePhoto(null)} />

      <FormSectionHeader step={isHr ? 3 : 2} title="CMND (nếu có)" />
      <div className="hrm-form-grid hrm-form-grid--3">
        <div><label className="hrm-field__label">Số CMND</label><input className="hrm-field-input" {...register('cmndNumber')} /></div>
        <div><label className="hrm-field__label">Ngày cấp</label><HrmDatePicker value={watch('cmndIssueDate') ?? ''} onChange={v => setValue('cmndIssueDate', v)} /></div>
        <div><label className="hrm-field__label">Nơi cấp</label><input className="hrm-field-input" {...register('cmndIssuePlace')} /></div>
      </div>

      <FormSectionHeader step={isHr ? 4 : 3} title="CCCD" />
      <div className="hrm-form-grid hrm-form-grid--3">
        <div>
          <label className="hrm-field__label">Số CCCD *</label>
          <input className="hrm-field-input" {...register('cccdNumber')} />
          {errors.cccdNumber && <p className="hrm-field__error">{errors.cccdNumber.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Ngày cấp *</label>
          <HrmDatePicker
            value={watch('cccdIssueDate') ?? ''}
            onChange={v => setValue('cccdIssueDate', v, { shouldValidate: true })}
            error={Boolean(errors.cccdIssueDate)}
          />
          {errors.cccdIssueDate && <p className="hrm-field__error">{errors.cccdIssueDate.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Nơi cấp *</label>
          <input className="hrm-field-input" {...register('cccdIssuePlace')} />
          {errors.cccdIssuePlace && <p className="hrm-field__error">{errors.cccdIssuePlace.message}</p>}
        </div>
      </div>
      <div className="hrm-form-grid">
        <ImageUpload label="Ảnh CCCD mặt trước *" file={cccdFront} onFile={setCccdFront} onRemove={() => setCccdFront(null)} />
        <ImageUpload label="Ảnh CCCD mặt sau *" file={cccdBack} onFile={setCccdBack} onRemove={() => setCccdBack(null)} />
      </div>

      <FormSectionHeader step={isHr ? 5 : 4} title="Liên hệ" />
      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Email cá nhân *</label>
          <input type="email" className="hrm-field-input" {...register('personalEmail')} />
          {errors.personalEmail && <p className="hrm-field__error">{errors.personalEmail.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Số điện thoại cá nhân *</label>
          <input className="hrm-field-input" {...register('personalPhone')} />
          {errors.personalPhone && <p className="hrm-field__error">{errors.personalPhone.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Địa chỉ thường trú *</label>
          <input className="hrm-field-input" {...register('permanentAddress')} />
          {errors.permanentAddress && <p className="hrm-field__error">{errors.permanentAddress.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Địa chỉ tạm trú</label>
          <input className="hrm-field-input" {...register('temporaryAddress')} />
        </div>
      </div>

      <FormSectionHeader step={isHr ? 6 : 5} title="Học vấn" />
      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Trình độ *</label>
          <select className="hrm-field-select" {...register('education')}>
            <option value="">-- Chọn --</option>
            {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {errors.education && <p className="hrm-field__error">{errors.education.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Trường đào tạo *</label>
          <input className="hrm-field-input" {...register('school')} />
          {errors.school && <p className="hrm-field__error">{errors.school.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Chuyên ngành *</label>
          <input className="hrm-field-input" {...register('major')} />
          {errors.major && <p className="hrm-field__error">{errors.major.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Tình trạng hôn nhân *</label>
          <select className="hrm-field-select" value={maritalStatus ?? ''} onChange={e => setValue('maritalStatus', e.target.value as FormValues['maritalStatus'], { shouldValidate: true })}>
            <option value="">-- Chọn --</option>
            {(['Độc thân', 'Đã kết hôn', 'Ly hôn', 'Khác'] as const).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.maritalStatus && <p className="hrm-field__error">{errors.maritalStatus.message}</p>}
        </div>
      </div>
      <ImageUpload label="Ảnh bằng cấp đính kèm" file={degreePhoto} onFile={setDegreePhoto} onRemove={() => setDegreePhoto(null)} />

      <FormSectionHeader step={isHr ? 7 : 6} title="Ngân hàng" />
      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Tên chủ tài khoản (IN HOA KHÔNG DẤU) *</label>
          <input
            className="hrm-field-input uppercase"
            value={bankAccountName}
            onChange={e => setValue('bankAccountName', removeVietnameseTones(e.target.value).toUpperCase(), { shouldValidate: true })}
          />
          {errors.bankAccountName && <p className="hrm-field__error">{errors.bankAccountName.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Số tài khoản *</label>
          <input className="hrm-field-input" {...register('bankAccountNumber')} />
          {errors.bankAccountNumber && <p className="hrm-field__error">{errors.bankAccountNumber.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Tên ngân hàng *</label>
          <input className="hrm-field-input" {...register('bankName')} />
          {errors.bankName && <p className="hrm-field__error">{errors.bankName.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Chi nhánh *</label>
          <input className="hrm-field-input" {...register('bankBranch')} />
          {errors.bankBranch && <p className="hrm-field__error">{errors.bankBranch.message}</p>}
        </div>
      </div>

      <FormSectionHeader step={isHr ? 8 : 7} title="BHXH" />
      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Đã tham gia BHXH chưa *</label>
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
          <label className="hrm-field__label">Số BHXH</label>
          <input className="hrm-field-input" {...register('siNumber')} />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full h-12 rounded-full font-bold mt-8 flex items-center justify-center gap-2">
        {isSubmitting
          ? (isHr ? 'ĐANG LƯU...' : 'ĐANG GỬI...')
          : (isHr ? 'LƯU NHÂN VIÊN' : 'GỬI THÔNG TIN')}
        <ChevronRight size={18} />
      </button>
    </form>
  );
}
