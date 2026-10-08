import type React from 'react';
import { useMemo, useState } from 'react';
import { Plus, Target, Trash2, Pencil, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { usePositionSelectOptions } from '../../hooks/usePositions';
import {
  useCreateRecruitmentPlan,
  useDeleteRecruitmentPlan,
  useDepartmentOptions,
  useRecruitmentPlans,
  useUpdateRecruitmentPlan,
} from '../../hooks/useRecruitmentPlans';
import { RECRUITMENT_PLAN_STATUSES, planDisplayStatus } from '../../constants/recruitment';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import { buildRecentMonthFilterOptions } from '../../lib/dates';
import type { RecruitmentPlan } from '../../types/hr';
import PermissionGate from '../../components/auth/PermissionGate';

const EMPTY_FORM = {
  positionName: '',
  departmentName: '',
  departmentId: 0,
  headcount: 1,
  reason: '',
  period: '',
  openDate: '',
  deadlineDate: '',
  status: 'Active' as const,
};

export default function RecruitmentPlansPage() {
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterOpenMonth, setFilterOpenMonth] = useState('');
  const monthOptions = useMemo(() => buildRecentMonthFilterOptions(), []);
  const hasFilters = Boolean(filterDepartmentId || filterStatus || filterPeriod.trim() || filterOpenMonth);

  const resetFilters = () => {
    setFilterDepartmentId('');
    setFilterStatus('');
    setFilterPeriod('');
    setFilterOpenMonth('');
  };

  const { data: plans = [], isLoading, isError, error, refetch } = useRecruitmentPlans({
    departmentId: filterDepartmentId ? Number(filterDepartmentId) : undefined,
    status: filterStatus || undefined,
    period: filterPeriod || undefined,
    openMonth: filterOpenMonth || undefined,
  });
  const positionOptions = usePositionSelectOptions();
  const { data: departments = [] } = useDepartmentOptions();
  const createMutation = useCreateRecruitmentPlan();
  const updateMutation = useUpdateRecruitmentPlan();
  const deleteMutation = useDeleteRecruitmentPlan();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecruitmentPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecruitmentPlan | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const totals = useMemo(() => {
    const campaigns = plans.length;
    const recruiting = plans.filter(p => p.status === 'Active' && p.remainingCount > 0).length;
    const closed = plans.filter(p => p.status === 'Closed' || (p.remainingCount <= 0 && p.headcount > 0)).length;
    return { campaigns, recruiting, closed };
  }, [plans]);

  const openCreate = () => {
    setEditing(null);
    const first = departments[0];
    setForm({
      ...EMPTY_FORM,
      positionName: positionOptions[0] ?? '',
      departmentName: first?.name ?? '',
      departmentId: first?.id ?? 0,
    });
    setFormOpen(true);
  };

  const openEdit = (plan: RecruitmentPlan) => {
    setEditing(plan);
    setForm({
      positionName: plan.positionName,
      departmentName: plan.departmentName,
      departmentId: plan.departmentId ?? departments.find(d => d.name === plan.departmentName)?.id ?? 0,
      headcount: plan.headcount,
      reason: plan.reason ?? '',
      period: plan.period ?? '',
      openDate: plan.openDate ?? '',
      deadlineDate: plan.deadlineDate ?? '',
      status: (plan.status as typeof EMPTY_FORM.status) || 'Active',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.positionName.trim() || !form.departmentId) {
      showToast('warning', 'Vui lòng chọn vị trí và phòng ban');
      return;
    }
    const payload = {
      positionName: form.positionName.trim(),
      departmentName: form.departmentName.trim(),
      departmentId: form.departmentId,
      headcount: Math.max(1, form.headcount),
      reason: form.reason.trim() || undefined,
      period: form.period.trim() || undefined,
      openDate: form.openDate.trim() || undefined,
      deadlineDate: form.deadlineDate.trim() || undefined,
      status: form.status,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, dto: payload });
        showToast('success', 'Đã cập nhật kế hoạch tuyển dụng');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('success', 'Đã tạo kế hoạch tuyển dụng');
      }
      setFormOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu kế hoạch'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', 'Đã xóa kế hoạch');
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa kế hoạch'));
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Kế hoạch & Tiến độ lấp đầy"
        subtitle="Theo dõi chiến dịch tuyển dụng theo đợt — đã tuyển tính từ ứng viên trạng thái Đã tuyển."
        actions={
          <PermissionGate
            permission="hrm.recruitment.plans.create"
            fallback={(
              <button type="button" className="btn btn-primary" disabled title="Bạn không có quyền tạo kế hoạch">
                <Plus size={16} />
                Thêm kế hoạch
              </button>
            )}
          >
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} />
              Thêm kế hoạch
            </button>
          </PermissionGate>
        }
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng chiến dịch" value={totals.campaigns} icon={Target} tone="primary" />
        <HrmStatCard label="Đang tuyển" value={totals.recruiting} icon={Target} tone="success" />
        <HrmStatCard label="Đã hoàn thành / Đóng" value={totals.closed} icon={Target} tone="warning" />
      </div>

      <HrmPanel noPadding>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <div className="hrm-list-toolbar__filters-right">
              <div className="hrm-filter-select-wrap">
                <select className="hrm-filter-select" value={filterDepartmentId} onChange={e => setFilterDepartmentId(e.target.value)}>
                  <option value="">Tất cả Phòng ban</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select className="hrm-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Tất cả Trạng thái</option>
                  <option value="Active">Đang tuyển</option>
                  <option value="Closed">Đã đóng</option>
                  <option value="Draft">Nháp</option>
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <input
                  className="hrm-filter-select"
                  placeholder="Đợt tuyển..."
                  value={filterPeriod}
                  onChange={e => setFilterPeriod(e.target.value)}
                />
              </div>
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={filterOpenMonth}
                  onChange={e => setFilterOpenMonth(e.target.value)}
                  aria-label="Tháng mở"
                >
                  <option value="">Tháng mở</option>
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="hrm-filter-reset">
                  <RotateCcw size={14} aria-hidden />
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table">
            <thead>
              <tr>
                <th className="table-header-cell whitespace-nowrap">Đợt tuyển</th>
                <th className="table-header-cell hrm-table-col-tight">Chỉ tiêu</th>
                <th className="table-header-cell hrm-table-col-tight">Đã tuyển</th>
                <th className="table-header-cell hrm-table-col-tight">Còn thiếu</th>
                <th className="table-header-cell hrm-table-col-period">Ngày mở đợt</th>
                <th className="table-header-cell hrm-table-col-status">Trạng thái</th>
                <th className="table-header-cell hrm-table-col-actions" aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7}><div className="hrm-table-skeleton" /></td></tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-10">
                    <p className="text-sm text-[var(--md-error)] mb-3">
                      {getApiErrorMessage(error, 'Không tải được kế hoạch tuyển dụng.')}
                    </p>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refetch()}>
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-sm text-[var(--md-on-surface-variant)] py-10">
                    Chưa có kế hoạch tuyển dụng. Bấm &quot;Thêm chiến dịch&quot; để bắt đầu.
                  </td>
                </tr>
              ) : (
                plans.map(plan => (
                  <tr key={plan.id} className="table-row">
                    <td className="table-cell font-medium text-[var(--md-primary)]">
                      <div>{plan.period || plan.positionName}</div>
                      <div className="text-xs text-[var(--md-on-surface-variant)]">{plan.departmentName}</div>
                    </td>
                    <td className="table-cell text-center tabular-nums hrm-table-col-tight">{plan.headcount}</td>
                    <td className="table-cell text-center tabular-nums text-[var(--md-primary)] hrm-table-col-tight">{plan.hiredCount}</td>
                    <td className="table-cell text-center tabular-nums font-semibold hrm-table-col-tight">{plan.remainingCount}</td>
                    <td className="table-cell tabular-nums hrm-table-col-period">{plan.openDate || '—'}</td>
                    <td className="table-cell text-center hrm-table-col-status">
                      <span className={`badge ${planDisplayStatus(plan).className}`}>
                        {planDisplayStatus(plan).label}
                      </span>
                    </td>
                    <td className="table-cell hrm-table-col-actions">
                      <div className="hrm-table-row-actions">
                        <PermissionGate
                          permission="hrm.recruitment.plans.update"
                          fallback={<button type="button" className="icon-btn" title="Bạn không có quyền sửa" disabled><Pencil size={15} /></button>}
                        >
                          <button type="button" className="icon-btn" title="Sửa" onClick={() => openEdit(plan)}>
                            <Pencil size={15} />
                          </button>
                        </PermissionGate>
                        <PermissionGate
                          permission="hrm.recruitment.plans.delete"
                          fallback={<button type="button" className="icon-btn icon-btn--danger" title="Bạn không có quyền xóa" disabled><Trash2 size={15} /></button>}
                        >
                          <button type="button" className="icon-btn icon-btn--danger" title="Xóa" onClick={() => setDeleteTarget(plan)}>
                            <Trash2 size={15} />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </HrmPanel>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Sửa chiến dịch' : 'Khởi tạo Chiến dịch'}
        size="md"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Hủy</button>
            <button
              type="submit"
              form="recruitment-plan-form"
              className="btn btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </button>
          </>
        )}
      >
        <form id="recruitment-plan-form" className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Vị trí cần tuyển *</span>
            <select
              className="form-input form-input-md"
              value={form.positionName}
              onChange={e => setForm(f => ({ ...f, positionName: e.target.value }))}
              required
            >
              <option value="">— Chọn vị trí —</option>
              {positionOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Phòng ban</span>
              <select
                className="form-input form-input-md"
                value={form.departmentId || ''}
                onChange={e => {
                  const id = Number(e.target.value) || 0;
                  const dept = departments.find(d => d.id === id);
                  setForm(f => ({
                    ...f,
                    departmentId: id,
                    departmentName: dept?.name ?? '',
                  }));
                }}
                required
              >
                <option value="">— Chọn —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Đợt tuyển</span>
              <input
                className="form-input form-input-md"
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                placeholder="VD: Đợt 1/2026"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Chỉ tiêu *</span>
            <input
              type="number"
              min={1}
              className="form-input form-input-md"
              value={form.headcount}
              onChange={e => setForm(f => ({ ...f, headcount: Number(e.target.value) || 1 }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Ngày mở đợt</span>
              <HrmDatePicker value={form.openDate} onChange={v => setForm(f => ({ ...f, openDate: v }))} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Hạn chót</span>
              <HrmDatePicker value={form.deadlineDate} onChange={v => setForm(f => ({ ...f, deadlineDate: v }))} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Trạng thái</span>
            <select
              className="form-input form-input-md"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))}
            >
              {RECRUITMENT_PLAN_STATUSES.map(s => (
                <option key={s} value={s}>
                  {s === 'Active' ? 'Đang chạy' : s === 'Closed' ? 'Đã đóng' : 'Nháp'}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Lý do / ghi chú</span>
            <textarea
              className="form-input form-input-md min-h-[72px]"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xóa kế hoạch tuyển dụng?"
        message={deleteTarget ? `Xóa chiến dịch "${deleteTarget.positionName}" — không thể hoàn tác.` : ''}
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
