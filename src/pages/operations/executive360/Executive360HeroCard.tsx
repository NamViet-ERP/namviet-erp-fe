import { Building2 } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { formatPmDisplayName } from '../../../lib/projectPersonnel';
import { projectStatusBadge } from '../../../lib/wms/projectStatusBadge';
import type { WarehouseProjectApiDto } from '../../../types/wms';

interface Executive360HeroCardProps {
  project: WarehouseProjectApiDto;
}

export default function Executive360HeroCard({ project }: Executive360HeroCardProps) {
  const pmLabel = formatPmDisplayName(project.pmName);

  return (
    <div className="rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-low)] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--md-surface-container-high)] text-[var(--md-primary)]">
              {project.projectCode}
            </span>
            <Badge status={projectStatusBadge(project.status)} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--md-on-surface)] m-0">
            {project.projectName}
          </h2>
          <p className="text-sm text-[var(--md-on-surface-variant)] flex items-center gap-2 m-0">
            <Building2 size={15} aria-hidden />
            <span>
              Khách hàng / CĐT: <strong>{project.clientName || '—'}</strong>
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[var(--md-surface-container)] p-3 rounded-lg border border-[var(--md-outline-variant02)]">
          <div>
            <span className="text-[var(--md-on-surface-variant)] block">Chỉ huy trưởng:</span>
            <strong
              className="text-[var(--md-on-surface)] font-medium truncate block max-w-[140px]"
              title={pmLabel}
            >
              {pmLabel}
            </strong>
          </div>
          <div>
            <span className="text-[var(--md-on-surface-variant)] block">Ngày khởi công:</span>
            <strong className="text-[var(--md-on-surface)] font-mono tabular-nums">
              {formatDateCell(project.startDate)}
            </strong>
          </div>
          <div>
            <span className="text-[var(--md-on-surface-variant)] block">Cam kết bàn giao:</span>
            <strong className="text-[var(--md-on-surface)] font-mono tabular-nums">
              {formatDateCell(project.endDate ?? undefined)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
