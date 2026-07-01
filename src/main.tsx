import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { queryClient } from './lib/queryClient'
import { initAuthTokenProvider } from './services/authService'
import { USE_MOCK } from './mocks'
import { initSystemUsersMock } from './constants/systemUsers'

async function boot() {
  if (USE_MOCK) {
    await initSystemUsersMock()
  }

  initAuthTokenProvider()

  const rootElement = document.getElementById('root') as HTMLElement
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void boot()
