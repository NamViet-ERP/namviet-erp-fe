import { useNavigate } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

export default function CskhProjectMissing({ loading }: { loading: boolean }) {
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="page-stack cskh-desk" aria-busy="true" aria-label="Đang tải dự án">
        <div className="cskh-grid" aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="cskh-grid-card cskh-grid-card--skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack cskh-desk">
      <PageHeader
        title="Không tìm thấy dự án"
        subtitle="Mã này không có trên trung tâm điều hành."
      />
      <HrmPanel className="cskh-desk__panel">
        <EmptyState
          icon={FolderKanban}
          message="Không tìm thấy dự án. Quay lại danh sách để chọn thẻ khác."
          action={(
            <Button type="button" variant="outlined" onClick={() => navigate('/cskh')}>
              Tất cả dự án
            </Button>
          )}
        />
      </HrmPanel>
    </div>
  );
}
