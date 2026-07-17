import { useEffect, useState } from 'react';
import { filesService } from '../services/filesService';

function isPrivateStorageKey(value?: string): value is string {
  return Boolean(value && /^hr\//i.test(value));
}

export function useSecureFileUrl(source?: string, fileName?: string) {
  const requestKey = `${source ?? ''}\u0000${fileName ?? ''}`;
  const [resolved, setResolved] = useState<{
    requestKey: string;
    url?: string;
    error: Error | null;
  } | null>(null);

  useEffect(() => {
    if (!isPrivateStorageKey(source)) return;

    const controller = new AbortController();
    let objectUrl: string | undefined;

    void filesService.downloadPrivate(source, fileName, controller.signal)
      .then(blob => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setResolved({ requestKey, url: objectUrl, error: null });
      })
      .catch(cause => {
        if (controller.signal.aborted) return;
        setResolved({
          requestKey,
          error: cause instanceof Error ? cause : new Error('Không thể tải tệp bảo mật'),
        });
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, fileName, requestKey]);

  if (!isPrivateStorageKey(source)) {
    return { url: source, isLoading: false, error: null };
  }
  if (resolved?.requestKey === requestKey) {
    return { url: resolved.url, isLoading: false, error: resolved.error };
  }
  return { url: undefined, isLoading: true, error: null };
}
