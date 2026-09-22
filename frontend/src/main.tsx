import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          color: '#1d1d1f',
          backgroundColor: '#f5f6fa',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            ⚠️ 예기치 않은 오류가 발생했습니다
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#86868b', marginBottom: '1.5rem', textAlign: 'center' }}>
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            페이지 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html contains a <div id="root"></div>.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
