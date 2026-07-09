import type { WarehouseProjectApiDto } from '../../types/wms';
import {
  type FrozenProjectMap,
  getFrozenProjectInfo,
  isProjectFrozen,
} from '../../lib/wms/stocktakeFreeze';

interface ProjectWarehouseSelectProps {
  projects: WarehouseProjectApiDto[];
  frozenByProjectCode: FrozenProjectMap;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ProjectWarehouseSelect({
  projects,
  frozenByProjectCode,
  value,
  onChange,
  placeholder = '— Chọn kho dự án —',
  disabled = false,
  className = 'form-select',
}: ProjectWarehouseSelectProps) {
  return (
    <select
      className={className}
      value={value}
      disabled={disabled}
      onChange={e => {
        const code = e.target.value;
        if (code && isProjectFrozen(frozenByProjectCode, code)) return;
        onChange(code);
      }}
    >
      <option value="">{placeholder}</option>
      {projects.map(project => {
        const frozen = isProjectFrozen(frozenByProjectCode, project.projectCode);
        const info = frozen ? getFrozenProjectInfo(frozenByProjectCode, project.projectCode) : undefined;
        const suffix = info ? ` (đang kiểm kê ${info.voucherCode})` : '';
        return (
          <option key={project.projectCode} value={project.projectCode} disabled={frozen}>
            {project.projectCode} — {project.projectName}
            {suffix}
          </option>
        );
      })}
    </select>
  );
}
