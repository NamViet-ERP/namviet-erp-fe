import { Clock } from 'lucide-react';
import { calcSeniority, type Employee } from '../../types/hr';
import { formatDateVi } from '../../lib/hrm/formatters';
import DetailSection from './DetailSection';
import DetailFieldGrid from './DetailFieldGrid';
import { FieldView, MaskedFieldView, SecureImagePreview } from './DetailFields';

interface EmployeeRecordViewProps {
  employee: Employee;
}

/** Read-only HR record — same sections as EmployeeDetailPage view mode. */
export default function EmployeeRecordView({ employee }: EmployeeRecordViewProps) {
  const seniority = calcSeniority(employee.joinDate);

  return (
    <>
      <DetailSection title="Thông tin HR (Mã NV, Tổ chức)">
        {employee.status === 'Nghỉ việc' && (
          <p className="hrm-alert hrm-alert--warning">
            Nhân viên đã nghỉ việc — tài khoản hệ thống (nếu có) bị khóa và không hiển thị trong các danh sách chọn.
          </p>
        )}
        <DetailFieldGrid>
          <FieldView label="Mã nhân viên" value={employee.code} />
          <FieldView label="Mảng" value={employee.segment} />
          <FieldView label="Chi nhánh" value={employee.branch} />
          <FieldView label="Bộ phận" value={employee.department} />
          <FieldView label="Chức vụ" value={employee.position} />
          <FieldView label="Ngày chính thức" value={formatDateVi(employee.officialDate)} />
          <FieldView label="Trạng thái" value={employee.status} />
          <FieldView label="Ngày nghỉ việc" value={formatDateVi(employee.resignDate)} />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Thông tin cơ bản">
        <DetailFieldGrid>
          <FieldView label="Họ và tên" value={employee.fullName} />
          <FieldView label="Giới tính" value={employee.gender} />
          <FieldView label="Ngày sinh" value={formatDateVi(employee.birthDate)} />
          <FieldView label="Ngày vào làm" value={formatDateVi(employee.joinDate)} />
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
        {(employee.cccdFront?.previewUrl || employee.cccdNumber) && (
          <p className="hrm-alert hrm-alert--info mb-4">
            Thông tin nhạy cảm được che mặc định. Nhấn biểu tượng mắt hoặc &quot;Xem ảnh&quot; để hiện đầy đủ khi cần.
          </p>
        )}
        <DetailFieldGrid layout="three">
          <MaskedFieldView label="Số CMND" value={employee.cmndNumber} />
          <FieldView label="Ngày cấp CMND" value={formatDateVi(employee.cmndIssueDate)} />
          <FieldView label="Nơi cấp CMND" value={employee.cmndIssuePlace} />
          <MaskedFieldView label="Số CCCD" value={employee.cccdNumber} />
          <FieldView label="Ngày cấp CCCD" value={formatDateVi(employee.cccdIssueDate)} />
          <FieldView label="Nơi cấp CCCD" value={employee.cccdIssuePlace} />
        </DetailFieldGrid>
        <DetailFieldGrid layout="two" className="mt-4">
          <SecureImagePreview label="CCCD mặt trước" url={employee.cccdFront?.previewUrl} fileName={employee.cccdFront?.fileName} document />
          <SecureImagePreview label="CCCD mặt sau" url={employee.cccdBack?.previewUrl} fileName={employee.cccdBack?.fileName} document />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Liên hệ">
        <DetailFieldGrid layout="two">
          <FieldView label="Email cá nhân" value={employee.personalEmail} />
          <FieldView label="SĐT cá nhân" value={employee.personalPhone} />
          <FieldView label="Địa chỉ thường trú" value={employee.permanentAddress} />
          <FieldView label="Địa chỉ tạm trú" value={employee.temporaryAddress} />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Học vấn">
        <DetailFieldGrid layout="two">
          <FieldView label="Trình độ" value={employee.education} />
          <FieldView label="Trường" value={employee.school} />
          <FieldView label="Chuyên ngành" value={employee.major} />
          <FieldView label="Tình trạng hôn nhân" value={employee.maritalStatus as string} />
        </DetailFieldGrid>
        <div className="mt-4">
          <SecureImagePreview label="Ảnh bằng cấp" url={employee.degreePhoto?.previewUrl} fileName={employee.degreePhoto?.fileName} document />
        </div>
      </DetailSection>

      <DetailSection title="Ngân hàng">
        <DetailFieldGrid layout="two">
          <FieldView label="Tên chủ TK" value={employee.bankAccountName} />
          <MaskedFieldView label="Số tài khoản" value={employee.bankAccountNumber} />
          <FieldView label="Tên ngân hàng" value={employee.bankName} />
          <FieldView label="Chi nhánh" value={employee.bankBranch} />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="BHXH & Thuế">
        <DetailFieldGrid layout="three">
          <FieldView label="Đã tham gia BHXH" value={employee.hadSocialInsurance} />
          <MaskedFieldView label="Số BHXH" value={employee.siNumber} />
          <MaskedFieldView label="Mã số thuế" value={employee.taxCode} />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="BHXH hiện tại">
        <p className="hrm-placeholder">Sẽ tích hợp từ module BHXH sau.</p>
      </DetailSection>

      <DetailSection title="Hợp đồng lao động">
        <p className="hrm-placeholder">Sẽ tích hợp từ module HĐLĐ sau.</p>
      </DetailSection>
    </>
  );
}
