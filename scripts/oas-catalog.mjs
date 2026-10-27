import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const sourcePath = 'standards/oas/catalog.json';
export const artifactPath = 'public/oas/catalogs/OAS-1@0.0.0-public-review.1.json';
const schemaPaths = readdirSync(path.join(root, 'schemas/oas')).filter((p) => p.endsWith('.schema.json')).sort().map((p) => `schemas/oas/${p}`);
export const inputPaths = [sourcePath, ...schemaPaths, 'scripts/oas-catalog.mjs'].sort();
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schemaPath of schemaPaths) ajv.addSchema(JSON.parse(readFileSync(path.join(root, schemaPath), 'utf8')));
// Compile every schema, including standalone contracts, before validating instances.
for (const schemaPath of schemaPaths) ajv.getSchema(JSON.parse(readFileSync(path.join(root, schemaPath), 'utf8')).$id);
export const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const digest = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
export const readSource = () => JSON.parse(readFileSync(path.join(root, sourcePath), 'utf8'));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
function ensure(condition, message) { if (!condition) throw new Error(message); }
export function validateSchema(name, value) {
  const validate = ajv.getSchema(`urn:oas:schema:${name}:1`);
  ensure(validate(value), `${name} schema: ${ajv.errorsText(validate.errors)}`);
}
function unique(records, field) {
  const ids = records.map((r) => r[field]);
  ensure(new Set(ids).size === ids.length, `Duplicate ${field}`);
  return new Map(records.map((r) => [r[field], r]));
}
function graph(records, field) {
  const byId = unique(records, field);
  for (const row of records) for (const [edge, inverse] of [['supersedes', 'superseded_by'], ['superseded_by', 'supersedes']]) {
    for (const id of row[edge]) {
      const target = byId.get(id);
      ensure(target && id !== row[field], `Invalid ${field} ${edge} reference: ${id}`);
      ensure(target[inverse].includes(row[field]), `Nonreciprocal ${field} supersession`);
      ensure(target.standard_id === row.standard_id, `Cross-standard ${field} supersession`);
    }
  }
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    ensure(!visiting.has(id), `Circular ${field} supersession`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of byId.get(id).superseded_by) visit(next);
    visiting.delete(id); visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  return byId;
}
export function validateCatalog(catalog, artifact = false) {
  validateSchema(artifact ? 'catalog' : 'catalog-source', catalog);
  const standards = unique(catalog.standards, 'standard_id');
  const domains = unique(catalog.domains, 'domain_id');
  const releases = graph(catalog.releases, 'release_id');
  const requirements = graph(catalog.requirements, 'requirement_id');
  graph(catalog.profiles, 'profile_id');
  const levels = unique(catalog.risk_levels, 'risk_level_id');
  unique(catalog.domains, 'ordinal'); unique(catalog.domains, 'domain_name');
  ensure(!/latest/i.test(JSON.stringify(catalog)), 'Floating latest is forbidden');
  for (const domain of catalog.domains) {
    ensure(domain.domain_id.endsWith(`-D${domain.ordinal}`), 'Domain ordinal mismatch');
    ensure(standards.has(domain.domain_id.split('-D')[0]), 'Unknown domain standard');
  }
  for (const row of catalog.releases) {
    const { source_revision, source_checksum, generated_at, ...release } = row;
    validateSchema('release', release);
    ensure(standards.has(row.standard_id), 'Unknown standard');
    ensure(row.release_id === `${row.standard_id}@${row.standard_version}`, 'Release ID/version mismatch');
    ensure(row.release_status !== 'superseded' || row.superseded_by.length > 0, 'Superseded release needs replacement');
    ensure(!row.effective_date || (row.release_date && row.effective_date >= row.release_date), 'Effective date precedes release');
    if (artifact) ensure(source_revision === catalog.source_revision && source_checksum === catalog.source_checksum && generated_at === catalog.generated_at, 'Release provenance mismatch');
  }
  for (const row of [...catalog.requirements, ...catalog.profiles]) {
    const release = releases.get(row.release_id);
    ensure(release && release.standard_id === row.standard_id && release.standard_version === row.standard_version, 'Invalid release relationship');
    ensure((row.requirement_id || row.profile_id).startsWith(`${row.standard_id}-`), 'Cross-standard identifier');
    ensure(row.status !== 'superseded' || row.superseded_by.length > 0, 'Superseded entry needs replacement');
    ensure(row.status !== 'active' || ['released', 'deprecated', 'superseded'].includes(release.release_status), 'Active entry requires adopted release');
  }
  for (const row of catalog.requirements) {
    ensure(domains.has(row.domain_id) && row.domain_id.startsWith(`${row.standard_id}-`), 'Unknown requirement domain');
    for (const level of row.risk_levels) ensure(levels.has(level), 'Unknown risk level');
    ensure(!row.normative_text_reference.source_path.startsWith('/') && !row.normative_text_reference.source_path.split('/').includes('..'), 'Normative reference must be repository relative');
  }
  for (const row of catalog.profiles) {
    ensure(row.profile_id === `${row.standard_id}-P-${row.profile_id.split('-P-')[1]?.split('@')[0]}@${row.profile_version}`, 'Profile ID/version mismatch');
    for (const domain of row.applicable_domains) ensure(domains.has(domain) && domain.startsWith(`${row.standard_id}-`), 'Unknown profile domain');
    for (const id of row.requirement_ids) {
      const requirement = requirements.get(id);
      ensure(requirement && requirement.release_id === row.release_id && row.applicable_domains.includes(requirement.domain_id), 'Invalid profile requirement');
    }
  }
  ensure((catalog.profiles.length > 0) === (catalog.profile_population_status === 'populated'), 'Profile population mismatch');
  ensure((catalog.requirements.length > 0) === (catalog.requirement_population_status === 'populated'), 'Requirement population mismatch');
  if (artifact) {
    const { artifact_checksum, ...payload } = catalog;
    ensure(artifact_checksum === digest(serialize(payload)), 'Artifact checksum mismatch');
    ensure(catalog.source_checksum === digest(serialize(catalog.source_files)), 'Source manifest checksum mismatch');
    ensure(JSON.stringify(catalog.source_files.map((f) => f.path)) === JSON.stringify(inputPaths), 'Source manifest paths mismatch');
  }
  return catalog;
}
export function validateDeclaration(declaration, catalog) {
  validateSchema('declaration', declaration);
  validateCatalog(catalog, 'artifact_checksum' in catalog);
  const ref = declaration.standard_reference;
  const release = catalog.releases.find((r) => r.release_id === ref.release_id);
  ensure(release && release.standard_id === ref.standard_id && release.standard_version === ref.standard_version, 'Unresolved declaration release');
  if (declaration.profile_reference !== null) ensure(catalog.profiles.some((p) => p.profile_id === declaration.profile_reference && p.release_id === release.release_id), 'Unresolved declaration profile');
  for (const id of declaration.requirement_references) ensure(catalog.requirements.some((r) => r.requirement_id === id && r.release_id === release.release_id), 'Unresolved declaration requirement');
  return declaration;
}
export function generateCatalog(source, metadata, files) {
  validateCatalog(source);
  const source_files = files.map(({ path, bytes }) => ({ path, checksum: digest(bytes) })).sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const source_checksum = digest(serialize(source_files));
  const provenance = { source_revision: metadata.source_revision, generated_at: metadata.generated_at, source_checksum };
  const payload = { ...source, ...provenance, source_files, releases: source.releases.map((r) => ({ ...r, ...provenance })), declaration_schema_id: 'urn:oas:schema:declaration:1', evaluation_status: 'NOT_EVALUATED' };
  return validateCatalog({ ...payload, artifact_checksum: digest(serialize(payload)) }, true);
}
export function generateFromGit(revision = git('log', '-1', '--format=%H', '--', ...inputPaths)) {
  ensure(/^[a-f0-9]{40}$/.test(revision), 'Full source commit required');
  const files = inputPaths.map((p) => ({ path: p, bytes: execFileSync('git', ['show', `${revision}:${p}`], { cwd: root, encoding: 'utf8' }) }));
  for (const file of files) ensure(file.bytes === readFileSync(path.join(root, file.path), 'utf8'), `Uncommitted source input: ${file.path}`);
  const source = JSON.parse(files.find((f) => f.path === sourcePath).bytes);
  return generateCatalog(source, { source_revision: revision, generated_at: new Date(git('show', '-s', '--format=%cI', revision)).toISOString() }, files);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'validate';
  if (command === 'generate') {
    const output = serialize(generateFromGit());
    // Never overwrite an existing snapshot with different bytes.
    let existing;
    try { existing = readFileSync(path.join(root, artifactPath), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    ensure(existing === undefined || existing === output, 'Pinned snapshot is immutable; allocate a new draft version');
    writeFileSync(path.join(root, artifactPath), output);
    console.log(`Generated ${artifactPath}`);
  } else if (command === 'validate' || command === 'check') {
    validateCatalog(readSource());
    if (command === 'check') ensure(readFileSync(path.join(root, artifactPath), 'utf8') === serialize(generateFromGit()), 'Published snapshot differs from committed inputs');
    console.log(`OAS schemas, identifiers, references, taxonomy and supersession valid (${command})`);
  } else throw new Error(`Unknown command ${command}`);
}
