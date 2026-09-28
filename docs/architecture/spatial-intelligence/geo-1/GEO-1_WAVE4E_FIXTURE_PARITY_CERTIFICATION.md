# GEO-1 Wave 4E Fixture Parity Certification

## Fixture Route / Injection

The development route is:

`/metaverse/city?metaverseDev=1&spatialFixture=1&metSceneTime=DAY`

`MetaverseCityPage` enables the fixture only when the existing development gate
is active and the explicit `spatialFixture=1` query is present. The fixture is
created in an isolated runtime and is not registered during normal production
startup.

## Fixture Authority and Records

Authority namespace: `test.spatial.quick-map-fixture`.

The four deterministic records are:

- `fixture-normal`: visible, verified, available at `(28, 32)`.
- `fixture-stale`: visible, stale at `(44, 46)`.
- `fixture-unavailable`: visible but unavailable at `(62, 54)`.
- `fixture-hidden`: restricted from the fixture viewer at `(75, 68)` and absent from client output.

All records use `METAVERSE` / `metaverse.quick-map` coordinates and have no
destination or navigation authority.

## Production Pipeline

The live path is:

`fixture record -> test-only projection adapter -> production Projection Pipeline -> ClientProjectionResult -> production QuickMapClientAdapter -> MetaverseMiniMap -> semantic list`

The map and list consume the same sanitized marker models. No handcrafted
marker or list records are used by the browser tests.

## Browser Certification

- `tests/ui/spatial-quick-map-live-parity.spec.mjs`: **3/3 PASS** in Chromium.
- `tests/ui/spatial-quick-map-accessibility.spec.mjs`: **1/1 PASS** in Chromium.
- Visual and semantic parity: normal, stale, and unavailable markers appear in both presentations.
- Restricted hidden record: absent from both presentations and not keyboard reachable.
- Map selection and list selection update the same single Selection Store state.
- Keyboard activation, modal focus, Escape close, and focus return pass.
- DOM privacy checks exclude fixture source IDs, authority namespace, and hidden identity.

## Defect Corrected

The first live run found that stale freshness metadata existed upstream but the
marker/list presentation rendered only `Normal`. The shared presentation now
uses the existing safe freshness text for stale markers, preserving the source
state without inventing a new state authority.

## Verification

- Wave 4E fixture unit tests: **3/3 PASS**.
- Existing Wave 4D unit tests: **8/8 PASS**.
- Full tracked unit baseline: **243/243 PASS**.
- Build: **PASS**.
- No production source mappings, legacy marker migration, coordinate transform,
  destination identity, navigation authority, or domain authority were added.

## Remaining Conditions

This is a test/development-only fixture and is not a production source mapping.
The 15 legacy Quick Map registry records remain unchanged. Wave 4E final
acceptance and broader client rollout remain out of scope for this pass.
