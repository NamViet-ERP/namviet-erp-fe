import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building, Calendar, ShieldCheck, CheckCircle, Key, ArrowLeft, Loader2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
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
        // keep session-only profile on error
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
      <div className="animate-fade-in flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-[var(--md-on-surface-variant)]">Không có phiên đăng nhập.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="TÀI KHOẢN"
        title="THÔNG TIN CÁ NHÂN"
        actions={
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline flex items-center gap-1.5 text-xs py-2"
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div
          className="rounded-2xl p-6 shadow-card flex flex-col items-center text-center justify-center"
          style={{
            background: 'var(--md-surface-container)',
            border: '1px solid var(--md-outline-variant)',
            minHeight: '320px'
          }}
        >
          {/* Large Avatar Circle */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl mb-4 shadow-inner"
            style={{
              background: 'var(--md-primary-container)',
              color: 'var(--md-on-primary-container)'
            }}
          >
            {profile.initials}
          </div>

          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--md-on-surface)' }}>
            {profile.name}
          </h2>
          <p className="text-sm font-semibold mb-4 px-3 py-1 rounded-full"
            style={{
              background: 'var(--md-secondary-container)',
              color: 'var(--md-on-secondary-container)'
            }}
          >
            {profile.role}
          </p>

          <div className="w-full border-t border-[var(--md-outline-variant)] pt-4 mt-2 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm text-[var(--md-on-surface-variant)]">
              <Mail size={16} className="text-[var(--md-primary)]" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--md-on-surface-variant)]">
              <Phone size={16} className="text-[var(--md-primary)]" />
              <span>{profile.phone || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed account info & permissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Detail Card */}
          <div
            className="rounded-2xl p-6 shadow-card"
            style={{
              background: 'var(--md-surface-container)',
              border: '1px solid var(--md-outline-variant)'
            }}
          >
            <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--md-on-surface)' }}>
              <Key size={18} className="text-[var(--md-primary)]" />
              Thông tin tài khoản hệ thống
              {loading && <Loader2 size={14} className="animate-spin text-[var(--md-outline)]" />}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-[var(--md-on-surface-variant)] block mb-1">Họ và tên</span>
                <p className="text-sm font-semibold text-[var(--md-on-surface)] flex items-center gap-2">
                  <User size={14} className="text-[var(--md-outline)]" />
                  {profile.name}
                </p>
              </div>

              <div>
                <span className="text-xs text-[var(--md-on-surface-variant)] block mb-1">Phòng ban / Bộ phận</span>
                <p className="text-sm font-semibold text-[var(--md-on-surface)] flex items-center gap-2">
                  <Building size={14} className="text-[var(--md-outline)]" />
                  {profile.dept || 'Chưa cập nhật'}
                </p>
              </div>

              <div>
                <span className="text-xs text-[var(--md-on-surface-variant)] block mb-1">Ngày tham gia</span>
                <p className="text-sm font-semibold text-[var(--md-on-surface)] flex items-center gap-2">
                  <Calendar size={14} className="text-[var(--md-outline)]" />
                  {profile.joined || 'Chưa cập nhật'}
                </p>
              </div>

              <div>
                <span className="text-xs text-[var(--md-on-surface-variant)] block mb-1">Trạng thái tài khoản</span>
                <p className="text-sm font-semibold text-[var(--md-on-surface)] flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  Hoạt động (Đã xác minh)
                </p>
              </div>
            </div>
          </div>

          {/* Permissions / Privileges Card */}
          <div
            className="rounded-2xl p-6 shadow-card"
            style={{
              background: 'var(--md-surface-container)',
              border: '1px solid var(--md-outline-variant)'
            }}
          >
            <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--md-on-surface)' }}>
              <ShieldCheck size={18} className="text-[var(--md-primary)]" />
              Quyền hạn & Nghiệp vụ được phân quyền
            </h3>

            <div className="space-y-3">
              <div
                className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                style={{ background: 'var(--md-surface-container-low)' }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{
                    background: 'var(--md-primary-container)',
                    color: 'var(--md-on-primary-container)'
                  }}
                >
                  <ShieldCheck size={12} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--md-on-surface)] mb-0.5">
                    Vai trò: {profile.role}
                  </p>
                  <p className="text-xs text-[var(--md-on-surface-variant)]">
                    Quyền hạn chi tiết sẽ được cấu hình qua hệ thống Phân quyền (RBAC).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
