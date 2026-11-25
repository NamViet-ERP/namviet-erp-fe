import { Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { isoToDisplay, toIsoDate } from '../../../lib/dates';
import { formatSignedPct } from '../../../lib/cskh/commandCenter';
import { ganttItemPlanPct, type CskhGanttItem } from '../../../lib/cskh/opsWorkspace';

interface CskhGanttTablePanelProps {
  items: CskhGanttItem[];
  actualPct: number;
  planPct: number;
  wbsWriteDisabled: boolean;
  onEdit: (row: CskhGanttItem) => void;
  onApplyTemplate: () => void;
  onCreate: () => void;
}

export default function CskhGanttTablePanel({
  items,
  actualPct,
  planPct,
  wbsWriteDisabled,
  onEdit,
  onApplyTemplate,
  onCreate,
}: CskhGanttTablePanelProps) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <h2 style={{
          fontSize: '13px',
          fontWeight: 800,
          color: '#0f172a',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          margin: 0,
        }}>
          CHI TIẾT TIẾN ĐỘ CÁC ĐỘI THI CÔNG (% KH HÔM NAY VS % TT THỰC TẾ)
        </h2>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Hôm nay: <span style={{ fontWeight: 600 }}>{isoToDisplay(toIsoDate(new Date()))}</span> · Tiến độ đạt:{' '}
          <strong style={{ color: actualPct >= planPct ? '#16a34a' : '#dc2626' }}>{actualPct}%</strong>{' '}
          (Kế hoạch: {planPct}%)
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '28%' }}>
                HẠNG MỤC GANTT NỘI BỘ
              </th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '16%' }}>
                BỘ PHẬN PHỤ TRÁCH
              </th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '10%' }}>
                THỜI HẠN
              </th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '7%' }}>
                % KH
              </th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '7%' }}>
                % TT
              </th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '7%' }}>
                Δ LỆCH
              </th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '15%' }}>
                TIMELINE TIẾN ĐỘ THỰC HIỆN
              </th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '10%' }}>
                TRẠNG THÁI
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(row => {
              const plan = ganttItemPlanPct(row);
              const delta = row.actualPct - plan;
              const isBottleneck = row.statusLabel?.includes('Nghẽn') || row.statusTone === 'danger' || delta <= -20;

              let badgeBg = '#e0f2fe';
              let badgeColor = '#0369a1';
              if (row.actualPct >= 100) {
                badgeBg = '#dcfce7';
                badgeColor = '#15803d';
              } else if (isBottleneck) {
                badgeBg = '#fee2e2';
                badgeColor = '#b91c1c';
              } else if (row.statusTone === 'warn' || row.statusLabel?.includes('Chờ')) {
                badgeBg = '#fef3c7';
                badgeColor = '#b45309';
              }

              const progressColor = row.actualPct >= 100
                ? '#10b981'
                : isBottleneck
                  ? '#ef4444'
                  : '#0284c7';

              return (
                <tr
                  key={row.id}
                  onClick={wbsWriteDisabled ? undefined : () => onEdit(row)}
                  aria-disabled={wbsWriteDisabled}
                  style={{
                    backgroundColor: isBottleneck ? 'rgba(254, 242, 242, 0.7)' : '#ffffff',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: wbsWriteDisabled ? 'default' : 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  title="Nhấn để chỉnh sửa hoặc cập nhật tiến độ"
                >
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {row.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                    {row.department || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                    {row.days} ngày
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', textAlign: 'center' }}>
                    {plan}%
                  </td>
                  <td style={{
                    padding: '14px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: row.actualPct >= 100 ? '#16a34a' : isBottleneck ? '#dc2626' : '#475569',
                    textAlign: 'center',
                  }}>
                    {row.actualPct}%
                  </td>
                  <td style={{
                    padding: '14px 16px',
                    fontSize: '13px',
                    fontWeight: delta < 0 ? 700 : 500,
                    color: delta < 0 ? '#dc2626' : '#64748b',
                    textAlign: 'center',
                  }}>
                    {formatSignedPct(delta)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, row.actualPct))}%`,
                          height: '100%',
                          backgroundColor: progressColor,
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      whiteSpace: 'nowrap',
                    }}>
                      {row.statusLabel || (row.actualPct >= 100 ? 'Hoàn thành' : 'Đang thực hiện')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        backgroundColor: '#fafafa',
        borderTop: '1px solid #f1f5f9',
      }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          💡 Nhấp vào từng dòng để cập nhật % thực tế hoặc bộ phận phụ trách
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {items.length === 0 ? (
            <Button type="button" variant="outlined" disabled={wbsWriteDisabled} onClick={onApplyTemplate}>
              Áp dụng bảng chuẩn
            </Button>
          ) : null}
          <Button type="button" size="sm" leftIcon={Plus} disabled={wbsWriteDisabled} onClick={onCreate}>
            Thêm hạng mục
          </Button>
        </div>
      </div>
    </div>
  );
}
