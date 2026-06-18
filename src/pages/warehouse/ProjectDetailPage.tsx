import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PackageX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useProject, useProjectInventory, useCloseProject } from '../../hooks/useProjects';

export default function ProjectDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useProject(code);
  const { data: inventory = [], isLoading: invLoading } = useProjectInventory(code);
  const closeMutation = useCloseProject();

  const handleCloseWarehouse = async () => {
    if (!code || !project) return;
    if (project.status === 'Closed') {
      showToast('warning', 'Dự án đã đóng kho.');
      return;
    }
    if (!window.confirm(`Xác nhận đóng kho dự án "${project.projectName}"? Tồn còn lại sẽ chuyển về kho tổng.`)) {
      return;
    }
    try {
      await closeMutation.mutateAsync(code);
      showToast('success', 'Đã đóng kho dự án và chuyển tồn về kho tổng.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đóng kho dự án'));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-[var(--md-on-surface-variant)]">Đang tải...</div>;
  }

  if (isError || !project) {
    return (
      <div className="animate-fade-in space-y-4">
        <button type="button" className="btn btn-ghost text-xs" onClick={() => navigate('/warehouse/projects')}>
          <ArrowLeft size={14} /> Quay lại
        </button>
        <EmptyState message="Không tìm thấy dự án." />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="Kho hàng"
        title={project.projectName}
        actions={
          project.status !== 'Closed' ? (
            <button
              type="button"
              className="btn btn-outline text-xs"
              disabled={closeMutation.isPending}
              onClick={handleCloseWarehouse}
            >
              <PackageX size={14} /> Đóng kho dự án
            </button>
          ) : undefined
        }
      />

      <div className="rounded-2xl shadow-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div>
          <div className="text-[var(--md-on-surface-variant)]">Mã dự án</div>
          <div className="font-bold font-mono text-[var(--md-primary)]">{project.projectCode}</div>
        </div>
        <div>
          <div className="text-[var(--md-on-surface-variant)]">PM</div>
          <div className="font-semibold">{project.pmName}</div>
        </div>
        <div>
          <div className="text-[var(--md-on-surface-variant)]">Ngày bắt đầu</div>
          <div className="font-semibold">{project.startDate}</div>
        </div>
        <div>
          <div className="text-[var(--md-on-surface-variant)]">Trạng thái</div>
          <Badge status={project.status === 'Closed' ? 'completed' : 'active'} />
        </div>
      </div>

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div className="px-4 py-3 border-b font-bold text-sm" style={{ borderColor: 'var(--md-outline-variant)' }}>
          Tồn kho dự án
        </div>
        {invLoading ? (
          <div className="p-8 text-center text-sm text-[var(--md-on-surface-variant)]">Đang tải tồn kho...</div>
        ) : inventory.length === 0 ? (
          <EmptyState message="Chưa có dữ liệu tồn kho cho dự án này." />
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                  <th className="table-header-cell text-left">Mã VT</th>
                  <th className="table-header-cell text-left">Tên vật tư</th>
                  <th className="table-header-cell text-center">ĐVT</th>
                  <th className="table-header-cell text-right">Tồn thực</th>
                  <th className="table-header-cell text-right">Kế hoạch</th>
                  <th className="table-header-cell text-right">Giữ kho</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(row => (
                  <tr key={row.materialCode} className="table-row border-b border-[var(--md-outline-variant)]">
                    <td className="table-cell font-mono font-bold">{row.materialCode}</td>
                    <td className="table-cell">{row.materialName}</td>
                    <td className="table-cell text-center">{row.unit}</td>
                    <td className="table-cell text-right font-bold">{row.actualInventoryQty}</td>
                    <td className="table-cell text-right text-amber-600">{row.plannedInventoryQty}</td>
                    <td className="table-cell text-right text-rose-500">{row.reservedQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button type="button" className="btn btn-ghost text-xs" onClick={() => navigate('/warehouse/projects')}>
        <ArrowLeft size={14} /> Quay lại danh sách
      </button>
    </div>
  );
}
