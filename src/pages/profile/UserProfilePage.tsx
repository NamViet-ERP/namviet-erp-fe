import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Building, Calendar, ShieldCheck, CheckCircle,
  Key, Loader2, Briefcase, Settings,
} from 'lucide-react';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import { showToast } from '../../components/ui/Toast';
import { getSessionUser, type SystemUser } from '../../constants/systemUsers';
import { employeesService } from '../../services/employeesService';
import type { Employee } from '../../types/hr';

interface ProfileData {
  name: string;
  initials: string;
  role: string;
  email: string;
  phone?: string;
  dept?: string;
  position?: string;
  joined?: string;
}

function buildProfileFromSession(user: SystemUser, employee?: Employee): ProfileData {
  return {
    name: user.name,
    initials: user.initials,
    role: user.roleLabel,
    email: user.email,
    phone: employee?.personalPhone ?? user.phone ?? undefined,
    dept: employee?.department ?? user.department ?? undefined,
    position: employee?.position ?? user.position ?? undefined,
    joined: user.createdAt ?? undefined,
  };
}

interface ProfileFieldProps {
  label: string;
  icon: typeof User;
  value: string;
  empty?: boolean;
}

function ProfileField({ label, icon: Icon, value, empty }: ProfileFieldProps) {
  return (
    <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)] p-4">
      <dt className="text-xs text-[var(--md-on-surface-variant)] mb-1.5">{label}</dt>
      <dd className={`text-sm font-semibold flex items-center gap-2 ${empty ? 'text-[var(--md-on-surface-variant)] font-medium' : 'text-[var(--md-on-surface)]'}`}>
        <Icon size={14} className="text-[var(--md-secondary)] shrink-0" aria-hidden />
        <span className="text-pretty">{value}</span>
      </dd>
    </div>
  );
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();

  const [profile, setProfile] = useState<ProfileData | null>(
    sessionUser ? buildProfileFromSession(sessionUser) : null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionUser?.employeeId) return;

    let cancelled = false;
    setLoading(true);

    employeesService
      .getById(sessionUser.employeeId)
      .then((emp) => {
        if (!cancelled) {
          setProfile(buildProfileFromSession(sessionUser, emp));
        }
      })
      .catch((e) => {
        console.error('Failed to fetch employee profile:', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.employeeId]);

  if (!profile) {
    return (
      <div className="page-shell flex items-center justify-center min-h-[40dvh]">
        <p className="text-sm text-[var(--md-on-surface-variant)]">Không có phiên đăng nhập.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto hrm-page w-full">
      <HrmDetailHeader
        onBack={() => navigate(-1)}
        title="Thông tin cá nhân"
        subtitle="Xem thông tin đăng nhập và quyền truy cập của bạn trong hệ thống."
        actions={
          <button
            type="button"
            onClick={() => showToast('info', 'Phân hệ "Cài đặt" đang được phát triển.', 'Chức năng giả lập')}
            className="hrm-header-btn flex items-center gap-1.5"
          >
            <Settings size={14} aria-hidden />
            Cài đặt
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5 mt-6">
        {/* Sidebar summary */}
        <aside className="rounded-2xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container)] p-6 shadow-sm flex flex-col items-center text-center lg:sticky lg:top-[calc(64px+20px)] lg:self-start">
          <div
            className="size-24 rounded-full flex items-center justify-center font-bold text-3xl mb-4 border-2 border-[color-mix(in_srgb,var(--md-secondary)_30%,transparent)] profile-avatar-lg"
          >
            {profile.initials}
          </div>

          <h2 className="text-lg font-bold text-[var(--md-on-surface)] text-balance leading-tight">
            {profile.name}
          </h2>
          <span className="mt-2 inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)]">
            {profile.role}
          </span>

          <div className="w-full mt-5 pt-5 border-t border-[var(--md-outline-variant)] space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm text-[var(--md-on-surface)]">
              <Mail size={15} className="text-[var(--md-secondary)] shrink-0" aria-hidden />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--md-on-surface)]">
              <Phone size={15} className="text-[var(--md-secondary)] shrink-0" aria-hidden />
              <span className={profile.phone ? '' : 'text-[var(--md-on-surface-variant)]'}>
                {profile.phone || 'Chưa cập nhật'}
              </span>
            </div>
          </div>
        </aside>

        {/* Detail panels */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container)] p-5 shadow-sm">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-[var(--md-on-surface)] text-balance">
              <Key size={18} className="text-[var(--md-secondary)] shrink-0" aria-hidden />
              Thông tin tài khoản hệ thống
              {loading && <Loader2 size={14} className="animate-spin text-[var(--md-outline)]" aria-label="Đang tải" />}
            </h3>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ProfileField label="Họ và tên" icon={User} value={profile.name} />
              <ProfileField
                label="Phòng ban / Bộ phận"
                icon={Building}
                value={profile.dept || 'Chưa cập nhật'}
                empty={!profile.dept}
              />
              <ProfileField
                label="Chức danh"
                icon={Briefcase}
                value={profile.position || 'Chưa cập nhật'}
                empty={!profile.position}
              />
              <ProfileField
                label="Ngày tham gia"
                icon={Calendar}
                value={profile.joined || 'Chưa cập nhật'}
                empty={!profile.joined}
              />
            </dl>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--md-success)_25%,var(--md-outline-variant))] bg-[var(--md-success-container)] px-4 py-3">
              <CheckCircle size={16} className="text-[var(--md-success)] shrink-0" aria-hidden />
              <p className="text-sm font-medium text-[var(--md-on-success-container)]">
                Tài khoản đang hoạt động và đã xác minh
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container)] p-5 shadow-sm">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-[var(--md-on-surface)] text-balance">
              <ShieldCheck size={18} className="text-[var(--md-secondary)] shrink-0" aria-hidden />
              Quyền hạn & nghiệp vụ
            </h3>

            <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)] p-4 flex items-start gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--md-primary-container)] text-[var(--md-primary)]">
                <ShieldCheck size={16} aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--md-on-surface)] mb-1">
                  Vai trò: {profile.role}
                </p>
                <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty leading-relaxed">
                  Quyền hạn chi tiết được cấu hình qua hệ thống phân quyền (RBAC). Liên hệ quản trị viên nếu cần thay đổi.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
