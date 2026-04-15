export interface Organization {
  organization_id: string;
  organization_name: string;
  service_categories: string[];
  contact_points?: Array<{
    type: string;
    value: string;
  }>;
  intake_rules?: string[];
  eligibility_notes?: string | null;
  hours?: string | null;
  referral_channels?: string[];
  accepted_fields?: string[];
  source_system_type?: string | null;
  integration_mode:
    | "api"
    | "webhook"
    | "batch_import"
    | "manual_assisted_entry"
    | "hybrid";
  active_status: "active" | "inactive";
}
