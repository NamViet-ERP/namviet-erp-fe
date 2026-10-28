import type React from 'react';
import { useState, useRef, type CSSProperties } from 'react';
import { useForm, useWatch, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, Trash2, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { showToast } from '../ui/Toast';
import { candidatesService } from '../../services/candidatesService';
import { filesService } from '../../services/filesService';
import FormSectionHeader from '../hr/FormSectionHeader';
import HrmDatePicker from '../hr/HrmDatePicker';
import HrmFieldLabel from '../hr/HrmFieldLabel';
import { hrmFieldClass } from '../hr/hrmFieldClass';
import HrmSelect from '../hr/HrmSelect';
import { RECRUITMENT_SOURCES, EDUCATION_LEVELS } from '../../constants/recruitment';
import { useActivePositions } from '../../hooks/usePositions';
import { useHrStaff } from '../../hooks/useHrStaff';
import { validateFullName } from '../../lib/hrm/validateFullName';
import { zPhoneField, zTrimmedString } from '../../lib/hrm/sanitizeInput';
import { registerHrmPhone, registerHrmText } from '../../lib/hrm/registerHrmField';

const candidateSchema = z.object({
  fullName: zTrimmedString().superRefine((val, ctx) => {
    const message = validateFullName(val);
    if (message) ctx.addIssue({ code: 'custom', message });
  }),
  phone: zPhoneField(),
  email: zTrimmedString().min(1, 'Vui lòng nhập email').email('Vui lòng nhập email hợp lệ'),
  gender: z.enum(['Nam', 'Nữ'], { message: 'Vui lòng chọn giới tính' }),
  address: zTrimmedString().min(5, 'Vui lòng nhập địa chỉ hiện tại'),
  birthDate: z.string().min(1, 'Vui lòng chọn năm sinh'),
  education: z.enum(EDUCATION_LEVELS, { message: 'Vui lòng chọn trình độ học vấn' }),
  position: z.string().min(1, 'Vui lòng chọn vị trí ứng tuyển'),
  experience: zTrimmedString().optional(),
  source: z.enum(RECRUITMENT_SOURCES, { message: 'Vui lòng chọn nguồn ứng tuyển' }),
  school: zTrimmedString().min(2, 'Vui lòng nhập tên trường'),
  major: zTrimmedString().min(2, 'Vui lòng nhập chuyên ngành'),
  hrResponsible: z.string().min(1, 'Vui lòng chọn HR phụ trách'),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

const FIELD_LABELS: Record<keyof CandidateFormValues, string> = {
  fullName: 'Họ và tên',
  birthDate: 'Năm sinh',
  phone: 'Số điện thoại',
  email: 'Email',
  gender: 'Giới tính',
  address: 'Địa chỉ hiện tại',
  education: 'Trình độ học vấn',
  position: 'Vị trí ứng tuyển',
  school: 'Trường đào tạo',
  major: 'Chuyên ngành',
  experience: 'Kinh nghiệm',
  source: 'Nguồn ứng tuyển',
  hrResponsible: 'HR phụ trách',
};

const VALIDATION_FIELD_ORDER: (keyof CandidateFormValues)[] = [
  'fullName', 'birthDate', 'phone', 'email', 'gender', 'address',
  'education', 'position', 'school', 'major', 'source', 'hrResponsible',
];

function scrollToField(field: string) {
  const el = document.querySelector(`[data-form-field="${field}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = el?.querySelector<HTMLElement>('input, select, textarea, button');
  focusable?.focus();
}

export default function CandidateForm() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileUrl, setCvFileUrl] = useState<string | null>(null);
  const [cvFileSize, setCvFileSize] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const positionsQuery = useActivePositions();
  const { data: positions = [], isLoading: loadingPositions } = positionsQuery;
  const staffQuery = useHrStaff();
  const hrStaffOptions = (staffQuery.data ?? []).map(staff => staff.name);
  const loadingOptions = loadingPositions || staffQuery.isLoading;
  const optionsFailed = positionsQuery.isError || staffQuery.isError;
  const noPositionsAvailable = positionsQuery.isSuccess && positions.length === 0;
  const noStaffAvailable = staffQuery.isSuccess && hrStaffOptions.length === 0;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvSectionRef = useRef<HTMLDivElement>(null);
  const uploadSessionId = useRef(crypto.randomUUID()).current;

  const {
    register,
    handleSubmit,
    setValue,
    control,
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
      school: '',
      major: '',
      position: '',
      hrResponsible: '',
    }
  });

  const selectedGender = useWatch({ control, name: 'gender' });
  const selectedEducation = useWatch({ control, name: 'education' });
  const selectedSource = useWatch({ control, name: 'source' });
  const birthDate = useWatch({ control, name: 'birthDate' }) ?? '';
  const fieldA11y = (name: keyof CandidateFormValues) => ({
    'aria-invalid': Boolean(errors[name]) || undefined,
    'aria-describedby': errors[name] ? `candidate-${name}-error` : undefined,
    'aria-required': name !== 'experience',
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const [dragActive, setDragActive] = useState(false);

  const validateAndUploadFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !['pdf', 'docx', 'doc'].includes(extension || '')) {
      setFileError('Định dạng file không hỗ trợ. Chỉ nhận file .pdf, .docx, .doc');
      setCvFile(null);
      setCvFileUrl(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('Dung lượng file vượt quá 5MB');
      setCvFile(null);
      setCvFileUrl(null);
      return;
    }

    setFileError(null);
    setCvFile(file);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const uploaded = await filesService.upload(file, 'cv', { sessionId: uploadSessionId });
      setCvFileUrl(uploaded.url);
      setCvFileSize((uploaded.fileSize / (1024 * 1024)).toFixed(2) + ' MB');
      setUploadProgress(100);
      showToast('success', 'Tải file CV lên thành công');
    } catch {
      setFileError('Không thể tải CV lên máy chủ. Vui lòng thử lại.');
      setCvFile(null);
      setCvFileUrl(null);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
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
    setCvFileUrl(null);
    setCvFileSize('');
    setUploadProgress(0);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onInvalid = (fieldErrors: FieldErrors<CandidateFormValues>) => {
    const invalidKeys = VALIDATION_FIELD_ORDER.filter(key => fieldErrors[key]?.message);
    if (invalidKeys.length === 0) return;

    const firstKey = invalidKeys[0];
    const firstMessage = fieldErrors[firstKey]?.message ?? 'Vui lòng kiểm tra lại thông tin';
    showToast(
      'warning',
      firstMessage,
      invalidKeys.length > 1
        ? `Còn ${invalidKeys.length - 1} mục chưa hợp lệ — vui lòng kiểm tra form`
        : `${FIELD_LABELS[firstKey]} chưa hợp lệ`,
    );
    scrollToField(firstKey);
  };

  const onSubmit = async (data: CandidateFormValues) => {
    setSubmitError(null);
    if (!cvFile || !cvFileUrl) {
      const message = 'Vui lòng tải lên file CV của bạn';
      setFileError(message);
      showToast('warning', message, 'Thiếu file CV');
      cvSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (isUploading) {
      showToast('warning', 'Vui lòng chờ quá trình tải file CV hoàn tất');
      return;
    }

    try {
      await candidatesService.applyPublic({
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
        cvFileSize: cvFileSize || (cvFile.size / (1024 * 1024)).toFixed(2) + ' MB',
        cvFileUrl,
      });

      setIsSubmitted(true);
      showToast('success', 'Hồ sơ của bạn đã được tiếp nhận!', 'Nộp hồ sơ thành công');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại!';
      setSubmitError(message);
      showToast('error', message);
    }
  };

  const handleResetForm = () => {
    reset();
    handleRemoveFile();
    setIsSubmitted(false);
    setSubmitError(null);
  };

  if (isSubmitted) {
    return (
      <div className="hrm-success-state animate-scale-in">
        <div className="hrm-success-state__icon"><CheckCircle2 size={72} /></div>
        <h3 className="hrm-success-state__title">Nộp Hồ Sơ Thành Công!</h3>
        <p className="hrm-success-state__desc">
          Cảm ơn bạn đã ứng tuyển vào hệ thống của chúng tôi. Bộ phận Tuyển dụng (Mayzer HR) sẽ xem xét hồ sơ và liên hệ sớm nhất với bạn qua số điện thoại hoặc email đã đăng ký.
        </p>
        <button onClick={handleResetForm} className="btn btn-primary rounded-full px-8 font-bold">
          Nộp thêm hồ sơ khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={e => { void handleSubmit(onSubmit, onInvalid)(e); }} noValidate className="candidate-apply-form space-y-1">
      {loadingOptions && <p role="status">Đang tải thông tin tuyển dụng...</p>}
      {optionsFailed && (
        <div role="alert" className="hrm-field__error">
          <p>Không thể tải thông tin tuyển dụng. Vui lòng thử lại.</p>
          <button type="button" className="btn btn-secondary" onClick={() => {
            void positionsQuery.refetch();
            void staffQuery.refetch();
          }}>Thử lại</button>
        </div>
      )}
      {noStaffAvailable && <p role="status">Chưa có nhân sự phụ trách để tiếp nhận hồ sơ. Vui lòng liên hệ Phòng Nhân sự hoặc quay lại sau.</p>}
      {submitError && <p role="alert" className="hrm-field__error">{submitError}</p>}
      {noPositionsAvailable && (
        <div
          role="status"
          className="p-4 rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low,#f8fafc)] text-[var(--md-on-surface)] flex items-start gap-3 mb-6"
        >
          <AlertCircle className="w-5 h-5 text-[var(--md-primary)] shrink-0 mt-0.5" aria-hidden />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-[var(--md-on-surface)] mb-1">Thông báo đợt tuyển dụng</p>
            <p className="text-[var(--md-on-surface-variant)] m-0">
              Hiện tại hệ thống chưa có đợt tuyển dụng công khai nào đang mở vị trí. Quý ứng viên vui lòng quay lại sau hoặc liên hệ Phòng Nhân sự qua email{' '}
              <a href="mailto:tuyendung@mayzer.vn" className="font-semibold text-[var(--md-primary)] underline">
                tuyendung@mayzer.vn
              </a>.
            </p>
          </div>
        </div>
      )}

      <FormSectionHeader step={1} title="Thông tin ứng viên" />

      <div className="hrm-form-grid">
        <div data-form-field="fullName">
          <HrmFieldLabel htmlFor="candidate-full-name" required>Họ và tên</HrmFieldLabel>
          <input
            id="candidate-full-name"
            {...fieldA11y('fullName')}
            type="text"
            className={hrmFieldClass(Boolean(errors.fullName))}
            placeholder="Nhập họ tên"
            {...registerHrmText(register, setValue, 'fullName')}
          />
          {errors.fullName && <p id="candidate-fullName-error" className="hrm-field__error">{errors.fullName.message}</p>}
        </div>
        <div data-form-field="birthDate">
          <HrmFieldLabel htmlFor="candidate-birth-date" required>Năm sinh</HrmFieldLabel>
          <HrmDatePicker
            id="candidate-birth-date"
            aria-describedby={fieldA11y('birthDate')['aria-describedby']}
            value={birthDate}
            onChange={v => setValue('birthDate', v, { shouldValidate: true })}
            error={Boolean(errors.birthDate)}
            max={new Date().toISOString().slice(0, 10)}
            yearFrom={1940}
          />
          {errors.birthDate && <p id="candidate-birthDate-error" className="hrm-field__error">{errors.birthDate.message}</p>}
        </div>
      </div>

      <div className="hrm-form-grid">
        <div data-form-field="phone">
          <HrmFieldLabel htmlFor="candidate-phone" required>Số điện thoại</HrmFieldLabel>
          <input
            id="candidate-phone"
            {...fieldA11y('phone')}
            type="tel"
            className={hrmFieldClass(Boolean(errors.phone))}
            placeholder="10 hoặc 11 số, bắt đầu bằng 0"
            {...registerHrmPhone(register, setValue, 'phone')}
          />
          {errors.phone && <p id="candidate-phone-error" className="hrm-field__error">{errors.phone.message}</p>}
        </div>
        <div data-form-field="email">
          <HrmFieldLabel htmlFor="candidate-email" required>Email</HrmFieldLabel>
          <input
            id="candidate-email"
            {...fieldA11y('email')}
            type="text"
            inputMode="email"
            autoComplete="email"
            className={hrmFieldClass(Boolean(errors.email))}
            placeholder="Nhập email"
            {...registerHrmText(register, setValue, 'email')}
          />
          {errors.email && <p id="candidate-email-error" className="hrm-field__error">{errors.email.message}</p>}
        </div>
        <div data-form-field="gender">
          <HrmFieldLabel required>Giới tính</HrmFieldLabel>
          <div className="hrm-radio-row">
            {(['Nam', 'Nữ'] as const).map(g => (
              <label key={g} htmlFor={`candidate-gender-${g}`}>
                <input
                  id={`candidate-gender-${g}`}
                  name="gender"
                  {...fieldA11y('gender')}
                  type="radio"
                  checked={selectedGender === g}
                  onChange={() => setValue('gender', g, { shouldValidate: true })}
                />
                {g}
              </label>
            ))}
          </div>
          {errors.gender && <p id="candidate-gender-error" className="hrm-field__error">{errors.gender.message}</p>}
        </div>
        <div data-form-field="address">
          <HrmFieldLabel htmlFor="candidate-address" required>Địa chỉ hiện tại</HrmFieldLabel>
          <input
            id="candidate-address"
            {...fieldA11y('address')}
            type="text"
            className={hrmFieldClass(Boolean(errors.address))}
            placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành..."
            {...registerHrmText(register, setValue, 'address')}
          />
          {errors.address && <p id="candidate-address-error" className="hrm-field__error">{errors.address.message}</p>}
        </div>
      </div>

      <FormSectionHeader step={2} title="Trình độ & Vị trí ứng tuyển" />

      <div className="hrm-form-grid">
        <div data-form-field="education">
          <HrmFieldLabel required>Trình độ học vấn</HrmFieldLabel>
          <div className="hrm-radio-row">
            {EDUCATION_LEVELS.map(edu => (
              <label key={edu} htmlFor={`candidate-edu-${edu}`}>
                <input
                  id={`candidate-edu-${edu}`}
                  name="education"
                  {...fieldA11y('education')}
                  type="radio"
                  checked={selectedEducation === edu}
                  onChange={() => setValue('education', edu, { shouldValidate: true })}
                />
                {edu}
              </label>
            ))}
          </div>
          {errors.education && <p id="candidate-education-error" className="hrm-field__error">{errors.education.message}</p>}
        </div>
        <div data-form-field="position">
          <HrmFieldLabel htmlFor="candidate-position" required>Vị trí ứng tuyển</HrmFieldLabel>
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <HrmSelect
                id="candidate-position"
                {...fieldA11y('position')}
                name="position"
                className="h-11"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={positions}
                placeholder={noPositionsAvailable ? '-- Hiện không có vị trí nào đang mở --' : '-- Chọn vị trí ứng tuyển --'}
                error={Boolean(errors.position)}
                disabled={loadingPositions || positionsQuery.isError || noPositionsAvailable}
              />
            )}
          />
          {errors.position && <p id="candidate-position-error" className="hrm-field__error">{errors.position.message}</p>}
        </div>
      </div>

      <div className="hrm-form-grid">
        <div data-form-field="school">
          <HrmFieldLabel htmlFor="candidate-school" required>Trường đào tạo</HrmFieldLabel>
          <input
            id="candidate-school"
            {...fieldA11y('school')}
            type="text"
            className={hrmFieldClass(Boolean(errors.school))}
            placeholder="Nhập tên trường"
            {...registerHrmText(register, setValue, 'school')}
          />
          {errors.school && <p id="candidate-school-error" className="hrm-field__error">{errors.school.message}</p>}
        </div>
        <div data-form-field="major">
          <HrmFieldLabel htmlFor="candidate-major" required>Chuyên ngành</HrmFieldLabel>
          <input
            id="candidate-major"
            {...fieldA11y('major')}
            type="text"
            className={hrmFieldClass(Boolean(errors.major))}
            placeholder="Nhập chuyên ngành"
            {...registerHrmText(register, setValue, 'major')}
          />
          {errors.major && <p id="candidate-major-error" className="hrm-field__error">{errors.major.message}</p>}
        </div>
      </div>

      <div>
        <HrmFieldLabel htmlFor="candidate-experience">Số năm kinh nghiệm</HrmFieldLabel>
        <input
          id="candidate-experience"
          type="text"
          className="hrm-field-input"
          placeholder="Ví dụ: Chưa có, 2 năm, 5 năm..."
          {...registerHrmText(register, setValue, 'experience')}
        />
      </div>

      <div data-form-field="source">
        <HrmFieldLabel required>Nguồn ứng tuyển</HrmFieldLabel>
        <div className="hrm-radio-row">
          {RECRUITMENT_SOURCES.map(src => (
            <label key={src} htmlFor={`candidate-source-${src}`}>
              <input
                id={`candidate-source-${src}`}
                name="source"
                {...fieldA11y('source')}
                type="radio"
                checked={selectedSource === src}
                onChange={() => setValue('source', src, { shouldValidate: true })}
              />
              {src}
            </label>
          ))}
        </div>
        {errors.source && <p id="candidate-source-error" className="hrm-field__error">{errors.source.message}</p>}
      </div>

      <div data-form-field="hrResponsible">
        <HrmFieldLabel htmlFor="candidate-hr-responsible" required>HR phụ trách</HrmFieldLabel>
        <Controller
          name="hrResponsible"
          control={control}
          render={({ field }) => (
            <HrmSelect
              id="candidate-hr-responsible"
              {...fieldA11y('hrResponsible')}
              name="hrResponsible"
              className="h-11"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={hrStaffOptions}
              disabled={staffQuery.isLoading || staffQuery.isError || noStaffAvailable}
              placeholder="-- Chọn HR phụ trách --"
              error={Boolean(errors.hrResponsible)}
            />
          )}
        />
        {errors.hrResponsible && <p id="candidate-hrResponsible-error" className="hrm-field__error">{errors.hrResponsible.message}</p>}
      </div>
      <div className="candidate-upload-header">
        <FormSectionHeader step={3} title="Tải lên CV" />
      </div>
      <div ref={cvSectionRef}>
        <HrmFieldLabel htmlFor="candidate-cv-file" required>File CV</HrmFieldLabel>

        {!cvFile ? (
          <div
            className={`hrm-upload-zone${dragActive ? ' hrm-upload-zone--active' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Chọn file CV"
            aria-describedby={fileError ? 'candidate-cv-error' : undefined}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              id="candidate-cv-file"
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
                  <div
                    className="hrm-upload-file__progress-bar"
                    style={{ '--upload-progress': `${uploadProgress}%` } as CSSProperties}
                  />
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isUploading}
              aria-label="Xóa file CV"
              className="text-[var(--md-error)] bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-[var(--md-error-container)] transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}

        {fileError && <p id="candidate-cv-error" role="alert" className="hrm-field__error">{fileError}</p>}
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="btn btn-primary w-full h-12 rounded-full font-bold flex items-center justify-center gap-2"
          disabled={isSubmitting || isUploading || loadingOptions || optionsFailed || noPositionsAvailable || noStaffAvailable}
        >
          <span>{isSubmitting ? 'ĐANG GỬI HỒ SƠ...' : 'GỬI HỒ SƠ ỨNG TUYỂN'}</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </form>
  );
}
