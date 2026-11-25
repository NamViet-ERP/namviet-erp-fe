import { RotateCcw } from 'lucide-react';
import SearchBar from '../../../components/ui/SearchBar';
import { MATERIAL_CATEGORY_LEVELS } from '../../../constants/materialCategoryLevels';
import type { MaterialCategoryApiDto } from '../../../types/wms';

interface MaterialsFilterToolbarProps {
  filterSelection: Array<number | ''>;
  filterOptions: MaterialCategoryApiDto[][];
  categoriesLoading: boolean;
  onFilterLevelChange: (levelIndex: number, value: number | '') => void;
  search: string;
  onSearchChange: (value: string) => void;
  showInactive: boolean;
  onToggleInactive: () => void;
  onResetFilters: () => void;
}

export default function MaterialsFilterToolbar({
  filterSelection,
  filterOptions,
  categoriesLoading,
  onFilterLevelChange,
  search,
  onSearchChange,
  showInactive,
  onToggleInactive,
  onResetFilters,
}: MaterialsFilterToolbarProps) {
  return (
    <div className="hrm-list-toolbar">
      <div className="hrm-list-toolbar__filters">
        <div className="mat-catalog__filters">
          {MATERIAL_CATEGORY_LEVELS.map((lvl, idx) => (
            <label key={lvl.key} className="mat-catalog__filter-field">
              <span>{lvl.label}</span>
              <select
                className="form-input form-input-md"
                disabled={categoriesLoading || (idx > 0 && filterSelection[idx - 1] === '')}
                value={filterSelection[idx]}
                onChange={e => {
                  const v = e.target.value;
                  onFilterLevelChange(idx, v === '' ? '' : Number(v));
                }}
              >
                <option value="">- Tất cả -</option>
                {filterOptions[idx]
                  ?.filter(c => idx > 0 || c.code !== 'UNCATEGORIZED')
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mat-catalog__toolbar">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder="Tìm mã vật tư, tên vật tư..."
          />
          <button
            type="button"
            onClick={onToggleInactive}
            className={`mat-catalog__status${showInactive ? ' is-on' : ''}`}
            aria-pressed={showInactive}
          >
            {showInactive ? 'Hiện cả ngừng SD' : 'Chỉ đang dùng'}
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            className="btn btn-text"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={14} aria-hidden />
            Xóa lọc
          </button>
        </div>
      </div>
    </div>
  );
}
