import { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
  /** When set, rendered instead of the full-page fallback (e.g. isolate Dev-only tools). */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
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
