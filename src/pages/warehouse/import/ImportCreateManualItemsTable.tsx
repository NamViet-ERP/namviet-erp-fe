import { Trash2 } from 'lucide-react';
import type { Material } from '../../../types';
import QtyStepper from '../../../components/ui/QtyStepper';
import MaterialAutocomplete from '../../../components/ui/MaterialAutocomplete';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';
import { importLineTotal } from './importUtils';
import type { ImportFormFieldErrors } from '../../../lib/wms/importFormSchema';
import { findDuplicateMaterialLineIndex } from '../../../lib/wms/voucherDuplicateMaterial';

export interface ImportCreateManualItemsTableProps {
  items: MaterialQtyPriceLine[];
  onItemsChange: (items: MaterialQtyPriceLine[]) => void;
  materials: Material[];
  canViewPrices: boolean;
  formGrandTotal: number;
  errors?: ImportFormFieldErrors;
  materialUnit: (code: string) => string;
  onMaterialLineChange?: (index: number, materialCode: string) => void;
  onDuplicateMaterialAttempt?: (lineIndex: number) => void;
  qtyColumnLabel?: string;
}

export default function ImportCreateManualItemsTable({
  items,
  onItemsChange,
  materials,
  canViewPrices,
  formGrandTotal,
  errors,
  materialUnit,
  onMaterialLineChange,
  onDuplicateMaterialAttempt,
  qtyColumnLabel = 'SL',
}: ImportCreateManualItemsTableProps) {
  const amountColSpan = canViewPrices ? 4 : 2;

  return (
    <div className="overflow-x-auto table-scroll">
      <table className="form-table import-items-table import-items-table--import import-items-table--manual text-xs">
        <thead>
          <tr>
            <th className="table-header-cell text-center">Mặt hàng</th>
            <th className="table-header-cell text-center import-manual-col-qty">{qtyColumnLabel}</th>
            <th className="table-header-cell text-center import-po-col-unit">ĐVT</th>
            {canViewPrices && <th className="table-header-cell text-center">Đơn giá</th>}
            {canViewPrices && (
              <th className="table-header-cell text-center import-po-col-amount">Thành tiền</th>
            )}
            <th className="table-header-cell text-center import-manual-col-action" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const total = importLineTotal(it);
            const lineErr = errors?.lineErrors?.[idx];
            return (
              <tr key={idx} className="table-row">
                <td className="table-cell align-top">
                  <MaterialAutocomplete
                    compact
                    value={it.materialCode}
                    fallbackLabel={it.materialName}
                    onChange={code => {
                      if (code.trim()) {
                        const dupIdx = findDuplicateMaterialLineIndex(items, code, idx);
                        if (dupIdx !== null) {
                          onDuplicateMaterialAttempt?.(idx);
                          return;
                        }
                      }
                      const nextMat = materials.find(m => m.materialCode === code);
                      const next = [...items];
                      next[idx] = {
                        ...next[idx],
                        materialCode: code,
                        materialName: nextMat?.materialName ?? next[idx].materialName,
                        unit: nextMat?.unit ?? next[idx].unit,
                      };
                      onItemsChange(next);
                      onMaterialLineChange?.(idx, code);
                    }}
                    materials={materials}
                    placeholder="- Vật tư -"
                  />
                  {lineErr?.materialCode && (
                    <p className="mt-0.5 text-[length:var(--fs-micro)] text-[var(--md-error)]">
                      {lineErr.materialCode}
                    </p>
                  )}
                </td>
                <td className="table-cell text-center align-top import-manual-col-qty">
                  <div className="import-cell-placeholder import-cell-placeholder--center">
                    <QtyStepper
                      value={it.qty}
                      className={`qty-stepper--compact${lineErr?.qty ? ' qty-stepper--error' : ''}`}
                      onChange={qtyVal => {
                        const next = [...items];
                        next[idx] = { ...next[idx], qty: qtyVal };
                        onItemsChange(next);
                      }}
                    />
                  </div>
                  {lineErr?.qty && (
                    <p className="mt-0.5 text-[length:var(--fs-micro)] text-[var(--md-error)] text-center">
                      {lineErr.qty}
                    </p>
                  )}
                </td>
                <td className="table-cell text-center import-po-col-unit">
                  <div className="import-cell-placeholder import-cell-placeholder--center">
                    {it.unit?.trim()
                      || (it.materialCode ? materialUnit(it.materialCode) : '-')}
                  </div>
                </td>
                {canViewPrices && (
                  <td className="table-cell text-center align-top">
                    <CurrencyInput
                      className={`form-input text-xs text-right input-no-spinner${lineErr?.unitPrice ? ' form-input--error' : ''}`}
                      value={it.unitPrice}
                      onChange={(_raw, numeric) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], unitPrice: numeric > 0 ? String(numeric) : '' };
                        onItemsChange(next);
                      }}
                    />
                    {lineErr?.unitPrice && (
                      <p className="mt-0.5 text-[length:var(--fs-micro)] text-[var(--md-error)] text-center">
                        {lineErr.unitPrice}
                      </p>
                    )}
                  </td>
                )}
                {canViewPrices && (
                  <td className="table-cell text-center tabular-nums font-semibold text-[var(--md-on-surface)] import-po-col-amount">
                    <div className="import-cell-placeholder import-cell-placeholder--center font-semibold">
                      {total > 0 ? formatCurrency(total) : '-'}
                    </div>
                  </td>
                )}
                <td className="table-cell text-center import-manual-col-action">
                  <div className="import-cell-placeholder import-cell-placeholder--center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="p-1 text-[var(--md-error)] opacity-80 hover:opacity-100"
                        aria-label="Xóa dòng"
                        onClick={() => onItemsChange(items.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        {canViewPrices && (
          <tfoot>
            <tr className="border-t border-[var(--md-outline-variant)]">
              <td
                colSpan={amountColSpan}
                className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2"
              >
                Tổng cộng
              </td>
              <td className="table-cell text-center font-bold tabular-nums text-[var(--md-primary)] py-2">
                {formatCurrency(formGrandTotal)} đ
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
