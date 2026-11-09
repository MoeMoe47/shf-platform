# Avalon traffic behavior — Checkpoint G

## Pre-implementation audit — 2026-11-09

Scope: Metaverse-owned private Avalon presentation only. Existing dirty/untracked
work is preserved; no shared authority, asset, geometry or engine changes planned.

Canonical movement: `useMetaverseTrafficAllRoutesReview` →
`advanceRouteFleetVehicles` → existing sampler/lifecycle → `TrafficVehicleMarker`.
The existing `metaverseTrafficIntersectionControls.js` already plans braking,
stop duration, following, reservation/rear clearance, pedestrian yielding and
right-hand/opposing-turn priority. No second engine/controller is needed.
Its runtime accepts `intersectionControls: {registry, state, pedestrianOccupancy}`;
the current React fleet hook does not forward this optional contract. This seam
can be extended later, after a verified caller-owned registry exists.

Two-blue-sedan cause: `AvalonSeasonalTrafficLayer` initializes every slot's index
to zero; both route lists start with sedan-blue. Other eligible models rotate only
on off-screen recycle. Plan: deterministic route-offset model selection, excluding
other active compatible slots' models when alternatives exist; keep models stable
within a journey and preserve exact-signature continuity. No density/speed changes.

Inventory: existing blue sedan, white SUV, red pickup, brown delivery truck.
No approved minivan in the current protected fleet. Autumn rear allows sedan/SUV/
pickup, autumn east sedan/SUV; winter east sedan/SUV, winter rear disabled.
Truck excluded everywhere by D/F safety checks. No new assets will be introduced.

**BEHAVIOR ACTIVATION BLOCKED on all nine seasonal routes.** D/F road edges,
crosswalk polygons and full-body journey clearance do not verify stop lines,
sign-facing/driver assignment, intersection type, turns, priority or rear-clear
progress. Summer Phase 3M contains explicitly provisional proposals, not verified
seasonal stop positions; it cannot authorize these plates. The owner requested
blocking and review if control geometry cannot be verified. No stop coordinates
will be guessed from painted signs or crosswalks.

Authorized implementation: improve private model selection and communicate the
behavior block; document a reusable adapter design using the existing controller.
Test diversity/continuity/geometry plus the existing controller at a two-second
hold on clearly synthetic coordinates. Synthetic stop evidence is not Avalon
traffic-law evidence. Actual seasonal approach/stop/departure proof remains blocked
until reviewed stop/topology measurements exist. No changes to the existing shared
engine, summer fleet, camera, calibrated routes, scale or artwork are planned.

Final verification, evidence, control map, owner review request and handoff follow
after this audit; this section records the design before implementation.

## Review disposition

**PARTIAL — fleet diversity ready for owner visual review; seasonal traffic-law
activation BLOCKED.** Owner approval of appearance alone will not resolve the
missing control geometry. No claim of lawful seasonal driving is made.

The working tree already contained the G allocator, layer integration, preview
warning and tests when this session began. They were inspected and retained.
This session completes verification and this report; unrelated dirty work is
outside the handoff. The existing branch was retained; no commit or deployment.

## Inventory and route eligibility

These are existing protected PNG models, not newly generated assets. Eligibility
is recalculated by `eligibleSeasonalCalibration` using full-body clearance,
perspective, heading, complete journey and off-screen lifecycle checks. A route's
generic `vehicle_classes` declaration does not authorize a particular PNG.

| Scene (each DAY/DUSK/NIGHT) | View | Sedan blue | SUV white | Pickup red | Delivery truck brown | Minivan |
| --- | --- | --- | --- | --- | --- | --- |
| Autumn west | rear-west | Yes | Yes | Yes | No: lane clearance | No approved model |
| Autumn east | front-garden | Yes | Yes | No: lane/heading, also curb at NIGHT | No: curb/lane/heading | No approved model |
| Winter west | rear-west | No: curb/lane | No: curb/lane | No: curb/lane | No: curb/lane | No approved model |
| Winter east | front-garden | Yes | Yes | No: curb/lane/heading | No: curb/lane/heading | No approved model |

The three winter west routes remain excluded. Autumn has two concurrent slots,
with all three eligible vehicle types appearing over successive journeys. Winter
has one slot rotating sedan/SUV; no density increase is used to force variety.
The initial autumn pair is sedan/SUV. Stable route ordering offsets the starting
index, then selection avoids already occupied model IDs when compatible choices
exist. Models remain fixed throughout a journey and on compatible refreshes.
Rotation occurs when progress wraps at the verified off-screen lifecycle.

## Stop-sign and intersection-control map

There is **no verified executable seasonal control map**. For every route below,
stop-line coordinates, approach assignment, topology, stop progress and rear-clear
progress are unresolved. `data-intersection-controls="OFF"` and
`data-traffic-behavior="BLOCKED_UNVERIFIED_STOP_GEOMETRY"` explicitly describe it.
The preview status also tells the owner that vehicles currently do not stop.

| Route ID suffix after `avalon-seasonal-d-` | Road movement | Road activation | Behavior activation |
| --- | --- | --- | --- |
| autumn-day-rear-west | westbound away from foreground junction | Private only | BLOCKED |
| autumn-day-front-garden | east arm toward foreground | Private only | BLOCKED |
| autumn-dusk-rear-west | westbound away from foreground junction | Private only | BLOCKED |
| autumn-dusk-front-garden | east arm toward foreground | Private only | BLOCKED |
| autumn-night-rear-west | westbound away from foreground junction | Private only | BLOCKED |
| autumn-night-front-garden | east arm toward foreground | Private only | BLOCKED |
| winter-day-rear-west | west arm | Disabled: body clearance | BLOCKED |
| winter-day-front-garden | east arm toward foreground | Private only | BLOCKED |
| winter-dusk-rear-west | west arm | Disabled: body clearance | BLOCKED |
| winter-dusk-front-garden | east arm toward foreground | Private only | BLOCKED |
| winter-night-rear-west | west arm | Disabled: body clearance | BLOCKED |
| winter-night-front-garden | east arm toward foreground | Private only | BLOCKED |

The opening audit's “nine seasonal routes” means nine road-eligible routes;
the table includes all twelve candidates. Every candidate is blocked for controls.

The seasonal calibration records native 1584×993 road-edge, divider, plaza,
crosswalk and wheelbase traces independently for all six plate hashes. Crosswalk
polygons are **not stop lines**. The summer
[Phase 3M proposal](AVALON_PHASE3M_EVENING_TRAFFIC_AND_INTERSECTION_READINESS.md#intersection-readiness-proposal--inactive)
labels four visible sign candidates: S1 west incoming, S2 foreground-to-west,
S3 east incoming, S4 foreground-to-east. Its bumper limits are provisional,
`activation:false`, `type:null`, with null executable stop/exit progress. These
assignments and coordinates cannot be transferred to autumn/winter plates.

Owner geometry review must establish, per plate/hash: actual stop-line endpoints
and uncertainty; sign face/driver approach; all stop-controlled and priority arms;
approved straight/turn/exit paths; crossing/conflict extent; corridor-local length
and per-model projected body length; bumper-stop and full-rear-clear progress;
and the approved pedestrian occupancy source. Without these, there is no safe
intersection type or right-of-way map to activate.

## Reusable behavior adapter design (inactive)

Use the existing optional runtime contract, never a new movement engine:

```js
advanceRouteFleetVehicles({
  // existing route, fleet, sampler and lifecycle arguments
  intersectionControls: { registry, state, pedestrianOccupancy },
});
```

After geometry approval, a Metaverse-owned adapter should construct an immutable
registry with `createTrafficControlRegistry`, use `holdSeconds: 2` on each approved
stop intersection, and own `createTrafficControlState` alongside the fleet state.
The existing controller supplies bounded acceleration/braking, bumper stops,
simulation-time holds, same-route body gaps/headway, pedestrian yielding,
arrival/right-hand/opposing-turn arbitration, exclusive conflict reservation and
rear-clear release. `vehicleLengths` must match actual slot models; fleet model
rotation requires that length mapping to update safely at recycle.

The hook currently does not forward this contract. Add that optional seam only
with the first verified caller registry and integration tests. State must survive
pause/resume and compatible refresh; pass zero delta while paused, with no wall
clock or artwork-time effect on holds. Changed topology requires fresh control
and fleet state at a verified safe spawn, never mid-intersection. Existing runtime
substeps handle long deltas. An absolute simulation-time edit must not rewind
traffic progress or grant a reservation. Test that policy through the hook before
activation. No shared World Time Authority change is needed.

## Evidence and acceptance coverage

Before: the owner reported two blue sedans and no stops. The earlier allocator
initialized every slot at index zero, and both eligible lists began `sedan-blue`;
only recycling changed the index. This is a selection/configuration problem,
not absence of approved SUV/pickup assets. No fabricated baseline screenshot is
presented as a historical capture.

After: [autumn DAY sedan/SUV](../../private-assets/metaverse/avalon-village/checkpoint-g/autumn-day-first-mix.png).
The browser runner saves six-scene fleet observations and screenshots plus
separate **SYNTHETIC** approach/stopped/departing/cleared captures in
`private-assets/metaverse/avalon-village/checkpoint-g/`. Its API responses are
test fixtures; they do not verify live authorization, tenant data or backend health.
The synthetic roads test the real controller, but do not verify Avalon sign compliance.

| Acceptance requirement | Fresh evidence / limit |
| --- | --- |
| Full stop and two-second duration | Executed existing controller at synthetic bumper line; actual Avalon BLOCKED |
| Yield/right-of-way | Existing controller runtime tests: first arrival, right-hand ties, opposing turns, priority road and pedestrians; actual Avalon BLOCKED |
| Following and collisions | Synthetic mixed-length queues and seasonal all-eligible-pair full-body journey checks |
| Smooth movement/no teleports | Bounded acceleration/deceleration tests; browser progress/model/recycle sampling; seasonal endpoint visibility tests |
| Multiple vehicle types | Allocator tests across three autumn periods; browser records all three eligible types |
| Size/perspective | Real assets and existing full-body heading/clearance verifier; no scale/anchor edits |
| DAY/DUSK/NIGHT | Six plate-specific browser runs; incompatible period gate removes old layer |
| Summer restoration | Browser retains paused summer IDs/progress across seasonal switch and resumes movement; controller legacy parity tests |
| Winter west disabled | Eligibility failure for every west model and one east slot in every winter browser scene |

Test commands and final browser disposition are recorded below after execution.

Fresh checks completed:

```sh
node --test tests/avalonSeasonalFleetModels.test.mjs tests/avalonTrafficBehaviorReadiness.test.mjs tests/metaverseTrafficIntersectionControls.test.mjs tests/avalonSeasonalTraffic.test.mjs tests/avalonSeasonalSelection.test.mjs tests/avalonSeasonalPrivatePreview.test.mjs tests/metaverseTrafficContinuity.test.mjs
node --test tests/avalonPhase3hProduction.test.mjs tests/avalonPhase3hPrivateAssets.test.mjs tests/avalonPhase3hTraffic.test.mjs
node node_modules/typescript/lib/tsc.js -p tests/avalon-seasonal-traffic.tsconfig.json
node node_modules/typescript/lib/tsc.js -p tests/metaverse-traffic-controls.tsconfig.json
git diff --check
```

Results: **29 + 16 = 45 passed, zero failures/skips**, exit 0; both scoped
TypeScript checks and whitespace check exit 0. The seasonal config does not
globally type-check imported legacy JS; this is not a repository-wide type pass.
The 16-test suite includes fresh production and development-mode adapter builds,
with no private artwork/lazy-preview output. Asset/private transport tests use
actual files, mutate isolated temporary copies, and exercise rejection behavior.
[preservation.json](../../private-assets/metaverse/avalon-village/checkpoint-g/preservation.json)
records six seasonal hashes and three summer V2 hashes, unchanged D vehicle
metadata, unchanged F calibration/verifier/gate/page/sampler sources, and inactive
registry/activation flags. The two changed F source hashes are the seasonal layer
and its explicit owner warning.

Browser runner: `node tests/browser/avalon-traffic-checkpoint-g.mjs`. Initial
sandbox port denial required an approved loopback rerun. That run captured all
three models in autumn DAY/DUSK but failed a test expectation: it compared summer
DAY state to a deliberately different DUSK summer mapping. The failure is retained
in [browser-attempt-1.json](../../private-assets/metaverse/avalon-village/checkpoint-g/browser-attempt-1.json).
The test now explicitly selects DAY again before asserting the captured DAY state.
No production runtime or continuity assertion was weakened; incompatible summer
geometry correctly invalidates the previous route signature. The corrected full
run's final result is recorded separately below.

`npm run build -- --outDir /private/tmp/shs-avalon-checkpoint-g-build` passed,
exit 0 (2,729 transformed modules, 86 seconds). Existing mixed static/dynamic
lesson-import and large-chunk warnings remain; Vite also reports that an external
output directory is not emptied. No existing output was deleted.
`node scripts/metaverse/checkSeasonalTrafficOutput.mjs /private/tmp/shs-avalon-checkpoint-g-build`
passed, exit 0: 854 output files checked against 757 private source files, with
no private filenames, copied private bytes, or seasonal query/route/projection
code in the fresh production artifact. This is a local build, not deployment.

## CODEX HANDOFF REPORT

Agent: Agent 02 / Metaverse scope, consuming the existing Traffic Engine.

Task: Checkpoint G — vehicle diversity and lawful-traffic readiness.

STATUS: PARTIAL. Fleet diversity READY FOR REVIEW; seasonal controls BLOCKED.

OBJECTIVE: Varied approved vehicles and realistic traffic behavior in the private
seasonal preview, preserving canonical systems and production safeguards.

WHAT WAS CHANGED: Retained and verified the pre-existing G seasonal allocator,
layer integration, explicit blocked-behavior warning, tests and fixture hold
configuration. Completed the audit/report, fresh evidence, corrected a browser
test's cross-period restoration expectation, and added concise test reporting
and optional per-scene diagnostic runs. The capture now waits until a pickup's
entire image fits the viewport rather than capturing its first edge sliver.

FILES CREATED (G package, already untracked at session start unless noted):

- `src/system/metaverse/avalonSeasonalFleetModels.js`
- `tests/avalonSeasonalFleetModels.test.mjs`
- `tests/avalonTrafficBehaviorReadiness.test.mjs`
- `tests/browser/avalon-traffic-checkpoint-g.mjs`
- `docs/metaverse/SHS_AVALON_TRAFFIC_BEHAVIOR_CHECKPOINT_G.md`
- Fresh private captures/JSON under `private-assets/metaverse/avalon-village/checkpoint-g/`, enumerated in the final artifact manifest.

FILES MODIFIED (G changes relative to F; all present before this session):

- `src/components/metaverse/AvalonSeasonalTrafficLayer.jsx` — allocator integration and blocked-control metadata.
- `src/components/metaverse/AvalonSeasonalWorldPreview.jsx` — explicit warning that vehicles currently do not stop.
- `tests/avalon-seasonal-traffic.tsconfig.json` — include allocator in scoped checks.
- `tests/fixtures/trafficControlsReview.jsx` — configurable fixture hold, default unchanged.

This session edited only the G report and browser runner and wrote private review
evidence. The source integration above was already present, inspected and verified.
The broader working tree contains unrelated modified/untracked files; this list
does not authorize their inclusion in a future change set.

DATABASE CHANGES: None.

API CHANGES: None. Synthetic browser API responses exist only in the test harness.

ROUTE CHANGES: None. No geographic registry, road points, stop coordinates or
disabled winter paths were modified.

SHARED COMPONENT CHANGES: None by G to Traffic Engine, controller, fleet hook,
marker, camera, scale system, summer fleet or World Time Authority.

TESTS RUN / TEST RESULTS: Exact commands/results and limitations above; final
browser result and artifact manifest below.

KNOWN ISSUES: Seasonal vehicles still traverse without verified stop/yield rules.
No approved seasonal stop/control topology; no minivan model; truck/east pickup
ineligible; all winter rear routes remain disabled. Existing narrow geometry
margins are unchanged. Live backend authorization, tenant boundaries, responsive
and reduced-motion behavior are not newly certified by this browser fixture.

CROSS-DOMAIN DEPENDENCIES: Existing authorized city entry, private asset transport,
canonical Traffic Engine sampler/lifecycle/controller and playback. Shared Core
identity, evidence/truth and World Time Authority remain untouched.

ARCHITECTURAL DECISIONS: Reuse existing controls after verified geometry; do not
invent bumper limits from artwork or activate a competing engine. Keep the
adapter design inactive until its inputs can be validated.

FOLLOW-UP WORK: Owner visual review of fleet; owner-confirmed control geometry;
then separately authorized hook/registry integration and real Avalon
approach/stop/yield/departure evidence before any behavior activation.

SAFE TO MERGE: NO for traffic-law completion or production activation. The
private diversity/test/docs package awaits owner and Integration review. No
commit, merge, asset generation/import, shared clock activation or deployment.

## Private review

[Open AUTUMN DAY private preview](http://127.0.0.1:5193/metaverse/city?district=community-district&destination=avalon-village&metaverseDev=1&avalonDayV2=1&avalonTraffic3l=1&avalonTraffic3m=1&avalonTraffic3p=1&worldTimePreview=1&worldInstant=2026-11-08T17:00:00Z&worldSeason=AUTUMN&worldPeriod=DAY&avalonSeasonalTraffic=autumn-day).
Loopback development only; the review server uses the existing application and
authorization path. For another season/period, change `worldSeason`, `worldPeriod`
and the matching lowercase `avalonSeasonalTraffic` gate together. Removing the
private gates withholds the seasonal traffic layer.

**STOP for owner visual approval.** Review sedan/SUV/pickup diversity, apparent
size and pavement placement. Stop/yield activation separately needs the verified
geometry listed above and subsequent behavioral review. No production activation
is authorized by this checkpoint.
