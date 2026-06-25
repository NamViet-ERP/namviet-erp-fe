import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import { useEmployee, useUpdateEmployee } from '../../hooks/useEmployees';
import { getSuggestedEmployeeCode } from '../../services/employeesService';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { employeeCodeNextHint } from '../../lib/hrm/suggestedEmployeeCode';
import { useEditableForm } from '../../hooks/useEditableForm';
import { EMPLOYEE_STATUSES } from '../../constants/recruitment';
import { calcSeniority } from '../../types/hr';
import type { Employee, FileAttachment } from '../../types/hr';
import { formatDateVi } from '../../lib/hrm/formatters';
import { sanitizeEmployeeForSave } from '../../lib/hrm/sanitizeInput';
import { toFileAttachment } from '../../lib/hrm/attachments';
import type { LocalFileState } from '../../components/hr/HrmImageUpload';
import { USE_MOCK } from '../../mocks';
import { filesService, type UploadCategory } from '../../services/filesService';
import DetailSection from '../../components/hr/DetailSection';
import DetailFieldGrid from '../../components/hr/DetailFieldGrid';
import {
  FieldView,
  FieldInput,
  FieldSelect,
  MaskedFieldView,
  SecureImagePreview,
  EditableImageField,
} from '../../components/hr/DetailFields';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmEditActions from '../../components/hr/HrmEditActions';
import HrmNotFound, { HrmLoadingState } from '../../components/hr/HrmNotFound';
import HrmProfileStripPhoto from '../../components/hr/HrmProfileStripPhoto';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading, isError } = useEmployee(id);
  const updateMutation = useUpdateEmployee();
  const { isEditing, setIsEditing, form, setForm, setField, cancelEdit } = useEditableForm(employee);
  const [codeError, setCodeError] = useState('');
  const [codeHint, setCodeHint] = useState('');
  const [prevEmployeeId, setPrevEmployeeId] = useState(employee?.id);
  const [pendingProfile, setPendingProfile] = useState<LocalFileState | null>(null);
  const [pendingCccdFront, setPendingCccdFront] = useState<LocalFileState | null>(null);
  const [pendingCccdBack, setPendingCccdBack] = useState<LocalFileState | null>(null);
  const [pendingDegree, setPendingDegree] = useState<LocalFileState | null>(null);
  const [profileRemoved, setProfileRemoved] = useState(false);

  const resetPendingUploads = () => {
    setPendingProfile(null);
    setPendingCccdFront(null);
    setPendingCccdBack(null);
    setPendingDegree(null);
    setProfileRemoved(false);
  };

  if (employee?.id !== prevEmployeeId) {
    setPrevEmployeeId(employee?.id);
    setCodeError('');
    setCodeHint('');
  }

  const handleEdit = async () => {
    if (!form) return;
    if (!form.code?.trim() && id) {
      try {
        const suggested = await getSuggestedEmployeeCode(id);
        setForm({ ...form, code: suggested });
        setCodeHint(employeeCodeNextHint(suggested));
      } catch (e) {
        console.error('Failed to fetch suggested employee code:', e);
        setCodeHint('');
      }
    } else {
      setCodeHint('');
    }
    setIsEditing(true);
  };

  if (isLoading) return <HrmLoadingState />;
  if (isError || !employee || !form) {
    return (
      <HrmNotFound
        message="Không tìm thấy nhân viên."
        onBack={() => navigate('/members/list')}
      />
    );
  }

  const seniority = calcSeniority(form.joinDate);

  const handleSave = async () => {
    if (!id || !form) return;
    setCodeError('');
    try {
      const uploadIfNeeded = async (
        pending: LocalFileState | null,
        category: UploadCategory,
        existing?: FileAttachment,
      ): Promise<FileAttachment | undefined> => {
        if (!pending) return existing;
        if (USE_MOCK) return toFileAttachment(pending);
        const result = await filesService.upload(pending.file, category, { employeeId: id });
        return {
          fileName: result.fileName,
          fileSize: `${Math.round(result.fileSize / 1024)} KB`,
          previewUrl: result.url,
        };
      };

      let profilePhoto: FileAttachment | undefined;
      if (profileRemoved && !pendingProfile) {
        profilePhoto = undefined;
      } else if (pendingProfile) {
        profilePhoto = await uploadIfNeeded(pendingProfile, 'profile', undefined);
      } else {
        profilePhoto = form.profilePhoto;
      }

      const [cccdFront, cccdBack, degreePhoto] = await Promise.all([
        uploadIfNeeded(pendingCccdFront, 'cccd-front', form.cccdFront),
        uploadIfNeeded(pendingCccdBack, 'cccd-back', form.cccdBack),
        uploadIfNeeded(pendingDegree, 'degree', form.degreePhoto),
      ]);

      const dto = sanitizeEmployeeForSave({ ...form, profilePhoto, cccdFront, cccdBack, degreePhoto } as Record<string, unknown>);
      delete dto.id;
      const updated = await updateMutation.mutateAsync({ id, dto });
      setForm({ ...updated });
      resetPendingUploads();
      if (form.status === 'Nghỉ việc') {
        showToast(
          'warning',
          employee.linkedAccountStatus === 'active' || employee.linkedAccountStatus === 'locked'
            ? 'Tài khoản hệ thống đã bị khóa. Nhân viên sẽ không xuất hiện trong các danh sách chọn.'
            : 'Nhân viên sẽ không xuất hiện trong các danh sách chọn liên quan.',
          'Đã cập nhật trạng thái nghỉ việc',
        );
      } else {
        showToast('success', 'Đã lưu thông tin nhân viên');
      }
      setIsEditing(false);
    } catch (e) {
      const msg = getApiErrorMessage(e, UI_ERROR.saveFailed);
      if (msg.includes('Mã nhân viên')) setCodeError(msg);
      showToast('error', msg);
    }
  };

  return (
    <div className="hrm-page w-full">
      <HrmDetailHeader
        onBack={() => navigate('/members/list')}
        title={employee.fullName}
        subtitle={employee.code ? `Mã NV: ${employee.code}` : 'Chưa có mã nhân viên'}
        actions={
          <HrmEditActions
            isEditing={isEditing}
            isSaving={updateMutation.isPending}
            onEdit={handleEdit}
            onCancel={() => { cancelEdit(); resetPendingUploads(); setCodeError(''); setCodeHint(''); }}
            onSave={handleSave}
          />
        }
      />

      <div className="hrm-profile-strip">
        <HrmProfileStripPhoto
          name={form.fullName}
          photoUrl={form.profilePhoto?.previewUrl}
          pending={pendingProfile}
          isEditing={isEditing}
          onFile={file => { setPendingProfile(file); setProfileRemoved(false); }}
          onRemove={() => { setPendingProfile(null); setField('profilePhoto', undefined); setProfileRemoved(true); }}
          onError={msg => showToast('error', msg)}
        />
        <div>
          <p className="font-bold text-lg text-[var(--md-on-surface)]">{form.fullName}</p>
          <p className="text-sm text-[var(--md-on-surface-variant)]">{form.position || 'Chưa có chức vụ'}</p>
          {isEditing && (
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">Nhấn ảnh để chọn hoặc cập nhật ảnh hồ sơ</p>
          )}
        </div>
      </div>

      <DetailSection title="Thông tin HR (Mã NV, Tổ chức)">
        {form.status === 'Nghỉ việc' && !isEditing && (
          <p className="hrm-alert hrm-alert--warning">
            Nhân viên đã nghỉ việc — tài khoản hệ thống (nếu có) bị khóa và không hiển thị trong các danh sách chọn.
          </p>
        )}
        <DetailFieldGrid>
          {isEditing ? (
            <>
              <FieldInput label="Mã nhân viên" value={form.code ?? ''} onChange={v => setField('code', v)} error={codeError} />
              {codeHint && (
                <p className="text-xs text-[var(--md-on-surface-variant)] col-span-full -mt-2">{codeHint}</p>
              )}
              <FieldInput label="Mảng" value={form.segment ?? ''} onChange={v => setField('segment', v)} />
              <FieldInput label="Chi nhánh" value={form.branch ?? ''} onChange={v => setField('branch', v)} />
              <FieldInput label="Bộ phận" value={form.department ?? ''} onChange={v => setField('department', v)} />
              <FieldInput label="Chức vụ" value={form.position ?? ''} onChange={v => setField('position', v)} />
              <FieldInput label="Ngày chính thức" value={form.officialDate ?? ''} onChange={v => setField('officialDate', v)} type="date" />
              <FieldSelect label="Trạng thái" value={form.status} onChange={v => setField('status', v as Employee['status'])} options={[...EMPLOYEE_STATUSES]} />
              <FieldInput label="Ngày nghỉ việc" value={form.resignDate ?? ''} onChange={v => setField('resignDate', v)} type="date" />
            </>
          ) : (
            <>
              <FieldView label="Mã nhân viên" value={form.code} />
              <FieldView label="Mảng" value={form.segment} />
              <FieldView label="Chi nhánh" value={form.branch} />
              <FieldView label="Bộ phận" value={form.department} />
              <FieldView label="Chức vụ" value={form.position} />
              <FieldView label="Ngày chính thức" value={formatDateVi(form.officialDate)} />
              <FieldView label="Trạng thái" value={form.status} />
              <FieldView label="Ngày nghỉ việc" value={formatDateVi(form.resignDate)} />
            </>
          )}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Thông tin cơ bản">
        <DetailFieldGrid>
          {isEditing ? (
            <>
              <FieldInput label="Họ và tên" value={form.fullName} onChange={v => setField('fullName', v)} />
              <FieldSelect label="Giới tính" value={form.gender} onChange={v => setField('gender', v as Employee['gender'])} options={['Nam', 'Nữ']} />
              <FieldInput label="Ngày sinh" value={form.birthDate} onChange={v => setField('birthDate', v)} type="date" />
              <FieldInput label="Ngày vào làm" value={form.joinDate} onChange={v => setField('joinDate', v)} type="date" />
            </>
          ) : (
            <>
              <FieldView label="Họ và tên" value={form.fullName} />
              <FieldView label="Giới tính" value={form.gender} />
              <FieldView label="Ngày sinh" value={formatDateVi(form.birthDate)} />
              <FieldView label="Ngày vào làm" value={formatDateVi(form.joinDate)} />
            </>
          )}
        </DetailFieldGrid>
        <div className="hrm-info-card mt-4">
          <p className="hrm-info-card__label flex items-center gap-1.5">
            <Clock size={14} aria-hidden />
            Thâm niên
          </p>
          <p className="hrm-info-card__value hrm-info-card__value--success">
            {seniority.years} năm {seniority.months} tháng {seniority.days} ngày
          </p>
        </div>
      </DetailSection>

      <DetailSection title="CMND / CCCD">
        {!isEditing && (form.cccdFront?.previewUrl || form.cccdNumber) && (
          <p className="hrm-alert hrm-alert--info mb-4">
            Thông tin nhạy cảm được che mặc định. Nhấn biểu tượng mắt hoặc &quot;Xem ảnh&quot; để hiện đầy đủ khi cần.
          </p>
        )}
        <DetailFieldGrid layout="three">
          {isEditing ? (
            <>
              <FieldInput label="Số CMND" value={form.cmndNumber ?? ''} onChange={v => setField('cmndNumber', v)} />
              <FieldInput label="Ngày cấp CMND" value={form.cmndIssueDate ?? ''} onChange={v => setField('cmndIssueDate', v)} type="date" />
              <FieldInput label="Nơi cấp CMND" value={form.cmndIssuePlace ?? ''} onChange={v => setField('cmndIssuePlace', v)} />
              <FieldInput label="Số CCCD" value={form.cccdNumber ?? ''} onChange={v => setField('cccdNumber', v)} />
              <FieldInput label="Ngày cấp CCCD" value={form.cccdIssueDate ?? ''} onChange={v => setField('cccdIssueDate', v)} type="date" />
              <FieldInput label="Nơi cấp CCCD" value={form.cccdIssuePlace ?? ''} onChange={v => setField('cccdIssuePlace', v)} />
            </>
          ) : (
            <>
              <MaskedFieldView label="Số CMND" value={form.cmndNumber} />
              <FieldView label="Ngày cấp CMND" value={formatDateVi(form.cmndIssueDate)} />
              <FieldView label="Nơi cấp CMND" value={form.cmndIssuePlace} />
              <MaskedFieldView label="Số CCCD" value={form.cccdNumber} />
              <FieldView label="Ngày cấp CCCD" value={formatDateVi(form.cccdIssueDate)} />
              <FieldView label="Nơi cấp CCCD" value={form.cccdIssuePlace} />
            </>
          )}
        </DetailFieldGrid>
        <DetailFieldGrid layout="two" className="mt-4">
          {isEditing ? (
            <>
              <EditableImageField
                label="CCCD mặt trước"
                attachment={form.cccdFront}
                pending={pendingCccdFront}
                onFile={setPendingCccdFront}
                onRemove={() => { setPendingCccdFront(null); setField('cccdFront', undefined); }}
                onError={msg => showToast('error', msg)}
                document
              />
              <EditableImageField
                label="CCCD mặt sau"
                attachment={form.cccdBack}
                pending={pendingCccdBack}
                onFile={setPendingCccdBack}
                onRemove={() => { setPendingCccdBack(null); setField('cccdBack', undefined); }}
                onError={msg => showToast('error', msg)}
                document
              />
            </>
          ) : (
            <>
              <SecureImagePreview label="CCCD mặt trước" url={form.cccdFront?.previewUrl} fileName={form.cccdFront?.fileName} document />
              <SecureImagePreview label="CCCD mặt sau" url={form.cccdBack?.previewUrl} fileName={form.cccdBack?.fileName} document />
            </>
          )}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Liên hệ">
        <DetailFieldGrid layout="two">
          {isEditing ? (
            <>
              <FieldInput label="Email cá nhân" value={form.personalEmail ?? ''} onChange={v => setField('personalEmail', v)} />
              <FieldInput label="SĐT cá nhân" value={form.personalPhone ?? ''} onChange={v => setField('personalPhone', v)} phone />
              <FieldInput label="Địa chỉ thường trú" value={form.permanentAddress ?? ''} onChange={v => setField('permanentAddress', v)} />
              <FieldInput label="Địa chỉ tạm trú" value={form.temporaryAddress ?? ''} onChange={v => setField('temporaryAddress', v)} />
            </>
          ) : (
            <>
              <FieldView label="Email cá nhân" value={form.personalEmail} />
              <FieldView label="SĐT cá nhân" value={form.personalPhone} />
              <FieldView label="Địa chỉ thường trú" value={form.permanentAddress} />
              <FieldView label="Địa chỉ tạm trú" value={form.temporaryAddress} />
            </>
          )}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Học vấn">
        <DetailFieldGrid layout="two">
          {isEditing ? (
            <>
              <FieldInput label="Trình độ" value={form.education ?? ''} onChange={v => setField('education', v)} />
              <FieldInput label="Trường" value={form.school ?? ''} onChange={v => setField('school', v)} />
              <FieldInput label="Chuyên ngành" value={form.major ?? ''} onChange={v => setField('major', v)} />
              <FieldInput label="Tình trạng hôn nhân" value={form.maritalStatus as string ?? ''} onChange={v => setField('maritalStatus', v as Employee['maritalStatus'])} />
            </>
          ) : (
            <>
              <FieldView label="Trình độ" value={form.education} />
              <FieldView label="Trường" value={form.school} />
              <FieldView label="Chuyên ngành" value={form.major} />
              <FieldView label="Tình trạng hôn nhân" value={form.maritalStatus as string} />
            </>
          )}
        </DetailFieldGrid>
        <div className="mt-4">
          {isEditing ? (
            <EditableImageField
              label="Ảnh bằng cấp"
              attachment={form.degreePhoto}
              pending={pendingDegree}
              onFile={setPendingDegree}
              onRemove={() => { setPendingDegree(null); setField('degreePhoto', undefined); }}
              onError={msg => showToast('error', msg)}
              document
            />
          ) : (
            <SecureImagePreview label="Ảnh bằng cấp" url={form.degreePhoto?.previewUrl} fileName={form.degreePhoto?.fileName} document />
          )}
        </div>
      </DetailSection>

      <DetailSection title="Ngân hàng">
        <DetailFieldGrid layout="two">
          {isEditing ? (
            <>
              <FieldInput label="Tên chủ TK" value={form.bankAccountName ?? ''} onChange={v => setField('bankAccountName', v)} />
              <FieldInput label="Số tài khoản" value={form.bankAccountNumber ?? ''} onChange={v => setField('bankAccountNumber', v)} />
              <FieldInput label="Tên ngân hàng" value={form.bankName ?? ''} onChange={v => setField('bankName', v)} />
              <FieldInput label="Chi nhánh" value={form.bankBranch ?? ''} onChange={v => setField('bankBranch', v)} />
            </>
          ) : (
            <>
              <FieldView label="Tên chủ TK" value={form.bankAccountName} />
              <MaskedFieldView label="Số tài khoản" value={form.bankAccountNumber} />
              <FieldView label="Tên ngân hàng" value={form.bankName} />
              <FieldView label="Chi nhánh" value={form.bankBranch} />
            </>
          )}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="BHXH & Thuế">
        <DetailFieldGrid layout="three">
          {isEditing ? (
            <>
              <FieldSelect label="Đã tham gia BHXH" value={form.hadSocialInsurance ?? ''} onChange={v => setField('hadSocialInsurance', v)} options={['Đã từng tham gia', 'Chưa từng tham gia']} />
              <FieldInput label="Số BHXH" value={form.siNumber ?? ''} onChange={v => setField('siNumber', v)} />
              <FieldInput label="Mã số thuế" value={form.taxCode ?? ''} onChange={v => setField('taxCode', v)} />
            </>
          ) : (
            <>
              <FieldView label="Đã tham gia BHXH" value={form.hadSocialInsurance} />
              <MaskedFieldView label="Số BHXH" value={form.siNumber} />
              <MaskedFieldView label="Mã số thuế" value={form.taxCode} />
            </>
          )}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="BHXH hiện tại">
        <p className="hrm-placeholder">Sẽ tích hợp từ module BHXH sau.</p>
      </DetailSection>

      <DetailSection title="Hợp đồng lao động">
        <p className="hrm-placeholder">Sẽ tích hợp từ module HĐLĐ sau.</p>
      </DetailSection>
    </div>
  );
}
