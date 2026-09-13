import { AX0_AUDIT_ERRORS, AX0_GAPS, AX0_MATURITY, AX0_RUNTIME_INVENTORY } from "../src/system/accessibility/ax0Audit.js";

if (AX0_AUDIT_ERRORS.length) {
  console.error("AX-0 audit validation failed:");
  AX0_AUDIT_ERRORS.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const severityCounts = AX0_GAPS.reduce((counts, [, severity]) => ({ ...counts, [severity]: (counts[severity] || 0) + 1 }), {});
console.log("AX-0 audit validation: PASS");
console.log(`- runtime mechanisms: ${AX0_RUNTIME_INVENTORY.length}`);
console.log(`- gaps: ${AX0_GAPS.length} (${JSON.stringify(severityCounts)})`);
console.log(`- maturity areas: ${AX0_MATURITY.length}`);
