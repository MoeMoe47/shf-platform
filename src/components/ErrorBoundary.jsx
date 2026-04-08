import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(255,110,110,0.25)",
          background: "rgba(18,20,28,0.92)",
          color: "#e9f2fa"
        }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            Module Error
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {String(this.state.error)}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
