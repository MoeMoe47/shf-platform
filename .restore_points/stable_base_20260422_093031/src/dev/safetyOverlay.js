(function(){
  function show(msg){
    const d=document.createElement('div');
    d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);color:#fff;padding:24px;z-index:999999;overflow:auto;font:14px/1.5 system-ui,Segoe UI,Roboto';
    d.innerHTML = '<h2 style="margin-top:0">Runtime Error</h2><pre style="white-space:pre-wrap">'+msg+'</pre>';
    document.body.appendChild(d);
  }
  window.addEventListener('error', e => show(e.message+'\n'+(e.filename||'')+':'+(e.lineno||'') ));
  window.addEventListener('unhandledrejection', e => show('Promise rejection: '+(e.reason && (e.reason.stack||e.reason.message||e.reason)) ));
})();
