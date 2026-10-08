import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Trash2, Link2, Copy, Check, ExternalLink, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import HrmPanel from '../../components/hr/HrmPanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { usePositions, useCreatePosition, useDeletePosition, useTogglePositionStatus } from '../../hooks/usePositions';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_LOADING } from '../../lib/uiMessages';
import { showToast } from '../../components/ui/Toast';

const APPLY_PATH = '/recruitment/apply';

export default function RecruitmentSettingsPage() {
  const { data: positions = [], isLoading } = usePositions();
  const createMutation = useCreatePosition();
  const deleteMutation = useDeletePosition();
  const toggleStatusMutation = useTogglePositionStatus();

  const [newPosition, setNewPosition] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const applyUrl = `${window.location.origin}${APPLY_PATH}`;

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
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm vị trí'));
    }
  };

  const handleToggle = async (posName: string) => {
    try {
      await toggleStatusMutation.mutateAsync(posName);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      showToast('success', `Đã xóa vị trí "${deleteTarget}"`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa vị trí'));
    }
  };

  const copyApplyLink = async () => {
    try {
      await navigator.clipboard.writeText(applyUrl);
      setCopied(true);
      showToast('success', 'Đã sao chép liên kết nộp đơn ứng tuyển');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Không thể sao chép. Vui lòng chọn và copy thủ công.');
    }
  };

  const filteredPositions = positions.filter(pos =>
    pos.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="hrm-page">
      <PageHeader
        eyebrow="Thiết lập"
        title="Tuyển dụng"
        subtitle="Quản lý vị trí ứng tuyển và liên kết cổng nộp hồ sơ công khai."
      />

      <div className="hrm-settings-grid hrm-settings-grid--recruitment">
        <HrmPanel className="hrm-settings-card hrm-settings-card--featured">
          <div className="hrm-settings-card__head">
            <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="hrm-settings-card__title">Vị trí ứng tuyển</h2>
              <p className="hrm-settings-card__desc">
                Bật/tắt hiển thị trên form công khai hoặc xóa vị trí không còn tuyển.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="hrm-recruitment-add-form">
            <input
              type="text"
              value={newPosition}
              onChange={e => setNewPosition(e.target.value)}
              placeholder="Tên vị trí mới (VD: Kỹ sư phần mềm, Kế toán trưởng...)"
              className="hrm-field-input flex-1"
              disabled={createMutation.isPending}
            />
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
              disabled={createMutation.isPending}
            >
              <Plus size={18} />
              Thêm
            </button>
          </form>

          <div className="hrm-recruitment-position-search">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm kiếm vị trí..."
            />
          </div>

          {isLoading ? (
            <div className="hrm-recruitment-positions-empty">{UI_LOADING.positions}</div>
          ) : filteredPositions.length === 0 ? (
            <div className="hrm-recruitment-positions-empty">
              {searchTerm ? 'Không tìm thấy vị trí phù hợp.' : 'Chưa có vị trí tuyển dụng nào.'}
            </div>
          ) : (
            <div className="hrm-recruitment-positions-grid">
              {filteredPositions.map(pos => (
                <div
                  key={pos.name}
                  className={`hrm-recruitment-position-card${pos.isActive ? '' : ' hrm-recruitment-position-card--inactive'}`}
                >
                  <span className="hrm-recruitment-position-card__name" title={pos.name}>
                    {pos.name}
                  </span>
                  <div className="hrm-recruitment-position-card__actions">
                    <button
                      type="button"
                      onClick={() => handleToggle(pos.name)}
                      className={`hrm-toggle-switch${pos.isActive ? ' hrm-toggle-switch--on' : ''}`}
                      role="switch"
                      aria-checked={pos.isActive}
                      title={pos.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                    >
                      <span className="hrm-toggle-switch__thumb" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(pos.name)}
                      className="hrm-recruitment-position-card__delete"
                      title="Xóa vĩnh viễn"
                      aria-label={`Xóa vị trí ${pos.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="hrm-recruitment-positions-meta">
            Tổng <strong>{positions.length}</strong> vị trí
            {searchTerm && (
              <> · Tìm thấy <strong>{filteredPositions.length}</strong></>
            )}
          </p>
        </HrmPanel>

        <div className="hrm-settings-grid hrm-settings-grid--recruitment-side">
          <HrmPanel className="hrm-settings-card">
            <div className="hrm-settings-card__head">
              <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">
                <Link2 size={20} />
              </div>
              <div>
                <h2 className="hrm-settings-card__title">Cổng ứng tuyển công khai</h2>
                <p className="hrm-settings-card__desc">
                  Ứng viên truy cập link này để nộp hồ sơ và tải CV. Vị trí đồng bộ theo thiết lập bên trái.
                </p>
              </div>
            </div>

            <label className="hrm-settings-field-label" htmlFor="recruitment-apply-url">
              Đường dẫn công khai
            </label>
            <div className="hrm-settings-url-row">
              <input
                id="recruitment-apply-url"
                readOnly
                value={applyUrl}
                className="hrm-settings-url-input"
                onFocus={e => e.target.select()}
              />
              <button
                type="button"
                onClick={copyApplyLink}
                className="btn btn-primary rounded-xl px-4 flex items-center gap-2 shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>

            <div className="hrm-settings-card__actions">
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline rounded-full px-4 flex items-center gap-2 text-sm"
              >
                <ExternalLink size={15} />
                Mở form xem thử
              </a>
            </div>
          </HrmPanel>

          <HrmPanel className="hrm-settings-card">
            <div className="hrm-settings-card__head">
              <div className="hrm-settings-card__icon hrm-settings-card__icon--neutral">
                <Briefcase size={20} />
              </div>
              <div>
                <h2 className="hrm-settings-card__title">Hướng dẫn vận hành</h2>
              </div>
            </div>
            <ul className="hrm-settings-list">
              <li><strong>Bật:</strong> Vị trí hiển thị trên form ứng tuyển công khai.</li>
              <li><strong>Tắt:</strong> Ẩn khỏi form, không xóa dữ liệu — tạm ngưng nhận hồ sơ.</li>
              <li><strong>Xóa:</strong> Gỡ vị trí khỏi hệ thống; hồ sơ cũ vẫn giữ nguyên.</li>
            </ul>
            <Link to="/recruitment/candidates" className="hrm-settings-link">
              <Users size={15} />
              Đi tới danh sách ứng viên
            </Link>
          </HrmPanel>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa vị trí tuyển dụng"
        message={
          <>
            Bạn có chắc chắn muốn xóa vĩnh viễn vị trí{' '}
            <strong className="confirm-dialog__emphasis">&ldquo;{deleteTarget}&rdquo;</strong>?
            <br />
            <span className="confirm-dialog__subtext">Hành động này không thể hoàn tác.</span>
          </>
        }
        confirmLabel="Xóa vĩnh viễn"
        cancelLabel="Hủy bỏ"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
