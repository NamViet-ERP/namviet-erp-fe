import PageHeader from '../../components/ui/PageHeader';
import ApiStockMatrixView from './ApiStockMatrixView';

export default function StockListPage() {
  return (
    <div className="hrm-page">
      <PageHeader
        title="Tồn kho"
        subtitle="Theo dõi tồn kho tổng và phân bổ theo kho dự án."
      />
      <ApiStockMatrixView />
    </div>
  );
}
