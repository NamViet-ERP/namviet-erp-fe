import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import type { PurchasePlanRow } from '../../data/purchasingMock';

export type PlanDetailMode = 'forecast' | 'outbound' | 'quote';

interface PlanDetailModalProps {
  plan: PurchasePlanRow | null;
  mode: PlanDetailMode | null;
  onClose: () => void;
}

type ForecastTab = 'production' | 'purchase' | 'stock';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function parseEmployeeDay(value: string): { name: string; date?: string } {
  const match = value.match(/^(.+?)\s*[—–-]\s*(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}:\d{2})?)$/);
  if (match) return { name: match[1].trim(), date: match[2].trim() };
  return { name: value.trim() };
}

function isEmployeeColumn(column: string): boolean {
  return column === 'Nhân viên' || column.startsWith('Nhân viên (');
}

function renderOutboundCell(column: string, value: string) {
  if (!isEmployeeColumn(column)) {
    return (
      <span className="pur-plan-detail__cell-text" title={value}>
        {value}
      </span>
    );
  }

  const isEmployeeDayColumn = column.includes('Ngày');
  const { name, date } = isEmployeeDayColumn
    ? parseEmployeeDay(value)
    : { name: value.trim(), date: undefined };

  const display = isEmployeeDayColumn && date
    ? `${name} - ${date.split(' ')[0]}`
    : name;

  return (
    <span className="pur-plan-detail__emp" title={value}>
      <span className="pur-plan-detail__emp-avatar" aria-hidden>{getInitials(name)}</span>
      {isEmployeeDayColumn ? (
        <span className="pur-plan-detail__emp-name pur-plan-detail__emp-name--inline">{display}</span>
      ) : (
        <span className="pur-plan-detail__emp-text">
          <span className="pur-plan-detail__emp-name">{name}</span>
        </span>
      )}
    </span>
  );
}

function outboundCellClass(column: string): string | undefined {
  const classes = [
    column === 'Số lượng' ? 'pur-plan-detail__num' : undefined,
    isEmployeeColumn(column) ? 'pur-plan-detail__td--emp' : undefined,
    column === 'Kho hàng' ? 'pur-plan-detail__td--warehouse' : undefined,
    column === 'Khách hàng' ? 'pur-plan-detail__td--customer' : undefined,
    column === 'Serial' ? 'pur-plan-detail__td--serial' : undefined,
    column === 'Đơn hàng' ? 'pur-plan-detail__td--order' : undefined,
  ].filter(Boolean);
  return classes.length > 0 ? classes.join(' ') : undefined;
}

function extractGroupBadgeCount(label: string): string {
  const match = label.match(/\((\d+)\)\s*$/);
  return match?.[1] ?? '0';
}

function getOutboundColumnWidth(groupKey: string, column: string): string | undefined {
  const holdWidths: Record<string, string> = {
    'Kho hàng': '23%',
    Serial: '15%',
    'Khách hàng': '21%',
    'Nhân viên': '20%',
    'Đơn hàng': '14%',
    'Số lượng': '7%',
  };
  const preorderWidths: Record<string, string> = {
    'Nhân viên (Ngày)': '34%',
    'Đơn hàng': '22%',
    'Khách hàng': '32%',
    'Số lượng': '12%',
  };

  if (groupKey === 'hold') return holdWidths[column];
  if (groupKey === 'pre') return preorderWidths[column];
  return undefined;
}

/** Modal chi tiết ô bảng KHMH — UI bám ERP purchase_plan. */
export default function PlanDetailModal({ plan, mode, onClose }: PlanDetailModalProps) {
  const [forecastTab, setForecastTab] = useState<ForecastTab>('production');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  if (!plan || !mode) return null;

  const production = plan.forecastProduction ?? [];
  const purchase = plan.forecastPurchase ?? [];
  const stock = plan.stockDetail ?? [];
  const outboundGroups = plan.outboundGroups ?? [];
  const quoteDetail = plan.quoteDetail ?? [];

  const title =
    mode === 'forecast'
      ? 'Thông tin chi tiết dự kiến có hàng'
      : mode === 'outbound'
        ? 'Thông tin chi tiết xuất hàng'
        : 'Xem số lượng chi tiết báo giá > 70%';

  const outboundTotal = outboundGroups.reduce(
    (sum, g) => sum + (Number(String(g.total).replace(/[^\d.-]/g, '')) || 0),
    0,
  );
  const outboundCountLabel = outboundGroups.length > 0
    ? outboundGroups.map(g => extractGroupBadgeCount(g.label)).join(' + ')
    : '0';
  const quoteTotal = quoteDetail.reduce(
    (sum, r) => sum + (Number(String(r.qty).replace(/[^\d.-]/g, '')) || 0),
    0,
  );

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const isGroupOpen = (key: string) => openGroups[key] ?? true;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      size={mode === 'outbound' ? 'xl' : mode === 'quote' ? 'lg' : 'md'}
      footer={(
        <div className="md-dialog__footer-actions pur-plan-detail__footer">
          {mode === 'outbound' ? (
            <p className="pur-plan-detail__outbound-sum">
              Số lượng xuất hàng ({outboundCountLabel}) :{' '}
              <strong>{outboundTotal || plan.forecastOutbound || 0}</strong>
            </p>
          ) : <span />}
          <button type="button" className="btn btn-outlined pur-plan-detail__exit" onClick={onClose}>Thoát</button>
        </div>
      )}
    >
      <div className="pur-plan-detail">
        {mode === 'forecast' && (
          <>
            <div className="pur-plan-detail__tabs" role="tablist">
              {(
                [
                  { id: 'production', label: 'Sản xuất' },
                  { id: 'purchase', label: 'Mua hàng' },
                  { id: 'stock', label: 'Tồn kho thực tế' },
                ] as const
              ).map(t => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={forecastTab === t.id}
                  className={`pur-plan-detail__tab${forecastTab === t.id ? ' is-active' : ''}`}
                  onClick={() => setForecastTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {forecastTab === 'production' && (
              <table className="pur-plan-detail__table">
                <thead>
                  <tr>
                    <th>Số lệnh chi tiết</th>
                    <th>Model</th>
                    <th>Số lượng</th>
                    <th>Ngày dự kiến có hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {production.length === 0 ? (
                    <tr><td colSpan={4}>Chưa có dữ liệu sản xuất.</td></tr>
                  ) : production.map((r, i) => (
                    <tr key={`${r.commandNo}-${i}`}>
                      <td>{r.commandNo}</td>
                      <td>{r.model}</td>
                      <td className="pur-plan-detail__num">{r.qty}</td>
                      <td>{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {forecastTab === 'purchase' && (
              <table className="pur-plan-detail__table">
                <thead>
                  <tr>
                    <th>Đơn đặt hàng</th>
                    <th>Ngày đặt hàng</th>
                    <th>Số lượng</th>
                    <th>Ngày dự kiến có hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.length === 0 ? (
                    <tr><td colSpan={4}>Chưa có đơn mua hàng.</td></tr>
                  ) : purchase.map((r, i) => (
                    <tr key={`${r.orderCode}-${i}`}>
                      <td>{r.orderCode}</td>
                      <td>{r.orderDate}</td>
                      <td className="pur-plan-detail__num">{r.qty}</td>
                      <td>{r.expectedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {forecastTab === 'stock' && (
              <table className="pur-plan-detail__table">
                <thead>
                  <tr>
                    <th>Kho hàng</th>
                    <th>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.length === 0 ? (
                    <tr><td colSpan={2}>Chưa có tồn kho.</td></tr>
                  ) : stock.map((r, i) => (
                    <tr key={`${r.warehouse}-${i}`}>
                      <td>{r.warehouse}</td>
                      <td className="pur-plan-detail__num">{r.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {mode === 'outbound' && (
          <div className="pur-plan-detail__groups">
            {outboundGroups.length === 0 ? (
              <p className="pur-plan-detail__empty">Chưa có chi tiết xuất hàng.</p>
            ) : outboundGroups.map(g => {
              const open = isGroupOpen(g.key);
              return (
                <div key={g.key} className="pur-plan-detail__group">
                  <table className="pur-plan-detail__table pur-plan-detail__table--summary">
                    <thead>
                      <tr>
                        <th className="pur-plan-detail__th-toggle" aria-hidden />
                        <th>Tên</th>
                        <th className="pur-plan-detail__num">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="pur-plan-detail__td-toggle">
                          <button
                            type="button"
                            className="pur-plan-detail__toggle"
                            onClick={() => toggleGroup(g.key)}
                            aria-expanded={open}
                            aria-label={`${open ? 'Thu gọn' : 'Mở rộng'} ${g.label}`}
                          >
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td className="pur-plan-detail__group-label">{g.label}</td>
                        <td className="pur-plan-detail__num">{g.total}</td>
                      </tr>
                    </tbody>
                  </table>
                  {open ? (
                    <div className="pur-plan-detail__table-scroll table-scroll overflow-x-auto">
                      <table
                        className={[
                          'pur-plan-detail__table',
                          'pur-plan-detail__table--nested',
                          `pur-plan-detail__table--${g.key}`,
                        ].join(' ')}
                      >
                        <colgroup>
                          {g.columns.map(column => (
                            <col key={column} style={{ width: getOutboundColumnWidth(g.key, column) }} />
                          ))}
                        </colgroup>
                        <thead>
                          <tr>
                            {g.columns.map(column => (
                              <th key={column} className={outboundCellClass(column)}>
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((row, ri) => (
                            <tr key={ri}>
                              {g.columns.map((column, ci) => (
                                <td key={`${column}-${ci}`} className={outboundCellClass(column)}>
                                  {renderOutboundCell(column, row[ci] ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr className="pur-plan-detail__total-row">
                            <td colSpan={Math.max(1, g.columns.length - 1)}>TỔNG CỘNG</td>
                            <td className="pur-plan-detail__num">{g.total}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {mode === 'quote' && (
          <table className="pur-plan-detail__table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Ngày</th>
                <th>Khách hàng</th>
                <th>Báo giá</th>
                <th>Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {quoteDetail.length === 0 ? (
                <tr><td colSpan={5}>Chưa có báo giá &gt; 70%.</td></tr>
              ) : (
                <>
                  {quoteDetail.map((r, i) => (
                    <tr key={`${r.quoteCode}-${i}`}>
                      <td className="pur-plan-detail__num">{i + 1}</td>
                      <td>{r.date}</td>
                      <td className="pur-plan-detail__bold">{r.customer}</td>
                      <td>{r.quoteCode}</td>
                      <td className="pur-plan-detail__num">{r.qty}</td>
                    </tr>
                  ))}
                  <tr className="pur-plan-detail__total-row">
                    <td colSpan={4}>Tổng cộng</td>
                    <td className="pur-plan-detail__num">{quoteTotal || plan.quoteOver70}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}
