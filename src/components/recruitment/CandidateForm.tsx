import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { showToast } from '../ui/Toast';
import { getHrStaff } from '../../constants/systemUsers';
import { candidatesService } from '../../services/candidatesService';
import FormSectionHeader from '../hr/FormSectionHeader';
import { RECRUITMENT_SOURCES, EDUCATION_LEVELS } from '../../constants/recruitment';
import { useActivePositions } from '../../hooks/usePositions';

const candidateSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  phone: z.string()
    .min(10, 'Số điện thoại phải từ 10 số')
    .max(11, 'Số điện thoại không quá 11 số')
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0912345678)'),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không đúng định dạng'),
  gender: z.enum(['Nam', 'Nữ'], { message: 'Vui lòng chọn giới tính' }),
  address: z.string().min(5, 'Địa chỉ hiện tại phải từ 5 ký tự'),
  birthDate: z.string().min(1, 'Năm sinh là bắt buộc'),
  education: z.enum(EDUCATION_LEVELS, { message: 'Vui lòng chọn trình độ học vấn' }),
  position: z.string().min(1, 'Vui lòng chọn vị trí ứng tuyển'),
  experience: z.string().optional(),
  source: z.enum(RECRUITMENT_SOURCES, { message: 'Vui lòng chọn nguồn ứng tuyển' }),
  school: z.string().min(2, 'Vui lòng nhập tên trường'),
  major: z.string().min(2, 'Vui lòng nhập chuyên ngành'),
  hrResponsible: z.string().min(1, 'Vui lòng chọn HR phụ trách'),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

export default function CandidateForm() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { data: positions = [] } = useActivePositions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      birthDate: '',
      experience: '',
    }
  });

  const selectedGender = watch('gender');
  const selectedEducation = watch('education');
  const selectedSource = watch('source');
  const hrStaff = getHrStaff();

  // Handle drag events
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndUploadFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !['pdf', 'docx', 'doc'].includes(extension || '')) {
      setFileError('Định dạng file không hỗ trợ. Chỉ nhận file .pdf, .docx, .doc');
      setCvFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('Dung lượng file vượt quá 5MB');
      setCvFile(null);
      return;
    }

    setFileError(null);
    setCvFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          showToast('success', 'Tải file CV lên thành công');
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setCvFile(null);
    setUploadProgress(0);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: CandidateFormValues) => {
    if (!cvFile) {
      setFileError('Vui lòng tải lên file CV của bạn');
      return;
    }
    if (isUploading) {
      showToast('warning', 'Vui lòng chờ quá trình tải file CV hoàn tất');
      return;
    }

    // Save to localStorage simulated candidate database
    try {
      candidatesService.create({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        address: data.address,
        birthDate: data.birthDate,
        education: data.education,
        school: data.school,
        major: data.major,
        position: data.position,
        experience: data.experience || 'Chưa cập nhật',
        source: data.source,
        hrResponsible: data.hrResponsible,
        cvFileName: cvFile.name,
        cvFileSize: (cvFile.size / (1024 * 1024)).toFixed(2) + ' MB',
      });

      setIsSubmitted(true);
      showToast('success', 'Hồ sơ của bạn đã được tiếp nhận!', 'Nộp hồ sơ thành công');
    } catch (e) {
      console.error(e);
      showToast('error', 'Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại!');
    }
  };

  const handleResetForm = () => {
    reset();
    handleRemoveFile();
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="hrm-success-state animate-scale-in">
        <div className="hrm-success-state__icon"><CheckCircle2 size={72} /></div>
        <h3 className="hrm-success-state__title">Nộp Hồ Sơ Thành Công!</h3>
        <p className="hrm-success-state__desc">
          Cảm ơn bạn đã ứng tuyển vào hệ thống của chúng tôi. Bộ phận Tuyển dụng (Vinh Việt HR) sẽ xem xét hồ sơ và liên hệ sớm nhất với bạn qua số điện thoại hoặc email đã đăng ký.
        </p>
        <button onClick={handleResetForm} className="btn btn-primary rounded-full px-8 font-bold">
          Nộp thêm hồ sơ khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      <FormSectionHeader step={1} title="Thông tin ứng viên" />
      <p className="text-xs text-[var(--md-on-surface-variant)] -mt-2 mb-4">Vui lòng cung cấp chính xác các thông tin dưới đây để chúng tôi liên hệ.</p>

      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Họ và tên *</label>
          <input
            type="text"
            className={`hrm-field-input${errors.fullName ? ' hrm-field-input--error' : ''}`}
            placeholder="Nhập họ và tên..."
            {...register('fullName')}
          />
          {errors.fullName && <p className="hrm-field__error">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Năm sinh *</label>
          <input
            type="date"
            className={`hrm-field-input${errors.birthDate ? ' hrm-field-input--error' : ''}`}
            {...register('birthDate')}
          />
          {errors.birthDate && <p className="hrm-field__error">{errors.birthDate.message}</p>}
        </div>
      </div>

      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Số điện thoại *</label>
          <input
            type="tel"
            className={`hrm-field-input${errors.phone ? ' hrm-field-input--error' : ''}`}
            placeholder="Ví dụ: 0912345678..."
            {...register('phone')}
          />
          {errors.phone && <p className="hrm-field__error">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Email *</label>
          <input
            type="email"
            className={`hrm-field-input${errors.email ? ' hrm-field-input--error' : ''}`}
            placeholder="Ví dụ: hoten@gmail.com..."
            {...register('email')}
          />
          {errors.email && <p className="hrm-field__error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Giới tính *</label>
          <div className="hrm-radio-row">
            {(['Nam', 'Nữ'] as const).map(g => (
              <label key={g}>
                <input
                  type="radio"
                  checked={selectedGender === g}
                  onChange={() => setValue('gender', g, { shouldValidate: true })}
                />
                {g}
              </label>
            ))}
          </div>
          {errors.gender && <p className="hrm-field__error">{errors.gender.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Địa chỉ hiện tại *</label>
          <input
            type="text"
            className={`hrm-field-input${errors.address ? ' hrm-field-input--error' : ''}`}
            placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành..."
            {...register('address')}
          />
          {errors.address && <p className="hrm-field__error">{errors.address.message}</p>}
        </div>
      </div>

      <FormSectionHeader step={2} title="Trình độ & Vị trí ứng tuyển" />

      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Trình độ học vấn *</label>
          <div className="hrm-radio-row">
            {EDUCATION_LEVELS.map(edu => (
              <label key={edu}>
                <input
                  type="radio"
                  checked={selectedEducation === edu}
                  onChange={() => setValue('education', edu, { shouldValidate: true })}
                />
                {edu}
              </label>
            ))}
          </div>
          {errors.education && <p className="hrm-field__error">{errors.education.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Vị trí ứng tuyển *</label>
          <select className={`hrm-field-select h-11${errors.position ? ' hrm-field-input--error' : ''}`} {...register('position')}>
            <option value="">-- Chọn vị trí ứng tuyển --</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
          {errors.position && <p className="hrm-field__error">{errors.position.message}</p>}
        </div>
      </div>

      <div className="hrm-form-grid">
        <div>
          <label className="hrm-field__label">Trường đào tạo *</label>
          <input
            type="text"
            className={`hrm-field-input${errors.school ? ' hrm-field-input--error' : ''}`}
            placeholder="Nhập tên trường..."
            {...register('school')}
          />
          {errors.school && <p className="hrm-field__error">{errors.school.message}</p>}
        </div>
        <div>
          <label className="hrm-field__label">Chuyên ngành *</label>
          <input
            type="text"
            className={`hrm-field-input${errors.major ? ' hrm-field-input--error' : ''}`}
            placeholder="Nhập chuyên ngành..."
            {...register('major')}
          />
          {errors.major && <p className="hrm-field__error">{errors.major.message}</p>}
        </div>
      </div>

      <div>
        <label className="hrm-field__label">Số năm kinh nghiệm (Tùy chọn)</label>
        <input
          type="text"
          className="hrm-field-input"
          placeholder="Ví dụ: Chưa có, 2 năm, 5 năm..."
          {...register('experience')}
        />
      </div>

      <div>
        <label className="hrm-field__label">Nguồn ứng tuyển *</label>
        <div className="hrm-radio-row">
          {RECRUITMENT_SOURCES.map(src => (
            <label key={src}>
              <input
                type="radio"
                checked={selectedSource === src}
                onChange={() => setValue('source', src, { shouldValidate: true })}
              />
              {src}
            </label>
          ))}
        </div>
        {errors.source && <p className="hrm-field__error">{errors.source.message}</p>}
      </div>

      <div>
        <label className="hrm-field__label">HR phụ trách *</label>
        <select className={`hrm-field-select h-11${errors.hrResponsible ? ' hrm-field-input--error' : ''}`} {...register('hrResponsible')}>
          <option value="">-- Chọn HR phụ trách --</option>
          {hrStaff.map(hr => (
            <option key={hr.id} value={hr.name}>{hr.name}</option>
          ))}
        </select>
        {errors.hrResponsible && <p className="hrm-field__error">{errors.hrResponsible.message}</p>}
      </div>

      <FormSectionHeader step={3} title="Tải lên CV" />
      <div>
        <label className="hrm-field__label">File CV *</label>

        {!cvFile ? (
          <div
            className={`hrm-upload-zone${dragActive ? ' hrm-upload-zone--active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            <Upload size={36} className={`mx-auto mb-3 ${dragActive ? 'text-[var(--md-primary)]' : 'text-[var(--md-on-surface-variant)]'}`} />
            <p className="text-sm font-medium text-[var(--md-on-surface)]">Kéo thả file CV vào đây hoặc click để duyệt file</p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1.5">
              Hỗ trợ .pdf, .docx, .doc (dưới 5MB)
            </p>
          </div>
        ) : (
          <div className="hrm-upload-file">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="hrm-upload-file__icon">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-[var(--md-on-surface)]">{cvFile.name}</p>
                <p className="text-xs text-[var(--md-on-surface-variant)]">
                  {(cvFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                {(isUploading || uploadProgress < 100) && (
                  <div className="hrm-upload-file__progress">
                    <div className="hrm-upload-file__progress-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-[var(--md-error)] bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-[var(--md-error-container)] transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}

        {fileError && <p className="hrm-field__error">{fileError}</p>}
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="btn btn-primary w-full h-12 rounded-full font-bold flex items-center justify-center gap-2"
          disabled={isSubmitting || isUploading}
        >
          <span>{isSubmitting ? 'ĐANG GỬI HỒ SƠ...' : 'GỬI HỒ SƠ ỨNG TUYỂN'}</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </form>
  );
}
