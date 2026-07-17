import { Clock } from 'lucide-react';

interface HrmTimeInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function HrmTimeInput({
  value = '',
  onChange,
  disabled,
  className = '',
  placeholder = 'Chọn giờ',
}: HrmTimeInputProps) {
  return (
    <div className={`hrm-time-input ${className}`.trim()}>
      <input
        type="time"
        className="hrm-time-input__control hrm-field-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Chọn giờ"
      />
      <Clock size={18} className="hrm-time-input__icon" aria-hidden />
    </div>
  );
}
