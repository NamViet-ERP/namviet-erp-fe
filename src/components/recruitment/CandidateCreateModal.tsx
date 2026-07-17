import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '../ui/Modal';
import HrmDatePicker from '../hr/HrmDatePicker';
import HrmSelect from '../hr/HrmSelect';
import { showToast } from '../ui/Toast';
import { useCreateCandidate } from '../../hooks/useCandidates';
import { filesService } from '../../services/filesService';
import { RECRUITMENT_SOURCES, EDUCATION_LEVELS } from '../../constants/recruitment';
import { usePositionSelectOptions } from '../../hooks/usePositions';
import { useHrStaffSelectOptions } from '../../hooks/useHrStaff';
import { validateFullName } from '../../lib/hrm/validateFullName';
import { zPhoneField, zTrimmedString } from '../../lib/hrm/sanitizeInput';
import { getApiErrorMessage } from '../../lib/apiClient';

const schema = z.object({
  fullName: zTrimmedString().superRefine((val, ctx) => {
    const message = validateFullName(val);
    if (message) ctx.addIssue({ code: 'custom', message });
  }),
  phone: zPhoneField(),
  email: zTrimmedString().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  gender: z.enum(['Nam', 'Nữ']),
  birthDate: z.string().min(1, 'Chọn năm sinh'),
  address: zTrimmedString().min(3, 'Nhập địa chỉ'),
  education: z.enum(EDUCATION_LEVELS),
  school: zTrimmedString().min(2, 'Nhập trường'),
  major: zTrimmedString().min(2, 'Nhập chuyên ngành'),
  position: z.string().min(1, 'Chọn vị trí'),
  experience: zTrimmedString().optional(),
  source: z.enum(RECRUITMENT_SOURCES),
  hrResponsible: z.string().min(1, 'Chọn HR phụ trách'),
});

type FormValues = z.infer<typeof schema>;

interface CandidateCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CandidateCreateModal({ open, onClose, onCreated }: CandidateCreateModalProps) {
  const createMutation = useCreateCandidate();
  const positionOptions = usePositionSelectOptions();
  const hrStaffOptions = useHrStaffSelectOptions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      gender: 'Nam',
      birthDate: '',
      address: '',
      education: 'Đại học',
      school: '',
      major: '',
      position: positionOptions[0] ?? '',
      experience: '',
      source: 'TopCV',
      hrResponsible: hrStaffOptions[0] ?? '',
    },
  });

  const close = () => {
    reset();
    setCvFile(null);
    setCvUrl(null);
    onClose();
  };

  const handleCvPick = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('warning', 'File CV tối đa 10MB');
      return;
    }
    setCvFile(file);
    setUploading(true);
    try {
      const up = await filesService.upload(file, 'cv');
      setCvUrl(up.url);
    } catch {
      showToast('error', 'Không tải được CV');
      setCvFile(null);
      setCvUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync({
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
        cvFileName: cvFile?.name ?? '',
        cvFileSize: cvFile ? `${(cvFile.size / (1024 * 1024)).toFixed(2)} MB` : '',
        cvFileUrl: cvUrl ?? undefined,
        status: 'New',
      });
      showToast('success', 'Đã thêm ứng viên');
      onCreated?.();
      close();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm ứng viên'));
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title="Thêm ứng viên"
      size="lg"
      footer={(
        <>
          <button type="button" className="btn btn-secondary" onClick={close}>Hủy</button>
          <button
            type="submit"
            form="candidate-create-form"
            className="btn btn-primary"
            disabled={createMutation.isPending || uploading}
          >
            {createMutation.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </button>
        </>
      )}
    >
      <form id="candidate-create-form" className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Họ và tên *</span>
          <input className="form-input form-input-md" {...register('fullName')} />
          {errors.fullName && <span className="text-xs text-[var(--md-error)]">{errors.fullName.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">SĐT *</span>
          <input className="form-input form-input-md" {...register('phone')} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email *</span>
          <input className="form-input form-input-md" {...register('email')} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Giới tính</span>
          <select className="form-input form-input-md" {...register('gender')}>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Năm sinh *</span>
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <HrmDatePicker value={field.value} onChange={field.onChange} placeholder="dd/mm/yyyy" />
            )}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Địa chỉ *</span>
          <input className="form-input form-input-md" {...register('address')} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Vị trí *</span>
          <Controller
            control={control}
            name="position"
            render={({ field }) => (
              <HrmSelect value={field.value} onChange={field.onChange} options={positionOptions} placeholder="Chọn vị trí" />
            )}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nguồn</span>
          <select className="form-input form-input-md" {...register('source')}>
            {RECRUITMENT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">HR phụ trách *</span>
          <Controller
            control={control}
            name="hrResponsible"
            render={({ field }) => (
              <HrmSelect value={field.value} onChange={field.onChange} options={hrStaffOptions} placeholder="Chọn HR" />
            )}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Trình độ</span>
          <select className="form-input form-input-md" {...register('education')}>
            {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Trường *</span>
          <input className="form-input form-input-md" {...register('school')} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Chuyên ngành *</span>
          <input className="form-input form-input-md" {...register('major')} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">CV (tùy chọn)</span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="text-sm"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) void handleCvPick(f);
            }}
          />
          {cvFile && <span className="text-xs text-[var(--md-on-surface-variant)]">{cvFile.name}{uploading ? ' — đang tải…' : ''}</span>}
        </label>
      </form>
    </Modal>
  );
}
