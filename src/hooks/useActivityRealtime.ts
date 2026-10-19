import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ACTIVITY_HUB_EVENT,
  createActivityHubConnection,
  ensureHubStarted,
  type ActivityEventCreatedPayload,
} from '../lib/activityHub';
import { getSessionUser } from '../constants/systemUsers';
import { suppressOwnWmsBellToast } from '../lib/wms/ownWmsBellToast';
import { queryKeys } from '../services/queryKeys';

const OWN_IMPORT_BELL_ACTIONS = new Set(['import.submitted', 'import.created']);

function suppressBellToastIfOwnImport(payload: ActivityEventCreatedPayload) {
  const me = getSessionUser();
  const actorId = payload.actorUserId?.trim();
  if (!me?.id || !actorId || actorId.toLowerCase() !== me.id.toLowerCase()) return;
  if (!OWN_IMPORT_BELL_ACTIONS.has(payload.action)) return;
  suppressOwnWmsBellToast(payload.entityCode);
}

/**
 * Subscribes to SignalR activity push for a module group.
 * On event: invalidates purchasing dashboard caches (summary/chart/feed).
 * Returns whether the hub is currently connected (used to pause polling).
 */
const isSignalREnabled = import.meta.env.VITE_ENABLE_SIGNALR === 'true';

export function useActivityRealtime(module: string, enabled = true): { connected: boolean } {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isSignalREnabled || !enabled || !module.trim()) return;

    const connection = createActivityHubConnection();
    let cancelled = false;

    const onCreated = (payload: ActivityEventCreatedPayload) => {
      suppressBellToastIfOwnImport(payload);
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchasingDashboard.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wmsNotifications.all });
    };

    const wire = async () => {
      const delays = [0, 2000, 5000, 10000];
      for (let attempt = 0; attempt < delays.length; attempt++) {
        if (cancelled) return;
        if (delays[attempt] > 0) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          if (cancelled) return;
        }
        try {
          await ensureHubStarted(connection);
          if (cancelled) return;
          await connection.invoke('JoinModule', module.trim());
          if (cancelled) return;
          setConnected(true);
          return;
        } catch {
          if (!cancelled) setConnected(false);
        }
      }
    };

    connection.on(ACTIVITY_HUB_EVENT, onCreated);
    connection.onreconnected(async () => {
      if (cancelled) return;
      try {
        await connection.invoke('JoinModule', module.trim());
        setConnected(true);
      } catch {
        setConnected(false);
      }
    });
    connection.onclose(() => {
      if (!cancelled) setConnected(false);
    });
    connection.onreconnecting(() => {
      if (!cancelled) setConnected(false);
    });

    void wire();

    return () => {
      cancelled = true;
      connection.off(ACTIVITY_HUB_EVENT, onCreated);
      void connection.stop();
      setConnected(false);
    };
  }, [module, enabled, queryClient]);

  return { connected };
}
