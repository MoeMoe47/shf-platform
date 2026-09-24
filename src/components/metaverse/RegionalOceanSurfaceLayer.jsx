import React, { useEffect, useRef } from "react";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import { OIL_RIG_OCEAN_MASK } from "@/system/metaverse/oilRigOceanMask.js";
import { createOilRigOceanSceneConfig } from "@/system/metaverse/oceanMotionEngine.js";
import { markMetaverseFrame, recordMetaverseFrameMetric } from "@/system/metaverse/metaverseFrameProfiler.js";
import "@/pages/metaverse/metaverse-city.css";

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D uSource;
  uniform sampler2D uMask;
  uniform float uTime;
  uniform float uHorizon;
  uniform float uHorizonSuppression;
  uniform float uStrength;
  uniform float uDepthInfluence;
  uniform float uFlowSpeed;
  uniform vec2 uFlow;
  uniform vec4 uSwell;
  uniform vec4 uMedium;
  uniform vec4 uRipple;
  uniform vec2 uSwellDir;
  uniform vec2 uMediumDir;
  uniform vec2 uRippleDir;
  uniform float uQuality;
  uniform float uTurbulence;
  uniform float uFoam;
  uniform float uRain;
  uniform float uWetness;
  uniform float uShowMask;
  uniform float uShowDepth;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float weight = 0.5;
    for (int i = 0; i < 2; i += 1) {
      value += noise(p) * weight;
      p = p * 2.03 + vec2(17.3, 9.1);
      weight *= 0.5;
    }
    return value;
  }

  float directionalField(vec2 uv, vec2 direction, float scale, float speed, float seed, float depth) {
    vec2 side = vec2(-direction.y, direction.x);
    vec2 flow = direction * uFlowSpeed * speed * uTime * 0.015;
    vec2 anisotropicUv = vec2(dot(uv, direction), dot(uv, side));
    vec2 domain = anisotropicUv * vec2(scale * mix(1.7, 3.4, depth), scale * mix(0.9, 1.65, depth)) + flow;
    if (uQuality < 0.5) return noise(domain + seed * 0.17);
    if (uQuality < 0.85) return fbm(domain + seed * 0.07);
    vec2 warp = vec2(noise(domain + seed), noise(domain.yx - seed)) - 0.5;
    return fbm(domain + warp * mix(0.2, 0.75, depth) * smoothstep(0.5, 1.0, uQuality));
  }

  void main() {
    vec2 sceneUv = vec2(vUv.x, vUv.y * (1.0 - uHorizon));
    vec4 maskSample = texture2D(uMask, sceneUv);
    float mask = maskSample.a;
    float sceneY = 1.0 - sceneUv.y;
    float depth = smoothstep(uHorizon, 1.0, sceneY);
    if (uShowMask > 0.5) {
      gl_FragColor = vec4(0.1, 0.8, 0.95, mask * 0.72);
      return;
    }
    if (uShowDepth > 0.5) {
      vec3 band = depth < 0.22 ? vec3(0.18, 0.4, 0.95) : depth < 0.58 ? vec3(0.1, 0.85, 0.65) : vec3(1.0, 0.65, 0.15);
      gl_FragColor = vec4(band, mask * 0.28);
      return;
    }
    if (mask <= 0.004) {
      gl_FragColor = vec4(0.0);
      return;
    }
    float horizonFeather = smoothstep(uHorizon + 0.004, uHorizon + 0.055, sceneY);
    float horizonGuard = mix(1.0 - uHorizonSuppression, 1.0, horizonFeather);
    float perspective = mix(0.035, 1.0, pow(depth, mix(1.45, 0.54, uDepthInfluence)));
    float foreground = smoothstep(0.48, 0.98, depth);
    vec2 flowOffset = uFlow * uFlowSpeed * uTime * 0.0025;
    float swell = directionalField(sceneUv + flowOffset * 0.55, uSwellDir, uSwell.y, uSwell.z, 2.7, depth) - 0.5;
    float medium = directionalField(sceneUv * 1.17 + flowOffset * 1.65, uMediumDir, uMedium.y, uMedium.z, 8.4, depth) - 0.5;
    float ripple = directionalField(sceneUv * 1.95 - flowOffset * 2.4, uRippleDir, uRipple.y, uRipple.z, 15.9, depth) - 0.5;
    float rippleQuality = smoothstep(0.28, 0.95, uQuality);
    vec2 verticalLimiter = vec2(1.0, mix(0.08, 1.0, horizonFeather));
    vec2 displacement = (
      uSwellDir * swell * uSwell.x * 0.0062 +
      uMediumDir * medium * uMedium.x * 0.0046 +
      uRippleDir * ripple * uRipple.x * (0.0016 + uRain * 0.0008) * rippleQuality * foreground
    ) * verticalLimiter;
    displacement *= uStrength * (1.0 + uTurbulence * 0.08) * perspective * horizonGuard;
    vec2 sampleUv = clamp(sceneUv + displacement, vec2(0.002), vec2(0.998));
    sampleUv.y = min(sampleUv.y, 1.0 - uHorizon - 0.006);
    vec4 source = texture2D(uSource, sampleUv);
    float waterMix = mask;
    float foamHint = 0.0;
    if (uFoam > 0.01 && uQuality > 0.52) {
      foamHint = smoothstep(0.66, 0.94, noise(sceneUv * 8.0 + flowOffset * 2.0));
    }
    vec3 wetTint = mix(source.rgb, source.rgb * vec3(0.86, 0.91, 0.96), uWetness * 0.12);
    vec3 foamTint = mix(wetTint, vec3(0.72, 0.9, 0.94), foamHint * uFoam * 0.045 * perspective);
    gl_FragColor = vec4(foamTint, waterMix);
  }
`;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ocean texture: ${url}`));
    image.src = url;
  });
}

function createOceanMaskCanvas(foregroundImage) {
  const { width, height } = OIL_RIG_OCEAN_MASK.dimensions;
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const context = mask.getContext("2d");
  if (!context) return mask;
  const horizon = (OIL_RIG_OCEAN_MASK.horizonY / 100) * height;
  const gradient = context.createLinearGradient(0, horizon, 0, horizon + (OIL_RIG_OCEAN_MASK.horizonFeather / 100) * height);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(255,255,255,1)");
  context.fillStyle = gradient;
  context.fillRect(0, horizon, width, Math.max(1, height - horizon));
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "rgba(255,255,255,1)";
  context.fillRect(0, horizon + (OIL_RIG_OCEAN_MASK.horizonFeather / 100) * height, width, height);
  context.globalCompositeOperation = "destination-out";
  context.drawImage(foregroundImage, 0, 0, width, height);
  context.globalCompositeOperation = "source-over";
  return mask;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compile error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Unable to link ocean shader");
  return program;
}

function qualityValue(quality) {
  return quality === "Low" ? 0.2 : quality === "Medium" ? 0.55 : quality === "Ultra" ? 1 : 0.78;
}

function qualityRenderScale(quality) {
  return quality === "Low" ? 0.14 : quality === "Medium" ? 0.2 : quality === "Ultra" ? 0.62 : 0.3;
}

function qualityPixelBudget(quality) {
  return quality === "Low" ? 90000 : quality === "Medium" ? 150000 : quality === "Ultra" ? 1100000 : 290000;
}

function boundedRenderSize(rect, quality) {
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const scale = qualityRenderScale(quality);
  let width = Math.max(1, Math.round(rect.width * dpr * scale));
  let height = Math.max(1, Math.round(rect.height * dpr * scale));
  const pixels = width * height;
  const budget = qualityPixelBudget(quality);
  if (pixels > budget) {
    const budgetScale = Math.sqrt(budget / pixels);
    width = Math.max(1, Math.round(width * budgetScale));
    height = Math.max(1, Math.round(height * budgetScale));
  }
  return { width, height };
}

function setDirectionUniform(gl, location, angle) {
  const radians = ((Number.isFinite(angle) ? angle : 250) * Math.PI) / 180;
  gl.uniform2f(location, Math.cos(radians), Math.sin(radians));
}

function drawFallback(context, source, width, height) {
  context.clearRect(0, 0, width, height);
  context.globalAlpha = 0.94;
  context.drawImage(source, 0, 0, width, height);
  context.globalAlpha = 1;
}

export default function RegionalOceanSurfaceLayer({
  sceneId = "oil-rig",
  timeOfDay = "DAY",
  config = createOilRigOceanSceneConfig(),
  reducedMotion = false,
  debug = null,
  quality = "High",
  playing = true,
  restartKey = 0,
  timeScale = 1,
  freeze = false,
  preview = "NATURAL",
  environment = null,
}) {
  const canvasRef = useRef(null);
  const configRef = useRef(config);
  const debugRef = useRef(debug || {});
  const reducedMotionRef = useRef(reducedMotion);
  const freezeRef = useRef(freeze);
  const previewRef = useRef(preview);
  const environmentRef = useRef(environment);
  const qualityRef = useRef(quality);
  const playingRef = useRef(playing);
  const restartKeyRef = useRef(restartKey);
  const timeScaleRef = useRef(timeScale);
  configRef.current = config;
  debugRef.current = debug || {};
  reducedMotionRef.current = reducedMotion;
  freezeRef.current = freeze;
  previewRef.current = preview;
  environmentRef.current = environment;
  qualityRef.current = quality;
  playingRef.current = playing;
  restartKeyRef.current = restartKey;
  timeScaleRef.current = timeScale;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sceneId !== "oil-rig" || timeOfDay !== "DAY") return undefined;
    let active = true;
    let frameHandle = 0;
    let context2d = null;
    let gl = null;
    let sourceImage = null;
    let simulationTime = 0;
    let lastFrameTime = null;
    let rafCount = 0;
    let renderCount = 0;
    let frameSkipCount = 0;
    let lastDeltaTime = 0;
    let lastShaderTime = 0;
    let lastRuntimePublish = 0;
    let lastRestartKey = restartKeyRef.current;
    let lastRectWidth = 0;
    let lastRectHeight = 0;
    let lastCanvasWidth = 0;
    let lastCanvasHeight = 0;
    const layerUniforms = [["swell", "uSwell", "uSwellDir"], ["medium", "uMedium", "uMediumDir"], ["ripple", "uRipple", "uRippleDir"]];

    const render = (now) => {
      const frameStart = performance.now();
      rafCount += 1;
      markMetaverseFrame(now);
      if (!active) return;
      const deltaTime = lastFrameTime === null ? 0 : Math.min(0.08, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;
      lastDeltaTime = deltaTime;
      if (document.hidden) {
        frameSkipCount += 1;
        publishRuntime();
        frameHandle = requestAnimationFrame(render);
        return;
      }
      const currentConfig = configRef.current;
      const currentDebug = debugRef.current;
      const currentQuality = qualityRef.current;
      if (restartKeyRef.current !== lastRestartKey) {
        simulationTime = 0;
        lastRestartKey = restartKeyRef.current;
      }
      if (freezeRef.current && canvas.dataset.frozenRendered === "true") {
        frameSkipCount += 1;
        publishRuntime();
        frameHandle = requestAnimationFrame(render);
        return;
      }
      if (playingRef.current && !freezeRef.current) simulationTime += deltaTime * Math.max(0.01, Number(timeScaleRef.current) || 1);
      lastShaderTime = simulationTime * (reducedMotionRef.current ? 0.16 : 1);
      if (gl && sourceImage) {
        const rect = canvas.getBoundingClientRect();
        let width = lastCanvasWidth;
        let height = lastCanvasHeight;
        if (rect.width !== lastRectWidth || rect.height !== lastRectHeight || canvas.dataset.renderQuality !== currentQuality || !width || !height) {
          const nextSize = boundedRenderSize(rect, currentQuality);
          width = nextSize.width;
          height = nextSize.height;
          lastRectWidth = rect.width;
          lastRectHeight = rect.height;
          lastCanvasWidth = width;
          lastCanvasHeight = height;
          canvas.dataset.renderQuality = currentQuality;
        }
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        gl.useProgram(gl.__oceanProgram);
        gl.uniform1f(gl.__oceanUniforms.time, lastShaderTime);
        const previewMultiplier = previewRef.current === "EXAGGERATED" ? 1.55 : previewRef.current === "VISIBLE" ? 1.15 : 1;
        gl.uniform1f(gl.__oceanUniforms.strength, (currentConfig.global?.displacementStrength ?? 0.82) * previewMultiplier * (reducedMotionRef.current ? 0.12 : 1));
        gl.uniform1f(gl.__oceanUniforms.depthInfluence, currentConfig.global?.depthPerspective ?? 0.72);
        let turbulence = currentConfig.effects?.globalTurbulence ?? 0.72;
        if (currentConfig.effects?.turbulenceEnabled !== false) {
          const zones = currentConfig.turbulenceZones || [];
          for (let index = 0; index < zones.length; index += 1) {
            const zone = zones[index];
            if (zone.enabled !== false) turbulence += (zone.intensity || 0) * 0.12;
          }
        }
        let foam = 0;
        if (currentConfig.effects?.foamEnabled !== false) {
          const zones = currentConfig.foamZones || [];
          for (let index = 0; index < zones.length; index += 1) {
            const zone = zones[index];
            if (zone.enabled !== false) foam += (zone.density || 0) * (zone.opacity || 0) * 0.35 + (zone.foamBoost || 0) * 0.08;
          }
        }
        gl.uniform1f(gl.__oceanUniforms.turbulence, turbulence);
        gl.uniform1f(gl.__oceanUniforms.foam, foam);
        gl.uniform1f(gl.__oceanUniforms.flowSpeed, currentConfig.global?.flowSpeed ?? 0.52);
        gl.uniform1f(gl.__oceanUniforms.horizon, (currentConfig.global?.horizonY ?? 21.1) / 100);
        gl.uniform1f(gl.__oceanUniforms.horizonSuppression, currentConfig.global?.horizonSuppression ?? 0.86);
        gl.uniform1f(gl.__oceanUniforms.quality, qualityValue(currentQuality));
        const environmentConfig = environmentRef.current?.config || {};
        const rain = environmentConfig.precipitationEnabled && environmentConfig.precipitationType === "RAIN" ? (environmentConfig.precipitationIntensity || 0) : 0;
        gl.uniform1f(gl.__oceanUniforms.rain, rain);
        gl.uniform1f(gl.__oceanUniforms.wetness, environmentConfig.surfaceWetness || 0);
        gl.uniform1f(gl.__oceanUniforms.showMask, currentDebug.showOceanMask ? 1 : 0);
        gl.uniform1f(gl.__oceanUniforms.showDepth, currentDebug.showDepthBands ? 1 : 0);
        setDirectionUniform(gl, gl.__oceanUniforms.flow, currentConfig.global?.flowDirection ?? 250);
        layerUniforms.forEach(([kind, valuesName, directionName]) => {
          const layer = currentConfig.waves?.[kind] || {};
          gl.uniform4f(gl.__oceanUniforms[valuesName], layer.enabled === false ? 0 : layer.amplitude || 0, layer.scale || 1, layer.speed || 0, layer.opacity || 0);
          setDirectionUniform(gl, gl.__oceanUniforms[directionName], layer.direction ?? 250);
        });
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        renderCount += 1;
        recordMetaverseFrameMetric("ocean", performance.now() - frameStart);
      } else if (context2d && sourceImage) {
        const rect = canvas.getBoundingClientRect();
        drawFallback(context2d, sourceImage, rect.width, rect.height);
        renderCount += 1;
        recordMetaverseFrameMetric("ocean", performance.now() - frameStart);
      }
      publishRuntime();
      canvas.dataset.frozenRendered = freezeRef.current ? "true" : "false";
      frameHandle = requestAnimationFrame(render);
    };

    function publishRuntime() {
      if (!import.meta.env.DEV || !canvas || performance.now() - lastRuntimePublish < 250) return;
      lastRuntimePublish = performance.now();
      const runtime = {
        rafCount,
        renderCount,
        simulationTime,
        deltaTime: lastDeltaTime,
        shaderTime: lastShaderTime,
        playing: playingRef.current,
        frozen: freezeRef.current,
        quality: qualityRef.current,
        frameSkipCount,
      };
      canvas.dataset.oceanRuntime = JSON.stringify(runtime);
      window.dispatchEvent(new CustomEvent("metaverse-ocean-runtime", { detail: runtime }));
    }

    const maskPromise = loadImage(publicAssetUrl(OIL_RIG_OCEAN_MASK.maskAsset)).catch(() => null);
    Promise.all([
      loadImage(publicAssetUrl(config.backgroundImageUrl || "public/assets/metaverse/regional/oil-rig/oil-rig-background-day.png")),
      loadImage(publicAssetUrl(OIL_RIG_OCEAN_MASK.sourceForegroundAsset)),
      maskPromise,
    ]).then(([source, foreground, maskAsset]) => {
      if (!active) return;
      sourceImage = source;
      const maskSource = maskAsset || createOceanMaskCanvas(foreground);
      try {
        gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
        if (!gl) throw new Error("WebGL unavailable");
        const program = createProgram(gl);
        gl.__oceanProgram = program;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, "aPosition");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        const sourceTexture = gl.createTexture();
        const maskTexture = gl.createTexture();
        for (const [texture, image, flipY] of [[sourceTexture, source, true], [maskTexture, maskSource, true]]) {
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }
        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.uniform1i(gl.getUniformLocation(program, "uSource"), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, maskTexture);
        gl.uniform1i(gl.getUniformLocation(program, "uMask"), 1);
        gl.__oceanUniforms = {
          time: gl.getUniformLocation(program, "uTime"), horizon: gl.getUniformLocation(program, "uHorizon"), horizonSuppression: gl.getUniformLocation(program, "uHorizonSuppression"), strength: gl.getUniformLocation(program, "uStrength"), depthInfluence: gl.getUniformLocation(program, "uDepthInfluence"), flowSpeed: gl.getUniformLocation(program, "uFlowSpeed"), flow: gl.getUniformLocation(program, "uFlow"), quality: gl.getUniformLocation(program, "uQuality"), turbulence: gl.getUniformLocation(program, "uTurbulence"), foam: gl.getUniformLocation(program, "uFoam"), rain: gl.getUniformLocation(program, "uRain"), wetness: gl.getUniformLocation(program, "uWetness"), showMask: gl.getUniformLocation(program, "uShowMask"), showDepth: gl.getUniformLocation(program, "uShowDepth"),
          swell: gl.getUniformLocation(program, "uSwell"), medium: gl.getUniformLocation(program, "uMedium"), ripple: gl.getUniformLocation(program, "uRipple"), swellDir: gl.getUniformLocation(program, "uSwellDir"), mediumDir: gl.getUniformLocation(program, "uMediumDir"), rippleDir: gl.getUniformLocation(program, "uRippleDir"),
        };
        setDirectionUniform(gl, gl.getUniformLocation(program, "uFlow"), config.global?.flowDirection ?? 250);
        const layers = [["uSwell", "uSwellDir", "swell"], ["uMedium", "uMediumDir", "medium"], ["uRipple", "uRippleDir", "ripple"]];
        layers.forEach(([valuesName, directionName, kind]) => {
          const layer = config.waves?.[kind] || {};
          gl.uniform4f(gl.getUniformLocation(program, valuesName), layer.amplitude || 0, layer.scale || 1, layer.speed || 0, layer.opacity || 0);
          setDirectionUniform(gl, gl.getUniformLocation(program, directionName), layer.direction ?? 250);
        });
        canvas.dataset.renderer = "webgl";
      } catch {
        gl = null;
        context2d = canvas.getContext("2d");
        canvas.dataset.renderer = "canvas-fallback";
      }
      frameHandle = requestAnimationFrame(render);
    }).catch(() => {
      canvas.dataset.renderer = "unavailable";
    });

    return () => {
      active = false;
      cancelAnimationFrame(frameHandle);
      if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [sceneId, timeOfDay, config.backgroundImageUrl]);

  if (sceneId !== "oil-rig" || timeOfDay !== "DAY" || config.surface?.enabled === false) return null;
  return (
    <canvas
      ref={canvasRef}
      className="met-regional-ocean-surface"
      data-ocean-mask={OIL_RIG_OCEAN_MASK.id}
              data-quality={quality}
      data-playing={playing ? "true" : "false"}
      data-frozen={freeze ? "true" : "false"}
      style={{ top: `${OIL_RIG_OCEAN_MASK.horizonY}%`, bottom: "auto", height: `${100 - OIL_RIG_OCEAN_MASK.horizonY}%` }}
      aria-hidden="true"
    />
  );
}
