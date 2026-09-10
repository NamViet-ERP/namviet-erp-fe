import PageHeader from '../../components/ui/PageHeader';
import { GENERAL_WAREHOUSE_LABEL_LOWER } from '../../lib/wms/stockTerminology';
import ApiStockMatrixView from './ApiStockMatrixView';

export default function StockListPage() {
  return (
    <div className="hrm-page">
      <PageHeader
        title="Tồn kho"
        subtitle={`Hai sổ riêng: ${GENERAL_WAREHOUSE_LABEL_LOWER} (kho tổng) và từng kho dự án.`}
      />
      <ApiStockMatrixView />
    </div>
  );
}
