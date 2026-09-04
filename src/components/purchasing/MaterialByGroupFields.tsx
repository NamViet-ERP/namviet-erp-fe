import FormField from '../ui/FormField';
import HrmSelect from '../hr/HrmSelect';
import MaterialAutocomplete from '../ui/MaterialAutocomplete';
import type { MaterialApiDto } from '../../services/materialsService';

// Helpers colocated with the field component for shared form usage
// eslint-disable-next-line react-refresh/only-export-components
export function categoryOptionLabel(c: { code: string; name: string }) {
  return `${c.code} - ${c.name}`;
}

// eslint-disable-next-line react-refresh/only-export-components
export function rootCategoryIdOf(
  categoryId: number | null | undefined,
  categories: Array<{ id: number; parentId?: number | null }>,
): number | '' {
  if (!categoryId) return '';
  const byId = new Map(categories.map(c => [c.id, c]));
  let cur = byId.get(categoryId);
  while (cur?.parentId) {
    const parent = byId.get(cur.parentId);
    if (!parent) break;
    cur = parent;
  }
  return cur?.id ?? categoryId;
}

export default function MaterialByGroupFields({
  categoryId,
  onCategoryChange,
  materialCode,
  onMaterialChange,
  groups,
  materials,
  categoryError,
  materialError,
  disabled = false,
}: {
  categoryId: number | '';
  onCategoryChange: (id: number | '') => void;
  materialCode: string;
  onMaterialChange: (code: string) => void;
  groups: Array<{ id: number; code: string; name: string }>;
  materials: MaterialApiDto[];
  categoryError?: string;
  materialError?: string;
  disabled?: boolean;
}) {
  const selected = groups.find(g => g.id === categoryId);
  return (
    <>
      <FormField label="Nhóm vật tư" required error={categoryError}>
        <HrmSelect
          aria-label="Nhóm vật tư"
          placeholder="Chọn nhóm vật tư"
          value={selected ? categoryOptionLabel(selected) : ''}
          options={groups.map(categoryOptionLabel)}
          disabled={disabled}
          onChange={label => {
            const found = groups.find(g => categoryOptionLabel(g) === label);
            onCategoryChange(found?.id ?? '');
          }}
        />
      </FormField>
      <FormField label="Vật tư" required error={materialError}>
        <MaterialAutocomplete
          value={materialCode}
          onChange={onMaterialChange}
          materials={materials}
          disabled={disabled || categoryId === ''}
          placeholder={categoryId === '' ? 'Chọn nhóm vật tư trước' : 'Gõ mã hoặc tên vật tư…'}
        />
      </FormField>
    </>
  );
}
