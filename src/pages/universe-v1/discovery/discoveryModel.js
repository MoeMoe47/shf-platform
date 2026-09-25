// src/pages/universe-v1/discovery/discoveryModel.js
// ------------------------------------------------------------
// SHU Ecosystem Experience V1 — discovery vocabulary and routes.
//
// Pure module (no React, no network) so it can be unit-tested with
// `node --test` and shared by the gateway, the Discover page, and the
// object detail pages.
//
// SHU is a projection layer: every object type below is OWNED by another
// domain (shs-api, the curriculum pathway map, the Metaverse registries,
// the Universe destination registry). This file only names the types and
// the Universe routes that present them. See
// docs/SHU_ECOSYSTEM_EXPERIENCE_V1.md.

export const DISCOVERY_ROUTE = '/universe/discover';

// The six ecosystem object types, in display order. `plural` is the
// URL/filter key (matches the existing chip labels), `segment` the detail
// route segment (/universe/<segment>/<id>).
export const OBJECT_TYPES = Object.freeze([
  { key: 'programs', segment: 'program', label: 'Program', plural: 'Programs' },
  { key: 'careers', segment: 'career', label: 'Career', plural: 'Careers' },
  { key: 'organizations', segment: 'organization', label: 'Organization', plural: 'Organizations' },
  { key: 'projects', segment: 'project', label: 'Project', plural: 'Projects' },
  { key: 'places', segment: 'place', label: 'Place', plural: 'Places' },
  { key: 'opportunities', segment: 'opportunity', label: 'Opportunity', plural: 'Opportunities' },
]);

// Registry destinations are searchable ("Search the universe") but are not
// detail-page objects: selecting one enters the destination through the
// registry, exactly like the planets do.
export const DESTINATION_GROUP = Object.freeze({ key: 'destinations', label: 'Destination', plural: 'Destinations' });

export const RESULT_GROUPS = Object.freeze([...OBJECT_TYPES, DESTINATION_GROUP]);

const TYPE_BY_KEY = new Map(RESULT_GROUPS.map((type) => [type.key, type]));
const TYPE_BY_SEGMENT = new Map(OBJECT_TYPES.map((type) => [type.segment, type]));

export function typeByKey(key) {
  return TYPE_BY_KEY.get(key) || null;
}

export function typeBySegment(segment) {
  return TYPE_BY_SEGMENT.get(segment) || null;
}

// Canonical ids come from other systems (slugs, UUID-ish ids, course ids),
// so they are always URI-encoded in routes.
export function detailRouteFor(typeKey, id) {
  const type = TYPE_BY_KEY.get(typeKey);
  if (!type || !type.segment || !id) return null;
  return `/universe/${type.segment}/${encodeURIComponent(id)}`;
}

// Returns { typeKey, id } for /universe/<segment>/<id>, or null when the
// path is not an object detail route. Unknown segments return null so the
// caller can fall through to the destination registry / NotFound.
export function parseDetailRoute(pathname) {
  const match = /^\/universe\/([a-z-]+)\/([^/]+)\/?$/.exec(pathname || '');
  if (!match) return null;
  const type = TYPE_BY_SEGMENT.get(match[1]);
  if (!type) return null;
  let id;
  try {
    id = decodeURIComponent(match[2]);
  } catch {
    return null;
  }
  return id ? { typeKey: type.key, id } : null;
}

export function discoverRouteFor({ query = '', type = '' } = {}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (type && TYPE_BY_KEY.has(type)) params.set('type', type);
  const search = params.toString();
  return search ? `${DISCOVERY_ROUTE}?${search}` : DISCOVERY_ROUTE;
}

export function readDiscoverParams(search) {
  const params = new URLSearchParams(search || '');
  const type = params.get('type') || '';
  return {
    query: params.get('q') || '',
    type: TYPE_BY_KEY.has(type) ? type : '',
  };
}

// Relationship vocabulary (subset of the program vocabulary actually
// backed by canonical data today). Every edge is { from, to, type, source }
// where from/to are object keys ("careers:data-center-technician") or
// destination keys ("destinations:career").
export const RELATIONSHIP_TYPES = Object.freeze({
  PREPARES_FOR: 'PREPARES_FOR', // course/program -> career
  CONTAINS: 'CONTAINS', // pathway program -> course program
  BUILDS_ON: 'BUILDS_ON', // course -> prerequisite course
  AVAILABLE_IN: 'AVAILABLE_IN', // object -> registry destination that serves it
  REPRESENTED_IN: 'REPRESENTED_IN', // organization -> its registry destination
  PARTNERS_WITH: 'PARTNERS_WITH', // organization -> organization (shs-api relationships)
});

export function objectKey(typeKey, id) {
  return `${typeKey}:${id}`;
}
