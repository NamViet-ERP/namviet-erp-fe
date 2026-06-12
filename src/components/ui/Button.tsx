import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
  filled: 'btn-filled',
  tonal: 'btn-tonal',
  outlined: 'btn-outlined',
  text: 'btn-text',
  danger: 'btn-danger',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional leading icon. */
  leftIcon?: LucideIcon;
  /** Optional trailing icon. */
  rightIcon?: LucideIcon;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  children?: ReactNode;
}

/** Token-based button built on the `.btn` system in index.css. */
export default function Button({
  variant = 'filled',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const iconPx = size === 'sm' ? ICON_SIZE.dense : ICON_SIZE.base;
  const classes = [
    'btn',
    variantClass[variant],
    sizeClass[size],
    fullWidth ? 'btn-block' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading
        ? <Loader2 size={iconPx} className="animate-spin" />
        : LeftIcon && <LeftIcon size={iconPx} />}
      {children}
      {!loading && RightIcon && <RightIcon size={iconPx} />}
    </button>
  );
}
