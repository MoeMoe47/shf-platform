// src/components/GlobalErrorBoundary.jsx
import React from "react";

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global error boundary caught:", error, errorInfo);
    // Optionally send error to a logging service
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "var(--beige)",
            color: "var(--slate)",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <h1 style={{ marginBottom: "10px" }}>⚠️ Something went wrong</h1>
          <p style={{ marginBottom: "20px" }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button className="sh-btn sh-btn--primary" onClick={this.handleReload}>
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
