import PageHeader from '../../components/ui/PageHeader';
import { GENERAL_WAREHOUSE_LABEL_LOWER } from '../../lib/wms/stockTerminology';
import ApiStockMatrixView from './ApiStockMatrixView';

export default function StockListPage() {
  return (
    <div className="hrm-page">
      <PageHeader
        title="Tồn kho"
        subtitle={`Theo dõi tồn ${GENERAL_WAREHOUSE_LABEL_LOWER} và phân bổ theo kho dự án.`}
      />
      <ApiStockMatrixView />
    </div>
  );
}
