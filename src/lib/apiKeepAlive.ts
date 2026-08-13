/** Ping interval below Render Free idle sleep (~15 min). */
const KEEP_ALIVE_MS = 5 * 60 * 1000;

function pingApi(): void {
  void fetch('/health', { cache: 'no-store', credentials: 'omit' }).catch(() => undefined);
}

/** Keep the Render API awake while this tab is open. */
export function startApiKeepAlive(): void {
  pingApi();
  window.setInterval(pingApi, KEEP_ALIVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pingApi();
  });
}
