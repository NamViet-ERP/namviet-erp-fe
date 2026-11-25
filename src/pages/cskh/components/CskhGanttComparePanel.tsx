import { formatSignedPct } from '../../../lib/cskh/commandCenter';
import { isoWeekNumber, type CskhProgressSnapshot } from '../../../lib/cskh/opsWorkspace';

interface SnapshotCompareResult {
  current?: CskhProgressSnapshot;
  previous?: CskhProgressSnapshot;
  delta: number;
  count: number;
}

interface CskhGanttComparePanelProps {
  comparison: SnapshotCompareResult;
  openBottlenecksCount: number;
  onClose: () => void;
}

export default function CskhGanttComparePanel({
  comparison,
  openBottlenecksCount,
  onClose,
}: CskhGanttComparePanelProps) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #bfdbfe',
      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
      marginBottom: '16px',
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
          📊 ĐỐI SOÁT TIẾN ĐỘ THỰC TẾ GIỮA CÁC TUẦN SNAPSHOT ({comparison.count} MỐC ĐÃ LƯU)
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
        >
          ✕ Đóng
        </button>
      </div>
      {comparison.current && comparison.previous ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Tuần {isoWeekNumber(new Date(comparison.previous.at))} (W{isoWeekNumber(new Date(comparison.previous.at))}) · Mốc trước
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{comparison.previous.actualPct}%</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Kế hoạch: {comparison.previous.planPct}%</div>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '11px', color: '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>
              Tuần {isoWeekNumber(new Date(comparison.current.at))} (W{isoWeekNumber(new Date(comparison.current.at))}) · Mốc mới nhất
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d' }}>{comparison.current.actualPct}%</div>
            <div style={{ fontSize: '12px', color: '#15803d' }}>Kế hoạch: {comparison.current.planPct}%</div>
          </div>
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: comparison.delta < 0 ? '#fef2f2' : '#f0fdf4',
            border: comparison.delta < 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
          }}>
            <div style={{ fontSize: '11px', color: comparison.delta < 0 ? '#b91c1c' : '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>
              Biến động thực tế
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: comparison.delta < 0 ? '#dc2626' : '#15803d' }}>
              {formatSignedPct(comparison.delta)}
            </div>
            <div style={{ fontSize: '12px', color: comparison.delta < 0 ? '#b91c1c' : '#15803d' }}>
              {comparison.delta > 0 ? 'Tiến độ tăng trưởng' : comparison.delta === 0 ? 'Tiến độ chững lại' : 'Tiến độ bị thụt lùi'}
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: 600 }}>Điểm nghẽn đang mở</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#b45309' }}>{openBottlenecksCount} điểm</div>
            <div style={{ fontSize: '12px', color: '#b45309' }}>
              {openBottlenecksCount > 0 ? 'Cần giải tỏa kịp thời' : 'Không có điểm nghẽn'}
            </div>
          </div>
        </div>
      ) : comparison.current ? (
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
          ℹ️ Đã có 1 snapshot (Tuần {isoWeekNumber(new Date(comparison.current.at))} - {comparison.current.actualPct}% thực tế). Cần thêm ít nhất 1 snapshot nữa sau giao ban để hệ thống tự động đối soát chênh lệch giữa hai tuần.
        </div>
      ) : (
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
          ℹ️ Chưa có snapshot nào. Bấm <strong>Snapshot Tuần</strong> ở góc phải để lưu mốc tiến độ đầu tiên vào cơ sở dữ liệu.
        </div>
      )}
    </div>
  );
}
