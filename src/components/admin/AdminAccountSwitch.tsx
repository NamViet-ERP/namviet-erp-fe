interface AccountSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  title?: string;
}

export default function AdminAccountSwitch({ checked, disabled, onChange, title }: AccountSwitchProps) {
  return (
    <button
      type="button"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      className={`hrm-toggle-switch${checked ? ' hrm-toggle-switch--on' : ''}${disabled ? ' hrm-toggle-switch--disabled' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      title={title ?? (checked ? 'Đang bật' : 'Đang tắt')}
    >
      <span className="hrm-toggle-switch__thumb" aria-hidden />
    </button>
  );
}
