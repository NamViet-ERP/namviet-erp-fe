import { Settings, Hash, Shield, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-navy-900 mb-6">THIẾT LẬP KHO HÀNG</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mã tự động */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Hash size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900">Mã tự động</h3>
              <p className="text-xs text-gray-500">Cấu hình định dạng mã chứng từ</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Phiếu nhập kho', prefix: 'NK', example: 'NK-002147' },
              { label: 'Phiếu xuất kho', prefix: 'XK', example: 'XK-001893' },
              { label: 'Phiếu chuyển kho', prefix: 'CK', example: 'CK-000125' },
              { label: 'Phiếu chuyển đổi kho', prefix: 'CDK', example: 'CDK-000057' },
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

        {/* Phân quyền */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Shield size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900">Phân quyền</h3>
              <p className="text-xs text-gray-500">Quản lý quyền truy cập module kho</p>
            </div>
          </div>
          <div className="space-y-3">
            {['Quản lý kho', 'Thủ kho', 'Nhân viên', 'Xem báo cáo'].map((role) => (
              <div key={role} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-navy-700">{role}</span>
                <span className="badge badge-approved text-[10px]">Đang hoạt động</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thông báo */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bell size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900">Thông báo</h3>
              <p className="text-xs text-gray-500">Cấu hình thông báo kho hàng</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Cảnh báo tồn kho thấp', enabled: true },
              { label: 'Thông báo nhập kho mới', enabled: true },
              { label: 'Thông báo xuất kho', enabled: false },
              { label: 'Thông báo chuyển kho', enabled: true },
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

        {/* Chung */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Globe size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900">Cài đặt chung</h3>
              <p className="text-xs text-gray-500">Cấu hình hệ thống chung</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">Đơn vị tiền tệ</label>
              <select className="form-select" defaultValue="VND">
                <option value="VND">VND - Việt Nam Đồng</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
            <div>
              <label className="form-label">Định dạng ngày</label>
              <select className="form-select" defaultValue="dd/MM/yyyy">
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
