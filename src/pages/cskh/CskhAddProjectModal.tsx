import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import HrmSelect from '../../components/hr/HrmSelect';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import { employeesService } from '../../services/employeesService';
import { queryKeys } from '../../services/queryKeys';
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
  | 'pa'
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
  pa: '',
  contractSignedDate: '',
  advanceDate: '',
  boilerType: '',
  industry: '',
  capacity: '',
  priority: 'normal',
  acceptanceDate: '',
  warrantyMonths: '12',
  notes: '',
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
  const { data: employees = [] } = useQuery({
    queryKey: [...queryKeys.employees.all, 'active'],
    queryFn: async () => {
      try {
        return await employeesService.listActive();
      } catch {
        return [];
      }
    },
    enabled: open,
    retry: false,
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const peopleOptions = useMemo(
    () => employees
      .map(row => ({ value: row.id, label: row.fullName }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi')),
    [employees],
  );
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

  const personName = (value: string) =>
    peopleOptions.find(item => item.value === value)?.label ?? value.trim();

  const submit = () => {
    const next: Partial<Record<FieldKey, string>> = {};
    const name = form.name.trim();
    const client = form.client.trim();
    const sales = personName(form.sales);
    const pa = personName(form.pa);
    const typedCode = form.code.trim().toUpperCase();
    const code = typedCode || nextProjectCode(existingCodes);
    const months = Number(form.warrantyMonths);

    if (!name) next.name = 'Nhập tên dự án.';
    if (typedCode && existingCodes.includes(typedCode)) next.code = 'Mã dự án đã có trên bảng.';
    if (!typedCode && existingCodes.includes(code)) next.code = 'Không tạo được mã trống. Thử nhập mã khác.';
                if (!client) next.client = 'Nhập chủ đầu tư.';
    if (!sales) next.sales = 'Chọn Sales phụ trách.';
    if (!pa) next.pa = 'Chọn PA phụ trách chính.';
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
      pmName: pa,
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
        <>
          <Button type="button" variant="outlined" onClick={close}>Hủy</Button>
          <Button type="button" variant="filled" onClick={submit}>Tạo dự án</Button>
        </>
      )}
    >
      <div className="cskh-add-form">
        <section className="cskh-add-section" aria-labelledby="cskh-add-basic">
          <h3 id="cskh-add-basic" className="cskh-add-section__title">Thông tin cơ bản</h3>
          <div className="cskh-add-span">
            <FormField label="Tên dự án" required error={errors.name}>
              <input
                className="form-input"
                value={form.name}
                onChange={e => patch({ name: e.target.value })}
                placeholder="VD: Nhà máy Giấy Đông Tiến"
                autoComplete="off"
              />
            </FormField>
          </div>
          <div>
            <FormField label="Mã dự án" error={errors.code}>
              <input
                className="form-input"
                value={form.code}
                onChange={e => patch({ code: e.target.value })}
                placeholder="VD: DA-2026-001"
                autoComplete="off"
              />
            </FormField>
            <p className="cskh-add-hint">Tự động tạo nếu để trống</p>
          </div>
          <FormField label="Ngày khởi công">
            <HrmDatePicker
              value={form.startDate}
              onChange={value => patch({ startDate: value })}
              placeholder="Chọn ngày"
            />
          </FormField>
        </section>

        <section className="cskh-add-section" aria-labelledby="cskh-add-people">
          <h3 id="cskh-add-people" className="cskh-add-section__title">Chủ đầu tư và phụ trách</h3>
          <div className="cskh-add-span">
            <FormField label="Chủ đầu tư / CĐT" required error={errors.client}>
              <input
                className="form-input"
                list={clientSelectOptions.length > 0 ? 'cskh-add-clients' : undefined}
                value={form.client}
                onChange={e => patch({ client: e.target.value })}
                placeholder={clientSelectOptions.length > 0 ? 'Chọn khách hàng có sẵn hoặc nhập mới' : 'VD: Tập đoàn Giấy An Phát'}
                autoComplete="off"
              />
            </FormField>
            {clientSelectOptions.length > 0 ? (
              <datalist id="cskh-add-clients">
                {clientSelectOptions.map(item => (
                  <option key={item.value} value={item.value} />
                ))}
              </datalist>
            ) : null}
          </div>
          <ChoiceField
            label="Sales phụ trách"
            required
            error={errors.sales}
            value={form.sales}
            onChange={value => patch({ sales: value })}
            options={peopleOptions}
            placeholder="Chọn Sales phụ trách"
            inputPlaceholder="Tên Sales phụ trách"
          />
          <ChoiceField
            label="PA phụ trách chính"
            required
            error={errors.pa}
            value={form.pa}
            onChange={value => patch({ pa: value })}
            options={peopleOptions}
            placeholder="Chọn PA phụ trách chính"
            inputPlaceholder="Tên PA phụ trách chính"
          />
        </section>

        <section className="cskh-add-section" aria-labelledby="cskh-add-contract">
          <h3 id="cskh-add-contract" className="cskh-add-section__title">Hợp đồng và tạm ứng</h3>
          <FormField label="Ngày ký hợp đồng">
            <HrmDatePicker
              value={form.contractSignedDate}
              onChange={value => patch({ contractSignedDate: value })}
              placeholder="Chọn ngày"
            />
          </FormField>
          <FormField label="Ngày nhận tạm ứng" required error={errors.advance}>
            <HrmDatePicker
              value={form.advanceDate}
              onChange={value => patch({ advanceDate: value })}
              placeholder="Chọn ngày"
              error={Boolean(errors.advance)}
            />
          </FormField>
        </section>

        <section className="cskh-add-section" aria-labelledby="cskh-add-boiler">
          <h3 id="cskh-add-boiler" className="cskh-add-section__title">Thông số lò hơi</h3>
          <FormField label="Loại lò" required error={errors.boiler}>
            <HrmSelect
              value={form.boilerType}
              onChange={value => patch({ boilerType: value })}
              options={boilerOptions}
              placeholder="Chọn loại lò"
              error={Boolean(errors.boiler)}
            />
          </FormField>
          <FormField label="Ngành nghề / Lĩnh vực sử dụng">
            <HrmSelect
              value={form.industry}
              onChange={value => patch({ industry: value })}
              options={industryOptions}
              placeholder="Chọn ngành nghề"
            />
          </FormField>
          <FormField label="Công suất">
            <input
              className="form-input"
              value={form.capacity}
              onChange={e => patch({ capacity: e.target.value })}
              placeholder="VD: 2 tấn/h"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Mức độ ưu tiên" required error={errors.priority}>
            <HrmSelect
              value={form.priority}
              onChange={value => patch({ priority: value })}
              options={priorityOptions}
              placeholder="Chọn mức ưu tiên"
              error={Boolean(errors.priority)}
            />
          </FormField>
        </section>

        <section className="cskh-add-section" aria-labelledby="cskh-add-warranty">
          <h3 id="cskh-add-warranty" className="cskh-add-section__title">Bảo hành</h3>
          <div>
            <FormField label="Ngày ký nghiệm thu">
              <HrmDatePicker
                value={form.acceptanceDate}
                onChange={value => patch({ acceptanceDate: value })}
                placeholder="Chọn ngày"
              />
            </FormField>
            <p className="cskh-add-hint">Để trống nếu chưa nghiệm thu. Có thể cập nhật sau.</p>
          </div>
          <FormField label="Thời gian bảo hành (tháng)" error={errors.warrantyMonths}>
            <input
              className="form-input"
              inputMode="numeric"
              value={form.warrantyMonths}
              onChange={e => patch({ warrantyMonths: e.target.value })}
              autoComplete="off"
            />
          </FormField>
        </section>

        <section className="cskh-add-section" aria-labelledby="cskh-add-notes">
          <h3 id="cskh-add-notes" className="cskh-add-section__title">Ghi chú</h3>
          <div className="cskh-add-span">
            <FormField label="Ghi chú nội bộ">
              <textarea
                className="form-input"
                rows={3}
                value={form.notes}
                onChange={e => patch({ notes: e.target.value })}
                placeholder="Thông tin thêm, yêu cầu đặc biệt..."
              />
            </FormField>
          </div>
        </section>
      </div>
    </Modal>
  );
}

interface ChoiceFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  inputPlaceholder: string;
}

function ChoiceField({
  label,
  required,
  error,
  value,
  onChange,
  options,
  placeholder,
  inputPlaceholder,
}: ChoiceFieldProps) {
  return (
    <FormField label={label} required={required} error={error}>
      {options.length > 0 ? (
        <HrmSelect
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          error={Boolean(error)}
        />
      ) : (
        <input
          className="form-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={inputPlaceholder}
          autoComplete="off"
        />
      )}
    </FormField>
  );
}
