interface FormSectionHeaderProps {
  title: string;
  step?: number;
  className?: string;
}

export default function FormSectionHeader({ title, step, className = '' }: FormSectionHeaderProps) {
  return (
    <div className={`hrm-form-section-header${className ? ` ${className}` : ''}`}>
      {step !== undefined && <span className="hrm-form-section-header__step">{step}</span>}
      <h3 className="hrm-form-section-header__title">{title}</h3>
    </div>
  );
}
