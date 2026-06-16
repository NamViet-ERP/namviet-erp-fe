import { useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../utils/formatCurrency';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';

interface ReconciliationItem {
  sku: string;
  name: string;
  estPrice: number;
  poPrice: number;
  ordered: number;
  received: number;
  unit: string;
}

interface ProcessedItem extends ReconciliationItem {
  diffVal: number;
  diffPct: number;
  totalEst: number;
  totalPo: number;
  exceedLimit: boolean;
}

interface PoRecord {
  code: string;
  project: string;
  supplier: string;
  date: string;
  items: ReconciliationItem[];
}

const mockReconciliationData: Record<string, PoRecord> = {
  'PO-2026-001': {
    code: 'PO-2026-001',
    project: 'Dự án 1 - Khách sạn Mường Thanh',
    supplier: 'Công ty TNHH Thép Việt Nhật',
    date: '02/06/2026',
    items: [
      { sku: 'THEP-D10', name: 'Thép cuộn Phi 10 Hòa Phát', estPrice: 15000, poPrice: 16200, ordered: 5000, received: 5000, unit: 'kg' },
      { sku: 'XI-MANG-40', name: 'Xi măng PCB40 Hoàng Long', estPrice: 85000, poPrice: 86000, ordered: 200, received: 200, unit: 'Bao' },
      { sku: 'CAT-VANG', name: 'Cát vàng xây dựng hạt thô', estPrice: 320000, poPrice: 315000, ordered: 50, received: 50, unit: 'm3' },
    ]
  },
  'PO-2026-002': {
    code: 'PO-2026-002',
    project: 'Dự án 2 - Nhà máy Dệt Nam Định',
    supplier: 'Tổng kho Điện lạnh Hải Phòng',
    date: '01/06/2026',
    items: [
      { sku: 'MNK-TV-20', name: 'Máy nén khí trục vít 20HP', estPrice: 45000000, poPrice: 45500000, ordered: 2, received: 2, unit: 'Cái' },
      { sku: 'BCK-1000', name: 'Bình chứa khí 1000L', estPrice: 18000000, poPrice: 18000000, ordered: 1, received: 1, unit: 'Cái' },
    ]
  },
  'PO-2026-003': {
    code: 'PO-2026-003',
    project: 'Dự án 5 - Vinhomes Grand Park',
    supplier: 'Nhà phân phối Cáp CADIVI',
    date: '28/05/2026',
    items: [
      { sku: 'CAP-CV-16', name: 'Cáp điện CADIVI 16mm2', estPrice: 22000, poPrice: 23800, ordered: 1500, received: 1500, unit: 'm' },
      { sku: 'ONG-LUON-20', name: 'Ống luồn dây điện Phi 20', estPrice: 12000, poPrice: 12000, ordered: 300, received: 300, unit: 'm' },
    ]
  }
};

export default function ReconciliationPage() {
  const activeRole = localStorage.getItem('nv-user-role') || 'admin';
  const isStorekeeper = activeRole === 'storekeeper';

  const [selectedPoCode, setSelectedPoCode] = useState('PO-2026-001');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [poData] = useState<Record<string, PoRecord>>(mockReconciliationData);
  const [approvedPos, setApprovedPos] = useState<Set<string>>(new Set());

  if (isStorekeeper) {
    return (
      <div className="animate-fade-in py-12 flex flex-col items-center justify-center min-h-[500px]">
        <div className="rounded-3xl p-8 max-w-md text-center border shadow-card space-y-6"
          style={{ background: 'var(--md-surface-container)', borderColor: 'var(--md-error)' }}>
          <div className="w-16 h-16 rounded-full bg-[var(--tint-error-strong)] text-[var(--md-error)] mx-auto flex items-center justify-center">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold uppercase tracking-wider text-[var(--md-on-surface)]">
              TRUY CẬP BỊ TỪ CHỐI
            </h3>
            <p className="text-xs text-[var(--md-on-surface-variant)] leading-relaxed">
              Bạn đang đăng nhập với vai trò **Thủ kho**. Phân hệ đối chiếu đơn giá PO-GRN chứa dữ liệu tài chính nhạy cảm và bị chặn truy cập.
            </p>
          </div>
          <div className="bg-[var(--md-surface-container-low)] p-3 rounded-lg border text-[10px] text-gray-500 font-mono">
            Security Policy: Mask Financial Data (BR-SEC-01)
          </div>
        </div>
      </div>
    );
  }

  const currentPo = poData[selectedPoCode] || poData['PO-2026-001'];
  const processedItems: ProcessedItem[] = currentPo.items.map(item => {
    const diffVal = item.poPrice - item.estPrice;
    const diffPct = (diffVal / item.estPrice) * 100;
    const totalEst = item.estPrice * item.received;
    const totalPo = item.poPrice * item.received;
    const exceedLimit = diffPct > 5;
    return { ...item, diffVal, diffPct, totalEst, totalPo, exceedLimit };
  });

  const hasExceedLimit = processedItems.some(i => i.exceedLimit) && !approvedPos.has(selectedPoCode);
  const isApproved = approvedPos.has(selectedPoCode);

  const totalEstSum = processedItems.reduce((s, i) => s + i.totalEst, 0);
  const totalPoSum = processedItems.reduce((s, i) => s + i.totalPo, 0);
  const overallDiffPct = ((totalPoSum - totalEstSum) / totalEstSum) * 100;

  const handleRequestApproval = () => {
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = () => {
    setApprovedPos(prev => {
      const next = new Set(prev);
      next.add(selectedPoCode);
      return next;
    });
    setShowApprovalModal(false);
    showToast('success', `Đã duyệt vượt hạn mức định biên cho đơn ${selectedPoCode}!`, 'Duyệt thành công');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="TỰ ĐỘNG ĐỐI CHIẾU"
        title="ĐỐI CHIẾU PO - GRN (SO GIÁ)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl p-5 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Chọn chứng từ PO</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Mã đơn mua hàng (PO)</label>
                <select
                  className="form-select w-full text-xs"
                  value={selectedPoCode}
                  onChange={(e) => setSelectedPoCode(e.target.value)}
                >
                  {Object.keys(poData).map(code => (
                    <option key={code} value={code}>{code} - {poData[code].project.split(' - ')[0]}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-[var(--md-outline-variant)] space-y-3 text-xs">
                <div>
                  <span className="block text-[10px]" style={{ color: 'var(--md-on-surface-variant)' }}>Dự án thụ hưởng:</span>
                  <span className="font-bold block mt-0.5" style={{ color: 'var(--md-on-surface)' }}>{currentPo.project}</span>
                </div>
                <div>
                  <span className="block text-[10px]" style={{ color: 'var(--md-on-surface-variant)' }}>Nhà cung cấp:</span>
                  <span className="font-bold block mt-0.5" style={{ color: 'var(--md-on-surface)' }}>{currentPo.supplier}</span>
                </div>
                <div>
                  <span className="block text-[10px]" style={{ color: 'var(--md-on-surface-variant)' }}>Ngày đặt hàng:</span>
                  <span className="font-bold block mt-0.5" style={{ color: 'var(--md-on-surface)' }}>{currentPo.date}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 shadow-card space-y-4" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-on-surface-variant)' }}>Tổng quan đối chiếu</h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border" style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)' }}>
                <span className="text-[10px] block uppercase font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>Tổng Giá Dự Toán</span>
                <span className="text-sm font-bold mt-0.5 block" style={{ color: 'var(--md-on-surface)' }}>{formatCurrency(totalEstSum)} đ</span>
              </div>

              <div className="p-3 rounded-xl border" style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)' }}>
                <span className="text-[10px] block uppercase font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>Tổng Giá Thực Tế (PO)</span>
                <span className="text-sm font-bold mt-0.5 block" style={{ color: 'var(--md-on-surface)' }}>{formatCurrency(totalPoSum)} đ</span>
              </div>

              <div className="flex justify-between items-center px-1">
                <span style={{ color: 'var(--md-on-surface-variant)' }}>Chênh lệch toàn đơn:</span>
                <span className={`font-bold ${overallDiffPct > 0 ? 'text-[var(--md-error)]' : 'text-[var(--md-success)]'}`}>
                  {overallDiffPct > 0 ? `+${overallDiffPct.toFixed(2)}%` : `${overallDiffPct.toFixed(2)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {hasExceedLimit && (
            <div className="rounded-2xl p-4 flex items-start gap-4 animate-slide-in border" style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderColor: 'var(--md-error)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--tint-error-strong)', color: 'var(--md-error)' }}>
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider">Cảnh báo: Đơn giá thực tế vượt dự toán &gt; 5%</h3>
                <p className="text-[11px] mt-1">
                  Đơn hàng có vật tư bị tăng đơn giá vượt quá định mức cho phép (5%). Phiếu nhập kho (GRN) đã bị khóa phê duyệt tự động. Bắt buộc phải được ký duyệt đặc cách bởi ban quản lý.
                </p>
                <div className="mt-3">
                  <button onClick={handleRequestApproval} className="btn btn-danger text-[10px] py-1.5 px-4 font-bold">
                    PHÊ DUYỆT GIÁ VƯỢT HẠN MỨC
                  </button>
                </div>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="rounded-2xl p-4 flex items-center gap-4 animate-scale-in border" style={{ background: 'var(--md-success-container)', color: 'var(--md-on-success-container)', borderColor: 'var(--md-success)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--tint-success-soft)', color: 'var(--md-success)' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Đã được phê duyệt vượt hạn mức</h3>
                <p className="text-[11px] mt-0.5">
                  Đơn hàng đã được duyệt giá đặc cách bởi Kế toán trưởng. Trạng thái thanh toán hóa đơn đã được mở khóa.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl p-5 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-on-surface)' }}>Bảng so sánh đơn giá chi tiết</h2>
            </div>

            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-xs text-left" style={{ minWidth: '850px' }}>
                <thead>
                  <tr>
                    <th className="table-header-cell">Vật tư / SKU</th>
                    <th className="table-header-cell text-right">Đơn giá dự toán</th>
                    <th className="table-header-cell text-right">Đơn giá thực tế (PO)</th>
                    <th className="table-header-cell text-center">Khối lượng</th>
                    <th className="table-header-cell text-right">Chênh lệch (%)</th>
                    <th className="table-header-cell text-right">Thành tiền PO</th>
                    <th className="table-header-cell text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {processedItems.map((item) => (
                    <tr
                      key={item.sku}
                      className={`table-row ${
                        item.exceedLimit && !isApproved ? 'bg-[var(--tint-error-soft)] text-[var(--md-error)] font-semibold' : ''
                      }`}
                    >
                      <td className="table-cell">
                        <div className="font-bold">{item.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{item.sku}</div>
                      </td>
                      <td className="table-cell text-right">{formatCurrency(item.estPrice)}</td>
                      <td className="table-cell text-right font-bold">{formatCurrency(item.poPrice)}</td>
                      <td className="table-cell text-center">
                        {item.received} <span className="text-[10px] text-gray-500">{item.unit}</span>
                      </td>
                      <td className={`table-cell text-right font-bold ${
                        item.diffPct > 5 ? 'text-[var(--md-error)]' : item.diffPct > 0 ? 'text-amber-600' : 'text-[var(--md-success)]'
                      }`}>
                        {item.diffPct > 0 ? `+${item.diffPct.toFixed(1)}%` : `${item.diffPct.toFixed(1)}%`}
                      </td>
                      <td className="table-cell text-right font-bold">{formatCurrency(item.totalPo)}</td>
                      <td className="table-cell text-center">
                        {item.exceedLimit && !isApproved ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            VƯỢT ĐỊNH MỨC
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-800">
                            HỢP LỆ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={`PHÊ DUYỆT ĐƠN GIÁ VƯỢT HẠN MỨC — ${selectedPoCode}`}
        size="md"
        footer={
          <>
            <button className="btn btn-outline text-xs" onClick={() => setShowApprovalModal(false)}>HỦY BỎ</button>
            <button className="btn btn-filled text-xs" onClick={handleConfirmApproval}>DUYỆT ĐẶC CÁCH</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl flex gap-3 text-xs border" style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderColor: 'var(--md-error)' }}>
            <AlertTriangle size={18} className="flex-shrink-0" />
            <p>
              **CẢNH BÁO AN TOÀN**: Hành động này sẽ mở khóa ghi sổ kế toán cho phiếu nhập tương ứng với PO giá cao này. Lịch sử duyệt sẽ được ghi lại vĩnh viễn dưới tên bạn.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span style={{ color: 'var(--md-on-surface-variant)' }}>Chứng từ mua hàng:</span>
              <span className="font-bold ml-2" style={{ color: 'var(--md-on-surface)' }}>{selectedPoCode}</span>
            </div>
            <div>
              <span style={{ color: 'var(--md-on-surface-variant)' }}>Tổng chênh lệch vượt định mức:</span>
              <span className="font-bold ml-2" style={{ color: 'var(--md-error)' }}>
                +{formatCurrency(totalPoSum - totalEstSum)} đ ({overallDiffPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>Lý do duyệt đặc cách (Bắt buộc)</label>
            <textarea
              rows={3}
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border"
              style={{ background: 'var(--md-surface-container-low)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
              placeholder="Nhập lý do chi tiết..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
