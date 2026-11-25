import { FileText, Lock, Unlock } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import TableShell from '../../components/ui/TableShell';
import { printVoucherWithFeedback } from '../../lib/wms/printVoucher';
import { fmtStocktakeDiff } from '../../lib/wms/stockQtyFormat';
import { buildStocktakePrintPayload } from '../../lib/wms/voucherPrintBuilders';
import type { Stocktake } from '../../types';
import { diffTone } from './stocktakeHelpers';

interface StocktakeDetailModalProps {
  isOpen: boolean;
  stocktake: Stocktake | null;
  onClose: () => void;
}

export default function StocktakeDetailModal({
  isOpen,
  stocktake,
  onClose,
}: StocktakeDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Phiếu kiểm kê — ${stocktake?.voucherCode || ''}`}
      size="xl"
      footer={
        stocktake ? (
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              type="button"
              variant="outlined"
              size="sm"
              leftIcon={FileText}
              onClick={() => printVoucherWithFeedback(buildStocktakePrintPayload(stocktake))}
            >
              In phiếu
            </Button>
            <Button type="button" variant="outlined" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outlined" onClick={onClose}>
            Đóng
          </Button>
        )
      }
    >
      {stocktake && (
        <>
          <div className="wms-detail-summary">
            <div>
              <span className="wms-detail-tile__label">Mã chứng từ</span>
              <p className="entity-code">{stocktake.voucherCode}</p>
            </div>
            <div>
              <span className="wms-detail-tile__label">Ngày</span>
              <p className="font-medium text-sm">{stocktake.date}</p>
            </div>
            <div>
              <span className="wms-detail-tile__label">Kho dự án</span>
              <p className="font-medium text-sm">{stocktake.warehouseName}</p>
            </div>
            <div>
              <span className="wms-detail-tile__label">Trạng thái</span>
              <div className="mt-0.5">
                <Badge status={stocktake.status} />
              </div>
            </div>
            <div>
              <span className="wms-detail-tile__label">Tình trạng</span>
              <div className="mt-0.5">
                <Badge status={stocktake.condition} />
              </div>
            </div>
            <div>
              <span className="wms-detail-tile__label">Đóng băng</span>
              <div className="mt-0.5">
                <StatusBadge
                  tone={stocktake.isFrozen ? 'error' : 'success'}
                  icon={stocktake.isFrozen ? Lock : Unlock}
                  label={stocktake.isFrozen ? 'Đang đóng băng' : 'Đã mở băng'}
                />
              </div>
            </div>
            {stocktake.note && (
              <div className="col-span-2">
                <span className="wms-detail-tile__label">Ghi chú</span>
                <p className="text-sm">{stocktake.note}</p>
              </div>
            )}
          </div>

          <TableShell
            tableClassName="wms-inventory-table wms-voucher-detail-table"
            colSpan={6}
            isEmpty={!stocktake.items?.length}
            emptyMessage="Không có mặt hàng nào"
            header={
              <tr>
                <th className="table-header-cell">Tên hàng</th>
                <th className="table-header-cell">Mã VT</th>
                <th className="table-header-cell text-right">Tồn HT</th>
                <th className="table-header-cell text-right">SL thực tế</th>
                <th className="table-header-cell text-right">Chênh lệch</th>
                <th className="table-header-cell">Lý do</th>
              </tr>
            }
          >
            {(stocktake.items ?? []).map((it, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell">{it.name}</td>
                <td className="table-cell font-mono text-xs">{it.sku}</td>
                <td className="table-cell text-right tabular-nums">{it.systemQty}</td>
                <td className="table-cell text-right tabular-nums">{it.actualQty}</td>
                <td className={`table-cell text-right font-bold tabular-nums ${diffTone(it.systemQty, it.actualQty)}`}>
                  {fmtStocktakeDiff(it.systemQty, it.actualQty)}
                </td>
                <td className="table-cell text-xs text-[var(--md-on-surface-variant)]">
                  {it.reason || '—'}
                </td>
              </tr>
            ))}
          </TableShell>
        </>
      )}
    </Modal>
  );
}
