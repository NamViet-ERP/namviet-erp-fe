import { NavLink } from 'react-router-dom';
import {
  CSKH_PROJECT_TABS,
  cskhProjectPath,
  type CskhProjectTabId,
} from '../../constants/cskhProject';

interface CskhPipelineStepsProps {
  code: string;
  current: CskhProjectTabId;
}

export default function CskhPipelineSteps({ code, current }: CskhPipelineStepsProps) {
  const currentMeta = CSKH_PROJECT_TABS.find((t) => t.id === current);
  if (!currentMeta) return null;

  const steps = CSKH_PROJECT_TABS.filter((tab) => tab.group === currentMeta.group);

  if (steps.length <= 1) return null;

  return (
    <nav className="cskh-pipe" aria-label={`Pipeline - ${steps.length} bước`}>
      {steps.map((tab, index) => (
        <NavLink
          key={tab.id}
          to={cskhProjectPath(code, tab.id)}
          className={`cskh-pipe__step${current === tab.id ? ' is-active' : ''}`}
        >
          <span className="cskh-pipe__num">{index + 1}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
