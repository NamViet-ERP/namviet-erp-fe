import { useState } from 'react';
import { Search, RefreshCw, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';

// Mock data for Expected Imports of Projects 1-4
interface ExpectedItem {
  id: string;
  project: string;
  sku: string;
  name: string;
  qty: number;
  surplus: number;
  unit: string;
  date: string;
}

interface Requirement {
  sku: string;
  name: string;
  needed: number;
}

interface TargetProject {
  id: string;
  name: string;
  requirements: Requirement[];
}

interface ScanSource {
  project: string;
  surplusAvailable: number;
  id: string;
}

interface ScanResult {
  sku: string;
  name: string;
  needed: number;
  availableSurplus: number;
  allocated: number;
  sources: ScanSource[];
}

const initialExpectedData: ExpectedItem[] = [
  { id: 'exp-1', project: 'Dự án 1 - Khách sạn Mường Thanh', sku: 'MNK-TV-20', name: 'Máy nén khí trục vít 20HP', qty: 10, surplus: 3, unit: 'Cái', date: '10/06/2026' },
  { id: 'exp-2', project: 'Dự án 1 - Khách sạn Mường Thanh', sku: 'BCK-1000', name: 'Bình chứa khí 1000L', qty: 5, surplus: 1, unit: 'Cái', date: '12/06/2026' },
  { id: 'exp-3', project: 'Dự án 2 - Nhà máy Dệt Nam Định', sku: 'MSK-TNL-30', name: 'Máy sấy khí tác nhân lạnh', qty: 8, surplus: 2, unit: 'Bộ', date: '08/06/2026' },
  { id: 'exp-4', project: 'Dự án 3 - Hóa dầu Nghi Sơn', sku: 'PK-DO-01', name: 'Phụ kiện đường ống cao cấp', qty: 120, surplus: 35, unit: 'Mét', date: '15/06/2026' },
  { id: 'exp-5', project: 'Dự án 4 - Nhà máy Bia Heineken', sku: 'MNK-TV-50', name: 'Máy nén khí trục vít 50HP', qty: 4, surplus: 0, unit: 'Cái', date: '18/06/2026' },
  { id: 'exp-6', project: 'Dự án 4 - Nhà máy Bia Heineken', sku: 'LCK-02', name: 'Bộ lọc khí thô đường ống', qty: 30, surplus: 10, unit: 'Bộ', date: '18/06/2026' },
];

// Mock data for Target Projects (Projects 5 & 6) and their requirements
const targetProjects: TargetProject[] = [
  { id: 'proj-5', name: 'Dự án 5 - Chung cư Vinhomes Grand Park', requirements: [
    { sku: 'MNK-TV-20', name: 'Máy nén khí trục vít 20HP', needed: 2 },
    { sku: 'BCK-1000', name: 'Bình chứa khí 1000L', needed: 1 },
    { sku: 'PK-DO-01', name: 'Phụ kiện đường ống cao cấp', needed: 10 }
  ] },
  { id: 'proj-6', name: 'Dự án 6 - Sân bay Long Thành', requirements: [
    { sku: 'MSK-TNL-30', name: 'Máy sấy khí tác nhân lạnh', needed: 1 },
    { sku: 'LCK-02', name: 'Bộ lọc khí thô đường ống', needed: 5 },
    { sku: 'PK-DO-01', name: 'Phụ kiện đường ống cao cấp', needed: 20 }
  ] }
];

export default function ExpectedImportsPage() {
  const [expectedData, setExpectedData] = useState<ExpectedItem[]>(initialExpectedData);
  const [selectedTargetProject, setSelectedTargetProject] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[] | null>(null);
  const [coordinationSuccess, setCoordinationSuccess] = useState(false);

  const handleStartScan = () => {
    if (!selectedTargetProject) {
      showToast('error', 'Vui lòng chọn Dự án thụ hưởng để kiểm tra', 'Thiếu thông tin');
      return;
    }
    setIsScanning(true);
    setScanResults(null);
    setCoordinationSuccess(false);

    // Simulate SCM scan animation
    setTimeout(() => {
      const target = targetProjects.find(p => p.id === selectedTargetProject);
      const matches: ScanResult[] = [];

      target!.requirements.forEach(req => {
        // Find total surplus in active expected imports (Projects 1-4)
        const suppliers = expectedData.filter(item => item.sku === req.sku && item.surplus > 0);
        const totalSurplus = suppliers.reduce((sum, item) => sum + item.surplus, 0);

        if (totalSurplus > 0) {
          const qtyToAllocate = Math.min(req.needed, totalSurplus);
          matches.push({
            sku: req.sku,
            name: req.name,
            needed: req.needed,
            availableSurplus: totalSurplus,
            allocated: qtyToAllocate,
            sources: suppliers.map(s => ({
              project: s.project,
              surplusAvailable: s.surplus,
              id: s.id
            }))
          });
        }
      });

      setScanResults(matches);
      setIsScanning(false);
      showToast('success', `Đã quét và tìm thấy ${matches.length} loại vật tư có thể điều phối!`, 'Quét hoàn tất');
    }, 1500);
  };

  const handleCreateCoordination = () => {
    if (!scanResults || scanResults.length === 0) return;

    // Deduct surplus values from original list to represent coordination
    const updatedExpected = expectedData.map(item => {
      let matchedAlloc = 0;
      scanResults.forEach(res => {
        const sourceMatch = res.sources.find(src => src.id === item.id);
        if (sourceMatch) {
          matchedAlloc = res.allocated; // For simplicity deduct the allocated qty
        }
      });
      return {
        ...item,
        surplus: Math.max(0, item.surplus - matchedAlloc)
      };
    });

    setExpectedData(updatedExpected);
    setCoordinationSuccess(true);
    setScanResults(null);
    showToast('success', 'Đã tự động tạo Phiếu chuyển kho liên dự án thành công!', 'Điều phối hoàn tất');
  };

  const selectedProjObj = targetProjects.find(p => p.id === selectedTargetProject);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Cung ứng liên dự án"
        title="Dự kiến nhập & Điều phối vật tư thừa"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Expected Imports List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-5 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--md-on-surface)' }}>Dự kiến vật tư sắp nhập (Dự án 1 - 4)</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold" style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}>
                SCM CHỦ ĐỘNG
              </span>
            </div>

            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-left text-xs" style={{ minWidth: '650px' }}>
                <thead>
                  <tr>
                    <th className="table-header-cell w-[22%]">Dự án yêu cầu</th>
                    <th className="table-header-cell w-[30%]">Vật tư / SKU</th>
                    <th className="table-header-cell w-[10%] text-right">Dự kiến</th>
                    <th className="table-header-cell w-[14%] text-center">Lượng thừa (Surplus)</th>
                    <th className="table-header-cell w-[8%] text-center">ĐVT</th>
                    <th className="table-header-cell w-[16%] text-center">Ngày nhập dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {expectedData.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell font-medium break-words whitespace-normal">{item.project}</td>
                      <td className="table-cell">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-[10px] text-[var(--md-on-surface-variant)]">{item.sku}</div>
                      </td>
                      <td className="table-cell text-right font-medium">{item.qty}</td>
                      <td className="table-cell text-center font-bold text-[var(--md-primary)]">
                        {item.surplus > 0 ? `+${item.surplus}` : <span className="text-[var(--md-on-surface-variant)]">0</span>}
                      </td>
                      <td className="table-cell text-center">{item.unit}</td>
                      <td className="table-cell text-center">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Coordination Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl p-5 shadow-card relative overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--md-on-surface)' }}>Điều phối nhanh lên Dự án mới</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>Chọn Dự án thụ hưởng (Dự án 5/6)</label>
                <select 
                  className="form-select w-full"
                  value={selectedTargetProject}
                  onChange={(e) => {
                    setSelectedTargetProject(e.target.value);
                    setScanResults(null);
                    setCoordinationSuccess(false);
                  }}
                >
                  <option value="">-- Chọn dự án cần cấp vật tư --</option>
                  {targetProjects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              {selectedProjObj && !scanResults && !isScanning && !coordinationSuccess && (
                <div className="rounded-xl p-4 border space-y-2 animate-fade-in" style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)' }}>
                  <h3 className="text-xs font-bold uppercase" style={{ color: 'var(--md-on-surface)' }}>Danh sách vật tư đang thiếu:</h3>
                  <div className="space-y-1.5">
                    {selectedProjObj.requirements.map(req => (
                      <div key={req.sku} className="flex justify-between text-xs">
                        <span className="truncate max-w-[180px]" style={{ color: 'var(--md-on-surface-variant)' }}>{req.name}</span>
                        <span className="font-semibold" style={{ color: 'var(--md-on-surface)' }}>Thiếu: {req.needed}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleStartScan}
                disabled={isScanning || !selectedTargetProject}
                className="w-full btn btn-filled flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    ĐANG QUÉT VẬT TƯ DƯ THỪA...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    KIỂM TRA VẬT TƯ DƯ THỪA
                  </>
                )}
              </button>
            </div>

            {/* Scanning Overlay Animation */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-10">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--tint-warning-border)] border-t-[var(--status-warning)] animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-[var(--tint-warning-soft)] border-b-[var(--status-warning)] animate-spin-reverse" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-amber-500 tracking-widest animate-pulse">SCM SCANNERS RUNNING</p>
                  <p className="text-[10px] text-gray-400 mt-1">Đang quét mức dư dự án 1-4...</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          {scanResults && (
            <div className="rounded-2xl p-5 shadow-card animate-slide-up space-y-4" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
              <div className="flex items-center gap-2 text-[var(--md-primary)]">
                <AlertTriangle size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Đề xuất điều phối khả thi</h3>
              </div>

              <div className="space-y-3">
                {scanResults.map(res => (
                  <div key={res.sku} className="rounded-xl p-3 border" style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)' }}>
                    <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--md-on-surface)' }}>{res.name}</div>
                    <div className="flex justify-between text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>
                      <span>Thiếu ở dự án đích:</span>
                      <span className="font-semibold" style={{ color: 'var(--md-on-surface)' }}>{res.needed}</span>
                    </div>
                    <div className="flex justify-between text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>
                      <span>Sẵn thừa ở Dự án 1-4:</span>
                      <span className="font-semibold text-[var(--md-primary)]">+{res.availableSurplus}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[var(--md-outline-variant)] flex justify-between text-xs font-bold text-[var(--md-success)]">
                      <span>Có thể cấp ngay:</span>
                      <span>{res.allocated} cái</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCreateCoordination}
                className="w-full btn btn-filled flex items-center justify-center gap-2"
              >
                <Send size={15} />
                TẠO LỆNH ĐIỀU PHỐI NHANH
              </button>
            </div>
          )}

          {/* Success Panel */}
          {coordinationSuccess && (
            <div className="rounded-2xl p-5 shadow-card text-center space-y-4 animate-scale-in" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto border" style={{ background: 'var(--md-success-container)', color: 'var(--md-success)', borderColor: 'var(--md-success)' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase" style={{ color: 'var(--md-on-surface)' }}>Tạo lệnh thành công</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>Hệ thống đã phê duyệt phiếu chuyển giao vật tư dư thừa liên dự án.</p>
              </div>
              <div className="rounded-xl p-3 border text-left text-[11px] space-y-1.5" style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--md-on-surface-variant)' }}>Mã lệnh:</span>
                  <span className="font-semibold text-[var(--md-on-surface)]">DP-2026001</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--md-on-surface-variant)' }}>Dự án đích:</span>
                  <span className="font-semibold text-[var(--md-on-surface)]">{selectedProjObj?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--md-on-surface-variant)' }}>Trạng thái:</span>
                  <span className="font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--md-success-container)', color: 'var(--md-on-success-container)' }}>Đã điều phối và hạch toán</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
