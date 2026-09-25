import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  FABRIC_PRODUCTION_UNCONFIGURED_BASE,
  resolveFabricApiBase,
} from '../src/system/fabric/fabricConfig.js';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');

test('Azure production model defines SHS public ingress and Fabric internal-only ingress', () => {
  const shs = read('infra/azure/shs-api.tf');
  assert.match(shs, /external_enabled\s*=\s*true/);
  assert.match(shs, /target_port\s*=\s*8091/);
  assert.match(shs, /AUTH_ALLOWED_ORIGINS[\s\S]*frontend_origin[\s\S]*shs_api_origin/);

  const fabric = read('infra/azure/agent-fabric.tf');
  assert.match(fabric, /external_enabled\s*=\s*false/);
  assert.match(fabric, /target_port\s*=\s*8090/);
  assert.match(fabric, /AUTH_ALLOWED_ORIGINS[\s\S]*var\.shs_api_origin/);

  const outputs = read('infra/azure/outputs.tf');
  assert.match(outputs, /agent_fabric_ingress_class" \{ value = "internal-only" \}/);
});

test('checked-in production frontend hosting does not pretend to route /fabric-api', () => {
  const frontend = read('infra/azure/frontend.tf');
  assert.match(frontend, /frontend_image == "" \? 0 : 1/);
  assert.doesNotMatch(frontend, /fabric-api|agent_fabric|reverse|rewrite|proxy/i);

  const vercel = read('src/vercel.json');
  assert.doesNotMatch(vercel, /fabric-api|8090|agent-fabric/i);
  assert.doesNotMatch(vercel, /"source"\s*:\s*"\/api/);
});

test('production Fabric frontend base is fail-visible without configured origin or confirmed proxy', () => {
  assert.equal(resolveFabricApiBase({ MODE: 'production', PROD: true }), FABRIC_PRODUCTION_UNCONFIGURED_BASE);
  assert.equal(
    resolveFabricApiBase({ MODE: 'production', PROD: true, VITE_FABRIC_ENABLE_SAME_ORIGIN_PROXY: 'true' }),
    '/fabric-api',
  );
  assert.equal(
    resolveFabricApiBase({ MODE: 'production', PROD: true, VITE_FABRIC_API_BASE: 'https://fabric.example.invalid' }),
    'https://fabric.example.invalid',
  );
});

test('deployment documentation records the blocker instead of inventing a hostname', () => {
  const doc = read('docs/FABRIC_PRODUCTION_DEPLOYMENT.md');
  assert.match(doc, /PRODUCTION BLOCKER - FABRIC SERVICE BROWSER ROUTE NOT ESTABLISHED/);
  assert.match(doc, /No production hostname is invented/);
  assert.match(doc, /`\S*\/api\/\*` \| SHS API/);
  assert.match(doc, /`\S*\/fabric-api\/\*` \| Agent Fabric/);
  assert.match(doc, /target port 8091/);
  assert.match(doc, /target port 8090/);
  assert.match(doc, /internal-only/);
});
