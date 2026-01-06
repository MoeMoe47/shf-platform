// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false }; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(err, info){ console.error("UI Error:", err, info); }

  render(){
    if (this.state.hasError){
      return (
        <section role="alert" className="sh-card">
          <div className="sh-cardStripe" />
          <div className="sh-cardBody">
            <h2 className="sh-cardTitle">Something went wrong</h2>
            <p className="sh-muted">Please try reloading. If it keeps happening, let us know.</p>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
