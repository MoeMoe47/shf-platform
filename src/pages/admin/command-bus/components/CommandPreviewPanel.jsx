export default function CommandPreviewPanel({ preview }) {
  return (
    <section className="command-panel preview">
      <div className="panel-heading"><p>Preview</p><h2>Dispatch Preview</h2></div>
      <strong>{preview.dispatch_status || "preview_ready"}</strong>
      <span>Execution performed: {String(preview.execution_performed)}</span>
      <span>Preview only: {String(preview.preview_only)}</span>
      <span>Target layer: {preview.route?.target_layer || "System"}</span>
    </section>
  );
}
