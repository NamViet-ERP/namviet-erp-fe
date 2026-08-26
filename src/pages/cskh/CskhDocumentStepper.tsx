import { NavLink } from 'react-router-dom';
import { CSKH_DOCUMENT_STEPS } from '../../constants/cskh';

export default function CskhDocumentStepper() {
  return (
    <nav className="cskh-stepper" aria-label="Pipeline hồ sơ CĐT">
      {CSKH_DOCUMENT_STEPS.map((step, index) => (
        <NavLink
          key={step.id}
          to={step.path}
          className={({ isActive }) => `cskh-stepper__step${isActive ? ' is-active' : ''}`}
        >
          <span className="cskh-stepper__num" aria-hidden>{index + 1}</span>
          <span className="cskh-stepper__label">{step.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
