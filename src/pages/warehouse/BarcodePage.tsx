import { useState } from 'react';
import { Barcode as BarcodeIcon, Search, Printer, Play, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import { products } from '../../data/products';
import PageHeader from '../../components/ui/PageHeader';
import type { Product } from '../../types';

// SVG Barcode Mock Renderer
function MockBarcodeSVG({ value = 'SKU-CODE' }: { value?: string }) {
  // Generate pseudo-random line widths based on string hash
  const chars = value.split('');
  const lines: React.ReactElement[] = [];
  let currentPos = 10;

  chars.forEach((char, idx) => {
    const code = char.charCodeAt(0);
    // Draw 3-4 lines per character based on ascii
    const lineCount = 3 + (code % 3);
    for (let l = 0; l < lineCount; l++) {
      const width = 1 + ((code + l) % 3);
      const gap = 1 + ((code * l) % 4);
      lines.push(
        <rect 
          key={`${idx}-${l}`} 
          x={currentPos} 
          y={10} 
          width={width} 
          height={60} 
          fill="currentColor" 
        />
      );
      currentPos += width + gap;
    }
  });

  return (
    <div
      className="flex flex-col items-center p-4 rounded-xl"
      style={{
        background: '#ffffff',
        border: '1px solid #e0ddd6',
        color: '#0f1119',           /* explicit dark ink — never inherits theme */
      }}
    >
      <svg width={currentPos + 10} height={80} className="w-full max-w-[280px]">
        {lines}
      </svg>
      <span
        className="text-xs font-mono font-bold tracking-[0.2em] mt-2 uppercase"
        style={{ color: '#1e2333' }} /* explicit — never inherits theme white */
      >{value}</span>
    </div>
  );
}

export default function BarcodePage() {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(products[0]);
  const [customValue, setCustomValue] = useState<string>(products[0]?.sku || 'SKU-NAMVIET');
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrintBarcode = () => {
    showToast('info', `Đang kết nối tới máy in tem nhãn... Đang in mã vạch cho ${selectedProduct?.name || customValue}`, 'Đang in mã');
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult(null);

    // Simulate laser scanning for 2 seconds
    setTimeout(() => {
      // Pick a random product from list
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      setScanResult(randomProduct);
      setIsScanning(false);
      showToast('success', `Đã quét thành công sản phẩm: ${randomProduct.name}`, 'Quét thành công');
    }, 2000);
  };

  return (
    <div className="animate-fade-in">
      {/* Title */}
      <PageHeader
        eyebrow="QUY CHUẨN MÃ SKU & BARCODE"
        title="MÃ SKU & BARCODE"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Standardized SKU Catalog */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl p-5 shadow-card flex flex-col h-[520px]"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-3">Danh mục sản phẩm SKU chuẩn</h2>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="Tìm mã SKU hoặc sản phẩm..."
                className="form-input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setCustomValue(p.sku);
                  }}
                  className="w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center text-xs"
                  style={selectedProduct?.id === p.id
                    ? { background: 'var(--md-primary-container)', borderColor: 'var(--md-primary)', color: 'var(--md-on-primary-container)' }
                    : { background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }
                }
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold truncate uppercase">{p.name}</div>
                    <div className="text-[10px] mt-0.5">{p.category}</div>
                  </div>
                  <div className="font-mono px-2 py-1 rounded text-[10px] flex-shrink-0 font-bold"
                    style={{ background: 'var(--md-surface-container-high)', border: '1px solid var(--md-outline-variant)', color: 'var(--md-primary)' }}>
                    {p.sku}
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-8">Không tìm thấy sản phẩm nào</p>
              )}
            </div>
          </div>
        </div>

        {/* Center Column: Barcode Generator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl p-5 shadow-card flex flex-col justify-between h-[520px]"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-4">Trình in & tạo mã Barcode</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label uppercase font-semibold">Mã nguồn Barcode (SKU)</label>
                  <input 
                    type="text"
                    className="form-input font-mono"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value.toUpperCase())}
                    placeholder="VD: SKU-NAMVIET"
                  />
                </div>

                <div className="flex flex-col items-center justify-center p-6 rounded-xl border min-h-[160px]"
                  style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)' }}>
                  <MockBarcodeSVG value={customValue} />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--md-outline-variant)]">
              <div className="text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>
                <span className="font-semibold" style={{ color: 'var(--md-on-surface)' }}>Sản phẩm chỉ định:</span> {selectedProduct?.name || 'Mã tùy chỉnh'}
              </div>
              <button 
                onClick={handlePrintBarcode}
                className="w-full btn btn-filled flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                IN MÃ TEM VẠCH VẬT TƯ
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Barcode Scanner */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl p-5 shadow-card flex flex-col justify-between h-[520px]"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-4">Trình mô phỏng quét mã vạch</h2>
              
              {/* Simulated camera screen */}
              <div className="relative h-60 rounded-xl overflow-hidden border flex items-center justify-center"
                style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline)' }}>
                
                {/* Visual laser line scanning up/down */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-0.5 z-10 animate-scan-laser" 
                    style={{
                      background: 'var(--md-error)',
                      boxShadow: '0 0 10px var(--md-error)',
                      animation: 'scanLaser 1.5s ease-in-out infinite'
                    }}
                  />
                )}

                {/* Grid Overlay inside "scanner" */}
                <div className="absolute inset-8 border border-dashed border-gray-600/40 rounded-lg flex items-center justify-center">
                  <div className="w-48 h-20 border border-amber-500/30 rounded flex items-center justify-center flex-col">
                    <BarcodeIcon size={32} className={`text-gray-600 ${isScanning ? 'animate-pulse text-amber-500' : ''}`} />
                    <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">
                      {isScanning ? 'MÃ VẠCH TRONG KHUNG' : 'ĐẶT MÃ VẠCH ĐỂ QUÉT'}
                    </span>
                  </div>
                </div>

                {/* Scan Overlay message */}
                {isScanning && (
                  <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-end pb-4 z-20">
                    <p className="text-[10px] font-bold tracking-wider flex items-center gap-1.5 bg-black/80 px-3 py-1 rounded-full border"
                      style={{ color: 'var(--md-error)', borderColor: 'var(--md-error)' }}>
                      <RefreshCw size={10} className="animate-spin" />
                      ĐANG GIẢ LẬP ĐỌC TÍN HIỆU...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--md-outline-variant)]">
              {scanResult && !isScanning && (
                <div className="rounded-xl p-3 flex gap-3 text-xs animate-scale-in"
                  style={{ background: 'var(--md-success-container)', color: 'var(--md-on-success-container)', border: '1px solid var(--md-outline-variant)' }}>
                  <Check size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--md-success)' }} />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold uppercase block">KẾT QUẢ QUÉT THÀNH CÔNG:</span>
                    <span className="font-semibold block mt-1">{scanResult.name}</span>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]" style={{ color: 'var(--md-on-surface-variant)' }}>
                      <div>Mã SKU: <span className="font-mono font-bold">{scanResult.sku}</span></div>
                      <div>ĐVT: <span className="font-bold">{scanResult.unit}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {!scanResult && !isScanning && (
                <div className="rounded-xl p-3 flex gap-2.5 text-[11px] border"
                  style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }} />
                  <p>Nhấp nút Bắt đầu để giả lập quét mã vạch vật tư, ghi nhận thông tin SCM tự động.</p>
                </div>
              )}

              <button 
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="w-full btn btn-filled flex items-center justify-center gap-2"
              >
                <Play size={15} />
                BẮT ĐẦU QUÉT MÔ PHỎNG
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded CSS for scanner laser animation */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
