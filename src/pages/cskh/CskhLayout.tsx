import { Outlet } from 'react-router-dom';

export default function CskhLayout() {
  return (
    <div className="page-shell cskh-shell">
      <Outlet />
    </div>
  );
}
