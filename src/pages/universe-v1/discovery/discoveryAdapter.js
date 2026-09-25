// src/pages/universe-v1/discovery/discoveryAdapter.js
// ------------------------------------------------------------
// SHU discovery adapter: projects canonical records owned by other domains
// into one normalized, read-only discovery object shape, derives only the
// relationship edges those records actually state, and searches the result.
//
// Pure module — the raw source payloads are passed in (see
// discoverySources.js for loading), so everything here is unit-testable.
//
// Canonical-only rule (SHU Ecosystem Experience V1): nothing in this file
// may read the gateway's illustrative editorial arrays (FEATURED_ITEMS,
// ACTIVITY_ITEMS, STORY_ITEMS, NETWORK_ITEMS). Those are presentation copy;
// they never enter the index, never create edges, never get detail pages.
//
// Two structurally separate result classes:
//   - SHU OBJECTS (resultClass 'object'): the six ecosystem object types
//     programs | careers | organizations | projects | places | opportunities
//   - DESTINATIONS (resultClass 'destination'): Universe registry
//     navigation entries (SHF, SHS/BOS, Career Center, Civic...). Searchable,
//     but never an object type, never a detail page, never in category
//     relationships — selecting one enters it through the registry.
//
// Indexed item shape (both classes):
//   { key, id, type, resultClass, kind, title, summary, tags, image,
//     geography, status, canonicalSource, canonicalSourceId, canonicalRoute,
//     detailRoute, destination, projection, facts, actions, searchableText }
//   canonicalSource    owning domain ('shs-api:/careers', 'curriculum', ...)
//   canonicalSourceId  the record's id in that domain
//   canonicalRoute     where the owning domain presents it (null if none)
//   destination        registry destination id that serves it (or null)
//   projection         set when SHU is presenting another domain's record
//                      under an SHU type (e.g. 'curriculum-as-program')

import {
  DESTINATION_GROUP,
  OBJECT_TYPES,
  RELATIONSHIP_TYPES,
  detailRouteFor,
  objectKey,
} from './discoveryModel.js';

// ---------------------------------------------------------------- helpers

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function searchableTextFor(object, extra = []) {
  const type = [...OBJECT_TYPES, DESTINATION_GROUP].find((entry) => entry.key === object.type);
  return normalizeText([
    object.title,
    object.summary,
    object.kind,
    object.geography,
    ...(object.tags || []),
    type?.label,
    type?.plural,
    ...extra,
  ].join(' '));
}

function finalize(object, extra) {
  const isDestination = object.type === DESTINATION_GROUP.key;
  const withRoute = {
    image: null,
    imageAlt: '',
    tags: [],
    geography: null,
    status: 'active',
    destinationId: null,
    projection: null,
    canonicalRoute: null,
    facts: [],
    actions: [],
    ...object,
    resultClass: isDestination ? 'destination' : 'object',
    key: objectKey(object.type, object.id),
    detailRoute: isDestination ? null : detailRouteFor(object.type, object.id),
  };
  withRoute.canonicalSource = withRoute.source?.domain || null;
  withRoute.canonicalSourceId = withRoute.source?.ref || null;
  withRoute.destination = withRoute.destinationId;
  return { ...withRoute, searchableText: searchableTextFor(withRoute, extra) };
}

function titleCaseStage(stage) {
  return String(stage || '')
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' & ');
}

function gradeRange(grades) {
  const values = grades.filter((grade) => Number.isFinite(grade));
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `Grade ${min}` : `Grades ${min}–${max}`;
}

// Presentation-only imagery keyed to canonical ids. Only records whose
// subject is literally depicted by an approved SHU production photo get
// one; everything else renders the typographic emblem.
const CAREER_IMAGE_BY_SLUG = Object.freeze({
  'data-center-technician': {
    src: '/assets/shu/content/shu-career-data-center-technician-1200.webp',
    alt: 'A data center technician reviewing systems on a tablet beside server racks',
  },
});

// Known test fixtures served by shs-api's organization seed. They are not
// real ecosystem organizations and must not be published by SHU.
const ORGANIZATION_FIXTURE_IDS = new Set(['partner-1']);

export function isOrganizationFixture(org) {
  return ORGANIZATION_FIXTURE_IDS.has(org?.id) || /\bdemo\b/i.test(org?.name || '');
}

// ------------------------------------------------------------ projections

export function projectCareer(career) {
  const slug = clean(career?.slug);
  if (!slug || !clean(career?.title)) return null;
  return finalize({
    type: 'careers',
    id: slug,
    kind: 'Career',
    title: clean(career.title),
    summary: clean(career.description),
    image: CAREER_IMAGE_BY_SLUG[slug]?.src || null,
    imageAlt: CAREER_IMAGE_BY_SLUG[slug]?.alt || '',
    tags: uniq([clean(career.sector), clean(career.family_name)]),
    status: clean(career.status) || 'active',
    destinationId: 'career',
    facts: [
      career.family_name && { label: 'Career family', value: clean(career.family_name) },
      career.sector && { label: 'Sector', value: clean(career.sector) },
    ].filter(Boolean),
    actions: [
      { label: 'Open in Career Center', href: `/career.html#/careers/${encodeURIComponent(slug)}`, hard: true },
    ],
    canonicalRoute: `/career.html#/careers/${encodeURIComponent(slug)}`,
    source: { authority: 'shs-api', domain: 'shs-api:/careers', endpoint: '/careers', ref: clean(career.career_id) || slug },
  });
}

export function projectPathwayProgram(pathway) {
  if (!pathway?.programId || !pathway?.title) return [];
  const stages = Object.entries(pathway.stages || {});
  const gradedStages = stages.filter(([, stage]) => (stage.grades || []).length);
  const allGrades = gradedStages.flatMap(([, stage]) => stage.grades);
  const stageNames = stages.map(([name]) => titleCaseStage(name));
  const courses = Array.isArray(pathway.courses) ? pathway.courses : [];
  const range = gradeRange(allGrades);

  const program = finalize({
    type: 'programs',
    id: pathway.programId,
    kind: 'Pathway',
    title: clean(pathway.title),
    summary: `${range ? `${range} learning pathway` : 'Learning pathway'} across ${stageNames.join(', ')} stages, with ${courses.length} courses.`,
    tags: uniq(['Curriculum', range, ...stageNames]),
    destinationId: 'curriculum',
    facts: [
      range && { label: 'Grades', value: range },
      { label: 'Stages', value: stageNames.join(' → ') },
      { label: 'Courses', value: String(courses.length) },
      pathway.transition?.notYetImplemented?.length && {
        label: 'Not yet implemented',
        value: pathway.transition.notYetImplemented.join(', '),
      },
    ].filter(Boolean),
    actions: [{ label: 'Open Curriculum Hub', destinationId: 'curriculum' }],
    projection: 'curriculum-as-program',
    source: { authority: 'curriculum', domain: 'curriculum', endpoint: 'src/content/curriculum/data-center-pathway-map.json', ref: pathway.programId },
  }, stages.map(([, stage]) => stage.purpose));

  const courseObjects = courses
    .filter((course) => clean(course.courseId) && clean(course.title))
    .map((course) => finalize({
      type: 'programs',
      id: course.courseId,
      kind: 'Course',
      title: clean(course.title),
      summary: clean(course.description),
      tags: uniq([
        Number.isFinite(course.grade) ? `Grade ${course.grade}` : null,
        titleCaseStage(course.stage),
        course.contentStatus === 'planned' ? 'Planned' : null,
      ]),
      status: clean(course.contentStatus) || 'active',
      destinationId: 'curriculum',
      facts: [
        Number.isFinite(course.grade) && { label: 'Grade', value: String(course.grade) },
        course.stage && { label: 'Stage', value: titleCaseStage(course.stage) },
        course.majorProject?.title && { label: 'Major project', value: clean(course.majorProject.title) },
        { label: 'Status', value: course.contentStatus === 'planned' ? 'Planned' : 'Active' },
      ].filter(Boolean),
      actions: [{ label: 'Open Curriculum Hub', destinationId: 'curriculum' }],
      projection: 'curriculum-as-program',
      source: { authority: 'curriculum', domain: 'curriculum', endpoint: 'src/content/curriculum/data-center-pathway-map.json', ref: course.courseId },
      // Courses are searchable by their pathway's name (they belong to it).
    }, [pathway.title, ...(course.learningOutcomes || [])]));

  return [program, ...courseObjects];
}

// shs-api /programs — empty today; projected generically so records appear
// as soon as the backend publishes them.
export function projectApiProgram(program) {
  const id = clean(program?.program_id || program?.id || program?.slug);
  const title = clean(program?.title || program?.name);
  if (!id || !title) return null;
  return finalize({
    type: 'programs',
    id,
    kind: 'Program',
    title,
    summary: clean(program.description || program.summary),
    tags: uniq([clean(program.category_name || program.category)]),
    status: clean(program.status) || 'active',
    source: { authority: 'shs-api', domain: 'shs-api:/programs', endpoint: '/programs', ref: id },
  });
}

export function projectOrganization(org) {
  if (!org?.id || !clean(org?.name) || isOrganizationFixture(org)) return null;
  return finalize({
    type: 'organizations',
    id: org.id,
    kind: clean(org.org_type) || 'Organization',
    title: clean(org.name),
    summary: '',
    tags: uniq([clean(org.org_type)]),
    status: clean(org.status) || 'active',
    facts: [org.org_type && { label: 'Organization type', value: clean(org.org_type) }].filter(Boolean),
    source: { authority: 'shs-api', domain: 'shs-api:/organizations', endpoint: '/organizations', ref: org.id },
  });
}

// shs-api /opportunities and /public/career/opportunities — empty today.
export function projectOpportunity(opportunity, endpoint) {
  const id = clean(opportunity?.opportunity_id || opportunity?.id || opportunity?.slug);
  const title = clean(opportunity?.title || opportunity?.name);
  if (!id || !title) return null;
  return finalize({
    type: 'opportunities',
    id,
    kind: clean(opportunity.opportunity_type || opportunity.type) || 'Opportunity',
    title,
    summary: clean(opportunity.description || opportunity.summary),
    geography: clean(opportunity.location || opportunity.region) || null,
    status: clean(opportunity.status) || 'active',
    source: { authority: 'shs-api', domain: `shs-api:${endpoint}`, endpoint, ref: id },
  });
}

// Future canonical sources (no endpoint publishes these yet). Projected
// generically so SHU can ingest them without redesigning search/detail.
export function projectProject(project) {
  const id = clean(project?.project_id || project?.id || project?.slug);
  const title = clean(project?.title || project?.name);
  if (!id || !title) return null;
  return finalize({
    type: 'projects',
    id,
    kind: clean(project.project_type || project.type) || 'Project',
    title,
    summary: clean(project.description || project.summary),
    geography: clean(project.location || project.region) || null,
    status: clean(project.status) || 'active',
    source: { authority: 'projects', domain: clean(project.source_domain) || 'projects', ref: id },
  });
}

// Real-world places (a future canonical source). Kept distinct from the
// virtual Metaverse districts via `projection: 'real-world-place'`.
export function projectRealWorldPlace(place) {
  const id = clean(place?.place_id || place?.id || place?.slug);
  const title = clean(place?.title || place?.name);
  if (!id || !title) return null;
  const geography = [clean(place.city), clean(place.county), clean(place.state)].filter(Boolean).join(', ') || clean(place.region) || null;
  return finalize({
    type: 'places',
    id,
    kind: clean(place.place_type) || 'Place',
    title,
    summary: clean(place.description || place.summary),
    geography,
    tags: ['Real-world'],
    projection: 'real-world-place',
    status: clean(place.status) || 'active',
    source: { authority: 'places', domain: clean(place.source_domain) || 'places', ref: id },
  });
}

function toPublicPath(targetPath) {
  const value = clean(targetPath);
  return value.startsWith('public/') ? value.slice('public'.length) : value || null;
}

export function projectMetaversePlaces({ districts = [], facilities = [], visualAssets = [] } = {}) {
  return districts
    .filter((district) => clean(district.id))
    .map((district) => {
      const inDistrict = facilities.filter((facility) => facility.districtId === district.id);
      const names = inDistrict.map((facility) => clean(facility.label)).filter(Boolean);
      const asset = visualAssets.find((entry) => entry.district === district.id && entry.cameraLevel === 'DISTRICT_VIEW' && !entry.facility);
      const listed = names.slice(0, 3).join(', ');
      const more = names.length > 3 ? ` and ${names.length - 3} more` : '';
      return finalize({
        type: 'places',
        id: district.id,
        kind: 'Virtual district',
        title: clean(district.fullLabel || district.label),
        summary: names.length
          ? `A virtual district in the Silicon Heartland Metaverse with ${listed}${more}.`
          : 'A virtual district in the Silicon Heartland Metaverse.',
        image: asset ? toPublicPath(asset.targetPath) : null,
        imageAlt: asset ? `Silicon Heartland Metaverse view of the ${clean(district.fullLabel || district.label)}` : '',
        tags: ['Virtual', 'Metaverse'],
        geography: 'Silicon Heartland Metaverse (virtual)',
        projection: 'metaverse-place',
        facts: [
          { label: 'Location type', value: 'Virtual — Silicon Heartland Metaverse' },
          { label: 'Metaverse district id', value: district.id },
          { label: 'Facilities', value: String(names.length) },
        ],
        facilities: names,
        actions: [{ label: 'Open the Metaverse', href: '/metaverse', hard: true }],
        canonicalRoute: '/metaverse',
        source: { authority: 'metaverse', domain: 'metaverse', endpoint: 'src/system/metaverse/metaverseNavigationModel.js', ref: district.id },
      }, names);
    });
}

const ENTITY_LABELS = {
  institution: 'Institution',
  platform: 'Platform',
  standard: 'Standard',
  application: 'Application',
  'public-surface': 'Public surface',
};

export function projectDestination(destination) {
  if (!destination?.id || destination.universeVisible === false) return null;
  return finalize({
    type: DESTINATION_GROUP.key,
    id: destination.id,
    kind: ENTITY_LABELS[destination.entityType] || 'Destination',
    title: clean(destination.title || destination.label),
    summary: clean(destination.description),
    status: destination.publicNavigationStatus === 'available' ? 'available' : 'unavailable',
    tags: uniq([clean(destination.label)]),
    canonicalRoute: clean(destination.productionPath) || clean(destination.route) || null,
    source: { authority: 'universe-destination-registry', domain: 'universe-destination-registry', ref: destination.id },
  });
}

// ---------------------------------------------------------- relationships

function edge(from, to, type, source) {
  return { from, to, type, source };
}

// Builds only the edges the canonical records state:
//   - curriculum course.careerConnections  -> course PREPARES_FOR career
//   - shs-api /careers/:slug/curriculum     -> course PREPARES_FOR career
//   - pathway.courses                        -> pathway CONTAINS course
//   - course.prerequisites                   -> course BUILDS_ON course
//   - career/course served by an app         -> AVAILABLE_IN destination
//   - organization whose name is exactly a registry destination title
//                                            -> REPRESENTED_IN destination
// Edges whose endpoints are not both present in the index are dropped.
export function buildRelationships({ objects, pathway, careerRequirements = {}, destinations = [], organizationRelationships = [] }) {
  const present = new Set(objects.map((object) => object.key));
  const edges = [];
  const add = (next) => {
    if (!present.has(next.from) || !present.has(next.to)) return;
    if (edges.some((existing) => existing.from === next.from && existing.to === next.to && existing.type === next.type)) return;
    edges.push(next);
  };

  if (pathway?.programId) {
    const pathwayKey = objectKey('programs', pathway.programId);
    for (const course of pathway.courses || []) {
      const courseKey = objectKey('programs', course.courseId);
      add(edge(pathwayKey, courseKey, RELATIONSHIP_TYPES.CONTAINS, 'curriculum:pathway.courses'));
      for (const slug of course.careerConnections || []) {
        add(edge(courseKey, objectKey('careers', slug), RELATIONSHIP_TYPES.PREPARES_FOR, 'curriculum:course.careerConnections'));
      }
      for (const prerequisite of course.prerequisites || []) {
        add(edge(courseKey, objectKey('programs', prerequisite), RELATIONSHIP_TYPES.BUILDS_ON, 'curriculum:course.prerequisites'));
      }
    }
  }

  for (const [slug, requirements] of Object.entries(careerRequirements)) {
    for (const requirement of requirements || []) {
      if (!requirement?.curriculum_id) continue;
      add(edge(objectKey('programs', requirement.curriculum_id), objectKey('careers', slug), RELATIONSHIP_TYPES.PREPARES_FOR, 'shs-api:/careers/:slug/curriculum'));
    }
  }

  for (const object of objects) {
    if (object.type !== DESTINATION_GROUP.key && object.destinationId) {
      add(edge(object.key, objectKey(DESTINATION_GROUP.key, object.destinationId), RELATIONSHIP_TYPES.AVAILABLE_IN, 'universe-destination-registry'));
    }
  }

  // shs-api /organization-relationships (empty today).
  for (const relation of organizationRelationships) {
    const from = clean(relation?.organization_id || relation?.source_organization_id);
    const to = clean(relation?.related_organization_id || relation?.target_organization_id);
    if (from && to) add(edge(objectKey('organizations', from), objectKey('organizations', to), RELATIONSHIP_TYPES.PARTNERS_WITH, 'shs-api:/organization-relationships'));
  }

  const destinationByTitle = new Map(destinations.map((destination) => [normalizeText(destination.title), destination]));
  for (const object of objects.filter((entry) => entry.type === 'organizations')) {
    const match = destinationByTitle.get(normalizeText(object.title));
    if (match) add(edge(object.key, objectKey(DESTINATION_GROUP.key, match.id), RELATIONSHIP_TYPES.REPRESENTED_IN, 'universe-destination-registry:title'));
  }

  return edges;
}

// --------------------------------------------------------------- the index

export function buildDiscoveryIndex(sources = {}) {
  // Order is precedence: a canonical shs-api Program with the same id as a
  // curriculum-as-program projection replaces the projection, keeping the
  // same /universe/program/<id> route (migration path off the projection).
  const projected = [
    ...(sources.programs?.items || []).map(projectApiProgram),
    ...projectPathwayProgram(sources.pathway),
    ...(sources.careers?.items || []).map(projectCareer),
    ...(sources.organizations?.items || []).map(projectOrganization),
    ...(sources.projects?.items || []).map(projectProject),
    ...(sources.places?.items || []).map(projectRealWorldPlace),
    ...projectMetaversePlaces(sources.metaverse),
    ...(sources.opportunities?.items || []).map((item) => projectOpportunity(item, '/opportunities')),
    ...(sources.careerOpportunities?.items || []).map((item) => projectOpportunity(item, '/public/career/opportunities')),
  ].filter(Boolean);

  const seen = new Set();
  const objects = projected.filter((object) => (seen.has(object.key) ? false : seen.add(object.key)));
  const destinations = (sources.destinations || []).map(projectDestination).filter(Boolean);

  // Objects served by a registry app inherit that app's route as their
  // canonical route when the owning domain has no per-record route.
  const registryById = new Map((sources.destinations || []).map((destination) => [destination.id, destination]));
  for (const object of objects) {
    if (!object.canonicalRoute && object.destination) {
      object.canonicalRoute = registryById.get(object.destination)?.productionPath || null;
    }
  }

  const byKey = new Map([...objects, ...destinations].map((entry) => [entry.key, entry]));
  const edges = buildRelationships({
    objects: [...objects, ...destinations],
    pathway: sources.pathway,
    careerRequirements: sources.careerRequirements,
    destinations: sources.destinations || [],
    organizationRelationships: sources.organizationRelationships?.items || [],
  });
  return { objects, destinations, edges, byKey };
}

// Six SHU object types come from `objects`; the navigation class
// ('destinations') comes only from the separate `destinations` list.
export function objectsOfType(index, typeKey) {
  if (typeKey === DESTINATION_GROUP.key) return index.destinations || [];
  return index.objects.filter((object) => object.type === typeKey);
}

export function findObject(index, typeKey, id) {
  return index.byKey.get(objectKey(typeKey, id)) || null;
}

// Related objects for a detail page, grouped by relationship + direction.
export function relatedObjects(index, key) {
  const groups = [];
  const push = (label, relation, direction, object) => {
    let group = groups.find((entry) => entry.label === label);
    if (!group) {
      group = { label, relation, direction, objects: [] };
      groups.push(group);
    }
    if (!group.objects.some((existing) => existing.key === object.key)) group.objects.push(object);
  };
  for (const item of index.edges) {
    if (item.from === key) {
      const target = index.byKey.get(item.to);
      if (target) push(OUTGOING_LABELS[item.type]?.(target) || item.type, item.type, 'out', target);
    } else if (item.to === key) {
      const origin = index.byKey.get(item.from);
      if (origin) push(INCOMING_LABELS[item.type]?.(origin) || item.type, item.type, 'in', origin);
    }
  }
  return groups;
}

const OUTGOING_LABELS = {
  PREPARES_FOR: () => 'Prepares for',
  CONTAINS: () => 'Courses in this pathway',
  BUILDS_ON: () => 'Builds on',
  AVAILABLE_IN: () => 'Available in',
  REPRESENTED_IN: () => 'Destination',
  PARTNERS_WITH: () => 'Partnerships',
};

const INCOMING_LABELS = {
  PREPARES_FOR: (origin) => (origin.kind === 'Pathway' ? 'Pathways' : 'Prepared by these courses'),
  CONTAINS: () => 'Part of',
  BUILDS_ON: () => 'Leads to',
  AVAILABLE_IN: () => 'Available here',
  REPRESENTED_IN: () => 'Represents',
  PARTNERS_WITH: () => 'Partnerships',
};

// Category-level relationship summary for the ecosystem network: which
// object types are linked to which, and by how many real edges.
export function typeRelationships(index) {
  const summary = new Map();
  for (const type of OBJECT_TYPES) summary.set(type.key, new Map());
  for (const item of index.edges) {
    const from = index.byKey.get(item.from);
    const to = index.byKey.get(item.to);
    if (!from || !to || from.type === to.type) continue;
    if (!summary.has(from.type) || !summary.has(to.type)) continue;
    summary.get(from.type).set(to.type, (summary.get(from.type).get(to.type) || 0) + 1);
    summary.get(to.type).set(from.type, (summary.get(to.type).get(from.type) || 0) + 1);
  }
  return summary;
}

// ------------------------------------------------------------------ search

function scoreObject(object, tokens, phrase) {
  const title = normalizeText(object.title);
  const tags = normalizeText((object.tags || []).join(' '));
  const kind = normalizeText(`${object.kind} ${object.type}`);
  let score = 0;
  for (const token of tokens) {
    if (!object.searchableText.includes(token)) return 0; // every token must match
    if (title.split(' ').some((word) => word.startsWith(token))) score += 4;
    else if (title.includes(token)) score += 3;
    if (tags.includes(token)) score += 2;
    if (kind.includes(token)) score += 2;
    score += 1;
  }
  if (phrase && title.includes(phrase)) score += 6;
  if (phrase && title.startsWith(phrase)) score += 4;
  return score;
}

// Returns results grouped in RESULT_GROUPS order:
//   [{ type, label, plural, total, results: [object] }]
// `type` narrows to one group; an empty query lists every object of the
// selected type (or nothing, for "All").
export function searchDiscovery(index, { query = '', type = '', limitPerGroup = Infinity } = {}) {
  const phrase = normalizeText(query);
  const tokens = phrase ? phrase.split(' ') : [];
  const groups = [...OBJECT_TYPES, DESTINATION_GROUP]
    .filter((group) => !type || group.key === type)
    .map((group) => {
      const candidates = objectsOfType(index, group.key);
      const scored = tokens.length
        ? candidates
          .map((object) => ({ object, score: scoreObject(object, tokens, phrase) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score || a.object.title.localeCompare(b.object.title))
          .map((entry) => entry.object)
        : type ? [...candidates].sort((a, b) => kindOrder(a) - kindOrder(b) || a.title.localeCompare(b.title)) : [];
      return {
        type: group.key,
        label: group.label,
        plural: group.plural,
        total: scored.length,
        results: scored.slice(0, limitPerGroup),
      };
    });
  return groups;
}

function kindOrder(object) {
  return object.kind === 'Pathway' ? 0 : 1;
}

export function totalResults(groups) {
  return groups.reduce((sum, group) => sum + group.total, 0);
}
