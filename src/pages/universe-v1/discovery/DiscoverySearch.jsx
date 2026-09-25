// src/pages/universe-v1/discovery/DiscoverySearch.jsx
// ------------------------------------------------------------
// The gateway hero's "Search the universe..." control, made functional:
// an ARIA combobox over the canonical discovery index (grouped by type),
// with the category chips beneath it acting as a single-select filter.
// Visual shell (form, input, arrow button, chips) is the approved gateway
// markup; only behavior and the results panel are new.
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Icon from '../gateway/GatewayIcon.jsx';
import { destinations } from '../destinations.js';
import { OBJECT_TYPES, discoverRouteFor, typeByKey } from './discoveryModel.js';
import { searchDiscovery, totalResults } from './discoveryAdapter.js';
import { NoResults, ObjectThumb, TypeEmptyState } from './DiscoveryParts.jsx';
import useDiscovery, { useDebouncedValue } from './useDiscovery.js';

const DESTINATION_TITLES = new Map(destinations.map((destination) => [destination.id, destination.title]));

export default function DiscoverySearch({ navigate, onEnterDestination }) {
  const discovery = useDiscovery();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debouncedQuery = useDebouncedValue(query);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const baseId = useId().replace(/:/g, '');
  const listboxId = `ugw-search-listbox-${baseId}`;

  const trimmed = debouncedQuery.trim();
  const groups = useMemo(() => {
    if (discovery.phase !== 'ready' || (!trimmed && !category)) return [];
    return searchDiscovery(discovery.index, { query: trimmed, type: category, limitPerGroup: category ? 8 : 4 });
  }, [discovery.phase, discovery.index, trimmed, category]);
  const visibleGroups = groups.filter((group) => group.results.length);
  const options = useMemo(() => visibleGroups.flatMap((group) => group.results), [visibleGroups]);
  const total = totalResults(groups);
  const panelOpen = open && Boolean(query.trim() || category);

  useEffect(() => { setActive(-1); }, [trimmed, category]);

  const openObject = (object) => {
    setOpen(false);
    if (object.type === 'destinations') {
      const record = destinations.find((destination) => destination.id === object.id);
      if (record) onEnterDestination(record);
      return;
    }
    navigate(object.detailRoute);
  };

  const goToDiscover = (typeOverride) => {
    setOpen(false);
    navigate(discoverRouteFor({ query: query.trim(), type: typeOverride ?? category }));
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      if (options.length) setActive((index) => (index + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (options.length) setActive((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (event.key === 'Escape') {
      if (panelOpen) { event.preventDefault(); setOpen(false); setActive(-1); }
      else if (query) { event.preventDefault(); setQuery(''); }
    } else if (event.key === 'Home' && panelOpen && options.length) {
      setActive(0);
    } else if (event.key === 'End' && panelOpen && options.length) {
      setActive(options.length - 1);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (panelOpen && active >= 0 && options[active]) openObject(options[active]);
    else goToDiscover();
  };

  const onBlur = (event) => {
    if (!wrapRef.current?.contains(event.relatedTarget)) setOpen(false);
  };

  const toggleCategory = (key) => {
    setCategory((current) => (current === key ? '' : key));
    setOpen(true);
    inputRef.current?.focus({ preventScroll: true });
  };

  const optionId = (index) => `${listboxId}-opt-${index}`;
  let optionIndex = -1;

  const liveMessage = !panelOpen ? '' : discovery.phase === 'loading' ? 'Loading results'
    : discovery.phase === 'error' ? 'Search is unavailable right now'
      : total ? `${total} result${total === 1 ? '' : 's'}${category ? ` in ${typeByKey(category).plural}` : ''}` : 'No results';

  return (
    <div className="ugw-searchWrap" ref={wrapRef} onBlur={onBlur}>
      <form className="ugw-search" role="search" aria-label="Search the Silicon Heartland Universe" onSubmit={onSubmit}>
        <Icon name="search" />
        <label className="ugw-srOnly" htmlFor="ugw-search-input">Search the universe</label>
        <input
          id="ugw-search-input"
          ref={inputRef}
          type="search"
          placeholder="Search the universe..."
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={panelOpen}
          aria-controls={listboxId}
          aria-activedescendant={panelOpen && active >= 0 ? optionId(active) : undefined}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" aria-label="Search">&rarr;</button>
      </form>

      <div className="ugw-searchChips" role="group" aria-label="Filter search by category">
        {OBJECT_TYPES.map((type) => (
          <button
            key={type.key}
            type="button"
            className={category === type.key ? 'is-selected' : ''}
            aria-pressed={category === type.key}
            onClick={() => toggleCategory(type.key)}
          >
            {type.plural}
          </button>
        ))}
      </div>

      <p className="ugw-srOnly" aria-live="polite">{liveMessage}</p>

      <div className={`ugw-searchPanel${panelOpen ? ' is-open' : ''}`} hidden={!panelOpen}>
        {discovery.phase === 'loading' && <p className="ugw-searchStatus">Loading the ecosystem index&hellip;</p>}
        {discovery.phase === 'error' && (
          <p className="ugw-searchStatus">Search is unavailable right now. <button type="button" className="ugw-textButton" onClick={discovery.retry}>Try again</button></p>
        )}
        {discovery.phase === 'ready' && (
          <>
            {category && (
              <div className="ugw-searchScope">
                <span>Showing {typeByKey(category).plural}</span>
                <button type="button" className="ugw-textButton" onClick={() => toggleCategory(category)}>Show all categories</button>
              </div>
            )}
            <div role="listbox" id={listboxId} aria-label="Search results" className="ugw-searchListbox">
              {visibleGroups.map((group) => (
                <div key={group.type} role="group" aria-labelledby={`${listboxId}-${group.type}`} className="ugw-searchGroup">
                  <div id={`${listboxId}-${group.type}`} className="ugw-searchGroupLabel">
                    {group.plural}<span>{group.total}</span>
                  </div>
                  {group.results.map((object) => {
                    optionIndex += 1;
                    const index = optionIndex;
                    const unavailable = object.type === 'destinations' && object.status !== 'available';
                    const context = object.type === 'destinations'
                      ? (unavailable ? 'Not yet available' : 'Enter destination')
                      : object.projection === 'metaverse-place' ? 'Virtual · Metaverse'
                        : DESTINATION_TITLES.get(object.destinationId) || object.geography || object.kind;
                    return (
                      <div
                        key={object.key}
                        id={optionId(index)}
                        role="option"
                        aria-selected={active === index}
                        aria-disabled={unavailable || undefined}
                        className={`ugw-searchOption${active === index ? ' is-active' : ''}${unavailable ? ' is-unavailable' : ''}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => { if (!unavailable) openObject(object); }}
                      >
                        <ObjectThumb object={object} />
                        <span className="ugw-searchOptionBody">
                          <span className="ugw-searchOptionType">{object.kind}</span>
                          <strong>{object.title}</strong>
                          {object.summary && <span className="ugw-searchOptionSummary">{object.summary}</span>}
                        </span>
                        <span className="ugw-searchOptionContext">{context}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {!options.length && trimmed && <NoResults compact query={trimmed} onClear={() => { setQuery(''); inputRef.current?.focus(); }} onBrowse={(key) => goToDiscover(key)} />}
            {!options.length && !trimmed && category && (
              <TypeEmptyState compact typeKey={category} status={discovery.status?.[category]} onBrowse={(key) => toggleCategory(key)} onRetry={discovery.retry} />
            )}
            {(options.length > 0 || trimmed) && (
              <button type="button" className="ugw-searchFooter" onClick={() => goToDiscover()}>
                {trimmed ? <>See all results for &ldquo;{trimmed}&rdquo;</> : <>Browse all {typeByKey(category)?.plural}</>}
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
