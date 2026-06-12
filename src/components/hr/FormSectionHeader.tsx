interface FormSectionHeaderProps {
  title: string;
  step?: number;
}

export default function FormSectionHeader({ title, step }: FormSectionHeaderProps) {
  return (
    <div className="hrm-form-section-header">
      {step !== undefined && <span className="hrm-form-section-header__step">{step}</span>}
      <h3 className="hrm-form-section-header__title">{title}</h3>
    </div>
  );
}
