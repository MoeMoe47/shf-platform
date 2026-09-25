// src/pages/universe-v1/discovery/UniverseObjectDetailPage.jsx
// ------------------------------------------------------------
// /universe/<program|career|organization|project|place|opportunity>/<id>
//
// One shared detail shell for every ecosystem object type. It renders the
// canonical projection only: facts the owning system publishes, edges the
// adapter derived from real records, and actions that resolve to real
// routes (Career Center, Curriculum Hub via the registry, the Metaverse).
// Relationships a type would normally have but that no canonical source
// publishes yet are listed as "not published yet", never invented.
import React, { useEffect, useMemo, useRef } from 'react';
import Icon from '../gateway/GatewayIcon.jsx';
import { GatewayShell, RouteLink } from '../gateway/UniverseGateway.jsx';
import { destinations } from '../destinations.js';
import { discoverRouteFor, typeByKey } from './discoveryModel.js';
import { findObject, relatedObjects } from './discoveryAdapter.js';
import { ResultCard, TYPE_ICONS } from './DiscoveryParts.jsx';
import { useDestinationEntry } from './destinationEntry.js';
import useDiscovery from './useDiscovery.js';

const DESTINATION_BY_ID = new Map(destinations.map((destination) => [destination.id, destination]));

// Relationship families each type is expected to have in the product
// model, used only to state honestly which ones have no canonical data yet.
const EXPECTED_RELATIONSHIPS = {
  programs: ['Operating organization', 'Places', 'Opportunities'],
  careers: ['Employers', 'Opportunities', 'Credentials'],
  organizations: ['Programs', 'Projects', 'Places', 'Opportunities', 'Partnerships'],
  projects: ['Operating organization', 'Places', 'Programs', 'Careers'],
  places: ['Programs', 'Organizations', 'Projects', 'Opportunities'],
  opportunities: ['Organization', 'Program', 'Career', 'Place'],
};

const SOURCE_LABELS = {
  'shs-api:/careers': 'Career Center (shs-api /careers)',
  'shs-api:/programs': 'Programs (shs-api /programs)',
  'shs-api:/organizations': 'Organizations (shs-api /organizations)',
  'shs-api:/opportunities': 'Opportunities (shs-api /opportunities)',
  'shs-api:/public/career/opportunities': 'Career Center opportunities (shs-api)',
  curriculum: 'Curriculum domain — pathway map',
  metaverse: 'Metaverse world registry',
};

// Provenance statements for records SHU presents on behalf of another
// domain under an SHU type (read-only projections).
const PROJECTION_NOTES = {
  'curriculum-as-program': 'This program is a read-only discovery view of Curriculum content. Courses, lessons and learning records are owned by the Curriculum domain and managed in the Curriculum Hub.',
  'metaverse-place': 'This is a virtual place in the Silicon Heartland Metaverse, not a real-world location.',
};

export default function UniverseObjectDetailPage({ navigate, typeKey, id }) {
  const discovery = useDiscovery();
  const { entering, enter } = useDestinationEntry(navigate);
  const headingRef = useRef(null);
  const type = typeByKey(typeKey);
  const object = discovery.phase === 'ready' ? findObject(discovery.index, typeKey, id) : null;
  const groups = useMemo(() => (object ? relatedObjects(discovery.index, object.key) : []), [object, discovery.index]);

  useEffect(() => {
    const previous = document.title;
    if (object) document.title = `${object.title} · Silicon Heartland Universe`;
    return () => { document.title = previous; };
  }, [object]);

  // Move focus to the page heading once content resolves (route change).
  useEffect(() => {
    if (discovery.phase !== 'loading') headingRef.current?.focus({ preventScroll: true });
  }, [discovery.phase, object]);

  const openObject = (target) => {
    if (target.type === 'destinations') {
      const record = DESTINATION_BY_ID.get(target.id);
      if (record) enter(record, target.title);
      return;
    }
    navigate(target.detailRoute);
  };

  const runAction = (action) => {
    if (action.destinationId) {
      const record = DESTINATION_BY_ID.get(action.destinationId);
      if (record) enter(record, record.title);
    } else if (action.hard) {
      window.location.assign(action.href);
    } else {
      navigate(action.href);
    }
  };

  const backTo = discoverRouteFor({ type: typeKey });
  const status = discovery.status?.[typeKey];
  const presentLabels = new Set(groups.map((group) => group.label));
  const missing = object ? (EXPECTED_RELATIONSHIPS[typeKey] || []).filter((label) => !presentLabels.has(label)) : [];

  return (
    <GatewayShell navigate={navigate} ariaLabel={`${type?.label || 'Ecosystem'} detail`} searchHref={discoverRouteFor()} className={entering ? 'is-entering' : ''}>
      <article className="ugw-detail" aria-labelledby="ugw-detail-title" aria-busy={discovery.phase === 'loading'}>
        <RouteLink className="ugw-backLink" to={backTo} navigate={navigate}>
          <span aria-hidden="true">&larr;</span> {type ? `All ${type.plural}` : 'Discover'}
        </RouteLink>

        {discovery.phase === 'loading' && (
          <div className="ugw-detailHero is-skeleton" aria-hidden="true"><span /><span /><span /></div>
        )}

        {discovery.phase !== 'loading' && !object && (
          <div className="ugw-detailMissing">
            <span className="ugw-emptyStateIcon" aria-hidden="true"><Icon name={TYPE_ICONS[typeKey] || 'search'} /></span>
            <h1 id="ugw-detail-title" ref={headingRef} tabIndex={-1}>
              {status === 'error' ? `${type.plural} are unavailable right now.` : `We couldn't find that ${type.label.toLowerCase()}.`}
            </h1>
            <p>
              {status === 'error'
                ? 'The system that publishes this record could not be reached. Try again in a moment.'
                : status === 'no-source'
                  ? `No ${type.plural.toLowerCase()} are published in the ecosystem yet, so there is nothing to show here.`
                  : `There is no published ${type.label.toLowerCase()} with the id “${id}”. It may have been renamed or removed.`}
            </p>
            <div className="ugw-emptyStateActions">
              {status === 'error' && <button type="button" className="ugw-pillButton" onClick={discovery.retry}>Try again</button>}
              <RouteLink className="ugw-pillButton" to={backTo} navigate={navigate}>Browse {type.plural}</RouteLink>
              <RouteLink className="ugw-pillButton" to={discoverRouteFor()} navigate={navigate}>Search the ecosystem</RouteLink>
            </div>
          </div>
        )}

        {object && (
          <>
            <header className="ugw-detailHero">
              <div className="ugw-detailHeroText">
                <p className="ugw-introEyebrow">{type.label}{object.kind && object.kind !== type.label ? ` · ${object.kind}` : ''}</p>
                <h1 id="ugw-detail-title" ref={headingRef} tabIndex={-1}>{object.title}</h1>
                {object.summary && <p className="ugw-detailSummary">{object.summary}</p>}
                {PROJECTION_NOTES[object.projection] && (
                  <p className="ugw-provenance"><span aria-hidden="true">&#9670;</span> {PROJECTION_NOTES[object.projection]}</p>
                )}
                {object.tags.length > 0 && (
                  <ul className="ugw-detailTags" aria-label="Tags">
                    {object.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                )}
                {object.actions.length > 0 && (
                  <div className="ugw-detailActions">
                    {object.actions.map((action, index) => {
                      const record = action.destinationId ? DESTINATION_BY_ID.get(action.destinationId) : null;
                      const unavailable = record && record.publicNavigationStatus !== 'available';
                      return (
                        <button
                          key={action.label}
                          type="button"
                          className={index === 0 ? 'ugw-primaryAction' : 'ugw-pillButton'}
                          disabled={unavailable}
                          onClick={() => runAction(action)}
                        >
                          {action.label} <span aria-hidden="true">&rarr;</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className={`ugw-detailMedia${object.image ? '' : ' is-emblem'}`}>
                {object.image
                  ? <img src={object.image} alt={object.imageAlt || ''} decoding="async" />
                  : <span className="ugw-detailEmblem" aria-hidden="true"><Icon name={TYPE_ICONS[typeKey]} /></span>}
              </div>
            </header>

            <div className="ugw-detailBody">
              <section className="ugw-detailFacts" aria-labelledby="ugw-detail-facts">
                <h2 id="ugw-detail-facts" className="ugw-sectionEyebrow">Overview</h2>
                <dl>
                  {object.facts.map((fact) => (
                    <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
                  ))}
                  {object.geography && <div><dt>Geography</dt><dd>{object.geography}</dd></div>}
                  <div><dt>Source</dt><dd>{SOURCE_LABELS[object.canonicalSource] || object.canonicalSource}</dd></div>
                  {object.canonicalSourceId && <div><dt>Source id</dt><dd className="ugw-mono">{object.canonicalSourceId}</dd></div>}
                </dl>
                {object.facilities?.length > 0 && (
                  <>
                    <h3 className="ugw-detailSubhead">Facilities in this district</h3>
                    <ul className="ugw-detailList">
                      {object.facilities.map((name) => <li key={name}>{name}</li>)}
                    </ul>
                  </>
                )}
              </section>

              <section className="ugw-detailRelations" aria-labelledby="ugw-detail-relations">
                <h2 id="ugw-detail-relations" className="ugw-sectionEyebrow">Relationships</h2>
                {groups.map((group) => (
                  <div key={group.label} className="ugw-relationGroup">
                    <h3 className="ugw-detailSubhead">{group.label}<span>{group.objects.length}</span></h3>
                    <ul className="ugw-resultGrid is-compact">
                      {group.objects.map((target) => (
                        <ResultCard key={target.key} object={target} onOpen={openObject} destinationLabel={DESTINATION_BY_ID.get(target.destinationId)?.title} />
                      ))}
                    </ul>
                  </div>
                ))}
                {!groups.length && <p className="ugw-detailNote">No relationships are published for this {type.label.toLowerCase()} yet.</p>}
                {missing.length > 0 && (
                  <p className="ugw-detailNote">
                    Not published yet: {missing.join(', ')}. These will appear here when the owning systems publish them.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </article>
      {entering && <p className="ugw-entryLabel" role="status">Entering {entering.label}</p>}
    </GatewayShell>
  );
}
