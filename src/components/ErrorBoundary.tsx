import { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const CHUNK_RELOAD_STORAGE_KEY = 'nv-chunk-reload-ts';
const CHUNK_RELOAD_WINDOW_MS = 15_000;
const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i;

function isChunkLoadError(error: Error): boolean {
  return (
    CHUNK_LOAD_ERROR_PATTERN.test(error.message || error.name)
    || CHUNK_LOAD_ERROR_PATTERN.test(error.name)
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack);

    if (isChunkLoadError(error) && typeof window !== 'undefined') {
      let prev: string | null;
      try {
        prev = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
      } catch {
        prev = null;
      }
      const prevTs = prev ? Number(prev) : NaN;
      if (!prev || !Number.isFinite(prevTs) || Date.now() - prevTs > CHUNK_RELOAD_WINDOW_MS) {
        try {
          sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(Date.now()));
        } catch {
          // Ignore sessionStorage write errors in restricted browser contexts
        }
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div className="error-fallback-page" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="error-fallback-page__title">Đã xảy ra lỗi</h1>
          <p className="error-fallback-page__message">
            Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang hoặc thử lại sau.
          </p>
          
          {this.state.error && import.meta.env.DEV && (
            <div style={{ padding: 20, textAlign: 'left', background: '#fee2e2', color: '#991b1b', borderRadius: 8, margin: '20px 0', fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflowX: 'auto', border: '1px solid #f87171' }}>
              <strong style={{fontSize: 16}}>{this.state.error.toString()}</strong>
              <br/><br/>
              {this.state.error.stack}
            </div>
          )}

          <Button
            type="button"
            variant="filled"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
