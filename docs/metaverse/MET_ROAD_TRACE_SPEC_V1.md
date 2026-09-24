# Silicon Heartland Metaverse
## Canonical Road Trace Specification V1

Repository: `/Users/mikeslate/Projects/shrv1`  
Branch: `studio-v1-plus-development`

## Status
Design specification only. Do not implement vehicle animation until actual normalized road coordinates have been traced and visually validated against DAY, DUSK, and NIGHT production backgrounds.

## Source Background Roles
- DAY = master trace source
- DUSK / SUNSET = validation variant
- NIGHT = validation variant

Use one shared canonical road geometry across all three unless visual verification proves a variant requires an exception.

## Global Rules
- Use normalized scene coordinates (`x`, `y` from `0.0` to `1.0`).
- Follow visible road centerlines.
- No random off-road movement.
- No traffic on decorative walkways, ambiguous service lanes, or tiny unreadable background roads.
- Do not create client-side authority.
- Do not claim trace acceptance until DAY, DUSK, and NIGHT validation is complete.

## Perspective Bands

### DEPTH_FAR
Approximate vertical range: `0.00 - 0.42`
- Smallest vehicle scale
- Lowest density
- Lowest visual detail
- Suggested scale: `1.0x - 1.15x`

### DEPTH_MID
Approximate vertical range: `0.42 - 0.72`
- Standard small vehicle scale
- Sparse traffic
- Suggested scale: `1.2x - 1.5x`

### DEPTH_NEAR
Approximate vertical range: `0.72 - 1.00`
- Slightly larger vehicles only
- Never oversized
- Suggested scale: `1.5x - 1.9x max`

## Canonical Road Inventory

### FREEWAY_01 - Foreground South Belt
Type: `FREEWAY`
- Large multi-lane foreground corridor.
- Fastest scene corridor, still restrained.
- Low-opacity freeway streaks allowed.
- Sparse tiny vehicles allowed.
- Mostly DEPTH_NEAR.

### FREEWAY_02 - Southwest Cable-Stayed Bridge Approach
Type: `FREEWAY`, `BRIDGE`
- Diagonal southwest bridge corridor toward the central interchange.
- Subtle streaks allowed.
- Keep bridge landmark visually dominant.
- DEPTH_NEAR to DEPTH_MID.

### FREEWAY_03 - Southeast River Crossing
Type: `FREEWAY`, `BRIDGE`
- Long lower-right bridge/causeway corridor.
- Subtle streaks allowed.
- Lower intensity than FREEWAY_02.
- Mostly DEPTH_NEAR.

### MAJOR_ROAD_01 - Left Data Center Crescent
Type: `MAJOR_ROAD`, `DISTRICT_CONNECTOR`
- Curving road network around the data-center district.
- Tiny dark vehicles only.
- No streaks.
- DEPTH_MID to DEPTH_NEAR.

### MAJOR_ROAD_02 - Central Lower Interchange Arc
Type: `DISTRICT_CONNECTOR`
- Lower-center connector around the utility/energy/interchange district.
- Sparse traffic.
- Rare bus overlap permitted.
- Mostly DEPTH_NEAR.

### MAJOR_ROAD_03 - Right Office District Loop
Type: `MAJOR_ROAD`
- Large curved route around right-center office/waterfront district.
- Sparse urban traffic.
- Bus overlap permitted.
- DEPTH_MID.

### MAJOR_ROAD_04 - Civic Front Cross Axis
Type: `MAJOR_ROAD`
- Calm corridor across the civic core.
- Very sparse traffic.
- No streaks.
- DEPTH_MID.

### BRIDGE_01 - Central Small Arch Bridge
Type: `BRIDGE`, `DISTRICT_CONNECTOR`
- Slow, minimal traffic.
- No streaks.
- DEPTH_MID.

### BRIDGE_02 - Center-Right Diagonal Bridge
Type: `BRIDGE`, `MAJOR_ROAD`
- Strong inter-district connector.
- Sparse slow-to-medium traffic.
- Bus overlap permitted.
- DEPTH_MID to DEPTH_NEAR.

### BRIDGE_03 - Rightmost Low Bridge
Type: `BRIDGE`, `DISTRICT_CONNECTOR`
- Secondary east-side connector.
- Very sparse traffic.
- Bus overlap permitted.
- DEPTH_MID.

## Bus Routes

### BUS_ROUTE_01 - Civic Loop
Uses portions of:
- MAJOR_ROAD_04
- MAJOR_ROAD_03

Behavior:
- Rare
- Slow
- Steady

### BUS_ROUTE_02 - Data Center to Civic Connector
Uses portions of:
- MAJOR_ROAD_01
- MAJOR_ROAD_02
- MAJOR_ROAD_04

Behavior:
- Rare
- Slow
- Functional

### BUS_ROUTE_03 - East District Waterfront Loop
Uses portions of:
- MAJOR_ROAD_03
- BRIDGE_03

Behavior:
- Rare
- Slow
- Smooth

## Vehicle Visual Language

### Cars
- Tiny dark charcoal rounded rectangles
- No detailed car art
- No headlights
- No taillights
- No glow
- Slow, calm movement

### Buses
- Elongated pill shape
- Dark body
- Light/white top
- Slightly larger than cars
- Rarer and slower than cars
- Bus/transit routes only

## Freeway Streaks
Allowed only on:
- FREEWAY_01
- FREEWAY_02
- FREEWAY_03

Rules:
- Thin
- Low opacity
- Road aligned
- Restrained brightness
- No neon
- No cyberpunk look
- Must not dominate city composition

## No-Traffic Zones
Do not animate traffic on:
- building drop-off loops
- landscaped civic paths
- pedestrian promenades
- park walkways
- ambiguous service lanes
- tiny far-background streets
- decorative internal loops

## Time-of-Day Presentation

### DAY
- Highest traffic readability
- Full baseline density
- Streak brightness remains low

### DUSK / SUNSET
- Slightly reduced local density
- Preserve sunset atmosphere
- Traffic must not become brighter than the environment

### NIGHT
- Lowest local density
- Dim freeway streaks
- Fewer local vehicles
- Preserve calm institutional character

## Accessibility / Performance

### Reduced Motion
- Reduce or stop moving cars
- Reduce or stop buses
- Disable freeway streak motion

### LOW / Mobile
- Reduce traffic density by roughly half
- Reduce bus frequency
- Reduce freeway streak density
- Keep city visible and dominant

## Trace Acceptance Gate
Do not call the road map complete until:
1. Exact normalized point arrays are traced from the DAY production image.
2. Paths are visually checked against DUSK.
3. Paths are visually checked against NIGHT.
4. No traffic path drifts off visible roads.
5. No route crosses buildings, water, lawns, or pedestrian areas incorrectly.
6. Perspective scaling remains believable.
