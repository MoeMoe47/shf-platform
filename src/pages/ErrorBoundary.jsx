import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false }; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(err, info){ console.error("Lesson crash:", err, info); }
  render(){
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
