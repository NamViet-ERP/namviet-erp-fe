import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { PurchaseEstimateVersionSummaryApiDto } from '../../../types/api/purchasingApi';

interface EstimateVersionSidebarProps {
  versions: PurchaseEstimateVersionSummaryApiDto[];
  latestVersion: number;
  viewVersion?: number;
  disabled: boolean;
  onSelectVersion: (version?: number) => void;
}

export default function EstimateVersionSidebar({
  versions,
  latestVersion,
  viewVersion,
  disabled,
  onSelectVersion,
}: EstimateVersionSidebarProps) {
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <aside
      className="pur-estimate-detail__versions w-full shrink-0 rounded-[var(--radius-md)] bg-[var(--md-surface)] lg:w-56"
      aria-label="Lịch sử version"
    >
      <div className="pur-estimate-detail__versions-head px-3 py-2 text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
        Lịch sử version
      </div>
      <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto p-2">
        {sortedVersions.map(v => {
          const isLatest = v.versionNumber === latestVersion;
          const selected = (!viewVersion && isLatest) || viewVersion === v.versionNumber;
          return (
            <button
              key={v.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectVersion(isLatest ? undefined : v.versionNumber)}
              className={[
                'pur-estimate-detail__ver',
                'w-full rounded-[var(--radius-sm)] px-2.5 py-2 text-left transition-[background-color,border-color,transform] duration-150',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-primary)]',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'active:scale-[0.97]',
                selected ? 'is-selected' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[length:var(--fs-sm)] font-semibold text-[var(--md-on-surface)]">
                  Ver {v.versionNumber}
                </span>
                {isLatest ? (
                  <span className="text-[length:var(--fs-micro)] font-medium text-[var(--md-primary)]">
                    Mới nhất
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 text-[length:var(--fs-xs)] tabular-nums text-[var(--md-on-surface-variant)]">
                {formatDateTimeVi(v.createdAt)}
              </div>
              <div className="mt-0.5 truncate text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
                {v.updatedByName}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
