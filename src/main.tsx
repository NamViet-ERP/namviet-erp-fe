import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './auth/AuthProvider';
import { queryClient } from './lib/queryClient';
import { startApiKeepAlive } from './lib/apiKeepAlive';
import { authService, initAuthTokenProvider } from './services/authService';

initAuthTokenProvider();
startApiKeepAlive();
void authService.ensureSession();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
