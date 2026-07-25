import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ACTIVITY_HUB_EVENT,
  createActivityHubConnection,
  ensureHubStarted,
  type ActivityEventCreatedPayload,
} from '../lib/activityHub';
import { queryKeys } from '../services/queryKeys';

/**
 * Subscribes to SignalR activity push for a module group.
 * On event: invalidates purchasing dashboard caches (summary/chart/feed).
 * Returns whether the hub is currently connected (used to pause polling).
 */
export function useActivityRealtime(module: string, enabled = true): { connected: boolean } {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !module.trim()) return;

    const connection = createActivityHubConnection();
    let cancelled = false;

    const onCreated = (_payload: ActivityEventCreatedPayload) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchasingDashboard.all });
    };

    const wire = async () => {
      try {
        await ensureHubStarted(connection);
        if (cancelled) return;
        await connection.invoke('JoinModule', module.trim());
        if (cancelled) return;
        setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
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
