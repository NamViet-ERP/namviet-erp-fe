import { useState, useEffect } from 'react';
import { Search, RotateCcw, Eye, FileText, Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';

interface Candidate {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  gender: 'Nam' | 'Nữ';
  address: string;
  birthDate: string;
  education: string;
  position: string;
  experience: string;
  source: string;
  cvFileName: string;
  cvFileSize: string;
  appliedAt: string;
  status: 'Mới nộp' | 'Đã duyệt CV' | 'Đang phỏng vấn' | 'Đạt yêu cầu' | 'Từ chối';
}

const POSITIONS = [
  'CS sầu riêng', 'CSKH MZ', 'Giám sát MTKP', 'HCNS', 'Kế toán', 
  'Kỹ thuật xưởng Mayzer', 'Marketing', 'Quản lý trang trại', 'Sale Kaizen', 
  'Sale King Power', 'Sale Mayzer', 'Sale Mayzer Hà Nội', 'Sale miền tây', 
  'Sale MTKP', 'Thiết kế/dự toán', 'Thu mua', 'TP Công nghệ MTKP', 
  'TP KD MTKP', 'TTS HCNS', 'Vận hành MTKP', 'Kỹ thuật điện', 
  'Giám sát', 'Nhân viên dự án', 'Sourcing', 'Nhân viên công nghệ MTKP', 
  'Kỹ thuật điện Mayzer', 'KT Quản lý kho Mayzer', 'Trưởng nhóm bảo trì Lò hơi', 
  'KT Chế tạo Lò hơi', 'TTS Cung ứng', 'Kỹ thuật MNK', 'PP Vận hành MTKP', 
  'Thiết kế thi công MTKP', 'Kỹ sư môi trường'
];

const SOURCES = ['Facebook', 'Zalo', '24h - lọc', '24h - ứng tuyển', 'TopCV', 'Glints'];
const STATUSES = ['Mới nộp', 'Đã duyệt CV', 'Đang phỏng vấn', 'Đạt yêu cầu', 'Từ chối'];

const MOCK_INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand_1',
    fullName: 'Nguyễn Văn An',
    phone: '0987654321',
    email: 'an.nguyen@gmail.com',
    gender: 'Nam',
    address: 'Q. Ninh Kiều, Cần Thơ',
    birthDate: '1998-05-15',
    education: 'Đại học',
    position: 'Quản lý trang trại',
    experience: '3 năm kinh nghiệm quản lý trang trại chăn nuôi công nghệ cao',
    source: 'TopCV',
    cvFileName: 'CV_NguyenVanAn_FarmManager.pdf',
    cvFileSize: '1.85 MB',
    appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: 'Mới nộp'
  },
  {
    id: 'cand_2',
    fullName: 'Lê Thị Bình',
    phone: '0912345678',
    email: 'binh.le@outlook.com',
    gender: 'Nữ',
    address: 'Hải Châu, Đà Nẵng',
    birthDate: '1995-10-24',
    education: 'Đại học',
    position: 'Kế toán',
    experience: '5 năm kế toán tổng hợp, có chứng chỉ kế toán trưởng',
    source: 'Facebook',
    cvFileName: 'CV_LeThiBinh_KeToan.docx',
    cvFileSize: '2.12 MB',
    appliedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'Đã duyệt CV'
  },
  {
    id: 'cand_3',
    fullName: 'Phạm Hồng Cường',
    phone: '0909999888',
    email: 'cuong.pham@gmail.com',
    gender: 'Nam',
    address: 'Q. Gò Vấp, TP. Hồ Chí Minh',
    birthDate: '2000-02-08',
    education: 'Cao đẳng',
    position: 'CS sầu riêng',
    experience: '1 năm hỗ trợ kỹ thuật vườn cây ăn trái, tốt nghiệp kỹ sư nông nghiệp',
    source: 'Zalo',
    cvFileName: 'CV_PhamHongCuong_CS.pdf',
    cvFileSize: '1.20 MB',
    appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'Đang phỏng vấn'
  }
];

export default function CandidateListPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected candidate for detail view modal
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Load candidate list from localStorage on mount
  useEffect(() => {
    const rawData = localStorage.getItem('nv-candidate-data');
    if (rawData) {
      setCandidates(JSON.parse(rawData));
    } else {
      // Preload mocks so the table has content initially
      localStorage.setItem('nv-candidate-data', JSON.stringify(MOCK_INITIAL_CANDIDATES));
      setCandidates(MOCK_INITIAL_CANDIDATES);
    }
  }, []);

  const handleStatusChange = (candId: string, newStatus: Candidate['status']) => {
    const updatedCandidates = candidates.map(c => 
      c.id === candId ? { ...c, status: newStatus } : c
    );
    setCandidates(updatedCandidates);
    localStorage.setItem('nv-candidate-data', JSON.stringify(updatedCandidates));
    showToast('success', `Đã cập nhật trạng thái ứng viên thành: ${newStatus}`);
  };

  const handleDownloadCV = (cvName: string) => {
    showToast('info', `Bắt đầu tải xuống file: ${cvName}`, 'Tải CV');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPosition('');
    setSelectedSource('');
    setSelectedStatus('');
  };

  // Filter logic
  const filteredCandidates = candidates.filter(cand => {
    const matchSearch = 
      cand.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.phone.includes(searchQuery);

    const matchPosition = selectedPosition ? cand.position === selectedPosition : true;
    const matchSource = selectedSource ? cand.source === selectedSource : true;
    const matchStatus = selectedStatus ? cand.status === selectedStatus : true;

    return matchSearch && matchPosition && matchSource && matchStatus;
  });

  const getStatusBadgeStyle = (status: Candidate['status']) => {
    switch (status) {
      case 'Mới nộp':
        return { bg: 'var(--md-info-container)', color: 'var(--md-on-info-container)', label: 'Mới nộp' };
      case 'Đã duyệt CV':
        return { bg: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', label: 'Đã duyệt CV' };
      case 'Đang phỏng vấn':
        return { bg: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)', label: 'Đang phỏng vấn' };
      case 'Đạt yêu cầu':
        return { bg: 'var(--md-success-container)', color: 'var(--md-on-success-container)', label: 'Đạt yêu cầu' };
      case 'Từ chối':
        return { bg: 'var(--md-error-container)', color: 'var(--md-on-error-container)', label: 'Từ chối' };
      default:
        return { bg: 'var(--md-surface-variant)', color: 'var(--md-on-surface-variant)', label: status };
    }
  };

  return (
    <div style={{ color: 'var(--md-on-surface)' }}>
      <PageHeader
        eyebrow="Quản trị nhân sự"
        title="Danh sách ứng viên ứng tuyển"
      />

      {/* Filters Area */}
      <div
        style={{
          background: 'var(--md-surface-container)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: 'var(--md-shadow-1)',
          border: '1px solid var(--md-outline-variant)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px' }} className="grid-cols-1 md:grid-cols-4">
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input-compact"
              placeholder="Tìm theo tên, email, sđt..."
              style={{ paddingLeft: '36px', height: '40px', borderRadius: '8px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--md-on-surface-variant)',
              }}
            />
          </div>

          {/* Position Filter */}
          <select
            className="form-select"
            style={{ height: '40px', borderRadius: '8px', borderBottom: '1px solid var(--md-outline)' }}
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
          >
            <option value="">-- Tất cả vị trí ứng tuyển --</option>
            {POSITIONS.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            className="form-select"
            style={{ height: '40px', borderRadius: '8px', borderBottom: '1px solid var(--md-outline)' }}
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="">-- Tất cả nguồn tuyển --</option>
            {SOURCES.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="form-select"
              style={{ height: '40px', borderRadius: '8px', borderBottom: '1px solid var(--md-outline)', flex: 1 }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">-- Tất cả trạng thái --</option>
              {STATUSES.map(stat => (
                <option key={stat} value={stat}>{stat}</option>
              ))}
            </select>

            <button
              onClick={resetFilters}
              className="btn btn-outline"
              title="Đặt lại bộ lọc"
              style={{
                height: '40px',
                width: '40px',
                padding: 0,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div
        style={{
          background: 'var(--md-surface-container)',
          borderRadius: '16px',
          boxShadow: 'var(--md-shadow-1)',
          border: '1px solid var(--md-outline-variant)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="table-header-cell">Ngày nộp</th>
                <th className="table-header-cell">Ứng viên</th>
                <th className="table-header-cell">Số điện thoại / Email</th>
                <th className="table-header-cell">Vị trí ứng tuyển</th>
                <th className="table-header-cell">Kinh nghiệm</th>
                <th className="table-header-cell">Nguồn</th>
                <th className="table-header-cell" style={{ minWidth: '120px' }}>CV File</th>
                <th className="table-header-cell" style={{ minWidth: '150px' }}>Trạng thái</th>
                <th className="table-header-cell" style={{ textAlign: 'center' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 0', textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>
                    Không tìm thấy dữ liệu ứng viên nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const badgeStyle = getStatusBadgeStyle(cand.status);
                  const formattedDate = new Date(cand.appliedAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={cand.id} className="table-row">
                      <td className="table-cell" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>
                      <td className="table-cell" style={{ fontWeight: 600 }}>
                        {cand.fullName}
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', fontWeight: 400 }}>
                          {cand.gender} • {new Date().getFullYear() - new Date(cand.birthDate).getFullYear()} tuổi
                        </span>
                      </td>
                      <td className="table-cell">
                        <span style={{ display: 'block', fontWeight: 500 }}>{cand.phone}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>{cand.email}</span>
                      </td>
                      <td className="table-cell" style={{ fontWeight: 500, color: 'var(--md-primary)' }}>
                        {cand.position}
                      </td>
                      <td className="table-cell" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cand.experience}>
                        {cand.experience}
                      </td>
                      <td className="table-cell">
                        <span style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          background: 'var(--md-surface-container-high)',
                          color: 'var(--md-on-surface)',
                          border: '1px solid var(--md-outline-variant)'
                        }}>
                          {cand.source}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleDownloadCV(cand.cvFileName)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--md-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'background-color 200ms var(--md-easing)',
                            fontSize: '0.8rem',
                            maxWidth: '150px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--nv-surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <FileText size={14} style={{ flexShrink: 0 }} />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {cand.cvFileName}
                          </span>
                          <Download size={12} style={{ flexShrink: 0 }} />
                        </button>
                      </td>
                      <td className="table-cell">
                        <select
                          value={cand.status}
                          onChange={(e) => handleStatusChange(cand.id, e.target.value as Candidate['status'])}
                          style={{
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: 'none',
                            borderRadius: '9999px',
                            padding: '4px 12px 4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: 'var(--md-shadow-1)',
                          }}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s} style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="table-cell" style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedCandidate(cand)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--md-on-surface-variant)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 200ms var(--md-easing)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--nv-surface-hover)';
                            e.currentTarget.style.color = 'var(--md-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--md-on-surface-variant)';
                          }}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Details Modal */}
      <Modal
        isOpen={selectedCandidate !== null}
        onClose={() => setSelectedCandidate(null)}
        title="Thông tin chi tiết ứng viên"
        size="md"
        footer={
          <button
            onClick={() => setSelectedCandidate(null)}
            className="btn btn-primary"
            style={{ borderRadius: '9999px', padding: '0 24px' }}
          >
            Đóng
          </button>
        }
      >
        {selectedCandidate && (
          <div style={{ color: 'var(--md-on-surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--md-outline-variant)', paddingBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedCandidate.fullName}</h4>
                <p style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.875rem' }}>
                  {selectedCandidate.gender} • Sinh ngày: {new Date(selectedCandidate.birthDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <span
                style={{
                  background: getStatusBadgeStyle(selectedCandidate.status).bg,
                  color: getStatusBadgeStyle(selectedCandidate.status).color,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: 'var(--md-shadow-1)',
                }}
              >
                {selectedCandidate.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>SỐ ĐIỆN THOẠI</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedCandidate.phone}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>EMAIL</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedCandidate.email}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>ĐỊA CHỈ HIỆN TẠI</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedCandidate.address}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>TRÌNH ĐỘ HỌC VẤN</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedCandidate.education}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>NGUỒN TUYỂN DỤNG</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedCandidate.source}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>VỊ TRÍ ỨNG TUYỂN</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--md-primary)' }}>{selectedCandidate.position}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>KINH NGHIỆM</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedCandidate.experience || 'Không ghi'}</span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--md-surface-container-low)',
                borderRadius: '12px',
                padding: '12px 16px',
                border: '1px solid var(--md-outline-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--md-primary-container)', color: 'var(--md-primary)', padding: '8px', borderRadius: '8px' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedCandidate.cvFileName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>{selectedCandidate.cvFileSize}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownloadCV(selectedCandidate.cvFileName)}
                className="btn btn-outline"
                style={{ height: '36px', padding: '0 16px', fontSize: '0.8rem', borderRadius: '9999px' }}
              >
                Tải CV xuống
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
