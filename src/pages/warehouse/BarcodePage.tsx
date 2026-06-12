import { useState } from 'react';
import { Barcode as BarcodeIcon, Search, Printer, Play, Check, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import { products } from '../../data/products';
import PageHeader from '../../components/ui/PageHeader';
import type { Product } from '../../types';

// Helper to convert product ID to Mayzer Standard 12-digit numeric SKU
// Group (2 digits) - Category (3 digits) - Serial (7 digits)
function get12DigitSKU(prodId: string, category: string): string {
  const numId = parseInt(prodId.replace('p-', ''), 10) || 1;
  const serial = String(numId).padStart(7, '0');
  
  let group = '10'; // 10: Thiết bị cơ khí, 20: Bình bồn áp lực, 30: Thiết bị phụ trợ, 40: Lọc khí, 50: Dầu & phụ kiện, 60: Vật tư tiêu hao
  let catCode = '101'; // 101: Trục vít, 102: Piston, 201: Bình chứa, 301: Máy sấy, 401: Lọc, 501: Dầu, 601: Tiêu hao

  if (category === 'Máy nén khí trục vít') {
    group = '10';
    catCode = '101';
  } else if (category === 'Máy nén khí piston') {
    group = '10';
    catCode = '102';
  } else if (category === 'Bình chứa') {
    group = '20';
    catCode = '201';
  } else if (category === 'Máy sấy khí') {
    group = '30';
    catCode = '301';
  } else if (category === 'Lọc khí') {
    group = '40';
    catCode = '401';
  } else if (category === 'Phụ kiện') {
    group = '50';
    catCode = '501';
  } else if (category === 'Vật tư tiêu hao') {
    group = '60';
    catCode = '601';
  }

  return `${group}${catCode}${serial}`;
}

// SVG Barcode Mock Renderer
function MockBarcodeSVG({ value = '000000000000' }: { value?: string }) {
  const chars = value.split('');
  const lines: React.ReactElement[] = [];
  let currentPos = 10;

  chars.forEach((char, idx) => {
    const code = char.charCodeAt(0);
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
        color: '#0f1119',
      }}
    >
      <svg width={currentPos + 10} height={80} className="w-full max-w-[280px]">
        {lines}
      </svg>
      <span
        className="text-xs font-mono font-bold tracking-[0.2em] mt-2 uppercase"
        style={{ color: '#1e2333' }}
      >{value}</span>
    </div>
  );
}

export default function BarcodePage() {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(products[0]);
  const [customValue, setCustomValue] = useState<string>(
    products[0] ? get12DigitSKU(products[0].id, products[0].category) : '101010000001'
  );
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Product & { numericSku?: string } | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    get12DigitSKU(p.id, p.category).includes(search)
  );

  const handlePrintBarcode = () => {
    showToast('info', `Đang chuẩn bị tem in... Mã 12 số chuẩn: ${customValue} cho thiết bị "${selectedProduct?.name || 'Mã tùy chỉnh'}"`, 'Đang gửi mã in');
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult(null);

    // Simulate laser scanning for 2 seconds
    setTimeout(() => {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const numericSku = get12DigitSKU(randomProduct.id, randomProduct.category);
      setScanResult({
        ...randomProduct,
        numericSku
      });
      setIsScanning(false);
      showToast('success', `Đã quét thành công mã chuẩn: ${numericSku}`, 'Quét thành công');
    }, 2000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="QUY CHUẨN KHO MAYZER"
        title="ĐỊNH DẠNG MÃ SKU & BARCODE 12 SỐ"
      />

      {/* Info Alert explaining the 12-digit standard */}
      <div className="rounded-2xl p-5 border flex gap-4"
        style={{ background: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}>
        <Info className="text-[var(--md-primary)] mt-1 flex-shrink-0" size={20} />
        <div className="text-xs space-y-2 text-[var(--md-on-surface-variant)]">
          <h4 className="font-bold text-[var(--md-on-surface)] uppercase">QUY CHUẨN MÃ HÓA VẬT TƯ MAYZER SCM STANDARD</h4>
          <p>
            Nhằm mục tiêu tự động hóa hoàn toàn hoạt động đối chiếu, toàn bộ vật tư máy nén khí và phụ kiện Mayzer được số hóa đồng bộ theo định dạng **12 chữ số** bao gồm 3 phân nhóm:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px] pt-1">
            <div className="bg-[var(--md-surface-container-low)] p-2.5 rounded border">
              <span className="font-bold text-[var(--md-primary)]">PHÂN NHÓM (2 chữ số)</span>
              <p className="mt-1 text-[10px]">10: Máy nén khí | 20: Bình chứa | 30: Máy sấy | 40: Lọc | 50: Dầu | 60: Tiêu hao</p>
            </div>
            <div className="bg-[var(--md-surface-container-low)] p-2.5 rounded border">
              <span className="font-bold text-[var(--md-primary)]">PHÂN LOẠI (3 chữ số)</span>
              <p className="mt-1 text-[10px]">101: Trục vít | 102: Piston | 201: Bình bồn áp lực | 601: Vật tư tiêu hao</p>
            </div>
            <div className="bg-[var(--md-surface-container-low)] p-2.5 rounded border">
              <span className="font-bold text-[var(--md-primary)]">MÃ SỐ DÒNG (7 chữ số)</span>
              <p className="mt-1 text-[10px]">Mã định danh duy nhất tăng dần (Serial) cho từng loại máy móc thiết bị chi tiết</p>
            </div>
          </div>
        </div>
      </div>

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
                placeholder="Tìm mã SKU, tên máy, mã 12 số..."
                className="form-input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map(p => {
                const numericSku = get12DigitSKU(p.id, p.category);
                const isSelected = selectedProduct?.id === p.id;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setCustomValue(numericSku);
                    }}
                    className="w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between text-xs"
                    style={isSelected
                      ? { background: 'var(--md-primary-container)', borderColor: 'var(--md-primary)', color: 'var(--md-on-primary-container)' }
                      : { background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }
                    }
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-bold truncate uppercase">{p.name}</div>
                        <div className="text-[10px] mt-0.5 font-semibold opacity-80">{p.category}</div>
                      </div>
                      <div className="font-mono px-2 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: 'var(--md-surface-container-high)', border: '1px solid var(--md-outline-variant)', color: 'var(--md-primary)' }}>
                        {p.sku}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono tracking-wider font-bold" style={{ color: isSelected ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)' }}>
                      Mã 12 số: {numericSku}
                    </div>
                  </button>
                );
              })}
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-4">Trình tạo nhãn in mã vạch</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label uppercase font-semibold">Mã nguồn Barcode (12 số chuẩn)</label>
                  <input 
                    type="text"
                    maxLength={12}
                    className="form-input font-mono text-center font-bold tracking-widest text-base"
                    value={customValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setCustomValue(val);
                    }}
                    placeholder="Mã 12 chữ số"
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
                <span className="font-semibold" style={{ color: 'var(--md-on-surface)' }}>Vật tư liên kết:</span> {selectedProduct?.name || 'Mã tùy chỉnh'}
              </div>
              <button 
                onClick={handlePrintBarcode}
                className="w-full btn btn-filled flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                IN NHÃN MÃ VẠCH (SCM LABEL)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Barcode Scanner */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl p-5 shadow-card flex flex-col justify-between h-[520px]"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-4">Bộ đọc & mô phỏng quét mã</h2>
              
              {/* Simulated camera screen */}
              <div className="relative h-60 rounded-xl overflow-hidden border flex items-center justify-center"
                style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline)' }}>
                
                {isScanning && (
                  <div className="absolute left-0 right-0 h-0.5 z-10 animate-scan-laser" 
                    style={{
                      background: 'var(--md-error)',
                      boxShadow: '0 0 10px var(--md-error)',
                      animation: 'scanLaser 1.5s ease-in-out infinite'
                    }}
                  />
                )}

                <div className="absolute inset-8 border border-dashed border-gray-600/40 rounded-lg flex items-center justify-center">
                  <div className="w-48 h-20 border border-[var(--tint-warning-border)] rounded flex items-center justify-center flex-col">
                    <BarcodeIcon size={32} className={`text-gray-600 ${isScanning ? 'animate-pulse text-amber-500' : ''}`} />
                    <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest text-center">
                      {isScanning ? 'QUÉT TÍN HIỆU LASER...' : 'ĐƯA NHÃN 12 SỐ VÀO KHUNG'}
                    </span>
                  </div>
                </div>

                {isScanning && (
                  <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-end pb-4 z-20">
                    <p className="text-[10px] font-bold tracking-wider flex items-center gap-1.5 bg-black/80 px-3 py-1 rounded-full border"
                      style={{ color: 'var(--md-error)', borderColor: 'var(--md-error)' }}>
                      <RefreshCw size={10} className="animate-spin" />
                      SCANNERS READY...
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
                    <span className="font-bold uppercase block text-[9px]">KẾT QUẢ ĐỌC SCM BARCODE:</span>
                    <span className="font-bold block mt-1 text-xs uppercase" style={{ color: 'var(--md-on-surface)' }}>{scanResult.name}</span>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]" style={{ color: 'var(--md-on-surface-variant)' }}>
                      <div>Mã 12 Số: <span className="font-mono font-bold block">{scanResult.numericSku}</span></div>
                      <div>Mã SKU cũ: <span className="font-mono block">{scanResult.sku}</span></div>
                      <div>ĐVT: <span className="font-bold block">{scanResult.unit}</span></div>
                      <div>Phân loại: <span className="font-bold block">{scanResult.category}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {!scanResult && !isScanning && (
                <div className="rounded-xl p-3 flex gap-2.5 text-[11px] border"
                  style={{ background: 'var(--md-surface-container-low)', borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }} />
                  <p>Nhấp nút mô phỏng quét laser để đọc tem nhãn 12 số chuẩn Mayzer cho thiết bị máy nén khí phụ trợ.</p>
                </div>
              )}

              <button 
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="w-full btn btn-filled flex items-center justify-center gap-2"
              >
                <Play size={15} />
                BẮT ĐẦU MÔ PHỎNG QUÉT LASER
              </button>
            </div>
          </div>
        </div>
      </div>

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
