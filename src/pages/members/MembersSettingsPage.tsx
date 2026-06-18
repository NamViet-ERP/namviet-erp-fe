import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Copy, Check, ExternalLink, Shield, FileText, Users } from 'lucide-react';

import PageHeader from '../../components/ui/PageHeader';

import HrmPanel from '../../components/hr/HrmPanel';

import { showToast } from '../../components/ui/Toast';



const ONBOARDING_PATH = '/employee/onboarding';



export default function MembersSettingsPage() {

  const [copied, setCopied] = useState(false);

  const onboardingUrl = `${window.location.origin}${ONBOARDING_PATH}`;



  const copyOnboardingLink = async () => {

    try {

      await navigator.clipboard.writeText(onboardingUrl);

      setCopied(true);

      showToast('success', 'Đã sao chép liên kết form khai báo nhân viên');

      setTimeout(() => setCopied(false), 2000);

    } catch {

      showToast('error', 'Không thể sao chép. Vui lòng chọn và copy thủ công.');

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



          <label className="hrm-settings-field-label" htmlFor="onboarding-url">

            Đường dẫn công khai

          </label>

          <div className="hrm-settings-url-row">

            <input

              id="onboarding-url"

              readOnly

              value={onboardingUrl}

              className="hrm-settings-url-input"

              onFocus={e => e.target.select()}

            />

            <button

              type="button"

              onClick={copyOnboardingLink}

              className="btn btn-primary rounded-xl px-4 flex items-center gap-2 shrink-0"

            >

              {copied ? <Check size={16} /> : <Copy size={16} />}

              {copied ? 'Đã sao chép' : 'Sao chép'}

            </button>

          </div>



          <div className="hrm-settings-card__actions">

            <a

              href={onboardingUrl}

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

    </div>

  );

}


