# Metaverse Weather & Environment System

## Authority

`useMetaverseEnvironmentRuntime` owns the live environmental state for a scene. It normalizes weather presets, precipitation, wind, atmospheric visibility, fog, wetness, storm, lightning, transition, playback, quality, and debug state. Regional cloud wind is derived from this controller so weather wind does not create a second cloud-wind authority.

## Presets and Capabilities

Canonical modes include clear, cloud states, rain, thunderstorm, snow, fog, mist, windy, and custom. Scene capability metadata filters those modes. Oil Rig currently supports rain, fog/marine mist, and lightning; city supports rain, snow, fog, and lightning. Snow accumulation and wet-surface masks remain hidden until scene masks exist.

## Rendering

`MetaverseWeatherEnvironmentLayer` uses one canvas with deterministic multi-depth particles rather than React DOM particles. Rain and snow respond to wind, depth, fall speed, opacity, density, reduced motion, and shared playback. Fog/mist is depth-weighted toward the horizon. Lightning fields are reserved in the runtime schema and exposed only as a controlled dev setting.

The regional ocean shader consumes shared rain intensity and wetness uniforms, increasing micro-disturbance and applying a restrained wet response without replacing the locked background or ocean renderer.

## Integrations and Hooks

- Clouds: regional cloud motion consumes environment wind direction, speed, and cloud speed.
- Ocean: regional WebGL layer consumes rain and wetness uniforms.
- Wildlife and vessels: environment state is available through the scene controller for future behavior hooks; no new AI or routing behavior is invented here.
- Roads, rail, water mobility, and snow accumulation: capability hooks are reserved and remain hidden where the repository has no approved runtime surface or mask.

## Contextual Dev Console

The Weather section is rendered by the shared `MetaverseWeatherDevSection`, filtered by scene capability metadata. It provides presets, precipitation, wind, atmosphere, lighting, surface/storm settings, debug toggles, playback, and `Reset Weather`. `/metaverse/dev/ocean` remains a deep ocean editor and does not become a duplicate weather authority.

## Adding Weather to a New Scene

Declare `weather` in the scene capability metadata, specify supported precipitation types and masks, instantiate one environment controller, pass it to the scene layers and `MetaverseDevConsole`, then add tests proving unsupported weather controls are absent.
