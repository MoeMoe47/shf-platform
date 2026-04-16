CREATE TABLE IF NOT EXISTS referral_details (
  case_id text PRIMARY KEY REFERENCES cases(case_id) ON DELETE CASCADE,
  receiving_organization_id text REFERENCES organizations(organization_id),
  need_category text,
  urgency_level text,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT NOW(),
  updated_at timestamp without time zone NOT NULL DEFAULT NOW()
);
