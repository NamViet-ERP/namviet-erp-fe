import { Search, RefreshCw } from 'lucide-react';

export default function SearchBar({ value, onChange, onRefresh, placeholder = 'Tìm kiếm...' }) {
  return (
    <div className="flex items-center gap-2">
      {onRefresh && (
        <button onClick={onRefresh} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-navy-500 transition-colors" title="Làm mới">
          <RefreshCw size={16} />
        </button>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="form-input pl-9 w-56"
        />
      </div>
    </div>
  );
}
