import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}

export function ErrorScreen({ message, onRetry }) {
  return (
    <div className="error-screen">
      <div className="error-box">
        <div className="logo" style={{ marginBottom: 24 }}>
          <span className="dev">श</span>Shabda
        </div>
        <p className="error-title">Something went wrong</p>
        <p className="error-msg">
          {message || "We couldn't load today's word. Please check your connection and try again."}
        </p>
        {onRetry && (
          <button className="btn primary" onClick={onRetry} style={{ marginTop: 24 }}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
