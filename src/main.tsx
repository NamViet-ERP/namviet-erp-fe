import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { assertProductionConfig } from './lib/assertProductionConfig';
import { queryClient } from './lib/queryClient';
import { initAuthTokenProvider } from './services/authService';

function renderConfigError(message: string): void {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  rootElement.replaceChildren();
  const panel = document.createElement('div');
  panel.style.cssText =
    'font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:1.5rem;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#991b1b;';

  const title = document.createElement('h1');
  title.style.cssText = 'font-size:1.125rem;margin:0 0 0.75rem;';
  title.textContent = 'Không thể khởi động ứng dụng';

  const body = document.createElement('p');
  body.style.cssText = 'margin:0;line-height:1.5;';
  body.textContent = message;

  panel.append(title, body);
  rootElement.append(panel);
}

function boot() {
  try {
    assertProductionConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cấu hình production không hợp lệ.';
    renderConfigError(message);
    return;
  }

  initAuthTokenProvider();

  const rootElement = document.getElementById('root') as HTMLElement;
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </StrictMode>,
  );
}

boot();
