import type { ReactNode } from 'react';

/**
 * MD3 Page Header
 * Headline-medium Roboto + primary tonal eyebrow chip
 */

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '24px',
        gap: '16px',
      }}
    >
      <div>
        {eyebrow && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 12px',
              borderRadius: '9999px',
              background: 'var(--md-primary-container)',
              color: 'var(--md-on-primary-container)',
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {eyebrow}
          </span>
        )}
        <h1
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '2rem',
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            color: 'var(--md-on-surface)',
          }}
        >
          {title}
        </h1>
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
