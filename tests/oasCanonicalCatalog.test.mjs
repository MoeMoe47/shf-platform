import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { validateCatalog, validateSchema, validateDeclaration, readSource, generateCatalog, generateFromGit, serialize, root, inputPaths, artifactPath } from '../scripts/oas-catalog.mjs';
import { publicDomains, legacyReportingDomains } from '../standards/oas/compatibility.js';
const source = readSource();
const fresh = () => structuredClone(source);
const release = source.releases[0];
const declaration = () => ({ schema_version: '1.0.0', standard_reference: { standard_id: 'OAS-1', standard_version: release.standard_version, release_id: release.release_id }, profile_reference: null, requirement_references: [], declaration_scope: 'Provider description of system X; draft reference only', declared_by: 'Example provider (test fixture)', declared_at: '2026-10-26T00:00:00Z', declaration_status: 'declared', evidence_references: [], notes: '', evaluation_status: 'NOT_EVALUATED' });
// Synthetic rows below exercise schema/reference rules, not published OAS requirements/profiles.
function fixture() {
  const c = fresh();
  c.requirement_population_status = 'populated'; c.profile_population_status = 'populated';
  c.requirements.push({ requirement_id: 'OAS-1-REQ-0001', standard_id: 'OAS-1', standard_version: release.standard_version, release_id: release.release_id, domain_id: 'OAS-1-D01', risk_levels: ['R0'], normative_text: 'TEST ONLY, not an OAS requirement.', normative_text_reference: { source_path: 'tests/oasCanonicalCatalog.test.mjs', anchor: 'fixture' }, status: 'draft', supersedes: [], superseded_by: [] });
  c.profiles.push({ profile_id: 'OAS-1-P-test@0.0.0-draft.1', profile_name: 'Test only', profile_version: '0.0.0-draft.1', standard_id: 'OAS-1', standard_version: release.standard_version, release_id: release.release_id, description: 'TEST ONLY', applicable_domains: ['OAS-1-D01'], requirement_ids: ['OAS-1-REQ-0001'], status: 'draft', supersedes: [], superseded_by: [] });
  return c;
}
test('catalog has exact draft identity, no invented release or normative population', () => {
  validateCatalog(source);
  assert.equal(release.release_id, 'OAS-1@0.0.0-public-review.1');
  assert.equal(release.release_status, 'public_review');
  assert.equal(release.publication_label, 'Public Working Draft');
  assert.equal(release.review_label, 'Public Review');
  assert.equal(release.release_date, null); assert.equal(release.effective_date, null);
  assert.equal(release.normative_status, 'not_published');
  assert.deepEqual(source.profiles, []); assert.deepEqual(source.requirements, []);
  assert.deepEqual(source.risk_levels.map((r) => r.risk_level_id), ['R0','R1','R2','R3','R4']);
});
for (const [collection, field] of [['standards','standard_id'],['releases','release_id'],['profiles','profile_id'],['requirements','requirement_id']]) {
  test(`duplicate ${field} rejected even when other fields differ`, () => {
    const c = fixture(); c[collection].push({ ...c[collection][0] });
    assert.throws(() => validateCatalog(c));
  });
}
test('stable machine ID formats and no floating latest', () => {
  for (const mutation of [c => c.standards[0].standard_id = 'OAS 1', c => c.releases[0].release_id = 'OAS-1@latest', c => c.releases[0].standard_version = 'latest', c => c.requirements[0].requirement_id = 'R0', c => c.profiles[0].profile_id = 'display name']) {
    const c = fixture(); mutation(c); assert.throws(() => validateCatalog(c));
  }
});
test('canonical public labels/order preserved; legacy report collisions remain unmapped', () => {
  assert.deepEqual(publicDomains.map((d) => d.label), ['Identity & Ownership','Purpose & Boundaries','Capabilities & Resources','Permissions & Access','Safety & Prohibited Actions','Human Authority','Validation & Evidence','Lifecycle & Accountability']);
  const adapter = readFileSync(path.join(root, 'apps/shs-api/src/domain/reporting/studio-oas-report-adapters.ts'), 'utf8');
  for (const [id, label] of legacyReportingDomains) assert.ok(adapter.includes(`["${id}", "${label}"]`));
  assert.ok(source.legacy_taxonomies[0].domains.every((d) => d.canonical_domain_id === null));
  for (const file of ['OAS1Page.jsx','OASLandingPage.jsx','OASControlDomainsPage.jsx']) assert.match(readFileSync(path.join(root,'src/pages/oas',file),'utf8'), /publicDomains/);
});
test('cross-reference, version and domain errors rejected', () => {
  validateCatalog(fixture());
  for (const mutation of [c => c.requirements[0].domain_id = 'OAS-1-D99', c => c.requirements[0].release_id = 'OAS-1@9.0.0', c => c.requirements[0].standard_version = '9.0.0', c => c.profiles[0].requirement_ids = ['OAS-1-REQ-9999'], c => c.profiles[0].profile_version = '9.0.0', c => c.domains[0].ordinal = '99', c => c.requirements[0].status = 'active']) {
    const c = fixture(); mutation(c); assert.throws(() => validateCatalog(c));
  }
});
for (const [collection, field] of [['releases','release_id'],['requirements','requirement_id'],['profiles','profile_id']]) {
  test(`${collection}: valid reciprocal supersession; dangling, self and cyclic links rejected`, () => {
    const c = fixture(), first = c[collection][0], next = structuredClone(first);
    if (collection === 'releases') { next.standard_version = '0.0.0-public-review.2'; next.release_id = 'OAS-1@0.0.0-public-review.2'; }
    if (collection === 'requirements') next.requirement_id = 'OAS-1-REQ-0002';
    if (collection === 'profiles') { next.profile_id = 'OAS-1-P-test@0.0.0-draft.2'; next.profile_version = '0.0.0-draft.2'; }
    first.superseded_by = [next[field]]; next.supersedes = [first[field]]; c[collection].push(next);
    validateCatalog(c);
    const dangling = structuredClone(c); dangling[collection][0].superseded_by = ['missing']; assert.throws(() => validateCatalog(dangling));
    const self = structuredClone(c); self[collection][0].superseded_by = [first[field]]; assert.throws(() => validateCatalog(self));
    next.superseded_by = [first[field]]; first.supersedes = [next[field]]; assert.throws(() => validateCatalog(c), /Circular/);
  });
}
test('schema rejects extra fields, false release claims, invalid dates and certifications', () => {
  for (const mutation of [c => c.certified = true, c => c.releases[0].release_status = 'released', c => c.releases[0].release_date = 'yesterday']) {
    const c = fresh(); mutation(c); assert.throws(() => validateCatalog(c));
  }
  for (const status of ['PASS','FAIL','CERTIFIED']) { const d = declaration(); d.evaluation_status = status; assert.throws(() => validateDeclaration(d, source)); }
  const d = declaration(); d.certification = true; assert.throws(() => validateSchema('declaration',d));
});
test('declarations resolve pinned references and preserve historical declaration data', () => {
  const d = declaration(); validateDeclaration(d, source);
  const before = serialize(d); const c = fresh(); c.releases[0].release_status = 'working_draft';
  validateDeclaration(d, c); assert.equal(serialize(d), before);
  for (const mutate of [d => d.standard_reference.standard_version = '9.0.0', d => d.requirement_references = ['OAS-1-REQ-0001'], d => d.profile_reference = 'OAS-1-P-test@1.0.0']) { const d = declaration(); mutate(d); assert.throws(() => validateDeclaration(d, source)); }
});
test('deterministic generation, provenance and independent digest tampering checks', () => {
  const files = inputPaths.map((p) => ({ path: p, bytes: readFileSync(path.join(root,p),'utf8') }));
  const metadata = { source_revision: 'a'.repeat(40), generated_at: '2026-10-26T00:00:00Z' };
  const a = generateCatalog(source, metadata, files), b = generateCatalog(source, metadata, files);
  assert.equal(serialize(a), serialize(b));
  assert.match(a.source_checksum, /^sha256:[a-f0-9]{64}$/); assert.equal(a.releases[0].source_revision, metadata.source_revision);
  for (const mutate of [c => delete c.source_revision, c => c.authority = 'Registry', c => c.source_files[0].checksum = `sha256:${'0'.repeat(64)}`, c => c.releases[0].source_revision = 'b'.repeat(40)]) { const c = structuredClone(a); mutate(c); assert.throws(() => validateCatalog(c,true)); }
});
test('committed public snapshot exists and reproduces from git', { skip: process.env.OAS_PREPUBLICATION === '1' }, () => {
  assert.ok(existsSync(path.join(root,artifactPath)), 'Generate after committing canonical inputs');
  assert.equal(readFileSync(path.join(root,artifactPath),'utf8'), serialize(generateFromGit()));
});
