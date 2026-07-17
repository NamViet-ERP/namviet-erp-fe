import { useState } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import PermissionGate from '../../components/auth/PermissionGate';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useRecruitmentReportSummary } from '../../hooks/useRecruitmentReports';
import { recruitmentReportsService } from '../../services/recruitmentReportsService';

export default function RecruitmentReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, isError, error } = useRecruitmentReportSummary(dateFrom, dateTo);

  const handleExport = async () => {
    setExporting(true);
    try {
      await recruitmentReportsService.download({ dateFrom, dateTo });
      showToast('success', 'Đã tải báo cáo Excel');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xuất báo cáo'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="hrm-page space-y-4">
      <PageHeader
        title="Báo cáo tuyển dụng"
        subtitle="Chất lượng nguồn, funnel chuyển đổi và top vị trí theo kỳ."
      />

      <HrmPanel>
        <div className="mb-3">
          <h2 className="text-base font-semibold">Bộ lọc kỳ</h2>
          <p className="text-sm text-[var(--md-on-surface-variant)]">Lọc theo ngày nộp hồ sơ</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <VoucherDateFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onReset={() => {
              setDateFrom('');
              setDateTo('');
            }}
          />
          <PermissionGate permission="hrm.recruitment.reports.export">
            <button type="button" className="btn btn-outline btn-sm" disabled={exporting} onClick={handleExport}>
              <Download size={14} />
              {exporting ? 'Đang xuất…' : 'Xuất Excel'}
            </button>
          </PermissionGate>
        </div>
      </HrmPanel>

      {isLoading ? (
        <p className="text-sm text-[var(--md-on-surface-variant)]">Đang tải báo cáo…</p>
      ) : isError ? (
        <p className="text-sm text-[var(--md-error)]">{getApiErrorMessage(error, 'Không tải được báo cáo')}</p>
      ) : data ? (
        <>
          <HrmPanel noPadding>
            <div className="p-4 pb-0">
              <h2 className="text-base font-semibold">Theo nguồn</h2>
              <p className="text-sm text-[var(--md-on-surface-variant)]">CV → PV/Offer → Đã tuyển</p>
            </div>
            <div className="overflow-x-auto hrm-table-wrap">
              <table className="w-full min-w-max border-collapse hrm-table">
                <thead>
                  <tr>
                    {['Nguồn', 'Số CV', 'PV/Offer', 'Đã tuyển', 'Tỷ lệ (%)'].map(h => (
                      <th key={h} className="table-header-cell">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.bySource.length === 0 ? (
                    <tr><td colSpan={5} className="table-cell text-center py-8 text-sm text-[var(--md-on-surface-variant)]">Không có dữ liệu.</td></tr>
                  ) : data.bySource.map(row => (
                    <tr key={row.source} className="table-row">
                      <td className="table-cell font-medium">{row.source}</td>
                      <td className="table-cell tabular-nums text-center">{row.cvCount}</td>
                      <td className="table-cell tabular-nums text-center">{row.interviewCount}</td>
                      <td className="table-cell tabular-nums text-center">{row.hiredCount}</td>
                      <td className="table-cell tabular-nums text-center">{row.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HrmPanel>

          <HrmPanel noPadding>
            <div className="p-4 pb-0">
              <h2 className="text-base font-semibold">Top vị trí</h2>
              <p className="text-sm text-[var(--md-on-surface-variant)]">Vị trí có nhiều CV nhất</p>
            </div>
            <div className="overflow-x-auto hrm-table-wrap">
              <table className="w-full min-w-max border-collapse hrm-table">
                <thead>
                  <tr>
                    {['Vị trí', 'Số CV'].map(h => (
                      <th key={h} className="table-header-cell">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.byPosition.length === 0 ? (
                    <tr><td colSpan={2} className="table-cell text-center py-8 text-sm text-[var(--md-on-surface-variant)]">Không có dữ liệu.</td></tr>
                  ) : data.byPosition.map(row => (
                    <tr key={row.position} className="table-row">
                      <td className="table-cell">{row.position}</td>
                      <td className="table-cell tabular-nums text-center">{row.cvCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HrmPanel>
        </>
      ) : null}
    </div>
  );
}
