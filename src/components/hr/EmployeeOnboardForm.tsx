import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { showToast } from '../ui/Toast';
import { employeesService } from '../../services/employeesService';
import { removeVietnameseTones } from '../../lib/vietnamese';
import FormSectionHeader from './FormSectionHeader';
import { EDUCATION_LEVELS } from '../../constants/recruitment';

const schema = z.object({
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
});

type FormValues = z.infer<typeof schema>;

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

export default function EmployeeOnboardForm() {
  const [profilePhoto, setProfilePhoto] = useState<FileState | null>(null);
  const [cccdFront, setCccdFront] = useState<FileState | null>(null);
  const [cccdBack, setCccdBack] = useState<FileState | null>(null);
  const [degreePhoto, setDegreePhoto] = useState<FileState | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { gender: undefined, maritalStatus: undefined, hadSocialInsurance: undefined },
  });

  const gender = watch('gender');
  const maritalStatus = watch('maritalStatus');
  const hadSi = watch('hadSocialInsurance');
  const bankAccountName = watch('bankAccountName') ?? '';

  const toAttachment = (f: FileState | null) =>
    f ? { fileName: f.file.name, fileSize: (f.file.size / 1024).toFixed(0) + ' KB', previewUrl: f.preview } : undefined;

  const onSubmit = (data: FormValues) => {
    if (!profilePhoto) { showToast('error', 'Vui lòng tải ảnh hồ sơ'); return; }
    if (!cccdFront || !cccdBack) { showToast('error', 'Vui lòng tải ảnh CCCD mặt trước và mặt sau'); return; }

    try {
      employeesService.create({
        fullName: data.fullName,
        gender: data.gender,
        birthDate: data.birthDate,
        joinDate: data.joinDate,
        status: 'Đang làm',
        profilePhoto: toAttachment(profilePhoto),
        cmndNumber: data.cmndNumber,
        cmndIssueDate: data.cmndIssueDate,
        cmndIssuePlace: data.cmndIssuePlace,
        cccdNumber: data.cccdNumber,
        cccdIssueDate: data.cccdIssueDate,
        cccdIssuePlace: data.cccdIssuePlace,
        cccdFront: toAttachment(cccdFront),
        cccdBack: toAttachment(cccdBack),
        personalEmail: data.personalEmail,
        personalPhone: data.personalPhone,
        permanentAddress: data.permanentAddress,
        temporaryAddress: data.temporaryAddress,
        education: data.education,
        school: data.school,
        major: data.major,
        degreePhoto: toAttachment(degreePhoto),
        maritalStatus: data.maritalStatus,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        hadSocialInsurance: data.hadSocialInsurance,
        siNumber: data.siNumber,
      });
      setIsSubmitted(true);
      showToast('success', 'Thông tin đã được gửi thành công!');
    } catch {
      showToast('error', 'Có lỗi xảy ra, vui lòng thử lại');
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
      <FormSectionHeader step={1} title="Thông tin cơ bản" />
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
          <input type="date" className="hrm-field-input" {...register('birthDate')} />
          {errors.birthDate && <p className="hrm-field__error">{errors.birthDate.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Ngày vào làm *</label>
          <input type="date" className="hrm-field-input" {...register('joinDate')} />
          {errors.joinDate && <p className="hrm-field__error">{errors.joinDate.message}</p>}
        </div>
      </div>
      <ImageUpload label="Ảnh hồ sơ *" file={profilePhoto} onFile={setProfilePhoto} onRemove={() => setProfilePhoto(null)} />

      <FormSectionHeader step={2} title="CMND (nếu có)" />
      <div className="hrm-form-grid hrm-form-grid--3">
        <div><label className="hrm-field__label">Số CMND</label><input className="hrm-field-input" {...register('cmndNumber')} /></div>
        <div><label className="hrm-field__label">Ngày cấp</label><input type="date" className="hrm-field-input" {...register('cmndIssueDate')} /></div>
        <div><label className="hrm-field__label">Nơi cấp</label><input className="hrm-field-input" {...register('cmndIssuePlace')} /></div>
      </div>

      <FormSectionHeader step={3} title="CCCD" />
      <div className="hrm-form-grid hrm-form-grid--3">
        <div>
          <label className="hrm-field__label">Số CCCD *</label>
          <input className="hrm-field-input" {...register('cccdNumber')} />
          {errors.cccdNumber && <p className="hrm-field__error">{errors.cccdNumber.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Ngày cấp *</label>
          <input type="date" className="hrm-field-input" {...register('cccdIssueDate')} />
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

      <FormSectionHeader step={4} title="Liên hệ" />
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

      <FormSectionHeader step={5} title="Học vấn" />
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

      <FormSectionHeader step={6} title="Ngân hàng" />
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

      <FormSectionHeader step={7} title="BHXH" />
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
        {isSubmitting ? 'ĐANG GỬI...' : 'GỬI THÔNG TIN'}
        <ChevronRight size={18} />
      </button>
    </form>
  );
}
