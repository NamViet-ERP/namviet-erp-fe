import { Search, RefreshCw } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  placeholder?: string;
  /** Ẩn placeholder trên UI — vẫn giữ aria-label cho accessibility */
  hidePlaceholder?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  onRefresh,
  placeholder = 'Tìm kiếm...',
  hidePlaceholder = false,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      {onRefresh && (
        <button type="button" onClick={onRefresh} title="Làm mới" className="search-bar__refresh">
          <RefreshCw size={18} />
        </button>
      )}
      <div className="search-bar__wrap">
        <Search className="search-bar__icon" size={16} aria-hidden />
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={hidePlaceholder ? '' : placeholder}
          aria-label={placeholder}
          className="search-bar__input form-input-compact"
        />
      </div>
    </div>
  );
}
