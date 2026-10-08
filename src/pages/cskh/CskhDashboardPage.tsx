import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Kanban, LayoutGrid, Plus, Search, Table } from 'lucide-react';
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
import CskhEditProjectModal from './CskhEditProjectModal';
import CskhProjectKanban from './CskhProjectKanban';
import CskhProjectGrid from './CskhProjectGrid';
import CskhProgressTable from './CskhProgressTable';

type BoardView = 'table' | 'grid' | 'kanban';

export default function CskhDashboardPage() {
  const navigate = useNavigate();
  const { setProjectCode } = useCskhProject();
  const {
    projects,
    kpis,
    years,
    isLoading,
    moveProject,
    addProject,
    getProject,
    patchProject,
    deleteProject,
  } = useCskhCommandCenter();
  const [view, setView] = useState<BoardView>('table');
  const [year, setYear] = useState<'all' | number>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editingProjectCode, setEditingProjectCode] = useState<string | null>(null);

  const editingProject = editingProjectCode ? getProject(editingProjectCode) : null;

  const filtered = useMemo(() => {
    let list = year === 'all' ? projects : projects.filter(p => p.year === year);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(p =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.clientName && p.clientName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [projects, year, searchTerm]);

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
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
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
        subtitle="Giám sát tiến độ kế hoạch vs thực tế và điều hành các dự án CSKH toàn hệ thống."
      />

      <div className="dashboard-kpi-grid cskh-desk__kpi" role="list" aria-label="Chỉ số CSKH">
        <Card
          className="cskh-desk__kpi-card"
          title="Tổng dự án"
          value={kpis.total}
          subtitle={`${kpis.onTrack} đúng/vượt · ${kpis.slight} chậm nhẹ · ${kpis.blocked} nghẽn`}
          accent="info"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Điểm nghẽn đang mở"
          value={kpis.bottleneckOpen}
          subtitle="Trên toàn bộ dự án"
          accent="danger"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Hồ sơ đang chờ"
          value={kpis.pendingDocs}
          subtitle="Cần theo dõi và xử lý"
          accent="warning"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="% Kế hoạch"
          value={`${kpis.planAvg}%`}
          subtitle="Mức kế hoạch cần đạt tới hôm nay"
          accent="primary"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="% Thực tế"
          value={`${kpis.actualAvg}%`}
          subtitle="Mức thực tế từ tồn kho khi có số"
          accent="success"
        />
        <Card
          className="cskh-desk__kpi-card"
          title="Bảo hành cần chú ý"
          value={kpis.warrantyWatch}
          subtitle="Sắp hết hoặc đã hết bảo hành"
          accent="amber"
        />
      </div>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">Danh sách dự án</h2>
            <p className="section-heading__sub mb-0">
              % Kế hoạch theo tiến độ cần đạt hôm nay. % Thực tế đối soát từ tồn kho vật tư.
            </p>
            <span className="cskh-desk__count">{filtered.length} dự án</span>
          </div>

          <div className="cskh-desk__board-tools">
            <div className="cskh-desk__search">
              <Search size={14} className="cskh-desk__search-icon" aria-hidden />
              <input
                type="text"
                className="cskh-desk__search-input"
                placeholder="Tìm mã, tên dự án, CĐT..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

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
                className={`cskh-desk__tab inline-flex items-center gap-1.5 ${view === 'table' ? 'is-active' : ''}`}
                aria-pressed={view === 'table'}
                onClick={() => setView('table')}
              >
                <Table size={14} aria-hidden />
                Bảng
              </button>
              <button
                type="button"
                className={`cskh-desk__tab inline-flex items-center gap-1.5 ${view === 'grid' ? 'is-active' : ''}`}
                aria-pressed={view === 'grid'}
                onClick={() => setView('grid')}
              >
                <LayoutGrid size={14} aria-hidden />
                Lưới
              </button>
              <button
                type="button"
                className={`cskh-desk__tab inline-flex items-center gap-1.5 ${view === 'kanban' ? 'is-active' : ''}`}
                aria-pressed={view === 'kanban'}
                onClick={() => setView('kanban')}
              >
                <Kanban size={14} aria-hidden />
                Giai đoạn
              </button>
            </div>

            <Button type="button" variant="outlined" leftIcon={Download} onClick={exportCsv}>
              Xuất Excel
            </Button>
            <Button type="button" variant="filled" leftIcon={Plus} onClick={() => setAddOpen(true)}>
              Thêm dự án
            </Button>
          </div>
        </div>

        {view === 'table' ? (
          <CskhProgressTable
            projects={filtered}
            loading={isLoading}
            onOpen={openProject}
            onEdit={code => setEditingProjectCode(code)}
          />
        ) : view === 'grid' ? (
          <CskhProjectGrid projects={filtered} loading={isLoading} onOpen={openProject} />
        ) : (
          <CskhProjectKanban projects={filtered} onMove={moveProject} onOpen={openProject} />
        )}
      </HrmPanel>

      <CskhAddProjectModal
        open={addOpen}
        existingCodes={projects.map(p => p.code)}
        clientOptions={clientOptions}
        onClose={() => setAddOpen(false)}
        onSave={addProject}
      />

      {editingProject && (
        <CskhEditProjectModal
          open={Boolean(editingProject)}
          project={editingProject}
          clientOptions={clientOptions}
          onClose={() => setEditingProjectCode(null)}
          onSave={patch => {
            if (editingProjectCode) patchProject(editingProjectCode, patch);
          }}
          onDelete={code => {
            deleteProject(code);
            setEditingProjectCode(null);
          }}
        />
      )}
    </div>
  );
}
