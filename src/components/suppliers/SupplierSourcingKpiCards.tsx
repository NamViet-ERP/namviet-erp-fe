import { useEffect, useState } from 'react';
import { UserPlus, Award, TrendingUp, Users } from 'lucide-react';
import { suppliersService, type SourcingKpiSummaryDto } from '../../services/suppliersService';

interface SupplierSourcingKpiCardsProps {
  onGradeFilterSelect?: (grade: string) => void;
}

export default function SupplierSourcingKpiCards({ onGradeFilterSelect }: SupplierSourcingKpiCardsProps) {
  const [kpi, setKpi] = useState<SourcingKpiSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    suppliersService.getSourcingKpi()
      .then((data) => {
        if (isMounted) setKpi(data);
      })
      .catch((err) => {
        console.warn('Could not load sourcing KPI:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !kpi) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200/60 dark:border-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {/* Total Suppliers */}
      <div
        className={`p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center gap-3 ${
          onGradeFilterSelect ? 'cursor-pointer hover:border-blue-400' : ''
        }`}
        onClick={() => onGradeFilterSelect?.('')}
        title="Bấm để xem tất cả NCC"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tổng Master NCC
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {kpi.totalSuppliers}
            </span>
            <span className="text-[11px] text-slate-400">đối tác</span>
          </div>
        </div>
      </div>

      {/* New Sourcing This Month (Grade D) */}
      <div
        className={`p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center gap-3 ${
          onGradeFilterSelect ? 'cursor-pointer hover:border-amber-400' : ''
        }`}
        onClick={() => onGradeFilterSelect?.('D')}
        title="Bấm để lọc NCC Hạng D"
      >
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            NCC Mới Tháng Này
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
              +{kpi.totalNewThisMonth}
            </span>
            <span className="text-[11px] text-slate-400">
              (Hạng D: {kpi.gradeDCount})
            </span>
          </div>
        </div>
      </div>

      {/* Promoted This Month */}
      <div
        className={`p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center gap-3 ${
          onGradeFilterSelect ? 'cursor-pointer hover:border-green-400' : ''
        }`}
        onClick={() => onGradeFilterSelect?.('C')}
        title="Bấm để lọc NCC Hạng C"
      >
        <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Thăng Hạng Tháng Này
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold text-green-600 dark:text-green-400">
              {kpi.totalPromotedThisMonth}
            </span>
            <span className="text-[11px] text-slate-400">
              (Hạng C: {kpi.gradeCCount})
            </span>
          </div>
        </div>
      </div>

      {/* Sourcing Conversion Rate */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tỷ Lệ Thăng Hạng
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {kpi.promotionRatePercent}%
            </span>
            <span className="text-[11px] text-slate-400">
              (A:{kpi.gradeACount} / B:{kpi.gradeBCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
