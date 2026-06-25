import { Search, RefreshCw, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { useExpectedImportsCoordination } from '../../hooks/warehouse/useExpectedImportsCoordination';

export default function ExpectedImportsPage() {
  const {
    expectedData,
    targetProjects,
    selectedTargetProject,
    selectedProjObj,
    isScanning,
    scanResults,
    coordinationSuccess,
    handleStartScan,
    handleCreateCoordination,
    handleSelectTargetProject,
  } = useExpectedImportsCoordination();

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Cung ứng liên dự án"
        title="Dự kiến nhập & điều phối tồn dư"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-panel surface-panel--rounded-xl p-5 shadow-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="wms-section-heading">Dự kiến vật tư sắp nhập (Dự án 1 - 4)</h2>
              <span className="wms-feature-badge">Điều phối tồn dư</span>
            </div>

            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-left text-xs table-min-w--650">
                <thead>
                  <tr>
                    <th className="table-header-cell w-[22%]">Dự án yêu cầu</th>
                    <th className="table-header-cell w-[30%]">Vật tư</th>
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

        <div className="space-y-6">
          <div className="surface-panel surface-panel--rounded-xl p-5 shadow-card relative overflow-hidden">
            <h2 className="wms-section-heading mb-4">Điều phối nhanh lên Dự án mới</h2>

            <div className="space-y-4">
              <div>
                <label className="wms-side-panel__title mb-2">Chọn Dự án thụ hưởng (Dự án 5/6)</label>
                <select
                  className="form-select w-full"
                  value={selectedTargetProject}
                  onChange={(e) => handleSelectTargetProject(e.target.value)}
                >
                  <option value="">-- Chọn dự án cần cấp vật tư --</option>
                  {targetProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              {selectedProjObj && !scanResults && !isScanning && !coordinationSuccess && (
                <div className="wms-inset-card space-y-2">
                  <h3 className="wms-section-heading text-xs">Danh sách vật tư đang thiếu:</h3>
                  <div className="wms-kv-list">
                    {selectedProjObj.requirements.map((req) => (
                      <div key={req.sku} className="wms-kv-row">
                        <span className="wms-kv-row__label truncate max-w-[180px]">{req.name}</span>
                        <span className="wms-kv-row__value">Thiếu: {req.needed}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleStartScan}
                disabled={isScanning || !selectedTargetProject}
                className="w-full btn btn-filled flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Đang quét vật tư dư thừa...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Kiểm tra vật tư dư thừa
                  </>
                )}
              </button>
            </div>

            {isScanning && (
              <div className="wms-scan-overlay" aria-live="polite">
                <div className="wms-scan-spinner">
                  <div className="wms-scan-ring wms-scan-ring--spin" />
                  <div className="wms-scan-ring wms-scan-ring--reverse" />
                </div>
                <div className="text-center">
                  <p className="wms-scan-overlay__title">Đang quét tồn dư...</p>
                  <p className="wms-scan-overlay__sub">Đang quét mức dư dự án 1-4...</p>
                </div>
              </div>
            )}
          </div>

          {scanResults && (
            <div className="surface-panel surface-panel--rounded-xl p-5 shadow-card space-y-4">
              <div className="flex items-center gap-2 text-[var(--md-primary)]">
                <AlertTriangle size={18} />
                <h3 className="wms-section-heading text-xs tracking-wider">Đề xuất điều phối khả thi</h3>
              </div>

              <div className="space-y-3">
                {scanResults.map((res) => (
                  <div key={res.sku} className="wms-inset-card">
                    <div className="wms-result-card__title">{res.name}</div>
                    <div className="wms-kv-row">
                      <span className="wms-kv-row__label">Thiếu ở dự án đích:</span>
                      <span className="wms-kv-row__value">{res.needed}</span>
                    </div>
                    <div className="wms-kv-row">
                      <span className="wms-kv-row__label">Sẵn thừa ở Dự án 1-4:</span>
                      <span className="wms-kv-row__value wms-kv-row__value--primary">+{res.availableSurplus}</span>
                    </div>
                    <div className="wms-result-highlight">
                      <span>Có thể cấp ngay:</span>
                      <span>{res.allocated} cái</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCreateCoordination}
                className="w-full btn btn-filled flex items-center justify-center gap-2"
              >
                <Send size={15} />
                Tạo lệnh điều phối
              </button>
            </div>
          )}

          {coordinationSuccess && (
            <div className="surface-panel surface-panel--rounded-xl p-5 shadow-card wms-success-panel space-y-4">
              <div className="wms-success-icon">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="wms-section-heading">Tạo lệnh thành công</h3>
                <p className="text-xs mt-1 text-[var(--md-on-surface-variant)]">
                  Hệ thống đã phê duyệt phiếu chuyển giao vật tư dư thừa liên dự án.
                </p>
              </div>
              <div className="wms-inset-card text-left text-[11px] wms-kv-list">
                <div className="wms-kv-row">
                  <span className="wms-kv-row__label">Mã lệnh:</span>
                  <span className="wms-kv-row__value">DP-2026001</span>
                </div>
                <div className="wms-kv-row">
                  <span className="wms-kv-row__label">Dự án đích:</span>
                  <span className="wms-kv-row__value">{selectedProjObj?.name}</span>
                </div>
                <div className="wms-kv-row">
                  <span className="wms-kv-row__label">Trạng thái:</span>
                  <span className="wms-status-chip">Đã điều phối và hạch toán</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
