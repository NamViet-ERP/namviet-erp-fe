import { Navigate } from 'react-router-dom';

/** Redirect — không còn tách đơn ngoài nước. */
export default function InternationalOrdersPage() {
  return <Navigate to="/purchasing/orders" replace />;
}
