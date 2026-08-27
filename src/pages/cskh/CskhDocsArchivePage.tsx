import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import HrmPanel from '../../components/hr/HrmPanel';
import EmptyState from '../../components/ui/EmptyState';
import { isoToDisplay } from '../../lib/dates';
import { useCskhDocsPipeline } from '../../hooks/cskh/useCskhDocsPipeline';
import { cskhProjectPath, cskhProjectTabMeta } from '../../constants/cskhProject';
import {
  archiveKpis,
  filterArchive,
  stageLabel,
  type CskhArchiveFilter,
} from '../../lib/cskh/docsPipeline';
import { progressStatusCopy, progressStatus } from '../../lib/cskh/commandCenter';
import CskhPipelineSteps from './CskhPipelineSteps';
import CskhFilterTabs, { type CskhFilterOption } from './CskhFilterTabs';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhDocsArchivePageProps {
  project: CskhProjectRecord;
}

const FILTERS: CskhFilterOption<CskhArchiveFilter>[] = [
  { id: 'all', label: 'Tất cả', tone: 'navy' },
  { id: 'valid', label: 'Hiệu lực', tone: 'ok' },
  { id: 'pending', label: 'Chờ ký', tone: 'warn' },
  { id: 'expired', label: 'Hết hạn', tone: 'danger' },
];

export default function CskhDocsArchivePage({ project }: CskhDocsArchivePageProps) {
  const meta = cskhProjectTabMeta('docs-archive');
  const navigate = useNavigate();
  const { docs } = useCskhDocsPipeline(project.code);
  const kpis = archiveKpis(docs.drafts);
  const [filter, setFilter] = useState<CskhArchiveFilter>('all');
  const rows = filterArchive(docs.drafts, filter);
  const blocked = project.bottleneckCount > 0;
  const status = progressStatus(project);

  return (
    <div className="page-stack cskh-desk">
      <PageHeader title={meta.title} subtitle={`${project.code} - ${meta.subtitle}`} />
      <CskhPipelineSteps code={project.code} current="docs-archive" />

      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số lưu trữ">
        <Card className="cskh-desk__kpi-card" title="Tổng hồ sơ lưu trữ" value={kpis.total} subtitle="Hợp đồng, phụ lục, biên bản" accent="info" />
        <Card className="cskh-desk__kpi-card" title="Hồ sơ hiệu lực" value={kpis.valid} subtitle="Đã vào lưu trữ chính thức" accent="success" />
        <Card className="cskh-desk__kpi-card" title="Chờ ký / bổ sung" value={kpis.pending} subtitle="Còn khâu trình ký" accent="warning" />
        <Card className="cskh-desk__kpi-card" title="Sắp hết hạn" value={kpis.expiring} subtitle="Quá hạn xác nhận, chưa lưu" accent="danger" />
      </div>

      {blocked ? (
        <div className="cskh-alert" role="status">
          <div>
            <p className="cskh-alert__title">Dự án này đang có {project.bottleneckCount} điểm nghẽn mở</p>
            <p className="cskh-alert__body">
              {progressStatusCopy(status).label}. Xem chi tiết trên tab Điểm nghẽn và tiến độ.
            </p>
          </div>
          <Button
            type="button"
            variant="text"
            onClick={() => navigate(cskhProjectPath(project.code, 'bottlenecks'))}
          >
            Xem điểm nghẽn
          </Button>
        </div>
      ) : null}

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head">
          <div>
            <h2 className="section-heading__title m-0">Hợp đồng và mốc thanh toán</h2>
            <p className="section-heading__sub mb-0">Theo dõi giá trị, ngày ký và mốc thanh toán khi đã nhập hợp đồng.</p>
          </div>
        </div>
        <div className="wms-inventory-table-wrap cskh-desk__table">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell">Mã HĐ</th>
                <th className="table-header-cell">Giá trị / Ngày ký</th>
                <th className="table-header-cell">Mốc hạng mục</th>
                <th className="table-header-cell">Thanh toán</th>
                <th className="table-header-cell">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={Archive} message="Chưa có hợp đồng trên dự án này." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </HrmPanel>

      <HrmPanel className="cskh-desk__panel">
        <div className="cskh-desk__section-head cskh-desk__section-head--stack">
          <div>
            <h2 className="section-heading__title m-0">Hồ sơ và biên bản</h2>
            <p className="section-heading__sub mb-0">Hồ sơ đã ký, đã gửi hoặc đã đưa vào lưu trữ từ bước soạn duyệt.</p>
          </div>
          <div className="cskh-desk__toolbar">
            <CskhFilterTabs value={filter} options={FILTERS} onChange={setFilter} label="Lọc hồ sơ lưu trữ" />
          </div>
        </div>
        <div className="wms-inventory-table-wrap cskh-desk__table">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell">Hồ sơ</th>
                <th className="table-header-cell">Loại</th>
                <th className="table-header-cell">Hạn xác nhận</th>
                <th className="table-header-cell">Người soạn</th>
                <th className="table-header-cell">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon={Archive} message="Chưa có hồ sơ khớp bộ lọc." />
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} className="table-row">
                    <td className="table-cell">{row.name}</td>
                    <td className="table-cell">{docs.processes.find(item => item.id === row.processId)?.name ?? '-'}</td>
                    <td className="table-cell">{isoToDisplay(row.confirmDeadline) || '-'}</td>
                    <td className="table-cell">{row.author}</td>
                    <td className="table-cell">
                      <span className={`cskh-status ${row.stage === 'archive' ? 'cskh-status--ok' : 'cskh-status--warn'}`}>
                        <span className="cskh-status__dot" aria-hidden />
                        {stageLabel(row.stage)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </HrmPanel>
    </div>
  );
}
