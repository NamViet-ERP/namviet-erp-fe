import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
} from '@microsoft/signalr';
import { getStoredToken } from './authSession';

export const ACTIVITY_HUB_EVENT = 'activity.created';

export interface ActivityEventCreatedPayload {
  id: number;
  occurredAt: string;
  actorUserId: string | null;
  actorName: string;
  module: string;
  action: string;
  entityType: string | null;
  entityCode: string | null;
  message: string;
  categoryLabel: string;
}

function hubUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  return `${base}/hubs/activity`;
}

/** Cookie credentials for negotiate + Bearer access from memory. */
export function createActivityHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(hubUrl(), {
      withCredentials: true,
      accessTokenFactory: () => getStoredToken() ?? '',
      transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
}

export async function ensureHubStarted(connection: HubConnection): Promise<void> {
  if (connection.state === HubConnectionState.Connected) return;
  if (connection.state === HubConnectionState.Connecting) return;
  await connection.start();
}
