import { makeLayer } from "../_layerContract.js";
export const { LAYER, init, status, guard, recommend, default: Layer } = makeLayer({
  id: "L08",
  name: "Employer Partnerships & Reimbursement Readiness",
  short: "Employers",
  purpose: "Employer workflows, hiring pipelines, reimbursements, and partner management.",
  fundableAngle: "WIOA/sector partnerships, employer engagement, retention metrics.",
});
