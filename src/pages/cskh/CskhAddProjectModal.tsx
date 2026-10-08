import { useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import {
  CSKH_BOILER_TYPES,
  CSKH_INDUSTRIES,
  CSKH_PRIORITIES,
  nextProjectCode,
  planPctFromDates,
  type CskhProjectDraft,
} from '../../lib/cskh/commandCenter';
import { optionsFromCatalog } from '../../lib/cskh/masterData';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import { useCskhUserOptions } from '../../hooks/cskh/useCskhUserOptions';
import {
  CskhProjectBasicSection,
  CskhProjectPeopleSection,
  CskhProjectBoilerSection,
  CskhProjectContractSection,
  CskhProjectNotesSection,
} from './components/CskhProjectFormSections';

interface CskhAddProjectModalProps {
  open: boolean;
  existingCodes: string[];
  clientOptions: string[];
  onClose: () => void;
  onSave: (draft: CskhProjectDraft) => void;
}

type FieldKey =
  | 'name'
  | 'code'
  | 'client'
  | 'sales'
  | 'pm'
  | 'advance'
  | 'boiler'
  | 'priority'
  | 'warrantyMonths';

const EMPTY_FORM = {
  name: '',
  code: '',
  startDate: '',
  client: '',
  sales: '',
  pm: '',
  contractSignedDate: '',
  advanceDate: '',
  boilerType: '',
  industry: '',
  capacity: '',
  priority: 'normal',
  acceptanceDate: '',
  warrantyMonths: '12',
  notes: '',
  targetCodDate: '',
};

function yearFromDates(...dates: string[]): number {
  for (const value of dates) {
    if (!value) continue;
    const year = Number(value.slice(0, 4));
    if (Number.isFinite(year) && year >= 2000) return year;
  }
  return new Date().getFullYear();
}

export default function CskhAddProjectModal({
  open,
  existingCodes,
  clientOptions,
  onClose,
  onSave,
}: CskhAddProjectModalProps) {
  const { store: master } = useCskhMasterData();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const { options: userOptions, isLoading: isLoadingUsers } = useCskhUserOptions([
    form.pm,
    form.sales,
  ]);

  const clientSelectOptions = useMemo(
    () => clientOptions.map(name => ({ value: name, label: name })),
    [clientOptions],
  );
  const boilerOptions = useMemo(
    () => optionsFromCatalog(master.boilerTypes, CSKH_BOILER_TYPES),
    [master.boilerTypes],
  );
  const industryOptions = useMemo(
    () => optionsFromCatalog(master.industries, CSKH_INDUSTRIES),
    [master.industries],
  );
  const priorityOptions = useMemo(
    () => optionsFromCatalog(master.priorities, CSKH_PRIORITIES),
    [master.priorities],
  );

  const patch = (partial: Partial<typeof EMPTY_FORM>) => {
    setForm(current => ({ ...current, ...partial }));
    setErrors({});
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    const next: Partial<Record<FieldKey, string>> = {};
    const name = form.name.trim();
    const client = form.client.trim();
    const sales = form.sales.trim();
    const pm = form.pm.trim();
    const typedCode = form.code.trim().toUpperCase();
    const code = typedCode || nextProjectCode(existingCodes);
    const months = Number(form.warrantyMonths);

    if (!name) next.name = 'Nhập tên dự án.';
    if (typedCode && existingCodes.includes(typedCode)) next.code = 'Mã dự án đã có trên bảng.';
    if (!typedCode && existingCodes.includes(code)) next.code = 'Không tạo được mã trống. Thử nhập mã khác.';
    if (!client) next.client = 'Nhập chủ đầu tư.';
    if (!sales) next.sales = 'Chọn phụ trách kinh doanh (Sales Rep).';
    if (!pm) next.pm = 'Chọn Quản lý dự án / Chỉ huy trưởng (PM).';
    if (!form.advanceDate) next.advance = 'Chọn ngày nhận tạm ứng.';
    if (!form.boilerType) next.boiler = 'Chọn loại lò.';
    if (!form.priority) next.priority = 'Chọn mức độ ưu tiên.';
    if (!Number.isFinite(months) || months < 0 || months > 240) next.warrantyMonths = 'Nhập số tháng bảo hành.';

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    onSave({
      code,
      name,
      year: yearFromDates(form.startDate, form.advanceDate),
      phaseId: 'survey',
      planPct: form.startDate ? planPctFromDates(form.startDate) : 0,
      actualPct: 0,
      bottleneckCount: 0,
      pendingDocs: 0,
      warrantyWatch: false,
      clientName: client,
      pmName: pm,
      salesName: sales,
      startDate: form.startDate || undefined,
      contractSignedDate: form.contractSignedDate || undefined,
      advanceDate: form.advanceDate,
      boilerType: form.boilerType,
      industry: form.industry || undefined,
      capacity: form.capacity.trim() || undefined,
      priority: form.priority,
      acceptanceDate: form.acceptanceDate || undefined,
      warrantyMonths: months,
      notes: form.notes.trim() || undefined,
      targetCodDate: form.targetCodDate || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title="Thêm dự án mới"
      size="xl"
      footer={(
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outlined" className="rounded-lg" onClick={close}>
            Hủy
          </Button>
          <Button type="button" variant="filled" className="rounded-lg" onClick={submit}>
            Tạo dự án
          </Button>
        </div>
      )}
    >
      <div className="space-y-4">
        <CskhProjectBasicSection
          name={form.name}
          code={form.code}
          startDate={form.startDate}
          targetCodDate={form.targetCodDate}
          isReadOnlyCode={false}
          codeHint="Tự động tạo nếu để trống"
          nameError={errors.name}
          codeError={errors.code}
          onChange={patch}
        />

        <CskhProjectPeopleSection
          client={form.client}
          clientOptions={clientSelectOptions}
          datalistId="cskh-add-clients"
          pm={form.pm}
          sales={form.sales}
          userOptions={userOptions}
          isLoadingUsers={isLoadingUsers}
          required={true}
          clientError={errors.client}
          pmError={errors.pm}
          salesError={errors.sales}
          onChange={patch}
        />

        <CskhProjectBoilerSection
          boilerType={form.boilerType}
          boilerOptions={boilerOptions}
          capacity={form.capacity}
          industry={form.industry}
          industryOptions={industryOptions}
          priority={form.priority}
          priorityOptions={priorityOptions}
          boilerRequired={true}
          priorityRequired={true}
          boilerError={errors.boiler}
          priorityError={errors.priority}
          onChange={patch}
        />

        <CskhProjectContractSection
          contractSignedDate={form.contractSignedDate}
          advanceDate={form.advanceDate}
          acceptanceDate={form.acceptanceDate}
          warrantyMonths={form.warrantyMonths}
          advanceRequired={true}
          advanceError={errors.advance}
          warrantyError={errors.warrantyMonths}
          onChange={patch}
        />

        <CskhProjectNotesSection
          notes={form.notes}
          onChange={val => patch({ notes: val })}
        />
      </div>
    </Modal>
  );
}
