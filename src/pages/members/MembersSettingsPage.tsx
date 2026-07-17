import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Copy, Check, ExternalLink, Shield, FileText, Users, Plus, Ban } from 'lucide-react';

import PageHeader from '../../components/ui/PageHeader';

import HrmPanel from '../../components/hr/HrmPanel';

import { showToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { usePermission } from '../../hooks/usePermission';
import {
  useCreateOnboardingInvite,
  useOnboardingInvites,
  useRevokeOnboardingInvite,
} from '../../hooks/useOnboardingInvites';
import type { OnboardingInviteDto } from '../../services/onboardingInvitesService';



const ONBOARDING_PATH = '/employee/onboarding';

type InviteStatus = 'valid' | 'used' | 'revoked' | 'expired';

function getInviteStatus(invite: OnboardingInviteDto): InviteStatus {
  if (invite.consumedAt) return 'used';
  if (invite.revokedAt) return 'revoked';
  return new Date(invite.expiresAt).getTime() > Date.now() ? 'valid' : 'expired';
}

const STATUS_LABELS: Record<InviteStatus, string> = {
  valid: 'Còn hiệu lực',
  used: 'Đã sử dụng',
  revoked: 'Đã thu hồi',
  expired: 'Đã hết hạn',
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}



export default function MembersSettingsPage() {
  const [copied, setCopied] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');
  const [inviteToRevoke, setInviteToRevoke] = useState<OnboardingInviteDto | null>(null);
  const { has } = usePermission();
  const canUpdate = has('hrm.members.settings.update');
  const invitesQuery = useOnboardingInvites();
  const createInvite = useCreateOnboardingInvite();
  const revokeInvite = useRevokeOnboardingInvite();

  const copyOnboardingLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('success', 'Đã sao chép liên kết khai báo nhân viên');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Không thể sao chép. Vui lòng chọn và copy thủ công.');
    }
  };

  const handleCreateInvite = async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const created = await createInvite.mutateAsync({ expiresAt });
      if (!created.token) {
        showToast('error', 'Liên kết đã được tạo nhưng máy chủ không trả về mã truy cập.');
        return;
      }
      setCopied(false);
      setCreatedUrl(
        `${window.location.origin}${ONBOARDING_PATH}?token=${encodeURIComponent(created.token)}`,
      );
      showToast('success', 'Đã tạo liên kết có hiệu lực trong 7 ngày.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể tạo liên kết.');
    }
  };

  const handleRevokeInvite = async () => {
    if (!inviteToRevoke) return;
    try {
      await revokeInvite.mutateAsync(inviteToRevoke.id);
      setInviteToRevoke(null);
      showToast('success', 'Đã thu hồi liên kết.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể thu hồi liên kết.');
    }
  };

  return (

    <div className="hrm-page">

      <PageHeader

        eyebrow="Nhân sự"

        title="Thiết lập nhân sự"

        subtitle="Cấu hình form khai báo và quy tắc hiển thị thông tin nhạy cảm trong module nhân viên."

      />



      <div className="hrm-settings-grid">

        <HrmPanel className="hrm-settings-card hrm-settings-card--featured">

          <div className="hrm-settings-card__head">

            <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">

              <Link2 size={20} />

            </div>

            <div>

              <h2 className="hrm-settings-card__title">Form khai báo thông tin nhân viên</h2>

              <p className="hrm-settings-card__desc">

                Gửi liên kết cho nhân viên mới để họ tự điền hồ sơ: ảnh, CCCD, liên hệ, học vấn, ngân hàng.

              </p>

            </div>

          </div>



          <div className="hrm-settings-card__actions">
            {canUpdate && (
              <button
                type="button"
                className="btn btn-primary rounded-full px-4 flex items-center gap-2 text-sm"
                onClick={() => void handleCreateInvite()}
                disabled={createInvite.isPending}
              >
                <Plus size={16} aria-hidden />
                {createInvite.isPending ? 'Đang tạo...' : 'Tạo liên kết 7 ngày'}
              </button>
            )}
          </div>

          {createdUrl && (
            <div className="hrm-invite-created" role="status">
              <label className="hrm-settings-field-label" htmlFor="onboarding-url">
                Liên kết vừa tạo
              </label>
              <div className="hrm-settings-url-row">
                <input
                  id="onboarding-url"
                  readOnly
                  value={createdUrl}
                  className="hrm-settings-url-input"
                  onFocus={event => event.target.select()}
                />
                <button
                  type="button"
                  onClick={() => void copyOnboardingLink(createdUrl)}
                  className="btn btn-primary rounded-xl px-4 flex items-center gap-2 shrink-0"
                  aria-label="Sao chép liên kết vừa tạo"
                >
                  {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
                <a
                  href={createdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline rounded-xl px-4 flex items-center gap-2 text-sm"
                  aria-label="Mở liên kết vừa tạo trong thẻ mới"
                >
                  <ExternalLink size={15} aria-hidden />
                  Mở liên kết
                </a>
              </div>
            </div>
          )}

          <div className="hrm-invite-list" aria-live="polite">
            <h3 className="hrm-invite-list__title">Liên kết đã tạo</h3>
            {invitesQuery.isPending && (
              <p className="hrm-settings-note" role="status">Đang tải danh sách liên kết...</p>
            )}
            {invitesQuery.isError && (
              <div className="hrm-invite-state" role="alert">
                <span>Không thể tải danh sách liên kết.</span>
                <button type="button" className="btn btn-outline btn-sm rounded-full" onClick={() => void invitesQuery.refetch()}>
                  Thử lại
                </button>
              </div>
            )}
            {!invitesQuery.isPending && !invitesQuery.isError && invitesQuery.data?.length === 0 && (
              <p className="hrm-settings-note">Chưa có liên kết khai báo nào.</p>
            )}
            {invitesQuery.data?.map(invite => {
              const status = getInviteStatus(invite);
              return (
                <div key={invite.id} className="hrm-invite-row">
                  <div className="hrm-invite-row__content">
                    <span className={`hrm-invite-status hrm-invite-status--${status}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="hrm-invite-row__date">
                      Hết hạn: {formatDateTime(invite.expiresAt)}
                    </span>
                  </div>
                  {canUpdate && status === 'valid' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm rounded-full text-[var(--md-error)] flex items-center gap-1.5"
                      onClick={() => setInviteToRevoke(invite)}
                      aria-label={`Thu hồi liên kết hết hạn lúc ${formatDateTime(invite.expiresAt)}`}
                    >
                      <Ban size={14} aria-hidden />
                      Thu hồi
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </HrmPanel>



        <HrmPanel className="hrm-settings-card">

          <div className="hrm-settings-card__head">

            <div className="hrm-settings-card__icon hrm-settings-card__icon--shield">

              <Shield size={20} />

            </div>

            <div>

              <h2 className="hrm-settings-card__title">Bảo mật thông tin nhạy cảm</h2>

              <p className="hrm-settings-card__desc">

                Trên hồ sơ nhân viên, dữ liệu sau được che mặc định:

              </p>

            </div>

          </div>

          <ul className="hrm-settings-list">

            <li>Số CMND / CCCD — chỉ hiện 3 số đầu và 3 số cuối</li>

            <li>Ảnh CCCD & bằng cấp — làm mờ, cần bấm &quot;Xem ảnh&quot; mới hiện rõ</li>

            <li>Số tài khoản, BHXH, mã số thuế — che tương tự số giấy tờ</li>

          </ul>

          <p className="hrm-settings-note">

            HR có thể xem đầy đủ khi cần; nhân viên khác không truy cập được trang chi tiết nếu không có quyền.

          </p>

        </HrmPanel>



        <HrmPanel className="hrm-settings-card">

          <div className="hrm-settings-card__head">

            <div className="hrm-settings-card__icon hrm-settings-card__icon--neutral">

              <FileText size={20} />

            </div>

            <div>

              <h2 className="hrm-settings-card__title">Quy trình gợi ý</h2>

              <p className="hrm-settings-card__desc">Luồng làm việc phổ biến với module nhân viên:</p>

            </div>

          </div>

          <ol className="hrm-settings-steps">

            <li>

              <span className="hrm-settings-steps__num">1</span>

              <span>Gửi link form cho nhân viên mới khai báo hồ sơ</span>

            </li>

            <li>

              <span className="hrm-settings-steps__num">2</span>

              <span>Kiểm tra danh sách, gán mã NV và bổ sung thông tin HR</span>

            </li>

            <li>

              <span className="hrm-settings-steps__num">3</span>

              <span>Mở hồ sơ chi tiết → Chỉnh sửa để cập nhật ảnh / CCCD nếu thiếu</span>

            </li>

          </ol>

          <Link to="/members/list" className="hrm-settings-link">
            <Users size={15} />
            Đi tới danh sách nhân viên
          </Link>

        </HrmPanel>

      </div>

      <ConfirmDialog
        isOpen={Boolean(inviteToRevoke)}
        onClose={() => setInviteToRevoke(null)}
        onConfirm={() => void handleRevokeInvite()}
        title="Thu hồi liên kết?"
        message="Người nhận sẽ không thể tiếp tục sử dụng liên kết này."
        confirmLabel="Thu hồi"
        isLoading={revokeInvite.isPending}
      />

    </div>

  );

}


