interface FormSectionHeaderProps {
  title: string;
  step?: number;
  style?: React.CSSProperties;
}

export default function FormSectionHeader({ title, step, style }: FormSectionHeaderProps) {
  return (
    <div className="hrm-form-section-header" style={style}>
      {step !== undefined && <span className="hrm-form-section-header__step">{step}</span>}
      <h3 className="hrm-form-section-header__title">{title}</h3>
    </div>
  );
}
