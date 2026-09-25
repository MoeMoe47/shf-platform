// src/pages/universe-v1/discovery/DiscoveryParts.jsx
// Presentation pieces shared by the gateway search, the Discover page and
// object detail pages. Styling lives in the "SHU Ecosystem Experience V1"
// block of ../universe-v1.css and reuses the gateway's tokens.
import React from 'react';
import Icon from '../gateway/GatewayIcon.jsx';
import { OBJECT_TYPES, typeByKey } from './discoveryModel.js';

export const TYPE_ICONS = Object.freeze({
  programs: 'cap',
  careers: 'hand',
  organizations: 'people',
  projects: 'rocket',
  places: 'pin',
  opportunities: 'ticket',
  destinations: 'orbit',
});

export function ObjectThumb({ object, className = '' }) {
  if (object.image) {
    return (
      <span className={`ugw-objThumb ${className}`}>
        <img src={object.image} alt="" loading="lazy" decoding="async" />
      </span>
    );
  }
  return (
    <span className={`ugw-objThumb ugw-objThumb--emblem ${className}`} aria-hidden="true">
      <Icon name={TYPE_ICONS[object.type]} />
    </span>
  );
}

export function ResultCard({ object, onOpen, destinationLabel }) {
  const type = typeByKey(object.type);
  const isDestination = object.resultClass === 'destination';
  const unavailable = isDestination && object.status !== 'available';
  return (
    <li className={`ugw-resultCard${unavailable ? ' is-unavailable' : ''}${isDestination ? ' is-destination' : ''}`}>
      <a
        href={object.detailRoute || '#'}
        onClick={(event) => { event.preventDefault(); onOpen(object); }}
        aria-disabled={unavailable || undefined}
      >
        <ObjectThumb object={object} />
        <span className="ugw-resultCardBody">
          <span className="ugw-resultCardType">{type?.label}{object.kind && object.kind !== type?.label ? ` · ${object.kind}` : ''}</span>
          <strong>{object.title}</strong>
          {object.summary && <span className="ugw-resultCardSummary">{object.summary}</span>}
          <span className="ugw-resultCardMeta">
            {isDestination
              ? (unavailable ? 'Destination · not yet available' : 'Destination · enter')
              : object.projection === 'metaverse-place' ? 'Virtual · Silicon Heartland Metaverse'
                : destinationLabel ? `In ${destinationLabel}` : object.geography || ''}
          </span>
        </span>
        <i aria-hidden="true">&rarr;</i>
      </a>
    </li>
  );
}

const EMPTY_COPY = {
  'no-source': (type) => ({
    title: `No ${type.plural.toLowerCase()} are published yet.`,
    body: `${type.plural} will appear here once they are recorded in the ecosystem's canonical ${type.label.toLowerCase()} registry.`,
  }),
  ready: (type) => ({
    title: `No ${type.plural.toLowerCase()} are published right now.`,
    body: `New ${type.plural.toLowerCase()} will appear here as soon as they are published.`,
  }),
  error: (type) => ({
    title: `${type.plural} are unavailable right now.`,
    body: 'The service that publishes them could not be reached. Try again in a moment.',
  }),
};

export function TypeEmptyState({ typeKey, status, onBrowse, onRetry, compact = false }) {
  const type = typeByKey(typeKey);
  if (!type) return null;
  const copy = (EMPTY_COPY[status] || EMPTY_COPY.ready)(type);
  const alternatives = OBJECT_TYPES.filter((entry) => ['programs', 'careers', 'places'].includes(entry.key) && entry.key !== typeKey);
  return (
    <div className={`ugw-emptyState${compact ? ' is-compact' : ''}`} role="status">
      <span className="ugw-emptyStateIcon" aria-hidden="true"><Icon name={TYPE_ICONS[typeKey]} /></span>
      <strong>{copy.title}</strong>
      <p>{copy.body}</p>
      <div className="ugw-emptyStateActions">
        {status === 'error' && onRetry && <button type="button" className="ugw-pillButton" onClick={onRetry}>Try again</button>}
        {onBrowse && alternatives.map((entry) => (
          <button key={entry.key} type="button" className="ugw-pillButton" onClick={() => onBrowse(entry.key)}>
            Browse {entry.plural}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NoResults({ query, onClear, onBrowse, compact = false }) {
  return (
    <div className={`ugw-emptyState${compact ? ' is-compact' : ''}`} role="status">
      <span className="ugw-emptyStateIcon" aria-hidden="true"><Icon name="search" /></span>
      <strong>No results for &ldquo;{query}&rdquo;</strong>
      <p>Try a broader term, or browse what the ecosystem publishes today.</p>
      <div className="ugw-emptyStateActions">
        {onClear && <button type="button" className="ugw-pillButton" onClick={onClear}>Clear search</button>}
        {onBrowse && ['programs', 'careers', 'organizations'].map((key) => (
          <button key={key} type="button" className="ugw-pillButton" onClick={() => onBrowse(key)}>
            Browse {typeByKey(key).plural}
          </button>
        ))}
      </div>
    </div>
  );
}
