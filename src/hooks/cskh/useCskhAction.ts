import { useRef, useState } from 'react';
import { showToast } from '../../components/ui/Toast';

/** Keep forms open on failure and block duplicate clicks until the write completes. */
export function useCskhAction() {
  const busy = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    setIsPending(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không lưu được thay đổi. Vui lòng thử lại.';
      setError(message);
      showToast('error', message);
      return false;
    } finally {
      busy.current = false;
      setIsPending(false);
    }
  };
  return { run, isPending, error };
}
