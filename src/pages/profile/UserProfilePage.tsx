import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building, Calendar, ShieldCheck, CheckCircle, Key, ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

const rolesMap = {
  admin: {
    name: 'Nguyễn Minh Tuấn',
    initials: 'AD',
    role: 'Quản trị viên',
    email: 'admin@namviet.vn',
    phone: '0902.999.888',
    dept: 'Ban giám đốc',
    joined: '01/06/2019',
    privileges: [
      'Quản trị toàn bộ hệ thống WMS/SCM',
      'Tạo mới và quản lý kho bãi, sơ đồ vị trí',
      'Quản lý danh sách thành viên và phân quyền truy cập',
      'Định cấu hình các định dạng mã chứng từ tự động',
      'Xem tất cả báo cáo giá trị tồn kho và đối chiếu tài chính MISA'
    ]
  },
  accountant: {
    name: 'Lê Thị Hồng',
    initials: 'LH',
    role: 'Kế toán trưởng',
    email: 'hong.le@namviet.vn',
    phone: '0912.345.678',
    dept: 'Phòng Kế toán Tài vụ',
    joined: '01/01/2020',
    privileges: [
      'Xem chi tiết giá trị tồn kho tài chính',
      'Thực hiện đối chiếu chứng từ mua hàng PO với phiếu nhập GRN',
      'Xem báo cáo chênh lệch kế toán MISA ERP và WMS',
      'Duyệt điều chỉnh số liệu chênh lệch sau kiểm kê',
      'Quản lý dữ liệu lịch sử giá trị nhập xuất của từng dự án'
    ]
  },
  procurement: {
    name: 'Mỹ Chi',
    initials: 'MC',
    role: 'Phòng mua hàng',
    email: 'chi.my@namviet.vn',
    phone: '0934.567.890',
    dept: 'Phòng Cung ứng Vật tư',
    joined: '10/11/2023',
    privileges: [
      'Xem kế hoạch dự kiến nhập xuất và phân phối điều phối vật tư',
      'Đánh giá và so sánh xếp hạng nhà cung cấp vật tư máy nén khí',
      'Tạo yêu cầu nhập kho dựa theo PO mua hàng',
      'Theo dõi tiến độ giao hàng của các nhà cung cấp',
      'Xem định mức vật tư tiêu hao của từng công trình'
    ]
  },
  pm: {
    name: 'Nguyễn Văn Hùng',
    initials: 'NH',
    role: 'Quản lý dự án (PM)',
    email: 'hung.nguyen@namviet.vn',
    phone: '0988.765.432',
    dept: 'Ban quản lý dự án',
    joined: '15/07/2021',
    privileges: [
      'Duyệt phiếu nhập kho dự án chuyên biệt',
      'Duyệt phiếu yêu cầu xuất kho thiết bị công trình theo BOM dự toán',
      'Ký duyệt phiếu mượn/trả thiết bị giữa các dự án (Cross-project Loan)',
      'Xem bảng ma trận tồn kho dự án chi tiết của công trình phụ trách',
      'Xem cảnh báo vượt định mức vật tư dự án'
    ]
  },
  storekeeper: {
    name: 'Phan Văn Vỹ',
    initials: 'VV',
    role: 'Thủ kho (Storekeeper)',
    email: 'vy.phan@namviet.vn',
    phone: '0901.234.567',
    joinedDate: '12/03/2022',
    dept: 'Bộ phận Kho bãi',
    joined: '12/03/2022',
    privileges: [
      'Thực hiện xác nhận nhập kho vật lý (GRN)',
      'Thực hiện xác nhận xuất kho vật lý (GDN)',
      'Quản lý vị trí lưu trữ hàng hóa và nhãn barcode 12 chữ số',
      'Khởi tạo đợt kiểm kê kho và nhập số liệu đếm thực tế',
      'Được ẩn các trường thông tin về đơn giá và tổng giá trị tài chính để đảm bảo bảo mật kho bãi'
    ]
  },
  hr: {
    name: 'Nguyễn Thị Lan',
    initials: 'NL',
    role: 'Nhân sự (HR)',
    email: 'lan.nguyen@namviet.vn',
    phone: '0903.456.789',
    dept: 'Phòng Nhân sự',
    joined: '01/03/2021',
    privileges: [
      'Quản lý danh sách ứng viên và quy trình tuyển dụng',
      'Quản lý hồ sơ nhân viên toàn công ty',
      'Gán mã nhân viên và cập nhật thông tin tổ chức',
      'Theo dõi onboarding nhân viên mới',
      'Xem và chỉnh sửa thông tin chi tiết ứng viên/nhân viên'
    ]
  }
};

export default function UserProfilePage() {
  const [activeRole, setActiveRole] = useState('storekeeper');
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('nv-user-role') || 'storekeeper';
    setActiveRole(role);
  }, []);

  const user = rolesMap[activeRole as keyof typeof rolesMap] || rolesMap.storekeeper;

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
            {user.initials}
          </div>

          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--md-on-surface)' }}>
            {user.name}
          </h2>
          <p className="text-sm font-semibold mb-4 px-3 py-1 rounded-full"
            style={{
              background: 'var(--md-secondary-container)',
              color: 'var(--md-on-secondary-container)'
            }}
          >
            {user.role}
          </p>

          <div className="w-full border-t border-[var(--md-outline-variant)] pt-4 mt-2 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm text-[var(--md-on-surface-variant)]">
              <Mail size={16} className="text-[var(--md-primary)]" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--md-on-surface-variant)]">
              <Phone size={16} className="text-[var(--md-primary)]" />
              <span>{user.phone}</span>
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
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-[var(--md-on-surface-variant)] block mb-1">Họ và tên</span>
                <p className="text-sm font-semibold text-[var(--md-on-surface)] flex items-center gap-2">
                  <User size={14} className="text-[var(--md-outline)]" />
                  {user.name}
                </p>
              </div>

              <div>
                <span className="text-xs text-[var(--md-on-surface-variant)] block mb-1">Phòng ban / Bộ phận</span>
                <p className="text-sm font-semibold text-[var(--md-on-surface)] flex items-center gap-2">
                  <Building size={14} className="text-[var(--md-outline)]" />
                  {user.dept}
                </p>
              </div>

              <div>
                <span className="text-xs text-[var(--md-on-surface-variant)] block mb-1">Ngày tham gia</span>
                <p className="text-sm font-semibold text-[var(--md-on-surface)] flex items-center gap-2">
                  <Calendar size={14} className="text-[var(--md-outline)]" />
                  {user.joined}
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
              {user.privileges.map((priv, idx) => (
                <div
                  key={idx}
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
                    {idx + 1}
                  </div>
                  <p className="text-sm text-[var(--md-on-surface-variant)] leading-relaxed">
                    {priv}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
