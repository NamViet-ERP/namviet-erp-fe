import { Navigate } from 'react-router-dom';

/** Redirect — mua hàng chỉ còn một danh sách đơn. */
export default function DomesticOrdersPage() {
  return <Navigate to="/purchasing/orders" replace />;
}
