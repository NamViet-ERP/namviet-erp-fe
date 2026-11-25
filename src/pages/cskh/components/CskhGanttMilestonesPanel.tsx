import { Calendar } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import { isoToDisplay } from '../../../lib/dates';

export interface ContractMilestoneItem {
  id: string;
  name: string;
  date: string;
  paymentPct: string;
  status: string;
  statusLabel: string;
  notes?: string;
}

interface CskhGanttMilestonesPanelProps {
  milestones: ContractMilestoneItem[];
}

export default function CskhGanttMilestonesPanel({ milestones }: CskhGanttMilestonesPanelProps) {
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
          CHI TIẾT MỐC HỢP ĐỒNG & THANH TOÁN VỚI CHỦ ĐẦU TƯ (MỐC PHÁP LÝ)
        </h2>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          {milestones.length > 0 ? `${milestones.length} mốc hợp đồng` : 'Chưa cấu hình mốc nghiệm thu'}
        </div>
      </div>

      {milestones.length === 0 ? (
        <div style={{ padding: '24px' }}>
          <EmptyState
            icon={Calendar}
            message="Chưa có dữ liệu mốc hợp đồng & thanh toán cho dự án này."
          />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '880px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '38%' }}>
                  MỐC HỢP ĐỒNG
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '14%' }}>
                  HẠN CAM KẾT
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '12%' }}>
                  THANH TOÁN
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '18%' }}>
                  TÌNH TRẠNG PHÁP LÝ
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '18%' }}>
                  GHI CHÚ ĐỐI SOÁT
                </th>
              </tr>
            </thead>
            <tbody>
              {milestones.map(cm => {
                const isDelay = cm.status === 'delayed';
                const isDone = cm.status === 'done' || cm.status === 'on_track';
                return (
                  <tr
                    key={cm.id}
                    style={{
                      backgroundColor: isDelay ? 'rgba(254, 242, 242, 0.7)' : '#ffffff',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      {cm.name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>
                      {isoToDisplay(cm.date)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                      {cm.paymentPct}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: isDone ? '#dcfce7' : isDelay ? '#fee2e2' : cm.status === 'warranty' ? '#ede9fe' : '#e0f2fe',
                        color: isDone ? '#15803d' : isDelay ? '#b91c1c' : cm.status === 'warranty' ? '#6d28d9' : '#0369a1',
                      }}>
                        {cm.statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#64748b' }}>
                      {cm.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
