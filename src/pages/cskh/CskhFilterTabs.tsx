export type CskhFilterTone = 'navy' | 'info' | 'danger' | 'warn' | 'ok' | 'muted';

export interface CskhFilterOption<T extends string> {
  id: T;
  label: string;
  tone?: CskhFilterTone;
}

interface CskhFilterTabsProps<T extends string> {
  value: T;
  options: CskhFilterOption<T>[];
  onChange: (id: T) => void;
  label: string;
}

export default function CskhFilterTabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: CskhFilterTabsProps<T>) {
  return (
    <div className="cskh-desk__view" role="group" aria-label={label}>
      {options.map(item => {
        const tone = item.tone ?? 'navy';
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`btn btn-outlined cskh-desk__tab cskh-desk__tab--${tone}${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
