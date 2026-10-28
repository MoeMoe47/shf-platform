import catalog from "../../../public/oas/catalogs/OAS-1@1.0.0.json";

const DOMAIN_PRESENTATION = Object.freeze({
  "OAS-1-D01": Object.freeze({
    number: "01",
    title: "Identity & Ownership",
    slug: "identity-ownership",
  }),
  "OAS-1-D02": Object.freeze({
    number: "02",
    title: "Purpose & Boundaries",
    slug: "purpose-boundaries",
  }),
  "OAS-1-D03": Object.freeze({
    number: "03",
    title: "Capabilities & Resources",
    slug: "capabilities-resources",
  }),
  "OAS-1-D04": Object.freeze({
    number: "04",
    title: "Permissions & Access",
    slug: "permissions-access",
  }),
  "OAS-1-D05": Object.freeze({
    number: "05",
    title: "Safety & Prohibited Actions",
    slug: "safety-prohibited-actions",
  }),
  "OAS-1-D06": Object.freeze({
    number: "06",
    title: "Human Authority",
    slug: "human-authority",
  }),
  "OAS-1-D07": Object.freeze({
    number: "07",
    title: "Validation & Evidence",
    slug: "validation-evidence",
  }),
  "OAS-1-D08": Object.freeze({
    number: "08",
    title: "Lifecycle & Accountability",
    slug: "lifecycle-accountability",
  }),
});

function requirementAnchor(requirementId) {
  return `requirement-${requirementId.toLowerCase()}`;
}

function domainAnchor(domainId) {
  return `domain-${domainId.toLowerCase()}`;
}

export const oasRequirements = Object.freeze(
  catalog.requirements.map((requirement) =>
    Object.freeze({
      ...requirement,
      anchor: requirementAnchor(requirement.requirement_id),
    }),
  ),
);

export const oasDomains = Object.freeze(
  catalog.domain_ids.map((domainId) => {
    const presentation = DOMAIN_PRESENTATION[domainId];

    if (!presentation) {
      throw new Error(`Missing OAS presentation metadata for ${domainId}`);
    }

    const requirements = oasRequirements.filter(
      (requirement) => requirement.domain_id === domainId,
    );

    return Object.freeze({
      id: domainId,
      ...presentation,
      anchor: domainAnchor(domainId),
      requirements: Object.freeze(requirements),
      requirementIds: Object.freeze(
        requirements.map((requirement) => requirement.requirement_id),
      ),
    });
  }),
);

export const oasStandard = Object.freeze({
  standardId: catalog.standard_id,
  releaseId: catalog.release_id,
  version: catalog.standard_version,
  status: catalog.status,
  declarationContractVersion: catalog.declaration_contract_version,
  evaluationStatus: catalog.evaluation_status,
  requirements: oasRequirements,
  domains: oasDomains,
});

if (oasRequirements.length !== 14) {
  throw new Error(
    `OAS presentation expected 14 requirements, received ${oasRequirements.length}`,
  );
}

if (oasDomains.length !== 8) {
  throw new Error(
    `OAS presentation expected 8 domains, received ${oasDomains.length}`,
  );
}

const mappedRequirementIds = oasDomains.flatMap(
  (domain) => domain.requirementIds,
);

if (
  mappedRequirementIds.length !== catalog.requirement_ids.length ||
  mappedRequirementIds.some(
    (requirementId) => !catalog.requirement_ids.includes(requirementId),
  )
) {
  throw new Error("OAS requirement/domain presentation mapping is incomplete");
}

export function getOasDomain(domainId) {
  return oasDomains.find((domain) => domain.id === domainId) ?? null;
}

export function getOasRequirement(requirementId) {
  return (
    oasRequirements.find(
      (requirement) => requirement.requirement_id === requirementId,
    ) ?? null
  );
}
