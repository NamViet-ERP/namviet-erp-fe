import { useOutletContext } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { CSKH_SCREENS, type CskhScreenId } from '../../constants/cskh';
import type { WarehouseProjectApiDto } from '../../types/wms';

interface CskhOutletContext {
  projectCode: string;
  projects: WarehouseProjectApiDto[];
}

export default function CskhScreenPage({ screen }: { screen: CskhScreenId }) {
  const { projectCode } = useOutletContext<CskhOutletContext>();
  const copy = CSKH_SCREENS[screen];
  const needsProjectPick = copy.needsProject && !projectCode;

  return (
    <>
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <EmptyState
        icon={FolderKanban}
        message={needsProjectPick ? 'Chọn dự án đang làm ở phía trên để mở tab này.' : copy.empty}
      />
    </>
  );
}
