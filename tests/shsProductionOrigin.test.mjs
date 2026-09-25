// SHS production origin normalization: live SHS API clients resolve their base
// through the canonical SHS configuration (src/lib/apiClient.js API_BASE ->
// VITE_API_BASE, then system/identity/authConfig.js SHS_AUTH_API_BASE:
// window.__SHS_API_BASE__ -> VITE_SHS_API_BASE -> "/api") instead of
// hard-coding a localhost origin, while Fabric-owned calls stay on the Fabric base.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
// Code only: strip block and line comments so documentation does not count.
// Line comments first: a line comment such as "// /live-learning/* routes"
// must not open a block comment.
const code = (path) => read(path).replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1').replace(/\/\*[\s\S]*?\*\//g, '');

const SHS_LOCALHOST = /(127\.0\.0\.1|localhost):(8091|8080)\b/;
const CANONICAL_IMPORT = /import \{ API_BASE as SHS_API_BASE(, apiGet)? \} from "@\/lib\/apiClient\.js";/;

const METAVERSE = ['Civic', 'Communication', 'Enterprise', 'Market', 'Mission', 'Opportunity', 'Orchestration', 'Passport', 'Runtime', 'Simulation']
  .map((name) => `src/system/metaverse/metaverse${name}Client.js`);
const SHF_WEB_SERVICES = ['accessibility-accommodations', 'audit', 'auth', 'cases', 'funding-grants', 'government-assurance', 'impact-attribution', 'organization-onboarding', 'programs', 'public-assurance', 'service-agreements', 'service-entitlements']
  .map((name) => `apps/shf-web/src/services/${name}-client.js`);

const MIGRATED = [
  ...['accessibilityProfile', 'assignments', 'calendar', 'calendarFeed', 'companion', 'credentials', 'curriculumImport', 'externalAccounts', 'hub', 'journey', 'liveLearning', 'notifications', 'opportunities', 'portfolio', 'studio']
    .map((name) => `src/lib/${name}/api.js`),
  'src/lib/curriculum/activityApi.js',
  'src/lib/curriculum/learningApi.js',
  ...METAVERSE,
  'src/shared/reporting/publicImpactReportingClient.js',
  'src/pages/admin/reporting/export-history-adapter.ts',
  'src/pages/admin/reporting/oracle-action-adapter.ts',
  'src/pages/admin/reporting/oracle-backend-adapter.ts',
  'src/pages/admin/reporting/oracle-compare-adapter.ts',
  'src/pages/admin/reporting/oracle-priority-adapter.ts',
  'src/pages/shf-command/hooks/useSHFOracle.js',
  'src/pages/shf-command/SHFImpactCommandCenter.jsx',
  'src/foundation/pages/CaseDetail.jsx',
  'src/pages/career/portfolio-sections/CredentialsBadges.jsx',
  'src/pages/civicsure/CivicSureApp.jsx',
  'src/pages/documentation/DocumentationCenter.jsx',
  'src/pages/documentation/DocumentationItemDetail.jsx',
  'src/pages/documentation/DocumentationRegistryAdmin.jsx',
  ...SHF_WEB_SERVICES,
  'apps/shf-web/src/pages/operator/AccessibilityAccommodations.jsx',
  'apps/shf-web/src/pages/operator/AccessibilityOperations.jsx',
];

// Unimported files that still hard-code the SHS origin (see
// docs/API_BACKEND_CONFIGURATION.md). Migrate before reviving any of them.
const DEAD = new Set([
  'src/foundation/adapters/oracle-case-action-adapter.js',
  'src/foundation/pages/case-detail/day1-checkpoints/CaseDetail.day1_20260423_150532.jsx',
  'src/foundation/pages/case-detail/versions/CaseDetail.v2-command-shell.jsx',
  'src/foundation/pages/case-detail/versions/CaseDetail.v3-cross-case-strip.jsx',
  'src/hooks/useOracle.js',
  'src/lib/careerEvents/api.js',
  'src/lib/projects/api.js',
]);

function shsRoutes() {
  const files = execSync('git ls-files apps/shs-api/src', { cwd: root, encoding: 'utf8' }).split('\n')
    .filter((file) => file.endsWith('.ts') && !file.includes('.bak'));
  const routes = [];
  for (const file of files) {
    for (const m of read(file).matchAll(/\b(?:app|router|r|api)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g)) {
      routes.push(`${m[1].toUpperCase()} ${m[2]}`);
    }
  }
  return routes;
}

test('the canonical SHS base resolves VITE_API_BASE, then window.__SHS_API_BASE__, VITE_SHS_API_BASE, "/api"', () => {
  assert.match(read('src/system/identity/authConfig.js'), /window\.__SHS_API_BASE__ \|\|\s*\(import\.meta\.env\.VITE_SHS_API_BASE \|\| "\/api"\)/);
  const client = code('src/lib/apiClient.js');
  assert.match(client, /import\.meta\.env\.VITE_API_BASE \|\| SHS_AUTH_API_BASE \|\| "\/api"/);
  assert.match(client, /export const API_BASE = stripTrailingSlash\(RAW_API_BASE\);/);
  assert.doesNotMatch(client, SHS_LOCALHOST);
});

for (const file of MIGRATED) {
  test(`${file} takes its SHS origin from the canonical SHS configuration`, () => {
    const source = code(file);
    assert.match(source, CANONICAL_IMPORT, 'imports API_BASE from src/lib/apiClient.js');
    assert.doesNotMatch(source, SHS_LOCALHOST, 'no hard-coded SHS localhost origin');
    assert.doesNotMatch(source, /VITE_LIVE_LEARNING_API_BASE|VITE_SHS_API_BASE\s*\|\||VITE_API_BASE\s*\|\|/, 'no private base resolution');
    assert.doesNotMatch(source, /["'`]\/fabric-api/, 'SHS clients never target /fabric-api');
  });
}

test('VITE_LIVE_LEARNING_API_BASE is retired from frontend code', () => {
  const files = execSync('git ls-files src apps/shf-web/src', { cwd: root, encoding: 'utf8' }).split('\n')
    .filter((file) => /\.(jsx?|tsx?)$/.test(file) && !/_archive|_patchbak|\.bak/.test(file));
  assert.deepEqual(files.filter((file) => /VITE_LIVE_LEARNING_API_BASE/.test(code(file))), []);
});

test('no live frontend file hard-codes the SHS API localhost origin', () => {
  const files = execSync('git ls-files src apps/shf-web/src', { cwd: root, encoding: 'utf8' }).split('\n')
    .filter((file) => /\.(jsx?|tsx?)$/.test(file) && !/_archive|_patchbak|hardening\//.test(file) && !DEAD.has(file));
  // src/dev/mockApi.js only string-matches legacy URLs to shadow them in dev.
  const offenders = files.filter((file) => file !== 'src/dev/mockApi.js' && SHS_LOCALHOST.test(code(file)));
  assert.deepEqual(offenders, []);
});

test('dead SHS-localhost files remain unimported (migrate before reviving)', () => {
  const files = execSync('git ls-files src apps/shf-web/src', { cwd: root, encoding: 'utf8' }).split('\n').filter((file) => /\.(jsx?|tsx?)$/.test(file));
  for (const dead of DEAD) {
    if (!fs.existsSync(new URL(dead, root))) continue;
    const name = dead.split('/').slice(-2).join('/').replace(/\.(jsx?|tsx?)$/, '');
    const specifier = new RegExp(`["'][^"']*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\.[jt]sx?)?["']`);
    assert.deepEqual(files.filter((file) => file !== dead && specifier.test(read(file))), [], `${dead} has no importers`);
  }
});

test('Career Center and Opportunities still route to the SHS API', () => {
  assert.match(code('src/lib/career/api.js'), /from "@\/lib\/apiClient(\.js)?"/);
  const opportunities = code('src/lib/opportunities/api.js');
  assert.match(opportunities, /const OPPORTUNITIES_API_BASE = SHS_API_BASE;/);
  assert.match(opportunities, /\$\{OPPORTUNITIES_API_BASE\}\/opportunities/);
  const routes = shsRoutes();
  assert.ok(routes.some((route) => route.startsWith('GET /opportunities')), 'SHS serves /opportunities');
  assert.ok(routes.some((route) => route.startsWith('GET /careers')), 'SHS serves /careers');
});

test('Oracle truth/compare/priority/action route to the SHS API; Oracle cases/rulings stay on the Fabric', () => {
  const routes = shsRoutes();
  for (const route of ['GET /oracle/truth/:entityId', 'GET /oracle/compare', 'GET /oracle/priority', 'POST /oracle/action', 'GET /oracle/actions']) {
    assert.ok(routes.includes(route), `SHS serves ${route}`);
  }
  assert.match(code('src/pages/admin/reporting/oracle-backend-adapter.ts'), /\$\{BASE\}\/oracle\/truth\//);
  assert.match(code('src/pages/admin/reporting/oracle-compare-adapter.ts'), /\$\{BASE\}\/oracle\/compare/);
  assert.match(code('src/pages/admin/reporting/oracle-priority-adapter.ts'), /\$\{BASE\}\/oracle\/priority/);
  assert.match(code('src/pages/admin/reporting/oracle-action-adapter.ts'), /\$\{SHS_API_BASE\}\/oracle\/action/);
  assert.match(code('src/pages/shf-command/hooks/useSHFOracle.js'), /const ORACLE_BASE = SHS_API_BASE;/);
  assert.match(code('src/foundation/pages/CaseDetail.jsx'), /const ORACLE_BASE = SHS_API_BASE;/);
  // Fabric-owned Oracle adjudication (routers/oracle_routes.py) is untouched.
  const fabricOracle = code('src/pages/admin/oracle/OraclePage.jsx');
  assert.match(fabricOracle, /fabricUrl\("\/oracle"\)/);
  assert.doesNotMatch(fabricOracle, /SHS_API_BASE|SHS_AUTH_API_BASE/);
});

test('SHS reporting export history routes to the SHS API /reporting/exports', () => {
  const routes = shsRoutes();
  assert.ok(routes.includes('GET /reporting/exports') && routes.includes('POST /reporting/exports'));
  const adapter = code('src/pages/admin/reporting/export-history-adapter.ts');
  assert.match(adapter, /const BASE = SHS_API_BASE;/);
  assert.match(adapter, /\$\{BASE\}\/reporting\/exports/);
});

test('dual-backend SHF Command Center keeps SHS and Fabric bases separate', () => {
  const source = code('src/pages/shf-command/SHFImpactCommandCenter.jsx');
  assert.match(source, /const ORACLE_BASE = SHS_API_BASE;/);
  assert.match(source, /fetch\(`\$\{ORACLE_BASE\}\/oracle\/action`/);
  assert.match(source, /const SELF_AUDIT_BASE = (FABRIC_API_BASE|"http:\/\/127\.0\.0\.1:8090");/, 'self-audit stays on the Fabric');
  assert.doesNotMatch(source, /\$\{ORACLE_BASE\}\/self-audit|SHS_API_BASE\}\/(self-audit|simulate-outcome|run|bfe|events)/);
  // Reporting actions (Fabric run reports) are not moved onto the SHS base.
  assert.doesNotMatch(code('src/pages/admin/reporting/reporting-actions.ts'), /SHS_API_BASE|SHS_AUTH_API_BASE/);
});

test('vite proxies: /api stays SHS-only (8091) in the root app and the standalone SHF Web app', () => {
  const rootConfig = read('vite.config.js');
  assert.match(rootConfig, /SHS_VITE_API_PROXY_TARGET \|\| "http:\/\/127\.0\.0\.1:8091"/);
  assert.match(rootConfig, /SHS_VITE_FABRIC_PROXY_TARGET \|\| "http:\/\/127\.0\.0\.1:8090"/);
  const shfWeb = read('apps/shf-web/vite.config.js');
  assert.match(shfWeb, /"\/api": \{\s*target: process\.env\.SHS_VITE_API_PROXY_TARGET \|\| "http:\/\/127\.0\.0\.1:8091",\s*changeOrigin: true,\s*rewrite: \(path\) => path\.replace\(\/\^\\\/api\/, ""\),/);
  assert.doesNotMatch(shfWeb, /8090|fabric-api/);
});
