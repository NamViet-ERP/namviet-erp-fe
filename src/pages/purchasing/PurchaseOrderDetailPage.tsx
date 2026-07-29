import { useNavigate, useParams } from 'react-router-dom';
import { CreatePurchaseOrderForm } from './purchaseOrderDetail/CreatePurchaseOrderForm';
import { PurchaseOrderDetailView } from './purchaseOrderDetail/PurchaseOrderDetailView';

/** Chi tiết PO hoặc tạo mới: chọn KHMH → NCC → dòng hàng. */
export default function PurchaseOrderDetailPage() {
  const { code } = useParams<{ code: string }>();
  const isCreate = !code || code === 'new';
  const navigate = useNavigate();

  if (isCreate) {
    return (
      <CreatePurchaseOrderForm
        onCreated={c => navigate(`/purchasing/orders/${encodeURIComponent(c)}`, { replace: true })}
      />
    );
  }

  return <PurchaseOrderDetailView code={code} />;
}
