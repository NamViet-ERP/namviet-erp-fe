import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import Skeleton from '../../components/ui/Skeleton';
import SupplierPayablesOverview from '../../components/suppliers/SupplierPayablesOverview';
import { usePermission } from '../../hooks/usePermission';
import { useSupplierPayables } from '../../hooks/useSupplierPayables';
import { getApiErrorMessage } from '../../lib/apiClient';
import { exportLinesCsv, type StatusFilter } from './payables/payablesUtils';
import { ApBoard } from './payables/PayablesBoard';
import SupplierPayablesLinesTable from './payables/SupplierPayablesLinesTable';
import SupplierPayablesSummaryTable from './payables/SupplierPayablesSummaryTable';
import SupplierPayablesUpcomingTable from './payables/SupplierPayablesUpcomingTable';

export default function SupplierPayablesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierIdRaw = searchParams.get('supplierId');
  const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
  const [status, setStatus] = useState<StatusFilter>('');
  const [search, setSearch] = useState('');
  const { hasAny } = usePermission();
  const canPay = hasAny(['purchasing.payments.pay', 'purchasing.payments.view']);

  const params = useMemo(
    () => ({
      supplierId: Number.isFinite(supplierId) ? supplierId : undefined,
      status: status || undefined,
      search: search.trim() || undefined,
    }),
    [supplierId, status, search],
  );
  const { data, isLoading, isFetching, isPlaceholderData, isError, error } = useSupplierPayables(params);
  const showInitialLoading = isLoading && !data;
  const isRefetching = isFetching && isPlaceholderData;

  const kpis = data?.kpis;
  const aging = data?.aging ?? [];
  const suppliers = data?.suppliers ?? [];
  const upcoming = data?.upcoming ?? [];
  const lines = data?.lines ?? [];
  const filteredSupplierName = suppliers.find(s => s.supplierId === supplierId)?.supplierName;
  const hasFilters = Boolean(supplierId || status || search.trim());

  const setSupplierFilter = (next: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set('supplierId', next);
    else nextParams.delete('supplierId');
    setSearchParams(nextParams, { replace: true });
  };

  const resetFilters = () => {
    setStatus('');
    setSearch('');
    setSupplierFilter('');
  };

  const handleSelectSupplier = (selectedId: number) => {
    setSupplierFilter(String(selectedId));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('sup-ap-lines')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <PageShell className="sup-ap">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Công nợ NCC"
        subtitle="Công nợ lấy từ DNTT còn phải trả. PO chưa lập đề nghị không phát sinh nợ."
        actions={(
          <Button
            type="button"
            variant="outlined"
            size="sm"
            leftIcon={Download}
            disabled={lines.length === 0}
            onClick={() => exportLinesCsv(lines)}
          >
            Xuất CSV
          </Button>
        )}
      />

      {isError ? (
        <ApBoard title="Công nợ NCC" desc="Không tải được dữ liệu công nợ.">
          <div className="ops-projects-board__body">
            <EmptyState message={getApiErrorMessage(error, 'Không tải được công nợ NCC.')} />
          </div>
        </ApBoard>
      ) : (
        <>
          <ApBoard title="Tổng quan công nợ" desc="Còn phải trả theo DNTT đã lập.">
            {showInitialLoading || !kpis ? (
              <div className="ops-projects-board__body">
                <Skeleton variant="rect" height={196} />
              </div>
            ) : (
              <SupplierPayablesOverview
                kpis={kpis}
                aging={aging}
                upcoming7Total={data?.upcoming7Total ?? 0}
                upcoming30Total={data?.upcoming30Total ?? 0}
              />
            )}
          </ApBoard>

          <SupplierPayablesSummaryTable
            suppliers={suppliers}
            showInitialLoading={showInitialLoading}
            isRefetching={isRefetching}
            onSelectSupplier={handleSelectSupplier}
          />

          {!showInitialLoading && upcoming.length > 0 ? (
            <SupplierPayablesUpcomingTable upcoming={upcoming} canPay={canPay} />
          ) : null}

          <SupplierPayablesLinesTable
            suppliers={suppliers}
            lines={lines}
            supplierId={supplierId}
            filteredSupplierName={filteredSupplierName}
            status={status}
            search={search}
            hasFilters={hasFilters}
            showInitialLoading={showInitialLoading}
            isRefetching={isRefetching}
            canPay={canPay}
            onSupplierFilterChange={setSupplierFilter}
            onStatusChange={setStatus}
            onSearchChange={setSearch}
            onResetFilters={resetFilters}
          />
        </>
      )}
    </PageShell>
  );
}
