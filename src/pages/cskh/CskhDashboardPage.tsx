import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmSelect from '../../components/hr/HrmSelect';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import { useCskhProject } from '../../hooks/cskh/useCskhProject';
import { cskhProjectPath } from '../../constants/cskhProject';
import { toCsv } from '../../lib/cskh/commandCenter';
import CskhAddProjectModal from './CskhAddProjectModal';
import CskhProjectKanban from './CskhProjectKanban';
import CskhProjectGrid from './CskhProjectGrid';
import CskhProgressTable from './CskhProgressTable';

type BoardView = 'kanban' | 'grid';

export default function CskhDashboardPage() {
  const navigate = useNavigate();
  const { setProjectCode } = useCskhProject();
  const { projects, kpis, years, isLoading, moveProject, addProject } = useCskhCommandCenter();
  const [view, setView] = useState<BoardView>('grid');
  const [year, setYear] = useState<'all' | number>('all');
  const [addOpen, setAddOpen] = useState(false);

  const visible = useMemo(
    () => (year === 'all' ? projects : projects.filter(p => p.year === year)),
    [projects, year],
  );

  const clientOptions = useMemo(() => {
    const names = new Set<string>();
    for (const row of projects) {
      const name = row.clientName?.trim();
      if (name && name !== '-') names.add(name);
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [projects]);

  const yearOptions = useMemo(
    () => [
      { value: 'all', label: 'Tất cả các năm' },
      ...years.map(y => ({ value: String(y), label: String(y) })),
    ],
    [years],
  );

  const openProject = (code: string) => {
    setProjectCode(code);
    navigate(cskhProjectPath(code));
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(visible)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cskh-du-an-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-stack cskh-desk">
      <PageHeader
        title="Trung tâm điều hành"
        subtitle="Bấm dự án để mở chi tiết CSKH. % kế hoạch theo ngày dự án, % thực tế theo tồn kho khi có số."
      />

      <div className="dashboard-kpi-grid cskh-desk__kpi" role="list" aria-label="Chỉ số CSKH">
        <Card
          className="cskh-desk__kpi-card"
          title="Tổng dự án"
          value={kpis.total}
          subtitle={`${kpis.onTrack} đúng/vượt · ${kpis.slight} chậm nhẹ · ${kpis.blocked} nghẽn`}
          accent="info"
        />
        <Card className="cskh-desk__kpi-card" title="Điểm nghẽn đang mở" value={kpis.bottleneckOpen} subtitle="Trên toàn bộ dự án" accent="danger" />
        <Card className="cskh-desk__kpi-card" title="Hồ sơ đang chờ" value={kpis.pendingDocs} subtitle="Cần theo dõi và xử lý" accent="warning" />
        <Card className="cskh-desk__kpi-card" title="% Kế hoạch" value={`${kpis.planAvg}%`} subtitle="Mức kế hoạch cần đạt tới hôm nay" accent="primary" />
        <Card className="cskh-desk__kpi-card" title="% Thực tế" value={`${kpis.actualAvg}%`} subtitle="Mức thực tế từ tồn kho khi có số" accent="success" />
        <Card className="cskh-desk__kpi-card" title="Bảo hành cần chú ý" value={kpis.warrantyWatch} subtitle="Sắp hết hoặc đã hết bảo hành" accent="amber" />
      </div>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">Tiến độ dự án - kế hoạch vs thực tế</h2>
            <p className="section-heading__sub mb-0">
              % Kế hoạch theo tiến độ cần đạt hôm nay. % Thực tế theo tồn kho dự án. Dự án chậm hiện lệch âm, không lấy % kế hoạch làm % thực tế.
            </p>
            <span className="cskh-desk__count">{visible.length} dự án</span>
          </div>
        </div>
        <CskhProgressTable projects={visible} loading={isLoading} onOpen={openProject} />
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">
              {view === 'grid' ? 'Danh sách dự án - bấm để vào chi tiết' : 'Dự án theo giai đoạn'}
            </h2>
            <p className="section-heading__sub mb-0">
              {view === 'grid' ? 'Thẻ tô theo đúng tiến độ, chậm nhẹ hoặc nghẽn nặng.' : 'Kéo thả thẻ giữa các cột.'}
            </p>
          </div>
          <div className="cskh-desk__board-tools">
            <label className="cskh-desk__year">
              <span className="form-label">Năm</span>
              <HrmSelect
                aria-label="Năm"
                value={year === 'all' ? 'all' : String(year)}
                options={yearOptions}
                allowEmpty={false}
                onChange={value => setYear(value === 'all' ? 'all' : Number(value))}
              />
            </label>
            <div className="cskh-desk__view" role="group" aria-label="Kiểu xem">
              <button
                type="button"
                className={`btn cskh-desk__tab ${view === 'kanban' ? 'btn-filled' : 'btn-outlined'}`}
                aria-pressed={view === 'kanban'}
                onClick={() => setView('kanban')}
              >
                Theo giai đoạn
              </button>
              <button
                type="button"
                className={`btn cskh-desk__tab ${view === 'grid' ? 'btn-filled' : 'btn-outlined'}`}
                aria-pressed={view === 'grid'}
                onClick={() => setView('grid')}
              >
                Lưới
              </button>
            </div>
            <Button type="button" variant="outlined" className="cskh-desk__tab" leftIcon={Download} onClick={exportCsv}>
              Xuất Excel
            </Button>
            <Button type="button" variant="filled" leftIcon={Plus} onClick={() => setAddOpen(true)}>
              Thêm dự án
            </Button>
          </div>
        </div>
        {view === 'kanban' ? (
          <CskhProjectKanban projects={visible} onMove={moveProject} onOpen={openProject} />
        ) : (
          <CskhProjectGrid projects={visible} loading={isLoading} onOpen={openProject} />
        )}
      </HrmPanel>

      <CskhAddProjectModal
        open={addOpen}
        existingCodes={projects.map(p => p.code)}
        clientOptions={clientOptions}
        onClose={() => setAddOpen(false)}
        onSave={addProject}
      />
    </div>
  );
}
