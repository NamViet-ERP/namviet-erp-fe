import type { TabItem } from '../../types';

/**
 * MD3 Primary Tabs
 * Active: primary indicator underline + primary text
 * Inactive: on-surface-variant text, state layer hover
 */

interface TabFilterProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function TabFilter({ tabs, activeTab, onChange }: TabFilterProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        borderBottom: '1px solid var(--md-outline-variant)',
        marginBottom: '16px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.875rem',
              fontWeight: isActive ? 500 : 400,
              letterSpacing: '0.01em',
              cursor: 'pointer',
              transition: 'color 200ms var(--md-easing), background 200ms var(--md-easing)',
              borderRadius: '0',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--tint-primary-hover)';
                e.currentTarget.style.color = 'var(--md-on-surface)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--md-on-surface-variant)';
              }
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  background: isActive ? 'var(--md-secondary-container)' : 'var(--md-surface-variant)',
                  color: isActive ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  transition: 'background 200ms, color 200ms',
                }}
              >
                {tab.count}
              </span>
            )}
            {/* Active indicator */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'var(--md-primary)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
