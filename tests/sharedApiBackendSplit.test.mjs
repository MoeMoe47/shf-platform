// Shared API backend split: the SHS API (8091) and the Agent Fabric (8090)
// each have one canonical frontend resolver, and Fabric clients never fall
// back to port 8000 (uvicorn's CLI default, not the Fabric's port).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { FABRIC_API_BASE, FABRIC_API_BASE_OVERRIDE, FABRIC_LOCAL_DEFAULT } from '../src/system/fabric/fabricConfig.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const FABRIC_CLIENTS = [
  'src/lib/capital/operatorApi.js',
  'src/lib/operatorApi.js',
  'src/lib/operatorDataApi.js',
  'src/components/operator/IssuancesPanel.jsx',
  'src/pages/exchange/commandCenterAdapter.js',
  'src/pages/admin/ReportsDashboard.jsx',
  'src/pages/admin/AlignmentSwitchboard.jsx',
  'src/apps/manifest/registry_admin_api.js',
];

test('canonical Fabric base defaults to the Fabric local port 8090', () => {
  assert.equal(FABRIC_LOCAL_DEFAULT, 'http://127.0.0.1:8090');
  assert.equal(FABRIC_API_BASE_OVERRIDE, '', 'no Fabric env configured under node');
  assert.equal(FABRIC_API_BASE, 'http://127.0.0.1:8090');
});

test('Fabric config honors the canonical variable, then legacy aliases, never VITE_API_BASE', () => {
  const source = read('src/system/fabric/fabricConfig.js');
  const order = ['VITE_FABRIC_API_BASE', 'VITE_FABRIC_URL', 'VITE_FABRIC_BASE_URL'].map((name) => source.indexOf(`env.${name}`));
  assert.ok(order.every((index) => index > 0) && order[0] < order[1] && order[1] < order[2]);
  assert.doesNotMatch(source, /env\.VITE_API_BASE\b/);
});

test('every Fabric client resolves through fabricConfig and has no :8000 fallback', () => {
  for (const file of FABRIC_CLIENTS) {
    const source = read(file);
    assert.match(source, /@\/system\/fabric\/fabricConfig/, `${file} imports the canonical Fabric config`);
    assert.doesNotMatch(source, /:8000\b/, `${file} has no port-8000 reference`);
    assert.doesNotMatch(source, /import\.meta[^;\n]*VITE_FABRIC_(URL|BASE_URL|API_BASE)/, `${file} does not resolve Fabric env itself`);
  }
});

test('shared SHS client resolves through the canonical SHS config, not a Fabric port', () => {
  const source = read('src/lib/apiClient.js');
  assert.match(source, /SHS_AUTH_API_BASE/);
  assert.doesNotMatch(source, /:8000\b|:8090\b/);
  const auth = read('src/system/identity/authConfig.js');
  assert.match(auth, /__SHS_API_BASE__[\s\S]*VITE_SHS_API_BASE[\s\S]*"\/api"/);
});

test('env example documents both canonical local ports', () => {
  const example = read('.env.example');
  assert.match(example, /VITE_FABRIC_API_BASE=http:\/\/127\.0\.0\.1:8090/);
  assert.match(example, /VITE_SHS_API_BASE=http:\/\/127\.0\.0\.1:8091/);
  assert.doesNotMatch(example, /:8000\b/);
});
