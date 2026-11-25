import Badge from '../../../components/ui/Badge';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { projectStatusBadge } from '../../../lib/wms/projectStatusBadge';
import { GENERAL_WAREHOUSE_LABEL_LOWER } from '../../../lib/wms/stockTerminology';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { WarehouseProjectApiDto } from '../../../types/wms';

interface ProjectInfoTabProps {
  project: WarehouseProjectApiDto;
  materialBudgetRemaining: number;
}

export default function ProjectInfoTab({
  project,
  materialBudgetRemaining,
}: ProjectInfoTabProps) {
  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
      <div>
        <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Loại dự án</div>
        <div className="font-semibold">{project.projectType}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Trạng thái</div>
        <Badge status={projectStatusBadge(project.status)} />
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Ngân sách vật tư</div>
        <div className="font-semibold tabular-nums">{formatCurrencyFull(project.materialBudget)}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Còn lại (đã trừ nhập duyệt)</div>
        <div className={`font-semibold tabular-nums ${materialBudgetRemaining < 0 ? 'text-[var(--md-error)]' : ''}`}>
          {formatCurrencyFull(materialBudgetRemaining)}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Ngày kết thúc</div>
        <div className="font-semibold tabular-nums">{formatDateCell(project.endDate ?? undefined)}</div>
      </div>
      <div className="md:col-span-2 text-sm text-[var(--md-on-surface-variant)] text-pretty leading-relaxed">
        Kho dự án lưu tồn thực tế tại công trình. Vật tư cấp qua phiếu nhập; tiêu hao qua phiếu xuất;
        phần dư hoàn về {GENERAL_WAREHOUSE_LABEL_LOWER} qua chuyển kho hoặc khi đóng kho.
      </div>
    </div>
  );
}
