import { AlertTriangle, CheckCircle2, HardHat } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { cskhProjectPath } from '../../../constants/cskhProject';
import { HRM_MODULE_ENABLED } from '../../../constants/sidebarMenus';
import { formatPmDisplayName, hasValidPm } from '../../../lib/projectPersonnel';
import type { CskhBottleneck } from '../../../lib/cskh/opsWorkspace';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import Executive360PillarCard, { PillarLoadError } from './Executive360PillarCard';

interface Executive360SitePillarsProps {
  project: WarehouseProjectApiDto;
  openBottlenecks: CskhBottleneck[];
  criticalBottlenecksCount: number;
  isBottlenecksError: boolean;
  onRetryBottlenecks: () => void;
}

export default function Executive360SitePillars({
  project,
  openBottlenecks,
  criticalBottlenecksCount,
  isBottlenecksError,
  onRetryBottlenecks,
}: Executive360SitePillarsProps) {
  const pmAssigned = hasValidPm(project.pmName, project.pmId);
  const keepers = project.warehouseKeepers ?? [];

  return (
    <>
      <Executive360PillarCard
        icon={HardHat}
        iconToneClass="text-[var(--md-tertiary)]"
        title="1. Nhân sự Hiện trường"
        headerRight={(
          <Badge
            status={pmAssigned ? 'approved' : 'pending'}
            label={pmAssigned ? 'Đủ chỉ huy' : 'Thiếu PM'}
          />
        )}
        footerLeft={`${keepers.length} thủ kho phụ trách`}
        footerLinkTo={HRM_MODULE_ENABLED ? '/members/list' : undefined}
        footerLinkLabel={HRM_MODULE_ENABLED ? 'Hồ sơ nhân sự' : undefined}
      >
        <div>
          <span className="text-[var(--md-on-surface-variant)] block mb-0.5">
            Chỉ huy trưởng (PM / PIC):
          </span>
          <strong className="text-sm text-[var(--md-on-surface)] font-semibold">
            {formatPmDisplayName(project.pmName)}
          </strong>
        </div>
        <div>
          <span className="text-[var(--md-on-surface-variant)] block mb-0.5">
            Ban chỉ huy & Kỹ sư (SC):
          </span>
          <span className="text-[var(--md-on-surface)] font-medium block" title={project.scMembers ?? undefined}>
            {project.scMembers || '—'}
          </span>
        </div>
        <div>
          <span className="text-[var(--md-on-surface-variant)] block mb-0.5">
            Thủ kho phụ trách:
          </span>
          <span className="text-[var(--md-on-surface)] font-medium">
            {keepers.length > 0
              ? keepers.map(k => k.displayName).join(', ')
              : '— Chưa phân công thủ kho'}
          </span>
        </div>
      </Executive360PillarCard>

      <Executive360PillarCard
        icon={AlertTriangle}
        iconToneClass="text-[var(--md-error)]"
        title="2. Tiến độ & Điểm nghẽn"
        headerRight={(
          <Badge
            status={
              isBottlenecksError
                ? 'rejected'
                : openBottlenecks.length === 0
                  ? 'approved'
                  : criticalBottlenecksCount > 0
                    ? 'rejected'
                    : 'pending'
            }
            label={
              isBottlenecksError
                ? 'Lỗi tải dữ liệu'
                : openBottlenecks.length === 0
                  ? 'Thông suốt'
                  : `${openBottlenecks.length} điểm nghẽn`
            }
          />
        )}
        footerLeft={isBottlenecksError ? '—' : `${criticalBottlenecksCount} điểm nghẽn khẩn cấp`}
        footerLinkTo={cskhProjectPath(project.projectCode, 'bottlenecks')}
        footerLinkLabel="Chi tiết điểm nghẽn"
      >
        {isBottlenecksError ? (
          <PillarLoadError
            message="Không thể tải dữ liệu điểm nghẽn"
            onRetry={onRetryBottlenecks}
          />
        ) : openBottlenecks.length === 0 ? (
          <div className="py-4 text-center text-[var(--md-on-surface-variant)]">
            <CheckCircle2 size={24} className="mx-auto text-[var(--md-success)] mb-1" aria-hidden />
            <p className="m-0">Công trường không có điểm nghẽn cản trở.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {openBottlenecks.slice(0, 3).map(b => (
              <div
                key={b.id}
                className="p-2 rounded bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant02)] text-xs"
              >
                <div className="flex items-center justify-between gap-2 font-semibold">
                  <span className="truncate max-w-[170px]" title={b.name}>{b.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs shrink-0 ${
                      b.severity === 'urgent'
                        ? 'bg-[var(--md-error)] text-[var(--md-on-error)]'
                        : 'bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)]'
                    }`}
                  >
                    {b.severity === 'urgent' ? 'Khẩn cấp' : b.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
                {b.reason && (
                  <p className="text-xs text-[var(--md-on-surface-variant)] line-clamp-1 mt-0.5 mb-0">
                    {b.reason}
                  </p>
                )}
              </div>
            ))}
            {openBottlenecks.length > 3 && (
              <div className="text-xs text-[var(--md-on-surface-variant)] text-center">
                +{openBottlenecks.length - 3} điểm nghẽn khác
              </div>
            )}
          </div>
        )}
      </Executive360PillarCard>
    </>
  );
}
