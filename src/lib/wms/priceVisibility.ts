import { useEffect, useState } from 'react';
import { AUTH_CHANGED_EVENT, getSessionUser } from '../../constants/systemUsers';
import { hasPermission } from '../permissions';

/** Client role for Warehouse_Keeper (see toClientRole). */
const STOREKEEPER_ROLE = 'storekeeper';

/**
 * Mirror BE PriceVisibility: Admin / wms.prices.view may see money;
 * thủ kho (storekeeper) never sees unit price / totals — even if claim was mis-assigned.
 */
export function canViewWmsPrices(permissions?: readonly string[], role?: string): boolean {
  const session = getSessionUser();
  const resolvedRole = (role ?? session?.role ?? '').toLowerCase();
  if (resolvedRole === 'admin') return true;
  if (resolvedRole === STOREKEEPER_ROLE || resolvedRole === 'warehouse_keeper') return false;
  return hasPermission(permissions ?? session?.permissions ?? [], 'wms.prices.view');
}

/** Reactive helper — re-renders when session / permissions change. */
export function useCanViewWmsPrices(): boolean {
  const [, setRevision] = useState(0);
  useEffect(() => {
    const onAuthChanged = () => setRevision(v => v + 1);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, []);
  return canViewWmsPrices();
}
