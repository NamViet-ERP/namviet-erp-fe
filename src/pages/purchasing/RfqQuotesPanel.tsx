import { forwardRef, useImperativeHandle } from 'react';
import HrmSelect from '../../components/hr/HrmSelect';
import Button from '../../components/ui/Button';
import FilterToolbar from '../../components/ui/FilterToolbar';
import FormField from '../../components/ui/FormField';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import RfqQuoteModal from './rfq/RfqQuoteModal';
import RfqQuotesTable from './rfq/RfqQuotesTable';
import {
  RFQ_THIS_YEAR,
  RFQ_YEARS,
  useRfqQuotesController,
} from './rfq/useRfqQuotesController';

export type RfqQuotesPanelHandle = {
  openCreate: () => void;
  exportCsv: () => void;
};

export default forwardRef<RfqQuotesPanelHandle, {
  canWrite: boolean;
  canUpdate?: boolean;
  presetMaterialCode?: string;
  /** Khi true: ẩn nút trên panel (parent đặt trên PageHeader). */
  hideToolbarActions?: boolean;
}>(function RfqQuotesPanel({
  canWrite,
  canUpdate = canWrite,
  presetMaterialCode = '',
  hideToolbarActions = false,
}, ref) {
  const vm = useRfqQuotesController({ canWrite, presetMaterialCode });

  useImperativeHandle(ref, () => ({
    openCreate: vm.openCreate,
    exportCsv: vm.exportCsv,
  }), [vm.openCreate, vm.exportCsv]);

  const statusSelectClass =
    vm.status === 'won' ? 'rfq-status-select--won'
      : vm.status === 'lost' ? 'rfq-status-select--lost'
        : vm.status === 'expired' ? 'rfq-status-select--expired'
          : vm.status === 'active' ? 'rfq-status-select--active'
            : '';

  return (
    <div className="space-y-3">
      {hideToolbarActions ? null : (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4">
          <h2 className="text-lg font-semibold m-0">Sổ giá chào thầu (RFQ)</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outlined" size="sm" onClick={vm.exportCsv}>
              Xuất CSV
            </Button>
            {canWrite ? (
              <Button type="button" variant="filled" size="sm" onClick={vm.openCreate}>
                + Ghi nhận báo giá mới
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <FilterToolbar
        filters={(
          <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects rfq-filter-row w-full">
            <FormField label="Lọc theo NCC">
              <HrmSelect
                aria-label="Lọc theo NCC"
                placeholder="-- Tất cả NCC --"
                value={vm.supplierId === '' ? '' : String(vm.supplierId)}
                options={vm.supplierOptions.map(s => ({ value: String(s.id), label: s.supplierName }))}
                onChange={v => {
                  vm.setSupplierId(v ? Number(v) : '');
                  vm.setPage(1);
                }}
              />
            </FormField>
            <FormField label="Lọc theo trạng thái">
              <HrmSelect
                aria-label="Lọc theo trạng thái"
                placeholder="-- Tất cả trạng thái --"
                value={vm.status}
                className={statusSelectClass}
                options={[
                  { value: 'active', label: 'Còn hiệu lực' },
                  { value: 'won', label: 'Thắng thầu' },
                  { value: 'lost', label: 'Thua thầu' },
                  { value: 'expired', label: 'Hết hạn' },
                ]}
                onChange={v => {
                  vm.setStatus(v);
                  vm.setPage(1);
                }}
              />
            </FormField>
            <FormField label="Gom giá TB">
              <HrmSelect
                aria-label="Gom giá TB"
                value={vm.groupBy}
                options={[
                  { value: 'quarter', label: 'Theo quý' },
                  { value: 'year', label: 'Theo năm' },
                ]}
                onChange={v => {
                  const next = v as 'quarter' | 'year';
                  vm.setGroupBy(next);
                  if (next === 'year') {
                    vm.setQuarter('');
                    if (vm.year === '') vm.setYear(RFQ_THIS_YEAR);
                  } else if (vm.year === '') {
                    vm.setYear(RFQ_THIS_YEAR);
                  }
                  vm.setPage(1);
                }}
              />
            </FormField>
            {vm.groupBy === 'quarter' ? (
              <FormField label="Quý">
                <HrmSelect
                  aria-label="Quý"
                  placeholder="Tất cả quý"
                  value={vm.quarter === '' ? '' : String(vm.quarter)}
                  options={[1, 2, 3, 4].map(q => ({ value: String(q), label: `Quý ${q}` }))}
                  onChange={v => {
                    vm.setQuarter(v ? Number(v) : '');
                    vm.setPage(1);
                  }}
                />
              </FormField>
            ) : (
              <FormField label="Năm">
                <HrmSelect
                  aria-label="Năm"
                  placeholder="Tất cả (5 năm)"
                  value={vm.year === '' ? '' : String(vm.year)}
                  options={RFQ_YEARS.map(y => ({ value: String(y), label: String(y) }))}
                  onChange={v => {
                    vm.setYear(v ? Number(v) : '');
                    vm.setPage(1);
                  }}
                />
              </FormField>
            )}
          </div>
        )}
      />

      {vm.winRateChips.length > 0 ? (
        <div className="rfq-chip-row">
          {vm.winRateChips.map(w => (
            <span key={w.supplierId} className={`badge ${w.rate >= 50 ? 'badge-success' : 'badge-error'}`}>
              {w.supplierName}: {w.won}/{w.total} ({w.rate}%)
            </span>
          ))}
        </div>
      ) : null}

      {vm.averages.data && vm.averages.data.length > 0 ? (
        <div className="rfq-chip-row">
          {vm.averages.data.map(a => (
            <span key={a.period} className="badge badge-info">
              {a.period}: {formatCurrencyFull(a.averagePrice)} ({a.quoteCount} BG)
            </span>
          ))}
        </div>
      ) : null}

      <RfqQuotesTable
        items={vm.items}
        isLoading={vm.list.isLoading}
        errorMessage={vm.list.isError ? getApiErrorMessage(vm.list.error, 'Không tải được báo giá.') : null}
        canUpdate={canUpdate}
        page={vm.page}
        totalPages={Math.max(1, vm.list.data?.totalPages ?? 1)}
        pageSize={vm.pageSize}
        totalItems={vm.list.data?.totalCount ?? 0}
        onPageChange={vm.setPage}
        onPageSizeChange={vm.setPageSize}
        getRowActions={vm.rowActions}
      />

      <RfqQuoteModal
        isOpen={vm.creating || Boolean(vm.editing)}
        isEditing={Boolean(vm.editing)}
        busy={vm.busy}
        categoryId={vm.categoryId}
        form={vm.form}
        formErrors={vm.formErrors}
        rootCategories={vm.rootCategories}
        materials={vm.materials}
        suppliers={vm.suppliers}
        projects={vm.projects}
        onCategoryChange={vm.setCategoryId}
        onPatchForm={vm.patchForm}
        onClearError={vm.clearError}
        onClose={vm.closeModal}
        onSave={vm.save}
      />
    </div>
  );
});
