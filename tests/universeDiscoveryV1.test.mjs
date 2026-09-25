// SHU Ecosystem Experience V1 — discovery adapter, search, routes,
// relationships, destination entry, and the canonical-only guarantee.
// Static canonical sources (curriculum pathway map, Metaverse registries,
// destination registry) are loaded for real; shs-api payloads use fixtures
// shaped exactly like the live responses so these tests need no server.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildDiscoveryIndex,
  findObject,
  isOrganizationFixture,
  objectsOfType,
  relatedObjects,
  searchDiscovery,
  totalResults,
  typeRelationships,
} from '../src/pages/universe-v1/discovery/discoveryAdapter.js';
import {
  OBJECT_TYPES,
  RELATIONSHIP_TYPES,
  detailRouteFor,
  discoverRouteFor,
  parseDetailRoute,
  readDiscoverParams,
} from '../src/pages/universe-v1/discovery/discoveryModel.js';
import { ENTRY_TRANSITION_MS, planDestinationEntry } from '../src/pages/universe-v1/discovery/destinationEntry.js';
import { universeDestinations, isDestinationAvailable } from '../src/pages/universe-v1/universeDestinationRegistry.js';
import { METAVERSE_DISTRICT_MARKERS, METAVERSE_FACILITIES } from '../src/system/metaverse/metaverseNavigationModel.js';
import { METAVERSE_PRODUCTION_BACKGROUND_SET } from '../src/system/metaverse/metaverseVisualAssets.js';

const pathway = JSON.parse(fs.readFileSync(new URL('../src/content/curriculum/data-center-pathway-map.json', import.meta.url), 'utf8'));

const CAREERS = {
  status: 'ready',
  items: [{
    career_id: 'career_data_center_technician',
    slug: 'data-center-technician',
    title: 'Data Center Technician',
    description: 'Foundational operations role supporting data-center hardware, systems, and facilities workflows.',
    status: 'active',
    sector: 'Infrastructure',
    family_name: 'Data Center & AI Infrastructure',
  }],
};
const ORGANIZATIONS = {
  status: 'ready',
  items: [
    { id: 'shs-core', name: 'Silicon Heartland Solutions', org_type: 'SHS', status: 'active' },
    { id: 'shf-core', name: 'Silicon Heartland Foundation', org_type: 'SHF', status: 'active' },
    { id: 'partner-1', name: 'Demo Partner Organization', org_type: 'Partner', status: 'active' },
  ],
};
const EMPTY = { status: 'ready', items: [] };

function buildIndex(overrides = {}) {
  return buildDiscoveryIndex({
    careers: CAREERS,
    careerRequirements: { 'data-center-technician': [{ curriculum_id: 'data-center-foundations' }] },
    programs: EMPTY,
    organizations: ORGANIZATIONS,
    opportunities: EMPTY,
    careerOpportunities: EMPTY,
    pathway,
    metaverse: { districts: METAVERSE_DISTRICT_MARKERS, facilities: METAVERSE_FACILITIES, visualAssets: METAVERSE_PRODUCTION_BACKGROUND_SET },
    destinations: universeDestinations,
    ...overrides,
  });
}

const index = buildIndex();

test('projects every canonical source into the discovery index', () => {
  assert.equal(objectsOfType(index, 'careers').length, 1);
  assert.equal(objectsOfType(index, 'programs').length, 1 + pathway.courses.length, 'pathway + each course');
  assert.equal(objectsOfType(index, 'places').length, METAVERSE_DISTRICT_MARKERS.length);
  assert.deepEqual(objectsOfType(index, 'organizations').map((org) => org.id).sort(), ['shf-core', 'shs-core']);
  assert.equal(objectsOfType(index, 'projects').length, 0, 'no canonical project source exists');
  assert.equal(objectsOfType(index, 'opportunities').length, 0, 'opportunity sources are empty');
  const visible = universeDestinations.filter((destination) => destination.universeVisible !== false);
  assert.equal(objectsOfType(index, 'destinations').length, visible.length);
  for (const object of index.objects) {
    assert.ok(object.source?.authority, `${object.key} records its authority`);
    assert.ok(object.searchableText.length > 0);
  }
});

test('organization test fixtures are never published', () => {
  assert.equal(isOrganizationFixture({ id: 'partner-1', name: 'Demo Partner Organization' }), true);
  assert.equal(isOrganizationFixture({ id: 'x', name: 'Demo Anything' }), true);
  assert.equal(isOrganizationFixture({ id: 'shf-core', name: 'Silicon Heartland Foundation' }), false);
  assert.equal(findObject(index, 'organizations', 'partner-1'), null);
});

test('illustrative gateway editorial content never enters the canonical index', () => {
  const gateway = fs.readFileSync(new URL('../src/pages/universe-v1/gateway/UniverseGateway.jsx', import.meta.url), 'utf8');
  const editorial = gateway.slice(gateway.indexOf('const FEATURED_ITEMS'), gateway.indexOf('function slugify'));
  const titles = [...editorial.matchAll(/title: '([^']+)'/g)].map((match) => match[1])
    .filter((title) => !OBJECT_TYPES.some((type) => type.plural === title)); // network node category labels
  assert.ok(titles.length >= 10, 'found the editorial titles');
  const indexed = new Set(index.objects.map((object) => object.title));
  for (const title of titles) {
    if (title === 'Silicon Heartland Foundation' || title === 'Data Center Technician') continue; // real canonical records with the same name
    assert.equal(indexed.has(title), false, `editorial "${title}" must not be indexed`);
  }
  const adapter = fs.readFileSync(new URL('../src/pages/universe-v1/discovery/discoveryAdapter.js', import.meta.url), 'utf8');
  assert.doesNotMatch(adapter, /from ['"][^'"]*UniverseGateway/, 'adapter never imports gateway editorial arrays');
});

test('search returns grouped canonical results, filters by category, and handles no results', () => {
  const groups = searchDiscovery(index, { query: 'data center' });
  const byType = Object.fromEntries(groups.map((group) => [group.type, group.total]));
  assert.ok(byType.programs > 1, 'pathway and its courses');
  assert.equal(byType.careers, 1);
  assert.ok(byType.places >= 1, 'Data Center District');
  assert.equal(byType.projects, 0);
  assert.equal(groups[0].type, 'programs', 'groups keep canonical type order');

  const careersOnly = searchDiscovery(index, { query: 'data center', type: 'careers' });
  assert.equal(careersOnly.length, 1);
  assert.equal(careersOnly[0].results[0].title, 'Data Center Technician');

  assert.equal(totalResults(searchDiscovery(index, { query: 'quantum farming' })), 0);
  assert.equal(totalResults(searchDiscovery(index, { query: '' })), 0, 'All with no query lists nothing');
  assert.equal(searchDiscovery(index, { type: 'places' })[0].total, METAVERSE_DISTRICT_MARKERS.length, 'empty query + type lists the category');
  assert.equal(searchDiscovery(index, { query: 'data center', limitPerGroup: 2 })[0].results.length, 2);
});

test('relationships are only the edges canonical records state', () => {
  const allowed = new Set(Object.values(RELATIONSHIP_TYPES));
  for (const edge of index.edges) {
    assert.ok(allowed.has(edge.type), edge.type);
    assert.ok(index.byKey.has(edge.from) && index.byKey.has(edge.to), 'both endpoints are indexed');
    assert.ok(edge.source, 'every edge names its source');
  }
  const prepares = index.edges.filter((edge) => edge.type === 'PREPARES_FOR');
  const stated = new Set(pathway.courses.filter((course) => (course.careerConnections || []).includes('data-center-technician')).map((course) => `programs:${course.courseId}`));
  stated.add('programs:data-center-foundations'); // shs-api requirement fixture
  for (const edge of prepares) {
    assert.equal(edge.to, 'careers:data-center-technician');
    assert.ok(stated.has(edge.from), `${edge.from} is stated by a canonical record`);
  }
  const orgEdges = index.edges.filter((edge) => edge.from.startsWith('organizations:') || edge.to.startsWith('organizations:'));
  assert.deepEqual(orgEdges.map((edge) => `${edge.from}>${edge.type}>${edge.to}`), ['organizations:shf-core>REPRESENTED_IN>destinations:silicon-heartland-foundation']);
  assert.equal(index.edges.some((edge) => /projects:|opportunities:|places:/.test(edge.from + edge.to)), false);

  const relations = typeRelationships(index);
  assert.ok(relations.get('careers').get('programs') > 0);
  assert.equal(relations.get('projects').size, 0);
  assert.equal(relations.get('places').size, 0);

  const careerGroups = relatedObjects(index, 'careers:data-center-technician');
  assert.ok(careerGroups.some((group) => group.relation === 'PREPARES_FOR' && group.objects.length === prepares.length));
});

test('detail routes round-trip for every object type and fail safely', () => {
  for (const type of OBJECT_TYPES) {
    const route = detailRouteFor(type.key, 'some id/with slash');
    assert.equal(route, `/universe/${type.segment}/some%20id%2Fwith%20slash`);
    assert.deepEqual(parseDetailRoute(route), { typeKey: type.key, id: 'some id/with slash' });
  }
  assert.equal(parseDetailRoute('/universe/unknown/x'), null);
  assert.equal(parseDetailRoute('/universe/directory'), null);
  assert.equal(parseDetailRoute('/universe/bos'), null, 'registry destination routes are untouched');
  assert.equal(parseDetailRoute('/universe/career/%E0%A4%A'), null, 'malformed encoding');
  assert.equal(findObject(index, 'careers', 'not-a-real-career'), null);
  assert.equal(findObject(index, 'projects', 'central-ohio-data-center-corridor'), null, 'editorial project has no detail record');
  assert.equal(detailRouteFor('destinations', 'bos'), null, 'destinations enter via the registry, not detail pages');
  for (const object of index.objects.filter((entry) => entry.type !== 'destinations')) {
    assert.deepEqual(parseDetailRoute(object.detailRoute), { typeKey: object.type, id: object.id });
  }
});

test('discover route carries query and category in the URL', () => {
  assert.equal(discoverRouteFor(), '/universe/discover');
  assert.equal(discoverRouteFor({ query: ' data center ', type: 'careers' }), '/universe/discover?q=data+center&type=careers');
  assert.deepEqual(readDiscoverParams('?q=data+center&type=careers'), { query: 'data center', type: 'careers' });
  assert.deepEqual(readDiscoverParams('?type=nonsense'), { query: '', type: '' });
});

test('destination entry stays registry-driven: blocked, animated, or immediate', () => {
  const available = universeDestinations.find((destination) => destination.id === 'silicon-heartland-foundation');
  const unavailable = universeDestinations.find((destination) => !isDestinationAvailable(destination));
  assert.ok(available && unavailable);
  assert.deepEqual(planDestinationEntry(available), { action: 'navigate', href: available.productionPath, hard: true, delayMs: ENTRY_TRANSITION_MS });
  assert.equal(planDestinationEntry(available, { reducedMotion: true }).delayMs, 0, 'reduced motion navigates immediately');
  assert.deepEqual(planDestinationEntry(unavailable), { action: 'blocked' });
  assert.ok(ENTRY_TRANSITION_MS >= 250 && ENTRY_TRANSITION_MS <= 500);
});

test('the Universe router registers discovery routes ahead of the registry fallback', () => {
  const app = fs.readFileSync(new URL('../src/pages/universe-v1/UniverseApp.jsx', import.meta.url), 'utf8');
  const discover = app.indexOf('path === DISCOVERY_ROUTE');
  const detail = app.indexOf('parseDetailRoute(path)');
  const registryFallback = app.indexOf('if (destination) return <DestinationRoute');
  assert.ok(discover > 0 && detail > 0 && registryFallback > detail && registryFallback > discover);
});

test('an unreachable source degrades to an honest empty category, not an exception', () => {
  const degraded = buildIndex({ careers: { status: 'error', items: [] }, careerRequirements: {}, organizations: { status: 'error', items: [] } });
  assert.equal(objectsOfType(degraded, 'careers').length, 0);
  assert.equal(objectsOfType(degraded, 'organizations').length, 0);
  assert.equal(degraded.edges.some((edge) => edge.type === 'PREPARES_FOR'), false, 'edges to missing records are dropped');
  assert.ok(objectsOfType(degraded, 'programs').length > 0, 'other sources still load');
  assert.doesNotThrow(() => buildDiscoveryIndex({}));
});

test('destinations are a separate navigation class, never an SHU object type', () => {
  assert.equal(index.objects.some((object) => object.type === 'destinations'), false);
  assert.ok(index.destinations.length > 0);
  for (const destination of index.destinations) {
    assert.equal(destination.resultClass, 'destination');
    assert.equal(destination.detailRoute, null, 'no SHU detail page for destinations');
    assert.equal(destination.canonicalSource, 'universe-destination-registry');
  }
  for (const object of index.objects) assert.equal(object.resultClass, 'object');
  assert.deepEqual([...typeRelationships(index).keys()], OBJECT_TYPES.map((type) => type.key), 'category relationships cover only the six object types');
  const shf = searchDiscovery(index, { query: 'silicon heartland foundation' });
  assert.equal(shf.find((group) => group.type === 'organizations').results[0].resultClass, 'object');
  assert.equal(shf.find((group) => group.type === 'destinations').results[0].resultClass, 'destination');
});

test('every indexed item carries its canonical source, id, route and destination fields', () => {
  for (const item of [...index.objects, ...index.destinations]) {
    for (const field of ['id', 'type', 'title', 'summary', 'tags', 'canonicalSource', 'canonicalSourceId', 'canonicalRoute', 'detailRoute', 'destination', 'status']) {
      assert.ok(Object.hasOwn(item, field), `${item.key} has ${field}`);
    }
    assert.ok(item.canonicalSource && item.canonicalSourceId, `${item.key} names its source record`);
  }
  assert.equal(findObject(index, 'careers', 'data-center-technician').canonicalRoute, '/career.html#/careers/data-center-technician');
  assert.equal(findObject(index, 'programs', 'data-center-foundations').canonicalRoute, '/curriculum.html#/dashboard', 'served by the Curriculum Hub');
});

test('curriculum-as-program is a labeled projection that a canonical Program replaces without changing routes', () => {
  const course = findObject(index, 'programs', 'data-center-foundations');
  assert.equal(course.projection, 'curriculum-as-program');
  assert.equal(course.canonicalSource, 'curriculum');
  assert.equal(course.canonicalSourceId, 'data-center-foundations');
  const migrated = buildIndex({ programs: { status: 'ready', items: [{ program_id: 'data-center-foundations', title: 'Data Center Foundations Program', description: 'Canonical program record.' }] } });
  const replaced = findObject(migrated, 'programs', 'data-center-foundations');
  assert.equal(replaced.canonicalSource, 'shs-api:/programs');
  assert.equal(replaced.projection, null);
  assert.equal(replaced.detailRoute, course.detailRoute, 'same SHU route after migration');
  assert.equal(objectsOfType(migrated, 'programs').filter((item) => item.id === 'data-center-foundations').length, 1, 'no duplicate record');
});

test('Metaverse districts are virtual places and never imply a real-world location', () => {
  for (const place of objectsOfType(index, 'places')) {
    assert.equal(place.projection, 'metaverse-place');
    assert.equal(place.canonicalSource, 'metaverse');
    assert.ok(place.tags.includes('Virtual'));
    assert.match(place.geography, /Metaverse \(virtual\)/);
    assert.match(place.summary, /virtual district/i);
    assert.ok(METAVERSE_DISTRICT_MARKERS.some((district) => district.id === place.canonicalSourceId), 'keeps the canonical Metaverse id');
  }
});

test('future canonical sources ingest without architectural change', () => {
  const future = buildIndex({
    projects: { status: 'ready', items: [{ project_id: 'p-1', title: 'Real Project', description: 'From a canonical project registry.' }] },
    places: { status: 'ready', items: [{ place_id: 'columbus', name: 'Columbus', city: 'Columbus', state: 'OH' }] },
    organizationRelationships: { status: 'ready', items: [{ organization_id: 'shf-core', related_organization_id: 'shs-core', relationship_type: 'partner' }] },
    opportunities: { status: 'ready', items: [{ id: 'o-1', title: 'Real Opportunity' }] },
  });
  assert.equal(findObject(future, 'projects', 'p-1').detailRoute, '/universe/project/p-1');
  const realPlace = findObject(future, 'places', 'columbus');
  assert.equal(realPlace.projection, 'real-world-place');
  assert.equal(realPlace.geography, 'Columbus, OH');
  assert.ok(future.edges.some((edge) => edge.type === 'PARTNERS_WITH' && edge.from === 'organizations:shf-core' && edge.to === 'organizations:shs-core'));
  assert.equal(findObject(future, 'opportunities', 'o-1').type, 'opportunities');
});

test('gateway editorial sections are explicitly labeled as non-canonical', () => {
  const gateway = fs.readFileSync(new URL('../src/pages/universe-v1/gateway/UniverseGateway.jsx', import.meta.url), 'utf8');
  assert.equal((gateway.match(/data-content-class="editorial"/g) || []).length, 3, 'Featured, Latest Activity, Featured Stories');
  assert.equal((gateway.match(/editorialNote="/g) || []).length, 3);
});
