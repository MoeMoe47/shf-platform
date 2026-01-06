import React from "react";
export default class DevErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err){ return { err }; }
  componentDidCatch(err, info){ console.error("[App crash]", err, info); }
  render(){
    if (!this.state.err) return this.props.children;
    return (
      <div style={{padding:16,background:"#fff5f5",border:"1px solid #fecaca",borderRadius:12,margin:12}}>
        <h2 style={{marginTop:0}}>💥 Render error</h2>
        <pre style={{whiteSpace:"pre-wrap",fontSize:13}}>
{String(this.state.err?.stack || this.state.err)}
        </pre>
      </div>
    );
  }
}
