# Oil Rig DAY Cargo Ship Layer

The Oil Rig DAY scene uses the owner-supplied PNGs in `public/assets/metaverse/vessels/cargo-ships/`. `src/system/metaverse/cargoShipRegistry.js` normalizes the original `1.png` through `4.png` names into a reusable asset registry and defines the `OIL_RIG_DAY_CARGO_SHIP_PRESET`.

`RegionalCargoShipLayer` renders a small, data-driven population on normalized shipping routes. Each ship has a depth group, route, scale, opacity, and asset waterline anchor. Routes are evaluated in scene coordinates and movement is driven by the shared wind direction/speed values used by the cloud and seagull layers. The layer is inserted after clouds and before the behind-rig birds, so the existing rig foreground cutout remains authoritative and unchanged.

In `/metaverse/oil-rig?metaverseDev=1`, the Cargo Ships panel exposes enablement, count, speed, scale, wind influence, animation, bobbing, far/mid visibility, route lines, waterline bounds, labels, play/pause/restart, and reset controls. Future shipping-corridor and harbor scenes can reuse the registry, route model, and component with their own presets.
