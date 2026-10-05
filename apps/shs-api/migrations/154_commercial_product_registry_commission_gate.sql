-- 154_commercial_product_registry_commission_gate.sql
-- SHU-COMMERCIAL-PRODUCT-REGISTRY-3D: expose commission review as a
-- distinct governed gate. This widens only the registry gate enum; it does
-- not introduce commission calculations or rates.

ALTER TABLE commercial_product_review_gates
  DROP CONSTRAINT IF EXISTS commercial_product_gate_type_known;

ALTER TABLE commercial_product_review_gates
  ADD CONSTRAINT commercial_product_gate_type_known CHECK (
    gate_type IN (
      'COMMERCIAL_READINESS',
      'LEGAL',
      'TAX',
      'REGULATORY',
      'PROCUREMENT',
      'FUNDING',
      'DELIVERY_CAPACITY',
      'EVIDENCE',
      'SUPPORT',
      'PRICING',
      'MARGIN',
      'COMMISSION',
      'ENTITLEMENT',
      'PARTNER'
    )
  );
