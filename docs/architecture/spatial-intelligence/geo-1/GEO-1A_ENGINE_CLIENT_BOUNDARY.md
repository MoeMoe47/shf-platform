# GEO-1A Engine / Client Boundary

## Engine

An engine owns real behavior or state. Examples may include confirmed traffic, water, transit, emergency, event, mission, or domain engines when repository evidence proves runtime behavior, authority, and state ownership.

## Registry

A registry owns structured definitions, metadata, references, coordinate spaces, layer definitions, or configuration. A registry is not automatically an engine.

## Projection Adapter

A projection adapter converts eligible domain or engine data into spatial representation. It must preserve source authority, coordinate family, coordinate space, provenance, publication state, and allowed interactions.

## Map Client

A map client renders spatial projections and emits interactions. A map client does not own domain truth merely because it displays a record.

## Spatial Engine

The Spatial Engine coordinates common spatial behavior: projections, coordinate spaces, layers, selection, viewport/camera state, highlight state, route/path presentation, interaction events, temporal projection, and projection-boundary eligibility.

## Classification Rule

Emergency/Dispatch and Sky Bridge/Transit must not be classified as full engines unless repository evidence supports runtime behavior, authority, routes or state, and tests. GEO-0 evidence supports metadata-only, registry-only, or pending classification.
