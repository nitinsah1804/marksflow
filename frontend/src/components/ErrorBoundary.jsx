import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MarksFlow Runtime Error Caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--bg-page)',
            color: 'var(--text-primary)'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--rose-light)',
                color: 'var(--rose)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Portal Render Interrupted
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              An unexpected display error occurred while rendering the academic view. The system has safely halted to prevent corrupted calculations.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--rose)',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                  wordBreak: 'break-all'
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <button className="btn btn-primary" onClick={this.handleReload} style={{ margin: '0 auto' }}>
              <RefreshCw size={15} /> Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
