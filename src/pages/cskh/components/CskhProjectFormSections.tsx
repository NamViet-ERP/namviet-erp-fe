import type { ReactNode } from 'react';
import FormField from '../../../components/ui/FormField';
import HrmSelect from '../../../components/hr/HrmSelect';
import HrmDatePicker from '../../../components/hr/HrmDatePicker';
import type { CskhPhaseMode } from '../../../lib/cskh/commandCenter';

/** Khung Card phân vùng chuẩn ERP — bo góc 12px, nền dịu, viền mảnh, chia 2 cột */
export function FormSectionCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-4 sm:p-5 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-4 shadow-2xs ${className}`}
    >
      <div className="border-b border-slate-200/70 pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E3063] flex items-center gap-2">
          {title}
        </h4>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

/* ── 1. THÔNG TIN CƠ BẢN & MÃ DỰ ÁN ── */
interface BasicInfoSectionProps {
  name: string;
  code: string;
  startDate: string;
  targetCodDate: string;
  isReadOnlyCode?: boolean;
  codeHint?: string;
  nameError?: string;
  codeError?: string;
  onChange: (patch: { name?: string; code?: string; startDate?: string; targetCodDate?: string }) => void;
}

export function CskhProjectBasicSection({
  name,
  code,
  startDate,
  targetCodDate,
  isReadOnlyCode = false,
  codeHint,
  nameError,
  codeError,
  onChange,
}: BasicInfoSectionProps) {
  return (
    <FormSectionCard title="1. Thông tin cơ bản & Mã dự án">
      <div className="md:col-span-2">
        <FormField label="Tên dự án" required error={nameError}>
          <input
            className="form-input"
            value={name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="VD: Nhà máy Giấy Chain Yarn 30T"
            autoComplete="off"
          />
        </FormField>
      </div>

      <div>
        <FormField label={isReadOnlyCode ? 'Mã dự án (Không thay đổi)' : 'Mã dự án'} error={codeError}>
          <input
            className={`form-input font-mono ${
              isReadOnlyCode ? 'bg-slate-100 text-slate-700 font-semibold cursor-not-allowed' : ''
            }`}
            value={code}
            disabled={isReadOnlyCode}
            readOnly={isReadOnlyCode}
            onChange={e => !isReadOnlyCode && onChange({ code: e.target.value })}
            placeholder="VD: DA-2026-001"
            autoComplete="off"
          />
        </FormField>
        {!isReadOnlyCode && codeHint && (
          <p className="text-xs text-slate-500 mt-1">{codeHint}</p>
        )}
      </div>

      <div>
        <FormField label="Ngày khởi công">
          <HrmDatePicker
            value={startDate}
            onChange={val => onChange({ startDate: val })}
            placeholder="Chọn ngày khởi công"
          />
        </FormField>
      </div>

      <div className="md:col-span-2">
        <FormField label="Mục tiêu COD (Commercial Operation Date)">
          <HrmDatePicker
            value={targetCodDate}
            onChange={val => onChange({ targetCodDate: val })}
            placeholder="Chọn ngày về đích COD"
          />
        </FormField>
      </div>
    </FormSectionCard>
  );
}

/* ── 2. CHỦ ĐẦU TƯ & NHÂN SỰ PHỤ TRÁCH ── */
interface PeopleSectionProps {
  client: string;
  clientOptions?: { value: string; label: string }[];
  datalistId?: string;
  pm: string;
  sales: string;
  userOptions: { value: string; label: string }[];
  isLoadingUsers: boolean;
  required?: boolean;
  clientError?: string;
  pmError?: string;
  salesError?: string;
  onChange: (patch: { client?: string; pm?: string; sales?: string }) => void;
}

export function CskhProjectPeopleSection({
  client,
  clientOptions = [],
  datalistId = 'cskh-client-options',
  pm,
  sales,
  userOptions,
  isLoadingUsers,
  required = false,
  clientError,
  pmError,
  salesError,
  onChange,
}: PeopleSectionProps) {
  return (
    <FormSectionCard title="2. Chủ đầu tư & Nhân sự phụ trách">
      <div className="md:col-span-2">
        <FormField label="Chủ đầu tư / CĐT" required error={clientError}>
          <input
            className="form-input"
            list={clientOptions.length > 0 ? datalistId : undefined}
            value={client}
            onChange={e => onChange({ client: e.target.value })}
            placeholder="VD: Tập đoàn Chain Yarn"
            autoComplete="off"
          />
        </FormField>
        {clientOptions.length > 0 ? (
          <datalist id={datalistId}>
            {clientOptions.map(item => (
              <option key={item.value} value={item.value} />
            ))}
          </datalist>
        ) : null}
      </div>

      <div>
        <FormField label="Quản lý dự án / Chỉ huy trưởng (Project Manager - PM)" required={required} error={pmError}>
          <HrmSelect
            value={pm}
            onChange={val => onChange({ pm: val })}
            options={userOptions}
            placeholder={isLoadingUsers ? 'Đang tải người dùng...' : '-- Chọn Quản lý dự án (PM) --'}
            error={Boolean(pmError)}
          />
        </FormField>
      </div>

      <div>
        <FormField label="Phụ trách kinh doanh (Sales Rep)" required={required} error={salesError}>
          <HrmSelect
            value={sales}
            onChange={val => onChange({ sales: val })}
            options={userOptions}
            placeholder={isLoadingUsers ? 'Đang tải người dùng...' : '-- Chọn phụ trách kinh doanh (Sales) --'}
            error={Boolean(salesError)}
          />
        </FormField>
      </div>
    </FormSectionCard>
  );
}

/* ── 3. THÔNG SỐ KỸ THUẬT LÒ HƠI ── */
interface BoilerSectionProps {
  boilerType: string;
  boilerOptions: { value: string; label: string }[];
  capacity: string;
  industry: string;
  industryOptions: { value: string; label: string }[];
  priority: string;
  priorityOptions: { value: string; label: string }[];
  boilerError?: string;
  priorityError?: string;
  boilerRequired?: boolean;
  priorityRequired?: boolean;
  onChange: (patch: { boilerType?: string; capacity?: string; industry?: string; priority?: string }) => void;
}

export function CskhProjectBoilerSection({
  boilerType,
  boilerOptions,
  capacity,
  industry,
  industryOptions,
  priority,
  priorityOptions,
  boilerError,
  priorityError,
  boilerRequired = false,
  priorityRequired = false,
  onChange,
}: BoilerSectionProps) {
  return (
    <FormSectionCard title="3. Thông số kỹ thuật lò hơi & Mức độ ưu tiên">
      <div>
        <FormField label="Loại lò hơi" required={boilerRequired} error={boilerError}>
          <HrmSelect
            value={boilerType}
            onChange={val => onChange({ boilerType: val })}
            options={boilerOptions}
            placeholder="Chọn loại lò"
            error={Boolean(boilerError)}
          />
        </FormField>
      </div>

      <div>
        <FormField label="Công suất">
          <input
            className="form-input"
            value={capacity}
            onChange={e => onChange({ capacity: e.target.value })}
            placeholder="VD: 30 Tấn/h"
            autoComplete="off"
          />
        </FormField>
      </div>

      <div>
        <FormField label="Ngành nghề / Lĩnh vực">
          <HrmSelect
            value={industry}
            onChange={val => onChange({ industry: val })}
            options={industryOptions}
            placeholder="Chọn ngành nghề"
          />
        </FormField>
      </div>

      <div>
        <FormField label="Mức độ ưu tiên" required={priorityRequired} error={priorityError}>
          <HrmSelect
            value={priority}
            onChange={val => onChange({ priority: val })}
            options={priorityOptions}
            placeholder="Chọn mức độ ưu tiên"
            error={Boolean(priorityError)}
          />
        </FormField>
      </div>
    </FormSectionCard>
  );
}

/* ── 4. HỢP ĐỒNG, TẠM ỨNG & BẢO HÀNH ── */
interface ContractSectionProps {
  contractSignedDate: string;
  advanceDate: string;
  acceptanceDate: string;
  warrantyMonths: string;
  advanceRequired?: boolean;
  advanceError?: string;
  warrantyError?: string;
  onChange: (patch: {
    contractSignedDate?: string;
    advanceDate?: string;
    acceptanceDate?: string;
    warrantyMonths?: string;
  }) => void;
}

export function CskhProjectContractSection({
  contractSignedDate,
  advanceDate,
  acceptanceDate,
  warrantyMonths,
  advanceRequired = false,
  advanceError,
  warrantyError,
  onChange,
}: ContractSectionProps) {
  return (
    <FormSectionCard title="4. Hợp đồng, Tạm ứng & Bảo hành">
      <div>
        <FormField label="Ngày ký hợp đồng">
          <HrmDatePicker
            value={contractSignedDate}
            onChange={val => onChange({ contractSignedDate: val })}
            placeholder="Chọn ngày ký"
          />
        </FormField>
      </div>

      <div>
        <FormField label="Ngày nhận tạm ứng" required={advanceRequired} error={advanceError}>
          <HrmDatePicker
            value={advanceDate}
            onChange={val => onChange({ advanceDate: val })}
            placeholder="Chọn ngày nhận tạm ứng"
            error={Boolean(advanceError)}
          />
        </FormField>
      </div>

      <div>
        <FormField label="Ngày nghiệm thu bàn giao">
          <HrmDatePicker
            value={acceptanceDate}
            onChange={val => onChange({ acceptanceDate: val })}
            placeholder="Chọn ngày nghiệm thu"
          />
        </FormField>
      </div>

      <div>
        <FormField label="Thời gian bảo hành (tháng)" error={warrantyError}>
          <input
            type="number"
            min={0}
            max={240}
            className="form-input"
            value={warrantyMonths}
            onChange={e => onChange({ warrantyMonths: e.target.value })}
            placeholder="VD: 12"
          />
        </FormField>
      </div>
    </FormSectionCard>
  );
}

/* ── 5. TIẾN ĐỘ & GIAI ĐOẠN (Chỉ dành cho Cập nhật dự án) ── */
interface ProgressSectionProps {
  phaseId: string;
  phaseOptions: { value: string; label: string }[];
  phaseMode: CskhPhaseMode;
  phaseModeOptions: { value: string; label: string }[];
  planPct: number;
  actualPct: number;
  bottleneckCount: number;
  planError?: string;
  actualError?: string;
  onChange: (patch: {
    phaseId?: string;
    phaseMode?: CskhPhaseMode;
    planPct?: number;
    actualPct?: number;
    bottleneckCount?: number;
  }) => void;
}

export function CskhProjectProgressSection({
  phaseId,
  phaseOptions,
  phaseMode,
  phaseModeOptions,
  planPct,
  actualPct,
  bottleneckCount,
  planError,
  actualError,
  onChange,
}: ProgressSectionProps) {
  return (
    <FormSectionCard title="5. Tiến độ thực hiện & Giai đoạn dự án">
      <div>
        <FormField label="Giai đoạn hiện tại">
          <HrmSelect
            value={phaseId}
            onChange={val => onChange({ phaseId: val })}
            options={phaseOptions}
            placeholder="Chọn giai đoạn"
          />
        </FormField>
      </div>

      <div>
        <FormField label="Cơ chế tính giai đoạn">
          <HrmSelect
            value={phaseMode}
            onChange={val => onChange({ phaseMode: val as CskhPhaseMode })}
            options={phaseModeOptions}
            placeholder="Chọn cơ chế"
          />
        </FormField>
      </div>

      <div>
        <FormField label="Tiến độ kế hoạch (%)" error={planError}>
          <input
            type="number"
            min={0}
            max={100}
            className="form-input"
            value={planPct}
            onChange={e => onChange({ planPct: Number(e.target.value) })}
          />
        </FormField>
      </div>

      <div>
        <FormField label="Tiến độ thực tế (%)" error={actualError}>
          <input
            type="number"
            min={0}
            max={100}
            className="form-input"
            value={actualPct}
            onChange={e => onChange({ actualPct: Number(e.target.value) })}
          />
        </FormField>
      </div>

      <div className="md:col-span-2">
        <FormField label="Số điểm nghẽn tồn đọng (Bottlenecks)">
          <input
            type="number"
            min={0}
            className="form-input"
            value={bottleneckCount}
            onChange={e => onChange({ bottleneckCount: Math.max(0, Number(e.target.value)) })}
          />
        </FormField>
      </div>
    </FormSectionCard>
  );
}

/* ── 6. GHI CHÚ ĐIỀU HÀNH ── */
export function CskhProjectNotesSection({
  notes,
  onChange,
}: {
  notes: string;
  onChange: (notes: string) => void;
}) {
  return (
    <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-3 shadow-2xs">
      <div className="border-b border-slate-200/70 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E3063]">
          Ghi chú điều hành dự án
        </h4>
      </div>
      <FormField label="Nội dung ghi chú">
        <textarea
          className="form-input"
          rows={3}
          value={notes}
          onChange={e => onChange(e.target.value)}
          placeholder="Ghi chú các mốc then chốt, lưu ý đặc thù về công trường hoặc điều phối..."
        />
      </FormField>
    </div>
  );
}
