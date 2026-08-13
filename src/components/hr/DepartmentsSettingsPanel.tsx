import { useMemo, useState } from 'react';
import { Building2, Plus, Pencil, Trash2, UserPlus } from 'lucide-react';
import HrmPanel from './HrmPanel';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useEmployees } from '../../hooks/useEmployees';
import {
  useAssignDepartmentEmployees,
  useCreateDepartment,
  useDeleteDepartment,
  useDepartmentMembers,
  useDepartments,
  useUpdateDepartment,
} from '../../hooks/useDepartments';
import type { DepartmentApiDto } from '../../services/departmentsService';

type DeptForm = { code: string; name: string; block: string };

const EMPTY_FORM: DeptForm = { code: '', name: '', block: '' };

/** Design read: dense ERP HR org settings — tokens only, table + modal primitives. */
export default function DepartmentsSettingsPanel({ canUpdate }: { canUpdate: boolean }) {
  const { data: departments = [], isPending, isError, refetch } = useDepartments(false);
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();
  const assignMutation = useAssignDepartmentEmployees();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentApiDto | null>(null);
  const [form, setForm] = useState<DeptForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentApiDto | null>(null);

  const [assignTarget, setAssignTarget] = useState<DepartmentApiDto | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [assignSearch, setAssignSearch] = useState('');

  const { data: members = [] } = useDepartmentMembers(assignTarget?.id ?? null);
  const { data: employees = [] } = useEmployees();

  const memberIdSet = useMemo(() => new Set(members.map(m => m.id)), [members]);

  const assignCandidates = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    return employees
      .map(e => ({
        id: Number(e.id),
        code: e.code ?? '',
        fullName: e.fullName,
        department: e.department,
      }))
      .filter(e => Number.isFinite(e.id) && e.id > 0)
      .filter(e => !memberIdSet.has(e.id))
      .filter(e => {
        if (!q) return true;
        return (
          e.fullName.toLowerCase().includes(q)
          || e.code.toLowerCase().includes(q)
          || (e.department?.toLowerCase().includes(q) ?? false)
        );
      });
  }, [employees, memberIdSet, assignSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (dept: DepartmentApiDto) => {
    setEditing(dept);
    setForm({ code: dept.code, name: dept.name, block: dept.block ?? '' });
    setFormOpen(true);
  };

  const openAssign = (dept: DepartmentApiDto) => {
    setAssignTarget(dept);
    setSelectedEmployeeIds([]);
    setAssignSearch('');
  };

  const handleSave = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name) {
      showToast('warning', 'Nhập mã và tên phòng ban.');
      return;
    }
    const body = {
      code,
      name,
      block: form.block.trim() || null,
      parentId: null as number | null,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        showToast('success', 'Đã cập nhật phòng ban.');
      } else {
        await createMutation.mutateAsync(body);
        showToast('success', 'Đã tạo phòng ban.');
      }
      setFormOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu phòng ban.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa phòng ban ${deleteTarget.name}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa phòng ban.'));
    }
  };

  const handleAssign = async () => {
    if (!assignTarget || selectedEmployeeIds.length === 0) {
      showToast('warning', 'Chọn ít nhất một nhân viên.');
      return;
    }
    try {
      const result = await assignMutation.mutateAsync({
        id: assignTarget.id,
        employeeIds: selectedEmployeeIds,
      });
      showToast('success', `Đã gán ${result.assigned} nhân viên vào ${assignTarget.name}.`);
      setSelectedEmployeeIds([]);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể gán nhân viên.'));
    }
  };

  const toggleEmployee = (id: number) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  return (
    <>
      <HrmPanel className="hrm-settings-card hrm-settings-card--featured">
        <div className="hrm-settings-card__head">
          <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">
            <Building2 size={20} aria-hidden />
          </div>
          <div className="hrm-settings-card__head-text">
            <h2 className="hrm-settings-card__title">Phòng ban</h2>
            <p className="hrm-settings-card__desc">
              Tạo - sửa phòng ban, rồi gán một hoặc nhiều nhân viên vào phòng. Đổi tên không làm lệch kế hoạch tuyển dụng (lưu theo Id).
            </p>
          </div>
          {canUpdate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden />
              Thêm phòng ban
            </button>
          )}
        </div>

        {isPending && <p className="hrm-settings-note" role="status">Đang tải phòng ban...</p>}
        {isError && (
          <div className="hrm-invite-state" role="alert">
            <span>Không tải được danh sách phòng ban.</span>
            <button type="button" className="btn btn-outline btn-sm rounded-full" onClick={() => void refetch()}>
              Thử lại
            </button>
          </div>
        )}

        {!isPending && !isError && departments.length === 0 && (
          <EmptyState message="Chưa có phòng ban. Tạo phòng ban đầu tiên để gán nhân viên." />
        )}

        {departments.length > 0 && (
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Mã</th>
                  <th className="table-header-cell">Tên phòng ban</th>
                  <th className="table-header-cell">Khối</th>
                  <th className="table-header-cell">Số NV</th>
                  <th className="table-header-cell">Trạng thái</th>
                  {canUpdate && <th className="table-header-cell">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept.id} className="table-row">
                    <td className="table-cell" style={{ fontFamily: 'var(--font-mono)' }}>{dept.code}</td>
                    <td className="table-cell">{dept.name}</td>
                    <td className="table-cell">{dept.block || '—'}</td>
                    <td className="table-cell" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dept.employeeCount ?? 0}
                    </td>
                    <td className="table-cell">{dept.isActive ? 'Đang hoạt động' : 'Ngừng'}</td>
                    {canUpdate && (
                      <td className="table-cell">
                        <div className="hrm-table-row-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => openAssign(dept)}
                            aria-label={`Gán nhân viên vào ${dept.name}`}
                          >
                            <UserPlus size={14} aria-hidden />
                            Gán NV
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(dept)}
                            aria-label={`Sửa ${dept.name}`}
                          >
                            <Pencil size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-[var(--md-error)]"
                            onClick={() => setDeleteTarget(dept)}
                            aria-label={`Xóa ${dept.name}`}
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HrmPanel>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Sửa phòng ban' : 'Thêm phòng ban'}
        size="sm"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Hủy</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleSave()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Lưu
            </button>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <label className="hrm-field">
            <span className="hrm-field__label">Mã phòng ban</span>
            <input
              className="hrm-field-input"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="VD: HCNS"
            />
          </label>
          <label className="hrm-field">
            <span className="hrm-field__label">Tên phòng ban</span>
            <input
              className="hrm-field-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="VD: Hành chính nhân sự"
            />
          </label>
          <label className="hrm-field">
            <span className="hrm-field__label">Khối (tuỳ chọn)</span>
            <input
              className="hrm-field-input"
              value={form.block}
              onChange={e => setForm(f => ({ ...f, block: e.target.value }))}
              placeholder="VD: HCNS, CUNG ỨNG"
            />
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        title={assignTarget ? `Gán nhân viên · ${assignTarget.name}` : 'Gán nhân viên'}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setAssignTarget(null)}>Đóng</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleAssign()}
              disabled={assignMutation.isPending || selectedEmployeeIds.length === 0}
            >
              Gán {selectedEmployeeIds.length > 0 ? `(${selectedEmployeeIds.length})` : ''}
            </button>
          </>
        )}
      >
        <p className="hrm-settings-note mb-3">
          Đang có {members.length} nhân viên trong phòng. Chọn thêm NV bên dưới để gán hàng loạt.
        </p>
        <input
          className="hrm-field-input mb-3"
          value={assignSearch}
          onChange={e => setAssignSearch(e.target.value)}
          placeholder="Tìm tên, mã NV, phòng hiện tại..."
          aria-label="Tìm nhân viên để gán"
        />
        <div className="wms-inventory-table-wrap" style={{ maxHeight: '22rem', overflow: 'auto' }}>
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell" style={{ width: '2.5rem' }} />
                <th className="table-header-cell">Mã NV</th>
                <th className="table-header-cell">Họ tên</th>
                <th className="table-header-cell">Phòng hiện tại</th>
              </tr>
            </thead>
            <tbody>
              {assignCandidates.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={4}>Không còn nhân viên phù hợp để gán.</td>
                </tr>
              ) : (
                assignCandidates.map(emp => (
                  <tr key={emp.id} className="table-row">
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        aria-label={`Chọn ${emp.fullName}`}
                      />
                    </td>
                    <td className="table-cell" style={{ fontFamily: 'var(--font-mono)' }}>{emp.code || '—'}</td>
                    <td className="table-cell">{emp.fullName}</td>
                    <td className="table-cell">{emp.department || 'Chưa phân phòng'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Xóa phòng ban?"
        message={
          deleteTarget
            ? `Xóa "${deleteTarget.name}"? Hệ thống sẽ chặn nếu còn nhân viên hoặc kế hoạch tuyển dụng.`
            : ''
        }
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
