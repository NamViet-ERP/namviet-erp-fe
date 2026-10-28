import { Wallet, CircleDollarSign, TrendingUp, ShieldCheck, AlertTriangle, Pencil, HardHat, Truck, Layers } from 'lucide-react';
import HrmStatCard from '../hr/HrmStatCard';
import Badge from '../ui/Badge';
import PermissionGate from '../auth/PermissionGate';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import {
  getBudgetRemainingHint,
  getBudgetRemainingTone,
  resolveMaterialBudgetRemaining,
} from '../../lib/wms/projectBudget';
import type { WarehouseProjectApiDto, WarehouseProjectLedgerEntryApiDto } from '../../types/wms';

interface ProjectBudgetTabProps {
  project: WarehouseProjectApiDto;
  ledger: WarehouseProjectLedgerEntryApiDto[];
  onOpenEditBudget: () => void;
}

export default function ProjectBudgetTab({
  project,
  ledger,
  onOpenEditBudget,
}: ProjectBudgetTabProps) {
  const approvedImportValue = (() => {
    if (project.approvedImportValue != null) return project.approvedImportValue;
    return ledger
      .filter(e => e.kind === 'import' && e.status === 'approved' && e.totalValue != null)
      .reduce((sum, e) => sum + (e.totalValue ?? 0), 0);
  })();

  const approvedExportValue = ledger
    .filter(e => e.kind === 'export' && e.status === 'approved' && e.totalValue != null)
    .reduce((sum, e) => sum + (e.totalValue ?? 0), 0);

  const materialBudget = project.materialBudget ?? 0;
  const materialBudgetRemaining = (() => {
    if (project.materialBudgetRemaining != null) return project.materialBudgetRemaining;
    return resolveMaterialBudgetRemaining(materialBudget, approvedImportValue);
  })();

  const usedRatio = materialBudget > 0 ? (approvedImportValue / materialBudget) : 0;
  const usedPct = Math.min(100, Math.max(0, usedRatio * 100));
  const tone = getBudgetRemainingTone(materialBudget, materialBudgetRemaining);
  const hint = getBudgetRemainingHint(materialBudget, materialBudgetRemaining);

  const isOverBudget = materialBudgetRemaining < 0;
  const isNearLimit = !isOverBudget && materialBudget > 0 && (materialBudgetRemaining / materialBudget) <= 0.2;

  const budgetStatusBadge = isOverBudget ? (
    <Badge status="rejected" label="Vượt dự toán" />
  ) : isNearLimit ? (
    <Badge status="pending" label="Cảnh báo chạm ngưỡng" />
  ) : materialBudget > 0 ? (
    <Badge status="approved" label="An toàn" />
  ) : (
    <Badge status="draft" label="Chưa thiết lập" />
  );

  return (
    <div className="p-4 sm:p-5 space-y-6">
      {/* KPI Cards */}
      <div className="hrm-stat-grid project-detail-stat-grid">
        <HrmStatCard
          label="Tổng dự toán vật tư"
          value={formatCurrencyFull(materialBudget)}
          hint="Hạn mức được phê duyệt"
          icon={Wallet}
          tone="primary"
        />
        <HrmStatCard
          label="Đã giải ngân nhập kho"
          value={formatCurrencyFull(approvedImportValue)}
          hint={`Xuất kho thực tế: ${formatCurrencyFull(approvedExportValue)}`}
          icon={CircleDollarSign}
          tone="success"
        />
        <HrmStatCard
          label="Tỷ lệ sử dụng ngân sách"
          value={`${usedPct.toFixed(1)}%`}
          hint={`${formatCurrencyFull(approvedImportValue)} / ${formatCurrencyFull(materialBudget)}`}
          icon={TrendingUp}
          tone={tone}
        />
        <HrmStatCard
          label="Ngân sách còn lại"
          value={formatCurrencyFull(materialBudgetRemaining)}
          hint={hint}
          icon={isOverBudget ? AlertTriangle : ShieldCheck}
          tone={tone}
        />
      </div>

      {/* Progress Bar Header */}
      <div className="rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-low)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--md-on-surface)]">
              Tiến độ giải ngân ngân sách vật tư:
            </span>
            {budgetStatusBadge}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--md-on-surface-variant)] tabular-nums">
              Đã dùng <strong>{usedPct.toFixed(1)}%</strong> ({formatCurrencyFull(approvedImportValue)}) · Còn lại{' '}
              <strong className={isOverBudget ? 'text-[var(--md-error)]' : ''}>
                {formatCurrencyFull(materialBudgetRemaining)}
              </strong>
            </span>
            <PermissionGate permission="wms.projects.update">
              <button
                type="button"
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                onClick={onOpenEditBudget}
              >
                <Pencil size={13} aria-hidden />
                <span>Cập nhật dự toán</span>
              </button>
            </PermissionGate>
          </div>
        </div>
        <div className="w-full bg-[var(--md-surface-container-highest)] h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOverBudget
                ? 'bg-[var(--md-error)]'
                : isNearLimit
                  ? 'bg-[var(--md-warning)]'
                  : 'bg-[var(--md-primary)]'
            }`}
            style={{ width: `${Math.min(100, usedPct)}%` }}
          />
        </div>
      </div>

      {/* WBS Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--md-on-surface)] flex items-center gap-2 m-0">
              <Layers size={18} className="text-[var(--md-primary)]" aria-hidden />
              <span>Bảng phân bổ chi phí 3 trụ cột (WBS Breakdown)</span>
            </h3>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 mb-0">
              Kiểm soát ngân sách theo 3 trụ cột chi phí chính của dự án EPC: Vật tư chính, Nhân công & Thi công, Thầu phụ & Dịch vụ.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell">Trụ cột chi phí WBS</th>
                <th className="table-header-cell text-right whitespace-nowrap">Hạn mức duyệt</th>
                <th className="table-header-cell text-right whitespace-nowrap">Đã thực hiện</th>
                <th className="table-header-cell text-right whitespace-nowrap">Ngân sách còn lại</th>
                <th className="table-header-cell text-center whitespace-nowrap">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {/* Pillar 1: Material */}
              <tr className="table-row">
                <td className="table-cell">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-primary)] shrink-0 mt-0.5">
                      <Wallet size={16} aria-hidden />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--md-on-surface)]">
                        Trụ cột 1: Vật tư chính (C<sub>VT</sub>)
                      </div>
                      <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                        Theo dõi qua KHMH / MHPS · Đơn đặt hàng PO · Nhập xuất tồn kho dự án
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-right font-mono font-medium tabular-nums">
                  {formatCurrencyFull(materialBudget)}
                </td>
                <td className="table-cell text-right font-mono tabular-nums text-[var(--md-on-surface)]">
                  {formatCurrencyFull(approvedImportValue)}
                </td>
                <td className={`table-cell text-right font-mono font-semibold tabular-nums ${isOverBudget ? 'text-[var(--md-error)]' : ''}`}>
                  {formatCurrencyFull(materialBudgetRemaining)}
                </td>
                <td className="table-cell text-center whitespace-nowrap">
                  {budgetStatusBadge}
                </td>
              </tr>

              {/* Pillar 2: Labor & Construction */}
              <tr className="table-row">
                <td className="table-cell">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-tertiary)] shrink-0 mt-0.5">
                      <HardHat size={16} aria-hidden />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--md-on-surface)]">
                        Trụ cột 2: Nhân công & Thi công (C<sub>NC</sub>)
                      </div>
                      <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                        Chỉ huy trưởng: <strong>{project.pmName || '—'}</strong>
                        {project.scMembers ? (
                          <span> · Ban chỉ huy / SC: <strong>{project.scMembers}</strong></span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-right font-mono text-[var(--md-on-surface-variant)] text-xs">
                  Định mức công trình
                </td>
                <td className="table-cell text-right font-mono text-[var(--md-on-surface-variant)] text-xs">
                  Theo bảng chấm công
                </td>
                <td className="table-cell text-right font-mono text-[var(--md-on-surface-variant)] text-xs">
                  Trong hạn mức
                </td>
                <td className="table-cell text-center whitespace-nowrap">
                  <Badge status="approved" label="Đang triển khai" />
                </td>
              </tr>

              {/* Pillar 3: Subcontractors & Services */}
              <tr className="table-row">
                <td className="table-cell">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-secondary)] shrink-0 mt-0.5">
                      <Truck size={16} aria-hidden />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--md-on-surface)]">
                        Trụ cột 3: Thầu phụ & Dịch vụ ngoài (C<sub>TP</sub>)
                      </div>
                      <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                        Gia công kết cấu, chế tạo, cẩu kéo, thí nghiệm kiểm định
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-right font-mono text-[var(--md-on-surface-variant)] text-xs">
                  Theo HĐ thầu phụ
                </td>
                <td className="table-cell text-right font-mono text-[var(--md-on-surface-variant)] text-xs">
                  Theo nghiệm thu
                </td>
                <td className="table-cell text-right font-mono text-[var(--md-on-surface-variant)] text-xs">
                  Theo tiến độ
                </td>
                <td className="table-cell text-center whitespace-nowrap">
                  <Badge status="draft" label="Quản lý theo gói" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
