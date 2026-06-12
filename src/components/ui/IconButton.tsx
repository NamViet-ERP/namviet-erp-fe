import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import type { ButtonVariant, ButtonSize } from './Button';

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

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Required for accessibility — describes the action. */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Square, icon-only button built on the `.btn` system. */
export default function IconButton({
  icon: Icon,
  variant = 'text',
  size = 'md',
  className = '',
  ...rest
}: IconButtonProps) {
  const iconPx = size === 'sm' ? ICON_SIZE.base : ICON_SIZE.action;
  const classes = [
    'btn',
    'btn-icon',
    variantClass[variant],
    sizeClass[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...rest}>
      <Icon size={iconPx} />
    </button>
  );
}
