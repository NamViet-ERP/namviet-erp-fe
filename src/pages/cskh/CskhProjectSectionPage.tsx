import { useParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import EmptyState from '../../components/ui/EmptyState';
import { useCskhCommandCenter } from '../../hooks/cskh/useCskhCommandCenter';
import {
  cskhProjectTabMeta,
  isCskhProjectTab,
} from '../../constants/cskhProject';
import CskhProjectMissing from './CskhProjectMissing';
import CskhDocsDraftPage from './CskhDocsDraftPage';
import CskhDocsHandoverPage from './CskhDocsHandoverPage';
import CskhDocsFeedbackPage from './CskhDocsFeedbackPage';
import CskhDocsArchivePage from './CskhDocsArchivePage';
import CskhBottlenecksPage from './CskhBottlenecksPage';
import CskhRequestsPage from './CskhRequestsPage';
import CskhGanttPage from './CskhGanttPage';
import CskhMeetingsPage from './CskhMeetingsPage';

export default function CskhProjectSectionPage() {
  const { code = '', tab } = useParams<{ code: string; tab: string }>();
  const { getProject, isLoading } = useCskhCommandCenter();
  const project = getProject(code);

  if (!isCskhProjectTab(tab) || tab === 'dashboard') {
    return <CskhProjectMissing loading={false} />;
  }

  if (!project) return <CskhProjectMissing loading={isLoading} />;

  if (tab === 'docs-draft') return <CskhDocsDraftPage project={project} />;
  if (tab === 'docs-handover') return <CskhDocsHandoverPage project={project} />;
  if (tab === 'docs-feedback') return <CskhDocsFeedbackPage project={project} />;
  if (tab === 'docs-archive') return <CskhDocsArchivePage project={project} />;
  if (tab === 'bottlenecks') return <CskhBottlenecksPage project={project} />;
  if (tab === 'requests') return <CskhRequestsPage project={project} />;
  if (tab === 'gantt') return <CskhGanttPage project={project} />;
  if (tab === 'meetings') return <CskhMeetingsPage project={project} />;

  const meta = cskhProjectTabMeta(tab);

  return (
    <div className="page-stack cskh-desk">
      <PageHeader
        title={meta.title}
        subtitle={`${project.code} - ${project.name}. ${meta.subtitle}`}
      />
      <HrmPanel className="cskh-desk__panel">
        <EmptyState icon={meta.icon} message={meta.empty} />
      </HrmPanel>
    </div>
  );
}
