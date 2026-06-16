import { useState } from 'react';
import { Briefcase, Plus, Trash2, Search, Link2, Copy, Check } from 'lucide-react';
import { usePositions, useCreatePosition, useDeletePosition, useTogglePositionStatus } from '../../hooks/usePositions';
import { showToast } from '../../components/ui/Toast';

export default function RecruitmentSettingsPage() {
  const { data: positions = [], isLoading } = usePositions();
  const createMutation = useCreatePosition();
  const deleteMutation = useDeletePosition();
  const toggleStatusMutation = useTogglePositionStatus();

  const [newPosition, setNewPosition] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newPosition.trim();
    if (!val) {
      showToast('warning', 'Vui lòng nhập tên vị trí');
      return;
    }

    try {
      await createMutation.mutateAsync(val);
      showToast('success', `Đã thêm vị trí "${val}"`);
      setNewPosition('');
    } catch (err: any) {
      showToast('error', err.message || 'Không thể thêm vị trí');
    }
  };

  const handleToggle = async (posName: string) => {
    try {
      await toggleStatusMutation.mutateAsync(posName);
    } catch (err: any) {
      showToast('error', err.message || 'Không thể thay đổi trạng thái');
    }
  };

  const handleDelete = async (pos: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn vị trí tuyển dụng "${pos}"?\n\nHành động này không thể hoàn tác.`)) {
      try {
        await deleteMutation.mutateAsync(pos);
        showToast('success', `Đã xóa vị trí "${pos}"`);
      } catch (err: any) {
        showToast('error', err.message || 'Không thể xóa vị trí');
      }
    }
  };

  const copyApplyLink = () => {
    const link = `${window.location.origin}/recruitment/apply`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast('success', 'Đã sao chép liên kết nộp đơn ứng tuyển');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPositions = positions.filter(pos =>
    pos.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Manage positions (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-6 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline-variant)' }}>
                <Briefcase size={20} style={{ color: 'var(--md-primary)' }} />
              </div>
              <div>
                <h3 className="font-bold text-lg uppercase" style={{ color: 'var(--md-on-surface)' }}>VỊ TRÍ ỨNG TUYỂN</h3>
                <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Bật/tắt trạng thái hiển thị hoặc xóa vị trí tuyển dụng</p>
              </div>
            </div>

            {/* Add position Form */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newPosition}
                onChange={e => setNewPosition(e.target.value)}
                placeholder="Nhập tên vị trí tuyển dụng mới (Ví dụ: Kỹ sư Phần mềm, Kế toán trưởng...)"
                className="hrm-field-input flex-1"
                disabled={createMutation.isPending}
              />
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2 px-4 h-10"
                style={{ paddingTop: 0, paddingBottom: 0 }}
                disabled={createMutation.isPending}
              >
                <Plus size={18} />
                <span>Thêm</span>
              </button>
            </form>

            {/* Search & Filter */}
            <div className="relative mb-4 page-filter-bar">
              <span className="absolute inset-y-0 left-3 flex items-center text-[var(--md-on-surface-variant)]">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm vị trí..."
                className="hrm-field-input pl-10"
              />
            </div>

            {/* Positions List */}
            {isLoading ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                Đang tải danh sách vị trí...
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                {searchTerm ? 'Không tìm thấy vị trí phù hợp.' : 'Chưa có vị trí tuyển dụng nào.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredPositions.map(pos => (
                  <div
                    key={pos.name}
                    className="flex items-center justify-between p-3 rounded-xl transition-all"
                    style={{
                      background: pos.isActive ? 'var(--md-surface-container-low)' : 'rgba(0, 0, 0, 0.05)',
                      border: '1px solid var(--md-outline-variant)',
                      opacity: pos.isActive ? 1 : 0.65
                    }}
                  >
                    <span className="text-sm font-medium pr-4 truncate" style={{ color: 'var(--md-on-surface)' }}>
                      {pos.name}
                    </span>
                    
                    <div className="flex items-center gap-3">
                      {/* Trạng thái Bật/Tắt (Toggle Switch) */}
                      <button
                        type="button"
                        onClick={() => handleToggle(pos.name)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pos.isActive ? 'bg-[#92c348]' : 'bg-gray-400 dark:bg-gray-600'}`}
                        role="switch"
                        aria-checked={pos.isActive}
                        title={pos.isActive ? "Đang bật (Hiển thị)" : "Đang tắt (Ẩn)"}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pos.isActive ? 'translate-x-4' : 'translate-x-0'}`}
                        />
                      </button>

                      {/* Nút xóa */}
                      <button
                        type="button"
                        onClick={() => handleDelete(pos.name)}
                        className="text-[var(--md-error)] p-1 rounded-lg hover:bg-[var(--md-error-container)] transition-colors flex-shrink-0"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 flex justify-between items-center text-xs" style={{ borderTop: '1px solid var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}>
              <span>Tổng số: <strong>{positions.length}</strong> vị trí</span>
              {searchTerm && <span>Tìm thấy: <strong>{filteredPositions.length}</strong></span>}
            </div>
          </div>
        </div>

        {/* Right Column: Portal Link & Guide */}
        <div className="space-y-6">
          {/* Cổng ứng tuyển link */}
          <div className="rounded-2xl p-6 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-info-container)', border: '1px solid var(--md-outline-variant)' }}>
                <Link2 size={20} style={{ color: 'var(--md-info)' }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--md-on-surface)' }}>Cổng ứng tuyển công khai</h3>
                <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Đường dẫn biểu mẫu dành cho ứng viên nộp CV</p>
              </div>
            </div>

            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
              Ứng viên bên ngoài có thể truy cập liên kết này để tự nộp đơn và tải CV lên hệ thống. Danh sách vị trí ứng tuyển sẽ tự động đồng bộ theo thiết lập của bạn.
            </p>

            <div
              className="flex items-center gap-2 p-2.5 rounded-lg mb-4 text-xs font-mono break-all"
              style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)', color: 'var(--md-primary)' }}
            >
              {window.location.origin}/recruitment/apply
            </div>

            <button
              type="button"
              onClick={copyApplyLink}
              className="btn btn-outline w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép liên kết'}</span>
            </button>
          </div>

          {/* Hướng dẫn vận hành */}
          <div className="rounded-2xl p-6 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <h4 className="font-bold text-sm mb-3" style={{ color: 'var(--md-on-surface)' }}>💡 Hướng dẫn vận hành</h4>
            <div className="space-y-3 text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
              <div className="space-y-2">
                <div className="flex gap-2 items-start">
                  <span className="text-green-500 font-bold mt-1">●</span>
                  <p className="mb-0"><strong>Bật công tắc (Active):</strong> Vị trí hiển thị ngoài Form ứng tuyển công khai để ứng viên nộp hồ sơ.</p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-gray-400 font-bold mt-1">●</span>
                  <p className="mb-0"><strong>Tắt công tắc (Deactive):</strong> Ẩn vị trí khỏi Form ứng tuyển mà <strong>không cần xóa vĩnh viễn</strong>. Giúp tạm ngưng nhận hồ sơ cho vị trí này.</p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-red-500 font-bold mt-1">●</span>
                  <p className="mb-0"><strong>Xóa vĩnh viễn (Trash):</strong> Xóa hoàn toàn vị trí ra khỏi hệ thống. Không ảnh hưởng đến hồ sơ cũ đã nộp.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
