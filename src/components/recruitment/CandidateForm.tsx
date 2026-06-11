import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { showToast } from '../ui/Toast';

const POSITIONS = [
  'CS sầu riêng', 'CSKH MZ', 'Giám sát MTKP', 'HCNS', 'Kế toán', 
  'Kỹ thuật xưởng Mayzer', 'Marketing', 'Quản lý trang trại', 'Sale Kaizen', 
  'Sale King Power', 'Sale Mayzer', 'Sale Mayzer Hà Nội', 'Sale miền tây', 
  'Sale MTKP', 'Thiết kế/dự toán', 'Thu mua', 'TP Công nghệ MTKP', 
  'TP KD MTKP', 'TTS HCNS', 'Vận hành MTKP', 'Kỹ thuật điện', 
  'Giám sát', 'Nhân viên dự án', 'Sourcing', 'Nhân viên công nghệ MTKP', 
  'Kỹ thuật điện Mayzer', 'KT Quản lý kho Mayzer', 'Trưởng nhóm bảo trì Lò hơi', 
  'KT Chế tạo Lò hơi', 'TTS Cung ứng', 'Kỹ thuật MNK', 'PP Vận hành MTKP', 
  'Thiết kế thi công MTKP', 'Kỹ sư môi trường'
];

const SOURCES = ['Facebook', 'Zalo', '24h - lọc', '24h - ứng tuyển', 'TopCV', 'Glints'];

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
  education: z.enum(['Đại học', 'Cao đẳng', 'THPT', 'Khác'], { message: 'Vui lòng chọn trình độ học vấn' }),
  position: z.string().min(1, 'Vui lòng chọn vị trí ứng tuyển'),
  experience: z.string().optional(),
  source: z.enum(['Facebook', 'Zalo', '24h - lọc', '24h - ứng tuyển', 'TopCV', 'Glints'], { message: 'Vui lòng chọn nguồn ứng tuyển' }),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

export default function CandidateForm() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
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
      const existingCandidatesRaw = localStorage.getItem('nv-candidate-data');
      const candidates = existingCandidatesRaw ? JSON.parse(existingCandidatesRaw) : [];
      
      const newCandidate = {
        id: 'cand_' + Date.now(),
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        address: data.address,
        birthDate: data.birthDate,
        education: data.education,
        position: data.position,
        experience: data.experience || 'Chưa cập nhật',
        source: data.source,
        cvFileName: cvFile.name,
        cvFileSize: (cvFile.size / (1024 * 1024)).toFixed(2) + ' MB',
        appliedAt: new Date().toISOString(),
        status: 'Mới nộp'
      };

      candidates.unshift(newCandidate);
      localStorage.setItem('nv-candidate-data', JSON.stringify(candidates));

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
      <div 
        className="animate-scale-in"
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--md-on-surface)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <CheckCircle2 size={72} style={{ color: 'var(--md-success, #386A20)' }} />
        </div>
        <h3
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          Nộp Hồ Sơ Thành Công!
        </h3>
        <p
          style={{
            color: 'var(--md-on-surface-variant)',
            fontSize: '0.95rem',
            maxWidth: '480px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}
        >
          Cảm ơn bạn đã ứng tuyển vào hệ thống của chúng tôi. Bộ phận Tuyển dụng (Vinh Việt HR) sẽ xem xét hồ sơ và liên hệ sớm nhất với bạn qua số điện thoại hoặc email đã đăng ký.
        </p>
        <button
          onClick={handleResetForm}
          className="btn btn-primary"
          style={{
            padding: '0 32px',
            fontWeight: 700,
            borderRadius: '9999px',
          }}
        >
          Nộp thêm hồ sơ khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div style={{ borderBottom: '1px solid var(--md-outline-variant)', paddingBottom: '12px', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--md-primary)' }}>Thông tin ứng viên</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>Vui lòng cung cấp chính xác các thông tin dưới đây để chúng tôi liên hệ.</p>
      </div>

      {/* Full Name & DOB */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-1 md:grid-cols-2">
        <div>
          <label className="form-label">Họ và tên *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Nhập họ và tên..."
            {...register('fullName')}
            style={{ borderColor: errors.fullName ? 'var(--md-error)' : undefined }}
          />
          {errors.fullName && (
            <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.fullName.message}</p>
          )}
        </div>
        <div>
          <label className="form-label">Năm sinh *</label>
          <input
            type="date"
            className="form-input"
            {...register('birthDate')}
            style={{ borderColor: errors.birthDate ? 'var(--md-error)' : undefined, paddingRight: '12px' }}
          />
          {errors.birthDate && (
            <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.birthDate.message}</p>
          )}
        </div>
      </div>

      {/* Phone & Email */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-1 md:grid-cols-2">
        <div>
          <label className="form-label">Số điện thoại *</label>
          <input
            type="tel"
            className="form-input"
            placeholder="Ví dụ: 0912345678..."
            {...register('phone')}
            style={{ borderColor: errors.phone ? 'var(--md-error)' : undefined }}
          />
          {errors.phone && (
            <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className="form-label">Email *</label>
          <input
            type="email"
            className="form-input"
            placeholder="Ví dụ: hoten@gmail.com..."
            {...register('email')}
            style={{ borderColor: errors.email ? 'var(--md-error)' : undefined }}
          />
          {errors.email && (
            <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Gender & Address */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px' }} className="grid-cols-1 md:grid-cols-2">
        <div>
          <label className="form-label">Giới tính *</label>
          <div style={{ display: 'flex', gap: '16px', height: '56px', alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
              <input
                type="radio"
                value="Nam"
                checked={selectedGender === 'Nam'}
                onChange={() => setValue('gender', 'Nam', { shouldValidate: true })}
                style={{ accentColor: 'var(--md-primary)' }}
              />
              <span>Nam</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
              <input
                type="radio"
                value="Nữ"
                checked={selectedGender === 'Nữ'}
                onChange={() => setValue('gender', 'Nữ', { shouldValidate: true })}
                style={{ accentColor: 'var(--md-primary)' }}
              />
              <span>Nữ</span>
            </label>
          </div>
          {errors.gender && (
            <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.gender.message}</p>
          )}
        </div>
        <div>
          <label className="form-label">Địa chỉ hiện tại *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành..."
            {...register('address')}
            style={{ borderColor: errors.address ? 'var(--md-error)' : undefined }}
          />
          {errors.address && (
            <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.address.message}</p>
          )}
        </div>
      </div>

      <div style={{ borderBottom: '1px solid var(--md-outline-variant)', paddingBottom: '12px', marginTop: '32px', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--md-primary)' }}>Trình độ & Vị trí ứng tuyển</h3>
      </div>

      {/* Education & Applied Position */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }} className="grid-cols-1 md:grid-cols-2">
        <div>
          <label className="form-label">Trình độ học vấn *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', minHeight: '56px', paddingTop: '8px' }}>
            {['Đại học', 'Cao đẳng', 'THPT', 'Khác'].map((edu) => (
              <label key={edu} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                <input
                  type="radio"
                  value={edu}
                  checked={selectedEducation === edu}
                  onChange={() => setValue('education', edu as any, { shouldValidate: true })}
                  style={{ accentColor: 'var(--md-primary)' }}
                />
                <span>{edu}</span>
              </label>
            ))}
          </div>
          {errors.education && (
            <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.education.message}</p>
          )}
        </div>

        <div>
          <label className="form-label">Vị trí ứng tuyển *</label>
          <select
            className="form-select"
            style={{ width: '100%', height: '56px', borderBottom: '1px solid var(--md-outline)' }}
            {...register('position')}
          >
            <option value="">-- Chọn vị trí ứng tuyển --</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
          {errors.position && (
            <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.position.message}</p>
          )}
        </div>
      </div>

      {/* Experience Years */}
      <div>
        <label className="form-label">Số năm kinh nghiệm (Tùy chọn)</label>
        <input
          type="text"
          className="form-input"
          placeholder="Nhập số năm kinh nghiệm (Ví dụ: Chưa có, 2 năm, 5 năm...)"
          {...register('experience')}
        />
      </div>

      {/* Recruitment Source */}
      <div>
        <label className="form-label">Nguồn ứng tuyển *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', paddingTop: '8px' }}>
          {SOURCES.map((src) => (
            <label key={src} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
              <input
                type="radio"
                value={src}
                checked={selectedSource === src}
                onChange={() => setValue('source', src as any, { shouldValidate: true })}
                style={{ accentColor: 'var(--md-primary)' }}
              />
              <span>{src}</span>
            </label>
          ))}
        </div>
        {errors.source && (
          <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.source.message}</p>
        )}
      </div>

      {/* CV Upload */}
      <div>
        <label className="form-label">Tải lên file CV *</label>
        
        {!cvFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: dragActive ? '2px dashed var(--md-primary)' : '2px dashed var(--md-outline)',
              borderRadius: '16px',
              padding: '32px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragActive ? 'rgba(0, 142, 206, 0.04)' : 'var(--md-surface-container-low)',
              transition: 'all 200ms var(--md-easing)',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <Upload size={36} style={{ color: dragActive ? 'var(--md-primary)' : 'var(--md-on-surface-variant)' }} />
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Kéo thả file CV của bạn vào đây hoặc click để duyệt file</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', marginTop: '6px' }}>
              Hỗ trợ định dạng .pdf, .docx, .doc (Dung lượng nhỏ hơn 5MB)
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--md-surface-container-low)',
              border: '1px solid var(--md-outline-variant)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  background: 'var(--md-primary-container)',
                  color: 'var(--md-primary)',
                  padding: '10px',
                  borderRadius: '10px',
                  display: 'flex',
                }}
              >
                <FileText size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p 
                  style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}
                >
                  {cvFile.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>
                  {(cvFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                
                {/* Progress bar */}
                {(isUploading || uploadProgress < 100) && (
                  <div style={{ width: '100%', background: 'var(--md-outline-variant)', height: '4px', borderRadius: '999px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, background: 'var(--md-primary)', height: '100%', transition: 'width 100ms linear' }} />
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--md-error)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 200ms var(--md-easing)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-error-container)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
        
        {fileError && (
          <p style={{ color: 'var(--md-error)', fontSize: '0.75rem', marginTop: '4px' }}>{fileError}</p>
        )}
      </div>

      {/* Submit Button */}
      <div style={{ paddingTop: '16px' }}>
        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: '100%',
            height: '48px',
            fontSize: '0.95rem',
            fontWeight: 700,
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          disabled={isSubmitting || isUploading}
        >
          <span>{isSubmitting ? 'ĐANG GỬI HỒ SƠ...' : 'GỬI HỒ SƠ ỨNG TUYỂN'}</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </form>
  );
}
