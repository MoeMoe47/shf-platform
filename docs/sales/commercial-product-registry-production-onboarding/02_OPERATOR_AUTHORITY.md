# Operator Authority

Production onboarding requires the explicit capability:

`commercial_product.production_onboard`

The capability is separate from:

- `sales.admin`
- `commercial_product.create`
- `commercial_product.edit`
- reviewer gate capabilities
- reviewer assignment management

The operator is taken from authenticated context. System actors cannot execute production onboarding. Client-supplied operator, product state, review, source, pricing, margin, commission, customer eligibility, and funding award fields are rejected as protected-field injection.
