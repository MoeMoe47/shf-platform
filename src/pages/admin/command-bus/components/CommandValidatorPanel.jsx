export default function CommandValidatorPanel({ validation }) {
  return (
    <section className="command-panel validation">
      <div className="panel-heading"><p>Validation</p><h2>Validator</h2></div>
      <strong>{validation.validation_status || "valid"}</strong>
      <span>Schema valid: {String(validation.schema?.valid ?? true)}</span>
      <span>Permissions: {validation.permissions?.permission_status || "allowed"}</span>
      <span>Safety: {validation.safety?.safety_status || "allowed"}</span>
      <span>Policy: {validation.policy?.policy_status || "allowed"}</span>
    </section>
  );
}
