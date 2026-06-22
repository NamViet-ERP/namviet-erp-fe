interface QtyStepperProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  onRequestAboveMax?: () => void;
  className?: string;
}

export default function QtyStepper({
  value,
  onChange,
  min = 0,
  max,
  onRequestAboveMax,
  className = '',
}: QtyStepperProps) {
  const n = Number(value) || 0;

  const applyValue = (raw: number) => {
    let next = Math.max(min, raw);
    if (max !== undefined && next > max) {
      const overflow = next - max;
      next = max;
      onChange(String(next));
      if (overflow > 0) onRequestAboveMax?.();
      return;
    }
    onChange(String(next));
  };

  const bump = (delta: number) => {
    if (delta > 0 && max !== undefined && n >= max) {
      onRequestAboveMax?.();
      return;
    }
    applyValue(n + delta);
  };

  return (
    <div className={`qty-stepper ${className}`.trim()}>
      <button
        type="button"
        className="qty-stepper__btn"
        aria-label="Giảm số lượng"
        onClick={() => bump(-1)}
        disabled={n <= min}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        inputMode="numeric"
        className="qty-stepper__input"
        value={value}
        onChange={e => applyValue(Number(e.target.value) || 0)}
      />
      <button
        type="button"
        className="qty-stepper__btn"
        aria-label="Tăng số lượng"
        onClick={() => bump(1)}
        disabled={max !== undefined && n >= max}
      >
        +
      </button>
    </div>
  );
}
