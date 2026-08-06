import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** When set, rendered instead of the full-page fallback (e.g. isolate Dev-only tools). */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div className="error-fallback-page">
          <h1 className="error-fallback-page__title">Đã xảy ra lỗi</h1>
          <p className="error-fallback-page__message">
            Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang hoặc thử lại sau.
          </p>
          {import.meta.env.DEV && this.state.errorMessage ? (
            <pre className="error-fallback-page__dev-detail">{this.state.errorMessage}</pre>
          ) : null}
          <button
            type="button"
            className="btn btn-filled"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
