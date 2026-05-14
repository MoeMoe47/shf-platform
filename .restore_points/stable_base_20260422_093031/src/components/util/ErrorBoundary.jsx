import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, err:null }; }
  static getDerivedStateFromError(err){ return { hasError:true, err }; }
  componentDidCatch(err, info){ try { console.error("[ErrorBoundary]", err, info); } catch {} }
  render(){
    if(!this.state.hasError) return this.props.children;
    return (
      <div className="page pad">
        <div className="card card--pad" style={{border:'1px solid #fca5a5', background:'#fff7f7'}}>
          <h2 style={{marginTop:0}}>Something went wrong</h2>
          <p className="muted">Try a hard refresh. If this keeps happening, screenshot the console.</p>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.err?.message||this.state.err||'')}</pre>
        </div>
      </div>
    );
  }
}
