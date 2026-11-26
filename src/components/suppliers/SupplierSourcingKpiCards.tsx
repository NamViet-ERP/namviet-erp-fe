import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Award, RefreshCw, TrendingUp, UserPlus, Users } from 'lucide-react';
import Button from '../ui/Button';
import KpiCard from '../ui/KpiCard';
import MetricsStrip from '../ui/MetricsStrip';
import { getApiErrorMessage } from '../../lib/apiClient';
import { suppliersService, type SourcingKpiSummaryDto } from '../../services/suppliersService';

interface SupplierSourcingKpiCardsProps {
  onGradeFilterSelect?: (grade: string) => void;
}

export default function SupplierSourcingKpiCards({ onGradeFilterSelect }: SupplierSourcingKpiCardsProps) {
  const [kpi, setKpi] = useState<SourcingKpiSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadKpi = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    suppliersService
      .getSourcingKpi()
      .then((data) => {
        if (requestIdRef.current === requestId) setKpi(data);
      })
      .catch((err) => {
        if (requestIdRef.current === requestId) {
          setError(getApiErrorMessage(err, 'Không tải được chỉ số KPI nguồn cung ứng.'));
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadKpi();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadKpi]);

  if (!loading && (error || !kpi)) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--md-error)] bg-[var(--md-error-container)] px-4 py-3 text-sm text-[var(--md-on-error-container)]"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" aria-hidden />
          <span>{error ?? 'Không có dữ liệu KPI nguồn cung ứng.'}</span>
        </div>
        <Button
          type="button"
          variant="outlined"
          size="sm"
          leftIcon={RefreshCw}
          onClick={loadKpi}
          className="shrink-0"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <MetricsStrip columns={4} ariaLabel="Chỉ số KPI nguồn cung ứng">
      <KpiCard
        label="Tổng Master NCC"
        value={kpi?.totalSuppliers ?? 0}
        hint="đối tác"
        tone="primary"
        icon={Users}
        loading={loading}
        onClick={onGradeFilterSelect ? () => onGradeFilterSelect('') : undefined}
      />
      <KpiCard
        label="NCC Mới Tháng Này"
        value={kpi ? `+${kpi.totalNewThisMonth}` : '0'}
        hint={kpi ? `Hạng D: ${kpi.gradeDCount}` : undefined}
        tone="warning"
        icon={UserPlus}
        loading={loading}
        onClick={onGradeFilterSelect ? () => onGradeFilterSelect('D') : undefined}
      />
      <KpiCard
        label="Thăng Hạng Tháng Này"
        value={kpi?.totalPromotedThisMonth ?? 0}
        hint={kpi ? `Hạng C: ${kpi.gradeCCount}` : undefined}
        tone="success"
        icon={Award}
        loading={loading}
        onClick={onGradeFilterSelect ? () => onGradeFilterSelect('C') : undefined}
      />
      <KpiCard
        label="Tỷ Lệ Thăng Hạng"
        value={kpi ? `${kpi.promotionRatePercent}%` : '0%'}
        hint={kpi ? `A:${kpi.gradeACount} / B:${kpi.gradeBCount}` : undefined}
        tone="info"
        icon={TrendingUp}
        loading={loading}
      />
    </MetricsStrip>
  );
}
