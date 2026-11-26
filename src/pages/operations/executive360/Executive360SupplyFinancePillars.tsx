import { ShoppingCart, Wallet, Warehouse } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { getBudgetRemainingHint, resolveMaterialBudgetRemaining } from '../../../lib/wms/projectBudget';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import Executive360PillarCard, { PillarLoadError } from './Executive360PillarCard';

interface Executive360SupplyFinancePillarsProps {
  project: WarehouseProjectApiDto;
  ordersCount: number;
  fullyDeliveredCount: number;
  inProgressCount: number;
  procurementProgress: number;
  progressError: boolean;
  onRetryProgress: () => void;
  activeStockCount: number;
  totalStockQty: number;
  totalImportQty: number;
  totalDisbursedQty: number;
  inventoryLinesCount: number;
  invError: boolean;
  onRetryInventory: () => void;
}

export default function Executive360SupplyFinancePillars({
  project,
  ordersCount,
  fullyDeliveredCount,
  inProgressCount,
  procurementProgress,
  progressError,
  onRetryProgress,
  activeStockCount,
  totalStockQty,
  totalImportQty,
  totalDisbursedQty,
  inventoryLinesCount,
  invError,
  onRetryInventory,
}: Executive360SupplyFinancePillarsProps) {
  const materialBudget = project.materialBudget ?? 0;
  const approvedImportValue = project.approvedImportValue ?? 0;
  const materialBudgetRemaining =
    project.materialBudgetRemaining ?? resolveMaterialBudgetRemaining(materialBudget, approvedImportValue);
  const budgetUsedPct =
    materialBudget > 0 ? Math.min(100, Math.max(0, (approvedImportValue / materialBudget) * 100)) : 0;
  const budgetHint = getBudgetRemainingHint(materialBudget, materialBudgetRemaining);
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

  const projectWarehousePath = `/warehouse/projects/${encodeURIComponent(project.projectCode)}`;

  return (
    <>
      <Executive360PillarCard
        icon={ShoppingCart}
        iconToneClass="text-[var(--md-primary)]"
        title="3. Tiến độ Cung ứng & Mua sắm"
        headerRight={
          progressError ? (
            <Badge status="rejected" label="Lỗi tải dữ liệu" />
          ) : (
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--md-surface-container-high)] text-[var(--md-primary)]">
              {procurementProgress}%
            </span>
          )
        }
        footerLeft={progressError ? '—' : `${ordersCount} PO cho công trình`}
        footerLinkTo={`/operations/projects?project=${encodeURIComponent(project.projectCode)}`}
        footerLinkLabel="Xem Gantt cung ứng"
      >
        {progressError ? (
          <PillarLoadError message="Không thể tải dữ liệu tiến độ cung ứng" onRetry={onRetryProgress} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-on-surface-variant)]">Tổng đơn hàng PO:</span>
              <strong className="font-mono tabular-nums text-[var(--md-on-surface)]">{ordersCount} đơn</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-on-surface-variant)]">Đã giao đủ 100%:</span>
              <strong className="font-mono tabular-nums text-[var(--md-success)]">{fullyDeliveredCount} đơn</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-on-surface-variant)]">Đang giao / chờ nhập:</span>
              <strong className="font-mono tabular-nums text-[var(--md-warning)]">{inProgressCount} đơn</strong>
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-[var(--md-on-surface-variant)]">
                <span>Mức độ hoàn thành giao hàng:</span>
                <span className="font-mono tabular-nums">{procurementProgress}%</span>
              </div>
              <div className="w-full bg-[var(--md-surface-container-highest)] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--md-primary)] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, procurementProgress)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </Executive360PillarCard>

      <Executive360PillarCard
        icon={Warehouse}
        iconToneClass="text-[var(--md-secondary)]"
        title="4. Tồn kho Dự Án Thực Tế"
        headerRight={
          invError ? (
            <Badge status="rejected" label="Lỗi tải dữ liệu" />
          ) : (
            <Badge status={activeStockCount > 0 ? 'approved' : 'draft'} label={`${activeStockCount} mặt hàng`} />
          )
        }
        footerLeft={invError ? '—' : `${inventoryLinesCount} dòng định mức`}
        footerLinkTo={projectWarehousePath}
        footerLinkLabel="Xem thẻ kho dự án"
      >
        {invError ? (
          <PillarLoadError message="Không thể tải dữ liệu tồn kho dự án" onRetry={onRetryInventory} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-on-surface-variant)]">Tồn thực tế tại công trình:</span>
              <strong className="font-mono tabular-nums text-sm font-semibold text-[var(--md-on-surface)]">
                {totalStockQty} SL
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-on-surface-variant)]">Đã nhập kho thực tế:</span>
              <strong className="font-mono tabular-nums text-[var(--md-on-surface)]">{totalImportQty} SL</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-on-surface-variant)]">Đã xuất lắp đặt / thi công:</span>
              <strong className="font-mono tabular-nums text-[var(--md-on-surface)]">{totalDisbursedQty} SL</strong>
            </div>
            <p className="text-xs text-[var(--md-on-surface-variant)] m-0 pt-1">
              Cấp vật tư qua phiếu nhập gắn PO, tiêu hao qua phiếu xuất kho công trình.
            </p>
          </>
        )}
      </Executive360PillarCard>

      <Executive360PillarCard
        icon={Wallet}
        iconToneClass="text-[var(--md-primary)]"
        title="5. Tài chính & Ngân Sách Dự Toán (WBS Financials)"
        headerRight={budgetStatusBadge}
        footerLeft="Kiểm soát cầu dao chi phí mua hàng"
        footerLinkTo={projectWarehousePath}
        footerLinkLabel="Chi tiết dự toán WBS"
        className="md:col-span-2 lg:col-span-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant02)]">
            <span className="text-xs text-[var(--md-on-surface-variant)] block">Tổng ngân sách duyệt:</span>
            <strong className="font-mono text-base font-bold text-[var(--md-on-surface)] block mt-0.5">
              {formatCurrencyFull(materialBudget)}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant02)]">
            <span className="text-xs text-[var(--md-on-surface-variant)] block">Đã giải ngân nhập kho:</span>
            <strong className="font-mono text-base font-bold text-[var(--md-success)] block mt-0.5">
              {formatCurrencyFull(approvedImportValue)}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant02)]">
            <span className="text-xs text-[var(--md-on-surface-variant)] block">Ngân sách còn lại:</span>
            <strong
              className={`font-mono text-base font-bold block mt-0.5 ${
                isOverBudget ? 'text-[var(--md-error)]' : 'text-[var(--md-on-surface)]'
              }`}
            >
              {formatCurrencyFull(materialBudgetRemaining)}
            </strong>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[var(--md-on-surface-variant)]">
            <span>Tiến độ tiêu hao ngân sách vật tư:</span>
            <span className="font-mono font-semibold tabular-nums">{budgetUsedPct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-[var(--md-surface-container-highest)] h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget
                  ? 'bg-[var(--md-error)]'
                  : isNearLimit
                    ? 'bg-[var(--md-warning)]'
                    : 'bg-[var(--md-primary)]'
              }`}
              style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--md-on-surface-variant)] m-0">{budgetHint}</p>
        </div>
      </Executive360PillarCard>
    </>
  );
}
