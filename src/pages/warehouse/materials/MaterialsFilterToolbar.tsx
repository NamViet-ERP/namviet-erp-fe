import { RotateCcw } from 'lucide-react';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/ui/SearchBar';
import { MATERIAL_CATEGORY_LEVELS } from '../../../constants/materialCategoryLevels';
import type { MaterialStatusFilter } from '../../../services/materialsService';
import type { MaterialCategoryApiDto } from '../../../types/wms';

const STATUS_OPTIONS: Array<{ value: MaterialStatusFilter; label: string }> = [
  { value: 'active', label: 'Đang dùng' },
  { value: 'inactive', label: 'Ngừng sử dụng' },
  { value: 'all', label: 'Tất cả' },
];

interface MaterialsFilterToolbarProps {
  filterSelection: Array<number | ''>;
  filterOptions: MaterialCategoryApiDto[][];
  categoriesLoading: boolean;
  onFilterLevelChange: (levelIndex: number, value: number | '') => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: MaterialStatusFilter;
  onStatusFilterChange: (next: MaterialStatusFilter) => void;
  onResetFilters: () => void;
}

export default function MaterialsFilterToolbar({
  filterSelection,
  filterOptions,
  categoriesLoading,
  onFilterLevelChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
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
                aria-label={lvl.label}
                className="form-select"
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
          <div
            role="group"
            aria-label="Trạng thái sử dụng vật tư"
            className="mat-catalog__status-group"
          >
            {STATUS_OPTIONS.map(opt => {
              const isActive = statusFilter === opt.value;
              const classes = [
                'mat-catalog__status-opt',
                opt.value === 'inactive' ? 'mat-catalog__status-opt--inactive' : '',
                isActive ? 'is-active' : '',
                'whitespace-nowrap',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onStatusFilterChange(opt.value)}
                  className={classes}
                  aria-pressed={isActive}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="text"
            leftIcon={RotateCcw}
            onClick={onResetFilters}
            title="Đặt lại bộ lọc"
          >
            Xóa lọc
          </Button>
        </div>
      </div>
    </div>
  );
}
