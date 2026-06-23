export interface IOSSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  title?: string;
  /** Prevent click from bubbling — use inside clickable table rows. */
  stopPropagation?: boolean;
}

export default function IOSSwitch({
  checked,
  disabled,
  onChange,
  title,
  stopPropagation = false,
}: IOSSwitchProps) {
  return (
    <button
      type="button"
      onClick={e => {
        if (stopPropagation) e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[var(--md-primary)]' : 'switch-track-off bg-[var(--md-outline)]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={checked}
      title={title ?? (checked ? 'Đang bật' : 'Đang tắt')}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full switch-thumb shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
