// src/pages/universe-v1/discovery/discoverySources.js
// ------------------------------------------------------------
// Loads the canonical sources the SHU discovery adapter projects. Nothing
// here owns data: each source is read from its authority and reported with
// its own status so the UI can degrade honestly when one is unreachable.
//
//   careers, career requirements, programs, organizations, opportunities
//       -> shs-api, via the same-origin `/api` proxy (vite.config.js)
//   pathway programs/courses -> src/content/curriculum/data-center-pathway-map.json
//   places (Metaverse districts) -> src/system/metaverse registries
//   destinations -> universeDestinationRegistry.js (navigation authority)
//
// Static sources are dynamic imports so the directory's first paint does
// not pay for them. Everything is fetched once per page session and cached.

import { universeDestinations } from '../universeDestinationRegistry.js';
import { buildDiscoveryIndex } from './discoveryAdapter.js';

const API_ROOT = '/api';
const REQUEST_TIMEOUT_MS = 8000;

async function fetchItems(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_ROOT}${path}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return { status: 'error', items: [], error: `HTTP ${response.status}` };
    const payload = await response.json();
    const items = payload?.data?.items ?? payload?.items;
    return Array.isArray(items) ? { status: 'ready', items } : { status: 'error', items: [], error: 'Unexpected response shape' };
  } catch (error) {
    return { status: 'error', items: [], error: error?.name === 'AbortError' ? 'Timed out' : 'Unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCareerRequirements(careers) {
  const entries = await Promise.all(careers.map(async (career) => {
    const slug = career?.slug;
    if (!slug) return null;
    try {
      const response = await fetch(`${API_ROOT}/careers/${encodeURIComponent(slug)}/curriculum`, { headers: { Accept: 'application/json' } });
      if (!response.ok) return null;
      const payload = await response.json();
      return [slug, Array.isArray(payload?.data?.requirements) ? payload.data.requirements : []];
    } catch {
      return null;
    }
  }));
  return Object.fromEntries(entries.filter(Boolean));
}

async function loadStatic(loader) {
  try {
    return { status: 'ready', value: await loader() };
  } catch (error) {
    return { status: 'error', value: null, error: error?.message || 'Failed to load' };
  }
}

export async function loadDiscoverySources() {
  const [careers, programs, organizations, organizationRelationships, opportunities, careerOpportunities, pathway, metaverse] = await Promise.all([
    fetchItems('/careers'),
    fetchItems('/programs'),
    fetchItems('/organizations'),
    fetchItems('/organization-relationships'),
    fetchItems('/opportunities'),
    fetchItems('/public/career/opportunities'),
    loadStatic(async () => (await import('../../../content/curriculum/data-center-pathway-map.json')).default),
    loadStatic(async () => {
      const [navigation, visuals] = await Promise.all([
        import('../../../system/metaverse/metaverseNavigationModel.js'),
        import('../../../system/metaverse/metaverseVisualAssets.js'),
      ]);
      return {
        districts: navigation.METAVERSE_DISTRICT_MARKERS,
        facilities: navigation.METAVERSE_FACILITIES,
        visualAssets: visuals.METAVERSE_PRODUCTION_BACKGROUND_SET,
      };
    }),
  ]);

  const careerRequirements = careers.status === 'ready' ? await fetchCareerRequirements(careers.items) : {};

  const sources = {
    careers,
    careerRequirements,
    programs,
    organizations,
    organizationRelationships,
    opportunities,
    careerOpportunities,
    pathway: pathway.value,
    metaverse: metaverse.value || undefined,
    destinations: universeDestinations,
  };

  // Per-type availability for honest empty/error states. Projects and
  // real-world places have no canonical endpoint yet; when one exists, load
  // it here as `sources.projects` / `sources.places` — the adapter already
  // projects both (see docs/SHU_CANONICAL_DATA_GAP_REPORT_V1.md).
  const status = {
    programs: pathway.status === 'ready' || programs.status === 'ready' ? 'ready' : 'error',
    careers: careers.status,
    organizations: organizations.status,
    projects: 'no-source',
    places: metaverse.status,
    opportunities: opportunities.status === 'ready' || careerOpportunities.status === 'ready' ? 'ready' : 'error',
    destinations: 'ready',
  };

  return { index: buildDiscoveryIndex(sources), status };
}

let cached = null;

export function getDiscovery() {
  if (!cached) {
    cached = loadDiscoverySources().catch((error) => {
      cached = null; // allow a retry after a hard failure
      throw error;
    });
  }
  return cached;
}

export function resetDiscoveryCache() {
  cached = null;
}
