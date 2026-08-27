import { NavLink } from 'react-router-dom';
import {
  CSKH_PROJECT_TABS,
  cskhProjectPath,
  type CskhProjectTabId,
} from '../../constants/cskhProject';

const STEPS = CSKH_PROJECT_TABS.filter(tab => tab.group === 'ops');

interface CskhPipelineStepsProps {
  code: string;
  current: CskhProjectTabId;
}

export default function CskhPipelineSteps({ code, current }: CskhPipelineStepsProps) {
  return (
    <nav className="cskh-pipe" aria-label="Pipeline hồ sơ - 4 bước">
      {STEPS.map((tab, index) => (
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
