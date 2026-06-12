import type { CSSProperties } from 'react';

type SkeletonVariant = 'text' | 'rect' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  /** Render multiple stacked lines (useful for text blocks). */
  count?: number;
  className?: string;
  style?: CSSProperties;
}

const radiusByVariant: Record<SkeletonVariant, string> = {
  text: '6px',
  rect: '12px',
  circle: '9999px',
};

/** Animated loading placeholder. Pair with EmptyState for full list states. */
export default function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style,
}: SkeletonProps) {
  const baseStyle: CSSProperties = {
    width: width ?? (variant === 'circle' ? 40 : '100%'),
    height: height ?? (variant === 'text' ? '1em' : variant === 'circle' ? 40 : 80),
    borderRadius: radiusByVariant[variant],
    ...style,
  };

  if (count > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${className}`}
            style={{ ...baseStyle, width: i === count - 1 ? '70%' : baseStyle.width }}
          />
        ))}
      </div>
    );
  }

  return <div className={`skeleton ${className}`} style={baseStyle} />;
}

/** Convenience: a skeleton table-row matching the app's list layouts. */
export function SkeletonRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === 0 ? '20%' : `${Math.max(10, 30 - i * 4)}%`} />
      ))}
    </div>
  );
}
