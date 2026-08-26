import { useCallback, useState } from 'react';
import { CSKH_PROJECT_STORAGE_KEY } from '../../constants/cskh';

function readStoredProject(): string {
  try {
    return sessionStorage.getItem(CSKH_PROJECT_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function useCskhProject() {
  const [projectCode, setProjectCodeState] = useState(readStoredProject);

  const setProjectCode = useCallback((code: string) => {
    setProjectCodeState(code);
    try {
      if (code) sessionStorage.setItem(CSKH_PROJECT_STORAGE_KEY, code);
      else sessionStorage.removeItem(CSKH_PROJECT_STORAGE_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  return { projectCode, setProjectCode };
}
