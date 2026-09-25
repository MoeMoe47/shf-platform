// src/pages/universe-v1/discovery/UniverseDiscoverPage.jsx
// ------------------------------------------------------------
// /universe/discover — the full browse experience behind every "View All".
// Query + category live in the URL (?q=&type=) so results are shareable and
// back/forward restore them. Renders only the canonical discovery index.
import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../gateway/GatewayIcon.jsx';
import { GatewayShell, RouteLink } from '../gateway/UniverseGateway.jsx';
import { destinations } from '../destinations.js';
import { UNIVERSE_DIRECTORY_ROUTE } from '../universeDestinationRegistry.js';
import { RESULT_GROUPS, discoverRouteFor, readDiscoverParams, typeByKey } from './discoveryModel.js';
import { objectsOfType, searchDiscovery, totalResults } from './discoveryAdapter.js';
import { NoResults, ResultCard, TypeEmptyState } from './DiscoveryParts.jsx';
import { useDestinationEntry } from './destinationEntry.js';
import useDiscovery, { useDebouncedValue } from './useDiscovery.js';

const DESTINATION_TITLES = new Map(destinations.map((destination) => [destination.id, destination.title]));
const OVERVIEW_LIMIT = 6;

export default function UniverseDiscoverPage({ navigate }) {
  const discovery = useDiscovery();
  const { entering, enter } = useDestinationEntry(navigate);
  const [params, setParams] = useState(() => readDiscoverParams(window.location.search));
  const [draft, setDraft] = useState(params.query);
  const debounced = useDebouncedValue(draft, 160);

  // Back/forward between Discover states re-reads the URL.
  useEffect(() => {
    const onPop = () => {
      const next = readDiscoverParams(window.location.search);
      setParams(next);
      setDraft(next.query);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Typing updates the URL in place (replace, not push) once it settles.
  useEffect(() => {
    if (debounced === params.query) return;
    const next = { ...params, query: debounced };
    setParams(next);
    window.history.replaceState({}, '', discoverRouteFor(next));
  }, [debounced]);

  const selectType = (type) => {
    const next = { query: draft, type };
    setParams(next);
    window.history.pushState({}, '', discoverRouteFor(next));
  };

  const query = params.query.trim();
  const ready = discovery.phase === 'ready';
  const groups = useMemo(() => (ready ? searchDiscovery(discovery.index, { query, type: params.type }) : []), [ready, discovery.index, query, params.type]);
  const counts = useMemo(() => {
    if (!ready) return {};
    if (query) return Object.fromEntries(searchDiscovery(discovery.index, { query }).map((group) => [group.type, group.total]));
    return Object.fromEntries(RESULT_GROUPS.map((group) => [group.key, objectsOfType(discovery.index, group.key).length]));
  }, [ready, discovery.index, query]);
  const total = totalResults(groups);

  const openObject = (object) => {
    if (object.type === 'destinations') {
      const record = destinations.find((destination) => destination.id === object.id);
      if (record) enter(record, object.title);
      return;
    }
    navigate(object.detailRoute);
  };

  // "All" with no query: an overview section per type, including the
  // honest empty states, rather than a blank page.
  const overview = ready && !query && !params.type;
  const selected = typeByKey(params.type);

  return (
    <GatewayShell navigate={navigate} ariaLabel="Discover the Silicon Heartland ecosystem" className={entering ? 'is-entering' : ''}>
      <section className="ugw-discover" aria-labelledby="ugw-discover-title">
        <RouteLink className="ugw-backLink" to={UNIVERSE_DIRECTORY_ROUTE} navigate={navigate}>
          <span aria-hidden="true">&larr;</span> Universe Directory
        </RouteLink>
        <p className="ugw-introEyebrow">Discover</p>
        <h1 id="ugw-discover-title" className="ugw-discoverTitle">Explore the Silicon Heartland ecosystem.</h1>
        <p className="ugw-discoverLead">
          Search programs, careers, organizations, projects, places, opportunities and destinations published by Silicon Heartland systems.
        </p>

        <form className="ugw-search ugw-discoverSearch" role="search" aria-label="Search the ecosystem" onSubmit={(event) => { event.preventDefault(); setParams((current) => ({ ...current, query: draft })); }}>
          <Icon name="search" />
          <label className="ugw-srOnly" htmlFor="ugw-search-input">Search the ecosystem</label>
          <input
            id="ugw-search-input"
            type="search"
            placeholder="Search the universe..."
            autoComplete="off"
            aria-controls="ugw-discover-results"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          {draft && <button type="button" className="ugw-searchClear" aria-label="Clear search" onClick={() => setDraft('')}>&times;</button>}
          <button type="submit" aria-label="Search">&rarr;</button>
        </form>

        <div className="ugw-filterRow ugw-discoverFilters" role="group" aria-label="Filter by category">
          <button type="button" className={params.type ? '' : 'is-active'} aria-pressed={!params.type} onClick={() => selectType('')}>All</button>
          {RESULT_GROUPS.map((group) => (
            <button key={group.key} type="button" className={params.type === group.key ? 'is-active' : ''} aria-pressed={params.type === group.key} onClick={() => selectType(group.key)}>
              {group.plural}{ready && <span className="ugw-filterCount">{counts[group.key] ?? 0}</span>}
            </button>
          ))}
        </div>

        <p className="ugw-srOnly" aria-live="polite">
          {ready ? (overview ? 'Showing an overview of every category' : `${total} result${total === 1 ? '' : 's'}${selected ? ` in ${selected.plural}` : ''}${query ? ` for ${query}` : ''}`) : ''}
        </p>

        <div id="ugw-discover-results" className="ugw-discoverResults">
          {discovery.phase === 'loading' && (
            <ul className="ugw-resultGrid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => <li key={index} className="ugw-resultCard is-skeleton"><span /></li>)}
            </ul>
          )}
          {discovery.phase === 'error' && (
            <div className="ugw-emptyState" role="alert">
              <strong>The ecosystem index could not be loaded.</strong>
              <p>Check your connection and try again.</p>
              <div className="ugw-emptyStateActions"><button type="button" className="ugw-pillButton" onClick={discovery.retry}>Try again</button></div>
            </div>
          )}

          {overview && RESULT_GROUPS.map((group) => {
            const objects = objectsOfType(discovery.index, group.key);
            return (
              <section key={group.key} className="ugw-discoverGroup" aria-labelledby={`ugw-discover-${group.key}`}>
                <div className="ugw-discoverGroupHeader">
                  <h2 id={`ugw-discover-${group.key}`} className="ugw-sectionEyebrow">{group.plural}<span>{objects.length}</span></h2>
                  {objects.length > OVERVIEW_LIMIT && (
                    <button type="button" className="ugw-textButton" onClick={() => selectType(group.key)}>See all {objects.length} <span aria-hidden="true">&rarr;</span></button>
                  )}
                </div>
                {objects.length ? (
                  <ul className="ugw-resultGrid">
                    {[...objects].sort((a, b) => (a.kind === 'Pathway' ? -1 : b.kind === 'Pathway' ? 1 : 0)).slice(0, OVERVIEW_LIMIT).map((object) => (
                      <ResultCard key={object.key} object={object} onOpen={openObject} destinationLabel={DESTINATION_TITLES.get(object.destinationId)} />
                    ))}
                  </ul>
                ) : (
                  <TypeEmptyState compact typeKey={group.key} status={discovery.status?.[group.key]} onRetry={discovery.retry} />
                )}
              </section>
            );
          })}

          {ready && !overview && total > 0 && groups.filter((group) => group.results.length).map((group) => (
            <section key={group.type} className="ugw-discoverGroup" aria-labelledby={`ugw-discover-${group.type}`}>
              <div className="ugw-discoverGroupHeader">
                <h2 id={`ugw-discover-${group.type}`} className="ugw-sectionEyebrow">{group.plural}<span>{group.total}</span></h2>
              </div>
              <ul className="ugw-resultGrid">
                {group.results.map((object) => (
                  <ResultCard key={object.key} object={object} onOpen={openObject} destinationLabel={DESTINATION_TITLES.get(object.destinationId)} />
                ))}
              </ul>
            </section>
          ))}

          {ready && !overview && total === 0 && query && (
            <NoResults query={query} onClear={() => setDraft('')} onBrowse={selectType} />
          )}
          {ready && !overview && total === 0 && !query && selected && (
            <TypeEmptyState typeKey={selected.key} status={discovery.status?.[selected.key]} onBrowse={selectType} onRetry={discovery.retry} />
          )}
        </div>

        <p className="ugw-sourceNote">
          Results are read directly from Silicon Heartland&rsquo;s canonical systems: the Career Center service, the curriculum pathway map,
          the Metaverse world registry and the Universe destination registry.
        </p>
      </section>
      {entering && <p className="ugw-entryLabel" role="status">Entering {entering.label}</p>}
    </GatewayShell>
  );
}
