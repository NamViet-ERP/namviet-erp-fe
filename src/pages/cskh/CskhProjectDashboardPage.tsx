import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Pencil,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import HrmPanel from '../../components/hr/HrmPanel';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import { useProjectDashboardStats } from '../../hooks/cskh/useProjectDashboardStats';
import { cskhProjectPath } from '../../constants/cskhProject';
import { isoToDisplay } from '../../lib/dates';
import {
  formatSignedPct,
  progressDelta,
  progressStatus,
  progressStatusCopy,
  progressTone,
} from '../../lib/cskh/commandCenter';
import CskhProjectMissing from './CskhProjectMissing';
import CskhEditProjectModal from './CskhEditProjectModal';

export default function CskhProjectDashboardPage() {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { projects, getProject, isLoading, isError, refetch, patchProject, deleteProject } = useCskhCommandCenter();
  const project = getProject(code);
  const stats = useProjectDashboardStats(code);
  const { tasks: ganttStages, urgentBottlenecks, overdueDocs, urgentRequests } = stats;
  const [editOpen, setEditOpen] = useState(false);
  const [currentTime] = useState(() => Date.now());

  if (isError || stats.isError) return <p role="alert">Không tải được dữ liệu dự án. <button type="button" onClick={() => void Promise.all([refetch(), stats.refetch()])}>Thử lại</button></p>;
  if (isLoading || stats.isLoading || !project) return <CskhProjectMissing loading={isLoading || stats.isLoading} />;

  const delta = progressDelta(project.planPct, project.actualPct);

  // COD target countdown calculation
  const codTarget = project.targetCodDate;
  const targetTime = codTarget ? Date.parse(codTarget) : NaN;
  const daysRemaining = Number.isFinite(targetTime)
    ? Math.max(0, Math.ceil((targetTime - currentTime) / (24 * 60 * 60 * 1000)))
    : null;

  const displayGanttStages = ganttStages;

  return (
    <div className="page-stack cskh-desk">
      <PageHeader
        title="Bảng Điều Hành Tiến Độ Dự Án Lò Hơi"
        subtitle={`Trung tâm chỉ huy điều phối EPC: ${project.code} - ${project.name}`}
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outlined"
              leftIcon={Pencil}
              onClick={() => setEditOpen(true)}
            >
              Chỉnh sửa dự án
            </Button>
            <Button
              type="button"
              variant="outlined"
              leftIcon={Layers}
              onClick={() => navigate(cskhProjectPath(project.code, 'gantt'))}
            >
              Xem Dual Gantt
            </Button>
            <Button
              type="button"
              variant="filled"
              leftIcon={AlertTriangle}
              onClick={() => navigate(cskhProjectPath(project.code, 'bottlenecks'))}
            >
              Xử lý điểm nghẽn
            </Button>
          </div>
        }
      />

      {/* BANNER MỤC TIÊU COD */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--nv-navy) 0%, color-mix(in srgb, var(--nv-navy) 85%, #0f3d63) 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '20px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              DỰ ÁN TRỌNG ĐIỂM
            </span>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              {project.boilerType || 'Chưa phân loại'}{project.capacity ? ` · ${project.capacity}` : ''}
            </span>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '4px',
              }}
              title="Chỉnh sửa thông tin dự án"
            >
              <Pencil size={11} />
              <span>Chỉnh sửa</span>
            </button>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#ffffff' }}>
            {project.code} — {project.name}
          </h2>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '4px' }}>
            Chủ đầu tư: <strong>{project.clientName || 'Chưa cập nhật'}</strong> · Chỉ huy trưởng:{' '}
            <strong>{project.pmName || 'Chưa chỉ định'}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '8px',
              padding: '8px 16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>Mục tiêu COD</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffdd57' }}>
              {codTarget ? isoToDisplay(codTarget) : 'Chưa thiết lập'}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '8px 18px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>Thời gian còn lại</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
              {daysRemaining !== null ? (
                <>{daysRemaining} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>ngày</span></>
              ) : (
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Chưa có mốc</span>
              )}
            </div>
          </div>

          <div
            style={{
              background: delta < 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
              border: `1px solid ${delta < 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)'}`,
              borderRadius: '8px',
              padding: '8px 16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.9 }}>Độ trễ tiến độ</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: delta < 0 ? '#ff8585' : '#86efac' }}>
              {formatSignedPct(delta)}
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số điều hành EPC">
        <Card
          className="cskh-desk__kpi-card"
          title="Tiến độ Tổng thể"
          value={`${project.actualPct}%`}
          subtitle={`Kế hoạch ${project.planPct}% · Thực tế ${project.actualPct}% · ${formatSignedPct(delta)}`}
          accent={delta < -5 ? 'danger' : delta < 0 ? 'warning' : 'success'}
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Điểm nghẽn rủi ro cao"
          value={urgentBottlenecks.length}
          subtitle={`${urgentBottlenecks.length} điểm nghẽn nghiêm trọng`}
          accent="danger"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Hồ sơ CĐT giữ lại"
          value={overdueDocs.length}
          subtitle={`${overdueDocs.length} hồ sơ quá hạn SLA phản hồi`}
          accent="warning"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Yêu cầu hiện trường"
          value={urgentRequests.length}
          subtitle={`${urgentRequests.length} đề xuất gấp chưa hoàn thành`}
          accent="teal"
        />
      </div>

      {/* 6 EPC CORE PHASES PROGRESS */}
      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head mb-4">
          <div>
            <h2 className="section-heading__title m-0">6 Giai Đoạn EPC Cốt Lõi Dự Án Lò Hơi</h2>
            <p className="section-heading__sub mb-0">
              Kiểm soát tiến độ đường găng (Critical Path) từ khảo sát thiết kế đến đốt lửa lần đầu & COD
            </p>
          </div>
          <Button
            type="button"
            variant="text"
            rightIcon={ArrowRight}
            onClick={() => navigate(cskhProjectPath(project.code, 'gantt'))}
          >
            Chi tiết tiến độ 170 ngày
          </Button>
        </div>

        {displayGanttStages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px 20px',
            borderRadius: '8px',
            backgroundColor: 'var(--md-surface, #ffffff)',
            border: '1px solid var(--cskh-frame, #e2e8f0)',
            color: 'var(--md-on-surface-variant, #64748b)',
            fontSize: '13px',
          }}>
            Chưa có hạng mục đường găng nào được ghi nhận cho dự án này. Bấm <strong>Chi tiết tiến độ 170 ngày</strong> để đồng bộ tiến độ WBS.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayGanttStages.map(stage => {
              const isCompleted = stage.actualPct >= 100;
              const hasBottleneck = stage.notes?.includes('BN-');
              const barTone = isCompleted
                ? 'var(--md-success)'
                : hasBottleneck
                ? 'var(--md-error)'
                : stage.actualPct > 0
                ? 'var(--nv-action)'
                : 'var(--md-outline)';

              return (
                <div
                  key={stage.id}
                  style={{
                    border: '1px solid var(--cskh-frame)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    background: hasBottleneck ? 'color-mix(in srgb, var(--md-error) 5%, var(--md-surface))' : 'var(--md-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="var(--md-success)" />
                      ) : hasBottleneck ? (
                        <AlertTriangle size={16} color="var(--md-error)" />
                      ) : (
                        <Clock size={16} color="var(--nv-action)" />
                      )}
                      <span style={{ fontWeight: 600, color: 'var(--md-on-surface)' }}>{stage.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-variant)' }}>
                        ({stage.days} ngày · {isoToDisplay(stage.startDate)} → {isoToDisplay(stage.endDate)})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {hasBottleneck && (
                        <span className="cskh-status cskh-status--danger" style={{ fontSize: '0.75rem' }}>
                          Điểm nghẽn đường găng
                        </span>
                      )}
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: barTone }}>
                        {stage.actualPct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '8px',
                      width: '100%',
                      background: 'var(--md-surface-variant, #e2e8f0)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${stage.actualPct}%`,
                        background: barTone,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  {stage.notes && (
                    <div style={{ fontSize: '0.8rem', color: hasBottleneck ? 'var(--md-error)' : 'var(--md-on-surface-variant)', marginTop: '6px' }}>
                      {stage.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </HrmPanel>

      {/* DANH SÁCH TỔNG QUAN TẤT CẢ DỰ ÁN */}
      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head mb-4">
          <div>
            <h2 className="section-heading__title m-0">Tất Cả Dự Án Lò Hơi Đang Điều Hành</h2>
            <p className="section-heading__sub mb-0">Theo dõi đồng thời danh mục các dự án Boiler EPC của Nam Việt</p>
          </div>
        </div>

        <div className="wms-inventory-table-wrap cskh-desk__table">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell" style={{ width: '90px' }}>Mã DA</th>
                <th className="table-header-cell">Tên dự án & CĐT</th>
                <th className="table-header-cell" style={{ width: '160px' }}>Loại lò & Công suất</th>
                <th className="table-header-cell" style={{ width: '110px' }}>Kế hoạch %</th>
                <th className="table-header-cell" style={{ width: '110px' }}>Thực tế %</th>
                <th className="table-header-cell" style={{ width: '110px' }}>Chênh lệch</th>
                <th className="table-header-cell" style={{ width: '110px' }}>Điểm nghẽn</th>
                <th className="table-header-cell" style={{ width: '130px' }}>Sức khỏe DA</th>
                <th className="table-header-cell hrm-table-col-actions" style={{ width: '110px' }}>Chuyển DA</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(item => {
                const itemStatus = progressStatus(item);
                const itemTone = progressTone(itemStatus);
                const itemDelta = progressDelta(item.planPct, item.actualPct);
                const isSelected = item.code === project.code;

                return (
                  <tr
                    key={item.code}
                    className="table-row"
                    style={{ background: isSelected ? 'color-mix(in srgb, var(--nv-action) 6%, transparent)' : undefined }}
                  >
                    <td className="table-cell font-mono font-bold text-primary">{item.code}</td>
                    <td className="table-cell">
                      <div style={{ fontWeight: 600, color: 'var(--md-on-surface)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>
                        CĐT: {item.clientName || '-'} · PM: {item.pmName || '-'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div style={{ fontSize: '0.85rem' }}>{item.boilerType || 'Lò hơi công nghiệp'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--md-outline)' }}>{item.capacity || '-'}</div>
                    </td>
                    <td className="table-cell tabular-nums font-semibold">{item.planPct}%</td>
                    <td className="table-cell tabular-nums font-semibold" style={{ color: `var(--md-${itemTone === 'danger' ? 'error' : itemTone === 'warn' ? 'tertiary' : 'success'})` }}>
                      {item.actualPct}%
                    </td>
                    <td className="table-cell tabular-nums font-mono">{formatSignedPct(itemDelta)}</td>
                    <td className="table-cell tabular-nums">
                      {item.bottleneckCount > 0 ? (
                        <span className="cskh-status cskh-status--danger">{item.bottleneckCount} mở</span>
                      ) : (
                        <span className="cskh-status cskh-status--ok">0</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`cskh-status cskh-status--${itemTone}`}>
                        <span className="cskh-status__dot" aria-hidden />
                        {progressStatusCopy(itemStatus).label}
                      </span>
                    </td>
                    <td className="table-cell hrm-table-col-actions">
                      <Button
                        type="button"
                        variant={isSelected ? 'filled' : 'outlined'}
                        size="sm"
                        onClick={() => navigate(cskhProjectPath(item.code, 'dashboard'))}
                      >
                        {isSelected ? 'Đang xem' : 'Chọn xem'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </HrmPanel>

      {/* ĐIỂM NGHẼN RỦI RO ĐƯỜNG GĂNG (HIGHLIGHT) */}
      {urgentBottlenecks.length > 0 && (
        <HrmPanel className="cskh-desk__panel">
          <div className="cskh-desk__section-head" style={{ marginBottom: '12px' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} color="var(--md-error)" />
              <h2 className="section-heading__title m-0" style={{ color: 'var(--md-error)' }}>
                {urgentBottlenecks.length} Điểm Nghẽn Đang Đe Dọa Mốc COD Dự Án
              </h2>
            </div>
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate(cskhProjectPath(project.code, 'bottlenecks'))}
            >
              Vào ma trận điểm nghẽn
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {urgentBottlenecks.map(bn => (
              <div
                key={bn.id}
                style={{
                  border: '1px solid var(--md-error)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  background: 'color-mix(in srgb, var(--md-error) 4%, var(--md-surface))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span className="font-mono font-bold" style={{ color: 'var(--md-error)' }}>{bn.code}</span>
                  <span className="cskh-status cskh-status--danger">Khẩn cấp</span>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--md-on-surface)', marginBottom: '4px', fontSize: '0.9rem' }}>
                  {bn.name}
                </div>
                {bn.ganttTask && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--nv-navy)', fontWeight: 600, marginBottom: '4px' }}>
                    {bn.ganttTask}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-variant)' }}>
                  Hạn xử lý: <strong>{isoToDisplay(bn.expectedAt)}</strong> · PIC: <strong>{bn.pic || 'Chưa chỉ định'}</strong>
                </div>
                {bn.resolution && (
                  <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--md-success)', fontWeight: 600 }}>
                    Giải pháp: {bn.resolution}
                  </div>
                )}
              </div>
            ))}
          </div>
        </HrmPanel>
      )}

      <CskhEditProjectModal
        open={editOpen}
        project={project}
        onClose={() => setEditOpen(false)}
        onSave={patch => patchProject(project.code, patch)}
        onDelete={async code => {
          await deleteProject(code);
          navigate('/cskh');
        }}
      />
    </div>
  );
}
