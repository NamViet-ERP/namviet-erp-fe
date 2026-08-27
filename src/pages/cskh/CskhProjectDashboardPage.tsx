import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import { showToast } from '../../components/ui/Toast';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import { cskhProjectPath } from '../../constants/cskhProject';
import { isoToDisplay } from '../../lib/dates';
import {
  formatSignedPct,
  phaseLabel,
  progressDelta,
  progressStatus,
  progressStatusCopy,
  progressTone,
  type CskhProjectRecord,
} from '../../lib/cskh/commandCenter';
import CskhProjectMissing from './CskhProjectMissing';

function displayText(value?: string | null): string {
  const text = value?.trim() ?? '';
  if (!text || text === '-') return '';
  return text;
}

function warrantyCopy(project: CskhProjectRecord): string {
  if (!project.acceptanceDate) return 'Chưa nghiệm thu';
  if (project.warrantyMonths != null) return `${project.warrantyMonths} tháng`;
  return 'Chưa đặt thời hạn';
}

function parseWarrantyMonths(raw: string): { value: number | null; error?: string } {
  const text = raw.trim();
  if (!text) return { value: null };
  const months = Number.parseInt(text, 10);
  if (!Number.isFinite(months) || String(months) !== text || months < 0 || months > 360) {
    return { value: null, error: 'Nhập số tháng từ 0 đến 360.' };
  }
  return { value: months };
}

export default function CskhProjectDashboardPage() {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { getProject, patchProject, isLoading } = useCskhCommandCenter();
  const { store: master } = useCskhMasterData();
  const project = getProject(code);

  const [editingAcceptance, setEditingAcceptance] = useState(false);
  const [acceptanceDate, setAcceptanceDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [warrantyError, setWarrantyError] = useState('');

  useEffect(() => {
    if (!project) return;
    setAcceptanceDate(project.acceptanceDate ?? '');
    setWarrantyMonths(project.warrantyMonths != null ? String(project.warrantyMonths) : '');
    setWarrantyError('');
  }, [project?.acceptanceDate, project?.code, project?.warrantyMonths]);

  if (!project) return <CskhProjectMissing loading={isLoading} />;

  const status = progressStatus(project);
  const tone = progressTone(status);
  const statusCopy = progressStatusCopy(status);
  const delta = progressDelta(project.planPct, project.actualPct);
  const currentPhase = phaseLabel(project.phaseId, master.phases);
  const clientName = displayText(project.clientName);
  const picName = displayText(project.pmName);
  const startLabel = isoToDisplay(project.startDate) || '-';
  const acceptanceLabel = isoToDisplay(project.acceptanceDate) || 'Chưa nghiệm thu';
  const progressAccent = status === 'blocked' ? 'danger' : status === 'slight_delay' ? 'warning' : 'success';
  const toneFill = tone === 'danger' ? 'var(--md-error)' : tone === 'warn' ? 'var(--nv-amber)' : 'var(--md-success)';
  const identity = [clientName ? `CĐT: ${clientName}` : '', picName ? `PIC: ${picName}` : '']
    .filter(Boolean)
    .join(' · ');

  const cancelAcceptance = () => {
    setAcceptanceDate(project.acceptanceDate ?? '');
    setWarrantyMonths(project.warrantyMonths != null ? String(project.warrantyMonths) : '');
    setWarrantyError('');
    setEditingAcceptance(false);
  };

  const saveAcceptance = () => {
    const parsed = parseWarrantyMonths(warrantyMonths);
    if (parsed.error) {
      setWarrantyError(parsed.error);
      return;
    }
    setWarrantyError('');
    patchProject(project.code, {
      acceptanceDate: acceptanceDate || null,
      warrantyMonths: parsed.value,
    });
    setEditingAcceptance(false);
    showToast('success', 'Đã lưu nghiệm thu và bảo hành.');
  };

  return (
    <div className="page-stack cskh-desk">
      <PageHeader
        title="Dashboard dự án"
        subtitle="Tổng quan tiến độ, điểm nghẽn và hồ sơ của dự án đang chọn."
      />

      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số dự án">
        <Card
          className="cskh-desk__kpi-card"
          title="Tiến độ dự án"
          value={`${project.actualPct}%`}
          subtitle={`KH hôm nay ${project.planPct}% · TT ${project.actualPct}% · ${formatSignedPct(delta)}`}
          accent={progressAccent}
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Điểm nghẽn khẩn cấp"
          value={project.bottleneckCount}
          subtitle={`${project.bottleneckCount} điểm nghẽn đang mở`}
          accent="danger"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Hồ sơ quá hạn phản hồi"
          value={project.pendingDocs}
          subtitle={`${project.pendingDocs} hồ sơ đang theo dõi`}
          accent="warning"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Hồ sơ chưa xác nhận nhận"
          value={0}
          subtitle="Rủi ro thất lạc hồ sơ"
          accent="teal"
        />
      </div>

      <div className="cskh-project__body">
        <HrmPanel className="cskh-desk__panel">
          <div className="cskh-desk__section-head">
            <div>
              <h2 className="section-heading__title m-0">{project.code}</h2>
              <p className="section-heading__sub mb-0">{project.name}{identity ? ` · ${identity}` : ''}</p>
            </div>
            <Button
              type="button"
              variant="text"
              onClick={() => navigate(cskhProjectPath(project.code, 'gantt'))}
            >
              Xem Gantt
            </Button>
          </div>

          <dl className="cskh-fact-list">
            <div className="cskh-fact-list__row">
              <dt>Giai đoạn hiện tại</dt>
              <dd>{currentPhase}</dd>
            </div>
            <div className="cskh-fact-list__row">
              <dt>Trạng thái</dt>
              <dd>
                <span className={`cskh-status cskh-status--${tone}`}>
                  <span className="cskh-status__dot" aria-hidden />
                  {statusCopy.label}
                </span>
              </dd>
            </div>
            <div className="cskh-fact-list__row">
              <dt>Tiến độ kế hoạch</dt>
              <dd>
                <div className="cskh-meter">
                  <span className="tabular-nums">{project.planPct}%</span>
                  <div
                    className="cskh-grid-card__bar"
                    style={{ '--cskh-tt': `${project.planPct}%`, '--cskh-tone': 'var(--nv-navy)' } as CSSProperties}
                  >
                    <span className="cskh-grid-card__bar-fill" />
                  </div>
                </div>
              </dd>
            </div>
            <div className="cskh-fact-list__row">
              <dt>Tiến độ thực tế</dt>
              <dd>
                <div className="cskh-meter">
                  <span className={`tabular-nums cskh-tone-${tone}`}>{project.actualPct}%</span>
                  <div
                    className="cskh-grid-card__bar"
                    style={{ '--cskh-tt': `${project.actualPct}%`, '--cskh-tone': toneFill } as CSSProperties}
                  >
                    <span className="cskh-grid-card__bar-fill" />
                  </div>
                </div>
              </dd>
            </div>
            <div className="cskh-fact-list__row">
              <dt>Chênh lệch KH - TT</dt>
              <dd className={`tabular-nums cskh-tone-${tone}`}>{formatSignedPct(delta)}</dd>
            </div>
            <div className="cskh-fact-list__row">
              <dt>Ngày khởi công</dt>
              <dd>{startLabel}</dd>
            </div>
            <div className="cskh-fact-list__row">
              <dt>Ngày ký nghiệm thu</dt>
              <dd>
                <div className="cskh-fact-list__value">
                  <span>{acceptanceLabel}</span>
                  <Button
                    type="button"
                    variant="outlined"
                    size="sm"
                    leftIcon={Plus}
                    aria-expanded={editingAcceptance}
                    onClick={() => setEditingAcceptance(true)}
                  >
                    Cập nhật
                  </Button>
                </div>
              </dd>
            </div>
            <div className="cskh-fact-list__row">
              <dt>Bảo hành</dt>
              <dd>{warrantyCopy(project)}</dd>
            </div>
          </dl>

          {editingAcceptance ? (
            <div className="cskh-inline-form" role="region" aria-label="Cập nhật nghiệm thu và bảo hành">
              <div className="cskh-inline-form__grid">
                <FormField label="Ngày ký nghiệm thu">
                  <HrmDatePicker
                    value={acceptanceDate}
                    onChange={setAcceptanceDate}
                    placeholder="dd/mm/yyyy"
                  />
                </FormField>
                <FormField label="Thời gian bảo hành (tháng)" error={warrantyError}>
                  <input
                    className="form-input"
                    inputMode="numeric"
                    value={warrantyMonths}
                    onChange={event => {
                      setWarrantyMonths(event.target.value);
                      if (warrantyError) setWarrantyError('');
                    }}
                    autoComplete="off"
                  />
                </FormField>
              </div>
              <div className="cskh-inline-form__actions">
                <Button type="button" variant="outlined" onClick={cancelAcceptance}>Hủy</Button>
                <Button type="button" variant="filled" onClick={saveAcceptance}>Lưu</Button>
              </div>
            </div>
          ) : null}
        </HrmPanel>

        <div className="cskh-project__aside">
          <HrmPanel className="cskh-desk__panel">
            <h2 className="section-heading__title m-0">Điểm nóng cần xử lý</h2>
            <p className={`cskh-callout${project.bottleneckCount > 0 ? ' cskh-callout--warn' : ''}`}>
              {project.bottleneckCount > 0
                ? `${project.bottleneckCount} điểm nghẽn đang mở.`
                : 'Không có điểm nghẽn đang mở.'}
            </p>
          </HrmPanel>
          <HrmPanel className="cskh-desk__panel">
            <h2 className="section-heading__title m-0">Hồ sơ sắp đến hạn tái trình</h2>
            <p className={`cskh-callout${project.pendingDocs > 0 ? ' cskh-callout--warn' : ''}`}>
              {project.pendingDocs > 0
                ? `${project.pendingDocs} hồ sơ đang theo dõi.`
                : 'Không có hồ sơ đang chờ.'}
            </p>
          </HrmPanel>
        </div>
      </div>
    </div>
  );
}
