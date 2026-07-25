import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import TableSkeletonRows from '../ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useCreateImportFromPo, usePoImportPreview } from '../../hooks/useImports';
import { usePermission } from '../../hooks/usePermission';
import { formatCurrency } from '../../utils/formatCurrency';
import type { PoImportLinePreviewApiDto } from '../../types/api/poImportApi';

interface CreateImportFromPoModalProps {
  isOpen: boolean;
  poCode: string;
  onClose: () => void;
  onCreated: (voucherCode: string) => void;
}

type LineDraft = {
  selected: boolean;
  qty: string;
};

function defaultDrafts(lines: PoImportLinePreviewApiDto[]): Record<number, LineDraft> {
  const next: Record<number, LineDraft> = {};
  for (const line of lines) {
    const available = Number(line.available) || 0;
    next[line.poItemId] = {
      selected: available > 0,
      qty: available > 0 ? String(available) : '0',
    };
  }
  return next;
}

/** Chọn dòng + SL còn lại trên PO để tạo phiếu nhập nháp. */
export default function CreateImportFromPoModal({
  isOpen,
  poCode,
  onClose,
  onCreated,
}: CreateImportFromPoModalProps) {
  const previewQuery = usePoImportPreview(poCode, isOpen);
  const createMutation = useCreateImportFromPo();
  const { has } = usePermission();
  const canViewPrices = has('wms.prices.view');
  const [drafts, setDrafts] = useState<Record<number, LineDraft>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const lines = previewQuery.data?.lines ?? [];

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    if (previewQuery.data?.lines) {
      setDrafts(defaultDrafts(previewQuery.data.lines));
    }
  }, [isOpen, previewQuery.data]);

  const selectedCount = useMemo(
    () => Object.values(drafts).filter(d => d.selected).length,
    [drafts],
  );

  const setLine = (poItemId: number, patch: Partial<LineDraft>) => {
    setDrafts(prev => ({
      ...prev,
      [poItemId]: { ...prev[poItemId], ...patch },
    }));
  };

  const submit = async () => {
    setFormError(null);
    const items: { poItemId: number; qty: number }[] = [];
    for (const line of lines) {
      const draft = drafts[line.poItemId];
      if (!draft?.selected) continue;
      const qty = Number(draft.qty);
      if (!Number.isFinite(qty) || qty <= 0) {
        setFormError(`SL nhập không hợp lệ: ${line.name}`);
        return;
      }
      if (qty > line.available + 1e-9) {
        setFormError(`${line.name}: chỉ còn ${line.available} ${line.unit}`);
        return;
      }
      items.push({ poItemId: line.poItemId, qty });
    }
    if (items.length === 0) {
      setFormError('Chọn ít nhất một mặt hàng còn SL.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        poCode,
        request: { items },
      });
      onCreated(created.voucherCode || created.id);
      onClose();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không tạo được phiếu nhập từ PO.'));
    }
  };

  const meta = previewQuery.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tạo phiếu nhập từ ${poCode}`}
      size="xl"
      footer={(
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <span className="text-sm text-[var(--md-on-surface-variant)]">
            {selectedCount > 0 ? `Đã chọn ${selectedCount} dòng` : 'Chưa chọn dòng'}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={createMutation.isPending}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={createMutation.isPending || previewQuery.isLoading || lines.every(l => l.available <= 0)}
              onClick={() => { void submit(); }}
            >
              {createMutation.isPending ? 'Đang tạo…' : 'Tạo phiếu nháp'}
            </button>
          </div>
        </div>
      )}
    >
      {meta ? (
        <p className="mb-3 text-sm text-[var(--md-on-surface-variant)]">
          KHMH <strong>{meta.planCode || '—'}</strong>
          {' · '}
          {meta.supplierName || '—'}
          {' · '}
          DA {meta.projectCode || '—'}
        </p>
      ) : null}

      {formError ? (
        <p className="mb-3 text-sm text-[var(--md-error)]" role="alert">{formError}</p>
      ) : null}

      {previewQuery.isError ? (
        <EmptyState
          message={getApiErrorMessage(previewQuery.error, 'Không tải được dòng còn lại trên PO.')}
          action={(
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { void previewQuery.refetch(); }}>
              Thử lại
            </button>
          )}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="pur-erp__table w-full">
            <thead>
              <tr>
                <th className="w-10" />
                <th>Mặt hàng</th>
                <th className="text-right">Đặt</th>
                <th className="text-right">Đã nhận</th>
                <th className="text-right">Chờ NK</th>
                <th className="text-right">Còn lại</th>
                {canViewPrices && <th className="text-right">Đơn giá</th>}
                <th className="text-right w-28">SL nhập</th>
              </tr>
            </thead>
            <tbody>
              {previewQuery.isLoading ? (
                <TableSkeletonRows rows={4} colSpan={canViewPrices ? 8 : 7} />
              ) : lines.length === 0 ? (
                <tr>
                  <td colSpan={canViewPrices ? 8 : 7}>
                    <EmptyState message="PO không còn dòng hàng để nhập." />
                  </td>
                </tr>
              ) : (
                lines.map(line => {
                  const draft = drafts[line.poItemId] ?? { selected: false, qty: '0' };
                  const disabled = line.available <= 0;
                  return (
                    <tr key={line.poItemId} className={disabled ? 'opacity-60' : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          checked={draft.selected && !disabled}
                          disabled={disabled || createMutation.isPending}
                          onChange={e => setLine(line.poItemId, { selected: e.target.checked })}
                          aria-label={`Chọn ${line.name}`}
                        />
                      </td>
                      <td>
                        <div className="font-medium">{line.name}</div>
                        <div className="text-xs text-[var(--md-on-surface-variant)]">
                          {line.materialCode || '—'} · {line.unit}
                        </div>
                      </td>
                      <td className="text-right tabular-nums">{line.ordered}</td>
                      <td className="text-right tabular-nums">{line.received}</td>
                      <td className="text-right tabular-nums">{line.reservedPending}</td>
                      <td className="text-right tabular-nums font-semibold">{line.available}</td>
                      {canViewPrices && (
                        <td className="text-right tabular-nums">{formatCurrency(line.unitPrice)}</td>
                      )}
                      <td className="text-right">
                        <input
                          type="number"
                          className="form-input form-input-sm text-right w-24"
                          min={0}
                          max={line.available}
                          step="any"
                          disabled={disabled || !draft.selected || createMutation.isPending}
                          value={draft.qty}
                          onChange={e => setLine(line.poItemId, { qty: e.target.value })}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
