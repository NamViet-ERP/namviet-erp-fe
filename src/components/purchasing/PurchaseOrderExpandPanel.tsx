import { useState } from 'react';
import type { OrderShipStage, PurchaseOrderRow } from '../../data/purchasingMock';
import ConfirmDialog from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';

const STAGES: { id: OrderShipStage; label: string }[] = [
  { id: 'producing', label: 'PRODUCING' },
  { id: 'loading', label: 'LOADING' },
  { id: 'shipping', label: 'SHIPPING' },
  { id: 'custom_trucking', label: 'CUSTOM-TRUCKING' },
  { id: 'done', label: 'DONE' },
];

const APPROVE_HINT = 'Bạn có muốn duyệt phiếu?';

function stageIndex(stage: OrderShipStage): number {
  const i = STAGES.findIndex(s => s.id === stage);
  return i < 0 ? 0 : i;
}

function sumQty(row: PurchaseOrderRow): number {
  return row.lines.reduce((n, l) => n + (Number(String(l.qty).replace(/[^\d.-]/g, '')) || 0), 0);
}

function taxDisplay(tax: string): string {
  const t = (tax || '0').trim();
  if (!t) return '0 %';
  return t.includes('%') ? t : `${t} %`;
}

interface PurchaseOrderExpandPanelProps {
  row: PurchaseOrderRow;
}

/**
 * Panel expand bám HTML ERP purchase_order:
 * flex > col-md-8 (dates 2×col-md-6 + table) | col-md-4 (avatars + progressbar)
 */
export default function PurchaseOrderExpandPanel({ row }: PurchaseOrderExpandPanelProps) {
  const active = stageIndex(row.shipStage);
  const totalQty = sumQty(row);
  const totalAmount = row.amountForeign || row.amount;
  const [confirmStage, setConfirmStage] = useState<string | null>(null);

  return (
    <div className="pur-po-detail">
      <div className="pur-po-detail__main">
        <div className="pur-po-detail__dates">
          <div className="pur-po-detail__dates-col">
            <div>
              Ngày dự kiến có hàng (ECD):{' '}
              <span className="pur-po-detail__date-val">{row.eta}</span>
            </div>
            <div>
              Ngày tàu khởi hành (ETD):{' '}
              <span className="pur-po-detail__date-val">{row.etd}</span>
            </div>
          </div>
          <div className="pur-po-detail__dates-col">
            <div>
              Ngày tàu cập cảng (ETA):{' '}
              <span className="pur-po-detail__date-val">{row.etaPort}</span>
            </div>
            <div>
              Ngày hàng về kho (ETW):{' '}
              <span className="pur-po-detail__date-val">{row.etw}</span>
            </div>
          </div>
        </div>

        <table className="pur-po-detail__table">
          <colgroup>
            <col style={{ width: 50 }} />
            <col />
            <col style={{ width: 50 }} />
            <col style={{ width: 50 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 50 }} />
            <col style={{ width: 100 }} />
          </colgroup>
          <thead>
            <tr>
              <th>STT</th>
              <th>Mặt hàng</th>
              <th>SL</th>
              <th>ĐVT</th>
              <th>Đơn giá</th>
              <th>Khuyến mãi</th>
              <th>Thuế</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {row.lines.map((l, i) => (
              <tr key={l.id}>
                <td className="pur-po-detail__td--center">{i + 1}</td>
                <td className="pur-po-detail__td--item">
                  <div className="pur-po-detail__item-name">{l.itemName}</div>
                </td>
                <td className="pur-po-detail__td--center">{l.qty}</td>
                <td className="pur-po-detail__td--center">{l.unit || 'Cái'}</td>
                <td className="pur-po-detail__td--right">{l.unitPrice}</td>
                <td className="pur-po-detail__td--right">{l.promo || '0'}</td>
                <td className="pur-po-detail__td--center">{taxDisplay(l.tax)}</td>
                <td className="pur-po-detail__td--right">{l.amount}</td>
              </tr>
            ))}
            <tr className="pur-po-detail__total">
              <td colSpan={2} className="pur-po-detail__total-label">Tổng cộng</td>
              <td className="pur-po-detail__td--center">{totalQty || ''}</td>
              <td colSpan={4} />
              <td className="pur-po-detail__td--right">{totalAmount}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pur-po-detail__side">
        <ul className="pur-po-progress__avatars" aria-hidden>
          {STAGES.map((s, i) => (
            <li key={`av-${s.id}`} className="pur-po-progress__slot">
              <img
                className={`pur-po-progress__avatar${i <= active ? ' is-active' : ''}`}
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E"
                alt=""
                width={25}
                height={25}
              />
            </li>
          ))}
        </ul>
        <ul className="pur-po-progress">
          {STAGES.map((s, i) => {
            const done = i <= active;
            return (
              <li key={s.id} className={`pur-po-progress__slot${done ? ' is-done' : ''}`}>
                <div className="pur-po-progress__label">{s.label}</div>
                <button
                  type="button"
                  className="pur-po-progress__check"
                  title={APPROVE_HINT}
                  aria-label={APPROVE_HINT}
                  onClick={() => setConfirmStage(s.label)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <ConfirmDialog
        isOpen={confirmStage != null}
        onClose={() => setConfirmStage(null)}
        onConfirm={() => {
          showToast('success', `Đã duyệt giai đoạn ${confirmStage} — ${row.code} (UI demo).`);
          setConfirmStage(null);
        }}
        title="Duyệt phiếu"
        message={APPROVE_HINT}
        confirmLabel="OK"
        cancelLabel="Cancel"
        variant="default"
      />
    </div>
  );
}
