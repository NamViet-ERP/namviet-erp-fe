import { Settings, Hash, Bell } from 'lucide-react';

export default function StocktakeSettingsPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-navy-900 mb-6">THIẾT LẬP KIỂM KÊ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Hash size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900">Mã tự động</h3>
              <p className="text-xs text-gray-500">Cấu hình định dạng mã chứng từ kiểm kê</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Phiếu kiểm kê', prefix: 'KK', example: 'KK-001530' },
              { label: 'Phiếu điều chỉnh', prefix: 'ĐCT', example: 'ĐCT-001453' },
            ].map((item) => (
              <div key={item.prefix} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-navy-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-navy-600">{item.prefix}-######</code>
                  <span className="text-xs text-gray-400">VD: {item.example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bell size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900">Thông báo kiểm kê</h3>
              <p className="text-xs text-gray-500">Cấu hình thông báo cho module kiểm kê</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Thông báo tạo phiếu kiểm kê mới', enabled: true },
              { label: 'Thông báo đóng băng SKU', enabled: true },
              { label: 'Thông báo chênh lệch kiểm kê', enabled: true },
              { label: 'Thông báo duyệt điều chỉnh', enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-navy-700">{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card col-span-1 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Settings size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900">Quy trình kiểm kê</h3>
              <p className="text-xs text-gray-500">Cấu hình luồng xử lý kiểm kê</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            {['Tạo phiếu', 'Đóng băng SKU', 'Đếm thực tế', 'So sánh chênh lệch', 'Duyệt điều chỉnh', 'Mở băng'].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <span className="text-sm text-navy-700 font-medium whitespace-nowrap">{step}</span>
                </div>
                {i < 5 && <div className="w-8 h-px bg-navy-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
