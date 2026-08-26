import { Outlet, useLocation } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import { useProjects } from '../../hooks/useProjects';
import { useCskhProject } from '../../hooks/cskh/useCskhProject';
import CskhDocumentStepper from './CskhDocumentStepper';

export default function CskhLayout() {
  const location = useLocation();
  const { projectCode, setProjectCode } = useCskhProject();
  const { data } = useProjects({ page: 1, pageSize: 200 });
  const projects = data?.items ?? [];
  const showStepper = location.pathname.startsWith('/cskh/documents/');

  return (
    <div className="page-shell cskh-shell">
      <div className="cskh-toolbar">
        <FormField label="Dự án đang làm">
          <ProjectAutocomplete
            value={projectCode}
            onChange={setProjectCode}
            projects={projects}
            placeholder="Chọn dự án để làm việc"
          />
        </FormField>
      </div>
      {showStepper ? <CskhDocumentStepper /> : null}
      <Outlet context={{ projectCode, projects }} />
    </div>
  );
}
