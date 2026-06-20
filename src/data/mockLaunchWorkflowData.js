import {
  createLaunchLedgerRecord,
  createSignoffRecord,
  createVersionRecord,
} from "@/system/launch/shsLaunchLedger";

const approvedAt = "2026-06-19T12:00:00.000Z";

export function createMockLaunchWorkflowRecords() {
  return [
    createLaunchLedgerRecord({
      project_id: "launch_cic_demo",
      client_name: "Community Impact Center",
      project_name: "CIC Demo Operating System",
      package_name: "SHS Core Launch",
      support_tier: "Priority",
      launch_status: "delivery_ready",
      qa_signoff: createSignoffRecord({
        type: "qa",
        status: "approved",
        owner: "QA Lead",
        role: "SHS QA",
        signed_at: approvedAt,
      }),
      operator_signoff: createSignoffRecord({
        type: "operator",
        status: "approved",
        owner: "Launch Operator",
        role: "SHS Ops",
        signed_at: approvedAt,
      }),
      delivery_signoff: createSignoffRecord({
        type: "delivery",
        status: "approved",
        owner: "Delivery Owner",
        role: "SHS Delivery",
        signed_at: approvedAt,
      }),
      clientops_activation: {
        owner: "ClientOps Owner",
        status: "pending",
        support_tier: "Priority",
      },
      private_beta_only: true,
    }),
    createLaunchLedgerRecord({
      project_id: "launch_growth_console",
      client_name: "Partner Growth Team",
      project_name: "Growth Console Launch",
      package_name: "SHS Executive Ops",
      support_tier: "Executive",
      launch_status: "launch_ready",
      qa_signoff: createSignoffRecord({
        type: "qa",
        status: "approved",
        owner: "QA Lead",
        role: "SHS QA",
        signed_at: approvedAt,
      }),
      operator_signoff: createSignoffRecord({
        type: "operator",
        status: "approved",
        owner: "Launch Operator",
        role: "SHS Ops",
        signed_at: approvedAt,
      }),
      delivery_signoff: createSignoffRecord({
        type: "delivery",
        status: "approved",
        owner: "Delivery Owner",
        role: "SHS Delivery",
        signed_at: approvedAt,
      }),
      client_signoff: createSignoffRecord({
        type: "client",
        status: "signed_off",
        owner: "Client Sponsor",
        role: "Client Approver",
        signed_at: approvedAt,
      }),
      version_record: createVersionRecord({
        version_id: "growth-console-v1",
        version_label: "V1 Launch",
        launch_date: "2026-06-19",
        summary: "Initial launch baseline.",
        owner: "Launch Operator",
      }),
      rollback_plan: {
        owner: "Release Owner",
        last_known_good_version: "growth-console-v1",
        trigger_conditions: ["Critical route failure", "Client approval reversal"],
      },
      clientops_activation: {
        owner: "ClientOps Owner",
        status: "ready",
        support_tier: "Executive",
      },
      private_beta_only: false,
    }),
    createLaunchLedgerRecord({
      project_id: "launch_referral_pilot",
      client_name: "Referral Pilot Group",
      project_name: "Referral Intake Pilot",
      package_name: "",
      support_tier: "",
      launch_status: "qa_review",
      qa_signoff: createSignoffRecord({
        type: "qa",
        status: "approved",
        owner: "QA Lead",
        role: "SHS QA",
        signed_at: approvedAt,
      }),
      private_beta_only: true,
    }),
  ];
}
