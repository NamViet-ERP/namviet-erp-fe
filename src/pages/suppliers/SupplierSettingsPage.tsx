import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import FormField from '../../components/ui/FormField';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  useSupplierModuleSettings,
  useUpdateSupplierModuleSettings,
} from '../../hooks/useSupplierDirectory';
import type { SupplierModuleSettingsApiDto } from '../../types/api/supplierDirectoryApi';

const CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Hàng tháng' },
  { value: 'quarterly', label: 'Hàng quý' },
  { value: 'yearly', label: 'Hàng năm' },
];

const GRADE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
type GradeKey = (typeof GRADE_KEYS)[number];

export default function SupplierSettingsPage() {
  const { data, isLoading, isError } = useSupplierModuleSettings();

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Thiết lập"
        subtitle="Cấu hình đánh giá và quy tắc danh mục NCC."
      />
      <HrmPanel>
        {isLoading ? (
          <Skeleton variant="rect" height={48} count={4} />
        ) : isError || !data ? (
          <EmptyState message="Không tải được thiết lập module nhà cung cấp." />
        ) : (
          <SettingsForm initial={data} />
        )}
      </HrmPanel>
    </div>
  );
}

/** Chỉ mount khi đã có thiết lập từ BE nên state khởi tạo trực tiếp từ props. */
function SettingsForm({ initial }: { initial: SupplierModuleSettingsApiDto }) {
  const updateMutation = useUpdateSupplierModuleSettings();
  const [grades, setGrades] = useState<Record<GradeKey, string>>({
    A: String(initial.gradeAMinScore),
    B: String(initial.gradeBMinScore),
    C: String(initial.gradeCMinScore ?? ''),
    D: String(initial.gradeDMinScore ?? ''),
    E: String(initial.gradeEMinScore ?? ''),
    F: String(initial.gradeFMinScore ?? ''),
    G: String(initial.gradeGMinScore ?? ''),
    H: String(initial.gradeHMinScore ?? ''),
  });
  const [cycle, setCycle] = useState(initial.evaluationCycle);
  const [groupRequired, setGroupRequired] = useState(initial.groupRequired);
  const [errors, setErrors] = useState<Partial<Record<GradeKey, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<GradeKey, string>> = {};
    const values = {} as Record<GradeKey, number>;

    for (const key of GRADE_KEYS) {
      const raw = grades[key].trim();
      const n = Number(raw);
      if (raw === '' || Number.isNaN(n) || n < 0 || n > 100) {
        next[key] = `Vui lòng nhập ngưỡng hạng ${key} (0–100).`;
      } else {
        values[key] = n;
      }
    }

    if (Object.keys(next).length === 0) {
      for (let i = 0; i < GRADE_KEYS.length - 1; i++) {
        const higher = GRADE_KEYS[i];
        const lower = GRADE_KEYS[i + 1];
        if (values[higher] <= values[lower]) {
          next[higher] = `Ngưỡng hạng ${higher} phải lớn hơn hạng ${lower}.`;
          break;
        }
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await updateMutation.mutateAsync({
        gradeAMinScore: values.A,
        gradeBMinScore: values.B,
        gradeCMinScore: values.C,
        gradeDMinScore: values.D,
        gradeEMinScore: values.E,
        gradeFMinScore: values.F,
        gradeGMinScore: values.G,
        gradeHMinScore: values.H,
        evaluationCycle: cycle,
        groupRequired,
      });
      showToast('success', 'Đã lưu thiết lập nhà cung cấp');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu thiết lập'));
    }
  };

  return (
    <form className="max-w-3xl space-y-4" noValidate onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-semibold text-[var(--md-on-surface)] mb-2">Ngưỡng điểm xếp hạng (A–H)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GRADE_KEYS.map(key => (
            <FormField key={key} label={`Hạng ${key}`} required error={errors[key]}>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                className="form-input tabular-nums"
                value={grades[key]}
                onChange={e => {
                  setGrades(prev => ({ ...prev, [key]: e.target.value }));
                  setErrors(prev => {
                    if (!prev[key]) return prev;
                    const copy = { ...prev };
                    delete copy[key];
                    return copy;
                  });
                }}
                aria-label={`Ngưỡng điểm hạng ${key}`}
              />
            </FormField>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty">
        Điểm từ ngưỡng hạng tương ứng trở lên xếp hạng đó (A cao nhất → H thấp nhất).
        Ngưỡng phải giảm dần A &gt; B &gt; C &gt; D &gt; E &gt; F &gt; G &gt; H.
        Đổi ngưỡng chỉ ảnh hưởng các đánh giá lưu sau đó.
      </p>

      <FormField label="Chu kỳ đánh giá" required>
        <select className="form-select" value={cycle} onChange={e => setCycle(e.target.value)}>
          {CYCLE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </FormField>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="form-checkbox mt-0.5"
          checked={groupRequired}
          onChange={e => setGroupRequired(e.target.checked)}
        />
        <span>
          Bắt buộc nhà cung cấp thuộc ít nhất một nhóm
          <span className="block text-xs text-[var(--md-on-surface-variant)]">
            Dùng để nhắc nhở khi phân nhóm còn thiếu.
          </span>
        </span>
      </label>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn btn-filled" disabled={updateMutation.isPending}>
          Lưu thiết lập
        </button>
      </div>
    </form>
  );
}
