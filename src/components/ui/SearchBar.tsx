import { Search, RefreshCw } from 'lucide-react';

/**
 * MD3 Search / Filled Text Field style
 * Surface-container-low bg · Rounded top · Border-bottom focus
 */

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, onRefresh, placeholder = 'Tìm kiếm...' }: SearchBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
      {onRefresh && (
        <button
          onClick={onRefresh}
          title="Làm mới"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-on-surface-variant)',
            cursor: 'pointer',
            transition: 'background 200ms var(--md-easing)',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--tint-primary-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <RefreshCw size={18} />
        </button>
      )}
      <div style={{ position: 'relative', minWidth: '220px' }}>
        <Search
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--md-on-surface-variant)',
            pointerEvents: 'none',
          }}
          size={16}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="form-input-compact"
          style={{ paddingLeft: '40px', width: '100%' }}
        />
      </div>
    </div>
  );
}
