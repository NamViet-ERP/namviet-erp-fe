import { useState } from 'react';
import { Plus, Pencil, Trash2, Wallet, Calculator } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import { parseCurrencyInput } from '../../utils/currencyInput';
import { RECRUITMENT_SOURCES } from '../../constants/recruitment';
import { usePositionSelectOptions } from '../../hooks/usePositions';
import {
  useCreateRecruitmentCost,
  useDeleteRecruitmentCost,
  useRecruitmentBudget,
  useRecruitmentCostSummary,
  useRecruitmentCosts,
  useUpdateRecruitmentBudget,
  useUpdateRecruitmentCost,
} from '../../hooks/useRecruitmentCosts';
import type { RecruitmentCostApiDto } from '../../services/recruitmentCostsService';
import PermissionGate from '../../components/auth/PermissionGate';

const CURRENT_YEAR = new Date().getFullYear();

const EMPTY_FORM = {
  source: 'TopCV',
  amount: 0,
  period: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${CURRENT_YEAR}`,
  positionName: '',
  durationDays: 30,
  paymentYear: CURRENT_YEAR,
  paymentMonth: new Date().getMonth() + 1,
  note: '',
};

function BudgetDonut({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="recruitment-budget-donut">
      <div
        className="recruitment-budget-donut__ring"
        style={{ background: `conic-gradient(${color} ${pct}%, #e8eaed ${pct}% 100%)` }}
      >
        <div className="recruitment-budget-donut__center">
          <span className="recruitment-budget-donut__value">{formatCurrency(value)}</span>
        </div>
      </div>
      <p className="recruitment-budget-donut__label">{label}</p>
    </div>
  );
}

export default function RecruitmentCostsPage() {
  const positionOptions = usePositionSelectOptions();
  const [filterSource, setFilterSource] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterYear, setFilterYear] = useState<number | ''>(CURRENT_YEAR);
  const [filterMonth, setFilterMonth] = useState<number | ''>('');

  const listParams = {
    source: filterSource || undefined,
    position: filterPosition || undefined,
    year: typeof filterYear === 'number' ? filterYear : undefined,
    month: typeof filterMonth === 'number' ? filterMonth : undefined,
  };

  const { data: costs = [], isLoading, isError, error, refetch } = useRecruitmentCosts(listParams);
  const { data: summary = [] } = useRecruitmentCostSummary();
  const { data: budget } = useRecruitmentBudget(CURRENT_YEAR);
  const createMutation = useCreateRecruitmentCost();
  const updateMutation = useUpdateRecruitmentCost();
  const deleteMutation = useDeleteRecruitmentCost();
  const budgetMutation = useUpdateRecruitmentBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [editing, setEditing] = useState<RecruitmentCostApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecruitmentCostApiDto | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const allocated = budget?.totalAllocated ?? 0;
  const used = budget?.totalUsed ?? summary.reduce((s, r) => s + r.totalAmount, 0);
  const remaining = budget?.remaining ?? Math.max(0, allocated - used);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (row: RecruitmentCostApiDto) => {
    setEditing(row);
    setForm({
      source: row.source,
      amount: row.amount,
      period: row.period,
      positionName: row.positionName ?? '',
      durationDays: row.durationDays ?? 30,
      paymentYear: row.paymentYear ?? CURRENT_YEAR,
      paymentMonth: row.paymentMonth ?? new Date().getMonth() + 1,
      note: row.note ?? '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.source.trim() || !form.period.trim()) {
      showToast('warning', 'Vui lòng nhập nguồn và kỳ');
      return;
    }
    const payload = {
      source: form.source.trim(),
      amount: Number(form.amount) || 0,
      period: form.period.trim(),
      positionName: form.positionName.trim() || undefined,
      durationDays: form.durationDays || undefined,
      paymentYear: form.paymentYear || undefined,
      paymentMonth: form.paymentMonth || undefined,
      note: form.note.trim() || undefined,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, dto: payload });
        showToast('success', 'Đã cập nhật chi phí');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('success', 'Đã thêm chi phí');
      }
      setFormOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu chi phí'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', 'Đã xóa chi phí');
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa chi phí'));
    }
  };

  const handleBudgetSave = async () => {
    const amount = parseCurrencyInput(budgetInput);
    try {
      await budgetMutation.mutateAsync({ year: CURRENT_YEAR, totalAllocated: amount });
      showToast('success', 'Đã cập nhật ngân sách');
      setBudgetOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật ngân sách'));
    }
  };

  const exportCsv = () => {
    const header = ['Nguồn', 'Vị trí', 'Chi phí', 'Thời hạn', 'Năm', 'Tháng', 'Ghi chú'];
    const rows = costs.map(c => [
      c.source,
      c.positionName ?? '',
      c.amount,
      c.durationDays ?? '',
      c.paymentYear ?? '',
      c.paymentMonth ?? '',
      c.note ?? '',
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chi-phi-tuyen-dung-${CURRENT_YEAR}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hrm-page space-y-4">
      <PageHeader
        title="Quản lý chi phí & Ngân sách"
        subtitle="Theo dõi ngân sách, chi phí theo kênh và vị trí tuyển dụng."
        actions={(
          <div className="flex flex-wrap gap-2">
            <PermissionGate
              permission="hrm.recruitment.costs.update"
              fallback={<button type="button" className="btn btn-secondary" disabled title="Bạn không có quyền cập nhật ngân sách"><Wallet size={16} /> Cập nhật Ngân sách</button>}
            >
              <button type="button" className="btn btn-secondary" onClick={() => { setBudgetInput(allocated > 0 ? String(allocated) : ''); setBudgetOpen(true); }}>
                <Wallet size={16} /> Cập nhật Ngân sách
              </button>
            </PermissionGate>
            <PermissionGate
              permission="hrm.recruitment.costs.create"
              fallback={<button type="button" className="btn btn-primary" disabled title="Bạn không có quyền thêm chi phí"><Plus size={16} /> Thêm chi phí</button>}
            >
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} /> Thêm chi phí
              </button>
            </PermissionGate>
            <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
              <Calculator size={16} /> Tính toán lại
            </button>
            <button type="button" className="btn btn-secondary" onClick={exportCsv}>
              Xuất Excel
            </button>
          </div>
        )}
      />

      <HrmPanel>
        <div className="recruitment-budget-donut-grid">
          <BudgetDonut label="Tổng ngân sách cấp" value={allocated} total={Math.max(allocated, used, 1)} color="#1a73e8" />
          <BudgetDonut label="Đã dùng" value={used} total={Math.max(allocated, used, 1)} color="#34a853" />
          <BudgetDonut label="Còn lại" value={remaining} total={Math.max(allocated, used, 1)} color="#5f6368" />
        </div>
      </HrmPanel>

      <HrmPanel noPadding>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <div className="hrm-list-toolbar__filters-right">
              <div className="hrm-filter-select-wrap">
                <select className="hrm-filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                  <option value="">Tất cả Nguồn</option>
                  {[...RECRUITMENT_SOURCES, 'CareerBuilder', 'VietnamWorks', 'ITviec'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select className="hrm-filter-select" value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
                  <option value="">Tất cả Vị trí</option>
                  {positionOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select className="hrm-filter-select" value={filterYear} onChange={e => setFilterYear(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Tất cả Năm</option>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select className="hrm-filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Tháng thanh toán</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto hrm-table-wrap">
          <table className="w-full border-collapse hrm-table">
            <thead>
              <tr>
                <th className="table-header-cell hrm-table-col-period">Ngày/Kỳ</th>
                <th className="table-header-cell">Nguồn</th>
                <th className="table-header-cell">Vị trí áp dụng</th>
                <th className="table-header-cell hrm-table-col-money">Chi phí (VND)</th>
                <th className="table-header-cell hrm-table-col-tight">Thời hạn (ngày)</th>
                <th className="table-header-cell hrm-table-col-tight">Năm</th>
                <th className="table-header-cell hrm-table-col-tight">Tháng</th>
                <th className="table-header-cell hrm-table-col-actions" aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="table-cell py-8 text-center text-sm">Đang tải…</td></tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="table-cell py-8 text-center">
                    <p className="text-sm text-[var(--md-error)] mb-3">
                      {getApiErrorMessage(error, 'Không tải được chi phí tuyển dụng.')}
                    </p>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refetch()}>
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : costs.length === 0 ? (
                <tr><td colSpan={8} className="table-cell py-8 text-center text-sm text-[var(--md-on-surface-variant)]">Chưa có bản ghi chi phí.</td></tr>
              ) : costs.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell tabular-nums hrm-table-col-period">{row.period}</td>
                  <td className="table-cell">{row.source}</td>
                  <td className="table-cell">{row.positionName || '-'}</td>
                  <td className="table-cell tabular-nums text-[var(--md-primary)] font-medium hrm-table-col-money">{formatCurrency(row.amount)}</td>
                  <td className="table-cell tabular-nums hrm-table-col-tight">{row.durationDays ?? '-'}</td>
                  <td className="table-cell tabular-nums hrm-table-col-tight">{row.paymentYear ?? '-'}</td>
                  <td className="table-cell tabular-nums hrm-table-col-tight">{row.paymentMonth ?? '-'}</td>
                  <td className="table-cell hrm-table-col-actions">
                    <div className="hrm-table-row-actions">
                      <PermissionGate
                        permission="hrm.recruitment.costs.update"
                        fallback={<button type="button" className="icon-btn" title="Bạn không có quyền sửa" disabled><Pencil size={13} /></button>}
                      >
                        <button type="button" className="icon-btn" title="Sửa" onClick={() => openEdit(row)}><Pencil size={13} /></button>
                      </PermissionGate>
                      <PermissionGate
                        permission="hrm.recruitment.costs.delete"
                        fallback={<button type="button" className="icon-btn icon-btn--danger" title="Bạn không có quyền xóa" disabled><Trash2 size={13} /></button>}
                      >
                        <button type="button" className="icon-btn icon-btn--danger" title="Xóa" onClick={() => setDeleteTarget(row)}><Trash2 size={13} /></button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HrmPanel>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Sửa chi phí' : 'Thêm chi phí'}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Hủy</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nguồn / kênh</span>
            <select className="form-input form-input-md" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
              {[...RECRUITMENT_SOURCES, 'CareerBuilder', 'Khác'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Kỳ (vd: 07/2026)</span>
            <input className="form-input form-input-md" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Số tiền (VNĐ)</span>
            <CurrencyInput
              value={form.amount > 0 ? String(form.amount) : ''}
              onChange={(_, numeric) => setForm(f => ({ ...f, amount: numeric }))}
              suffix="đ"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Vị trí áp dụng</span>
            <select className="form-input form-input-md" value={form.positionName} onChange={e => setForm(f => ({ ...f, positionName: e.target.value }))}>
              <option value="">— Chọn —</option>
              {positionOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Thời hạn (ngày)</span>
              <input type="number" min={1} className="form-input form-input-md" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Năm</span>
              <input type="number" className="form-input form-input-md" value={form.paymentYear} onChange={e => setForm(f => ({ ...f, paymentYear: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Tháng</span>
              <input type="number" min={1} max={12} className="form-input form-input-md" value={form.paymentMonth} onChange={e => setForm(f => ({ ...f, paymentMonth: Number(e.target.value) }))} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Ghi chú</span>
            <textarea className="form-input form-input-md min-h-[72px]" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        title="Cập nhật ngân sách"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setBudgetOpen(false)}>Hủy</button>
            <button type="button" className="btn btn-primary" onClick={handleBudgetSave} disabled={budgetMutation.isPending}>
              {budgetMutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </button>
          </>
        }
      >
        <label className="flex flex-col gap-1 text-sm modal-form-bordered">
          <span className="font-medium">Tổng ngân sách cấp ({CURRENT_YEAR})</span>
          <CurrencyInput
            value={budgetInput}
            onChange={(_, numeric) => setBudgetInput(numeric > 0 ? String(numeric) : '')}
            suffix="đ"
          />
        </label>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xóa chi phí?"
        message={deleteTarget ? `Xóa khoản chi phí ${deleteTarget.source} — ${formatCurrency(deleteTarget.amount)}?` : ''}
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
