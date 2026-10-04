-- 152_sales_cross_account_link_constraints.sql
-- Defense-in-depth for Sales account-scoped links.
-- Service policy remains authoritative for workflow decisions; these
-- constraints prevent direct SQL writes from linking scalar Sales records
-- across account organizations inside the same tenant.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_relationships_scope_record_uniq'
  ) THEN
    ALTER TABLE sales_relationships
      ADD CONSTRAINT sales_relationships_scope_record_uniq
      UNIQUE (tenant_id, organization_id, account_organization_id, relationship_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_discovery_scope_record_uniq'
  ) THEN
    ALTER TABLE sales_discovery_records
      ADD CONSTRAINT sales_discovery_scope_record_uniq
      UNIQUE (tenant_id, organization_id, account_organization_id, discovery_record_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_needs_scope_record_uniq'
  ) THEN
    ALTER TABLE sales_needs
      ADD CONSTRAINT sales_needs_scope_record_uniq
      UNIQUE (tenant_id, organization_id, account_organization_id, need_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_discovery_relationship_account_fk'
  ) THEN
    ALTER TABLE sales_discovery_records
      ADD CONSTRAINT sales_discovery_relationship_account_fk
      FOREIGN KEY (tenant_id, organization_id, account_organization_id, relationship_id)
      REFERENCES sales_relationships (tenant_id, organization_id, account_organization_id, relationship_id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_needs_discovery_account_fk'
  ) THEN
    ALTER TABLE sales_needs
      ADD CONSTRAINT sales_needs_discovery_account_fk
      FOREIGN KEY (tenant_id, organization_id, account_organization_id, discovery_record_id)
      REFERENCES sales_discovery_records (tenant_id, organization_id, account_organization_id, discovery_record_id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_opportunities_relationship_account_fk'
  ) THEN
    ALTER TABLE sales_opportunities
      ADD CONSTRAINT sales_opportunities_relationship_account_fk
      FOREIGN KEY (tenant_id, organization_id, account_organization_id, relationship_id)
      REFERENCES sales_relationships (tenant_id, organization_id, account_organization_id, relationship_id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_opportunities_discovery_account_fk'
  ) THEN
    ALTER TABLE sales_opportunities
      ADD CONSTRAINT sales_opportunities_discovery_account_fk
      FOREIGN KEY (tenant_id, organization_id, account_organization_id, discovery_record_id)
      REFERENCES sales_discovery_records (tenant_id, organization_id, account_organization_id, discovery_record_id)
      NOT VALID;
  END IF;
END $$;
