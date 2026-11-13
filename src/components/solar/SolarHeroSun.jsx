import React, { useEffect, useRef, useState } from "react";
import "./solar-hero-sun.css";

const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uAspect;

float hash(vec2 p) {
  return fract(
    sin(dot(p, vec2(127.1, 311.7))) * 43758.5453
  );
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      hash(i),
      hash(i + vec2(1.0, 0.0)),
      f.x
    ),
    mix(
      hash(i + vec2(0.0, 1.0)),
      hash(i + vec2(1.0, 1.0)),
      f.x
    ),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += noise(p) * amplitude;
    p = p * 2.03 + vec2(7.1, 3.8);
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= uAspect;

  float r = length(p);
  float angle = atan(p.y, p.x);
  float t = uTime;

  float largeFlow = fbm(
    p * 3.0 +
    vec2(
      0.14 * t,
      -0.105 * t
    )
  );

  vec2 warp = vec2(
    fbm(p * 4.2 + vec2(t * 0.12, 4.1)),
    fbm(p * 4.2 + vec2(8.7, -t * 0.11))
  );

  vec2 plasmaUv = p * 5.6 + (warp - 0.5) * 2.3;

  plasmaUv += vec2(
    sin(angle * 3.0 + t * 0.11),
    cos(angle * 2.0 - t * 0.09)
  ) * 0.13;

  float plasma = fbm(
    plasmaUv +
    vec2(t * 0.22, -t * 0.16)
  );

  float filaments = fbm(
    plasmaUv * 2.9 +
    vec2(-t * 0.29, t * 0.24)
  );

  float granulation = noise(
    plasmaUv * 8.4 +
    vec2(t * 0.37, -t * 0.33)
  );

  float energy =
    plasma * 0.58 +
    filaments * 0.32 +
    granulation * 0.10;

  energy += (largeFlow - 0.5) * 0.24;

  float sphereRadius = 0.74;

  float inside = 1.0 -
    smoothstep(sphereRadius - 0.012,
               sphereRadius + 0.009, r);

  float edge = smoothstep(
    sphereRadius - 0.19,
    sphereRadius,
    r
  );

  vec3 darkPlasma = vec3(0.37, 0.055, 0.01);
  vec3 orangePlasma = vec3(1.0, 0.26, 0.012);
  vec3 goldPlasma = vec3(1.0, 0.67, 0.065);
  vec3 whiteHot = vec3(1.0, 0.95, 0.60);

  vec3 surface = mix(
    darkPlasma,
    orangePlasma,
    smoothstep(0.22, 0.48, energy)
  );

  surface = mix(
    surface,
    goldPlasma,
    smoothstep(0.43, 0.73, energy)
  );

  surface = mix(
    surface,
    whiteHot,
    smoothstep(0.70, 0.87, energy) * 0.83
  );

  float channels = fbm(
    plasmaUv * 1.8 +
    vec2(t * 0.08, -t * 0.19)
  );

  surface *= 0.78 + channels * 0.5;

  surface += vec3(1.0, 0.37, 0.018)
    * edge * 0.33;

  float coronaNoise = fbm(
    vec2(angle * 5.0, r * 12.0 - t * 0.30)
  );

  float coronaReach =
    0.16 + coronaNoise * 0.12;

  float corona = 1.0 -
    smoothstep(
      sphereRadius - 0.02,
      sphereRadius + coronaReach,
      r
    );

  corona *= smoothstep(
    sphereRadius - 0.14,
    sphereRadius + 0.025,
    r
  );

  float halo = exp(
    -max(0.0, r - sphereRadius) * 10.0
  ) * 0.56;

  halo *= 1.0 -
    smoothstep(0.72, 1.3, r);

  float rim = exp(
    -abs(r - sphereRadius) * 75.0
  );

  vec3 color =
    surface * inside +
    vec3(1.0, 0.29, 0.01) * corona * 0.65 +
    vec3(1.0, 0.20, 0.015) * halo +
    vec3(1.0, 0.75, 0.26) * rim * 0.7;

  float alpha = clamp(
    inside + corona * 0.45 + halo + rim * 0.5,
    0.0,
    1.0
  );


  // SHU_LIVING_SUN_LAYERS_AB_V1
  // Layer A: additional fine-scale surface turbulence.

  float fineGranules = noise(
    plasmaUv * 16.0 +
    vec2(t * 0.17, -t * 0.12)
  );

  float fineFilaments = noise(
    plasmaUv * 9.0 +
    (warp - 0.5) * 3.2 +
    vec2(-t * 0.09, t * 0.08)
  );

  float normalZ = sqrt(
    max(0.0, 1.0 - pow(
      min(r / sphereRadius, 1.0), 2.0
    ))
  );

  float sphericalDepth = mix(
    0.83, 1.07, pow(normalZ, 0.6)
  );

  vec3 fineSurface =
    color * sphericalDepth *
    (0.94 + 0.12 * fineGranules);

  fineSurface += vec3(0.27, 0.075, 0.004) *
    (fineFilaments - 0.5) * 0.42;

  color = mix(color, fineSurface, inside);

  // Layer B: slowly migrating magnetic active regions.

  float magneticField = fbm(
    p * 7.3 +
    (warp - 0.5) * 1.1 +
    vec2(t * 0.026, -t * 0.021)
  );

  float activeRegions =
    smoothstep(0.56, 0.77, magneticField) *
    smoothstep(0.24, 0.82, filaments);

  float activePulse =
    0.87 + 0.13 *
    sin(t * 0.75 + angle * 3.0);

  color += inside *
    activeRegions *
    activePulse *
    vec3(0.27, 0.19, 0.055);

  // Layer B: extended, textured chromosphere/corona.

  float coronaTexture = noise(
    vec2(
      angle * 12.0 + t * 0.035,
      r * 18.0 - t * 0.09
    )
  );

  float coronaLayer =
    smoothstep(
      sphereRadius - 0.012,
      sphereRadius + 0.032,
      r
    ) *
    (1.0 - smoothstep(
      sphereRadius + 0.025,
      sphereRadius + 0.215,
      r
    ));

  float coronaStrands =
    coronaLayer *
    (0.40 + coronaTexture * 0.60);

  color += vec3(1.0, 0.38, 0.055) *
    coronaStrands * 0.34;

  alpha = clamp(
    alpha + coronaStrands * 0.12,
    0.0,
    1.0
  );


  // SHU_LIVING_SUN_PHASE_C_V1
  // Magnetic plasma arches around the outer solar limb.
  // All effects remain in the existing WebGL renderer.

  float archGlow = 0.0;

  // Three differently sized prominence arches.
  for (int i = 0; i < 3; i++) {
    float idx = float(i);

    float centerAngle =
      0.42 + idx * 2.14 +
      0.045 * sin(t * 0.12 + idx * 2.1);

    float angularWidth = 0.29 + idx * 0.055;

    float angleDifference = atan(
      sin(angle - centerAngle),
      cos(angle - centerAngle)
    );

    float q = angleDifference / angularWidth;

    float archEnvelope =
      1.0 - smoothstep(0.82, 1.0, abs(q));

    float archHeight =
      (0.075 + idx * 0.018) *
      (1.0 - q * q);

    float flowing = 0.008 *
      sin(q * 13.0 - t * 0.85 + idx * 3.0);

    float archRadius =
      sphereRadius + archHeight + flowing;

    float radialDistance = abs(r - archRadius);

    float strand = exp(
      -radialDistance * radialDistance * 2600.0
    );

    float surroundingGlow = exp(
      -radialDistance * radialDistance * 190.0
    );

    archGlow += archEnvelope *
      (strand * 0.68 + surroundingGlow * 0.16) *
      smoothstep(sphereRadius - 0.01,
                 sphereRadius + 0.018, r);
  }

  // Keep prominence arcs outside the main solar surface.
  archGlow *= 1.0 - inside;

  float prominencePulse =
    0.84 + 0.16 * sin(t * 0.43);

  color +=
    vec3(1.0, 0.37, 0.045) *
    archGlow * prominencePulse * 0.9;

  alpha = clamp(
    alpha + archGlow * 0.65,
    0.0,
    1.0
  );

  // Occasional restrained flare near the solar edge.
  float flareCycle =
    smoothstep(0.91, 0.995, sin(t * 0.52));

  float flareAngle = 2.43 +
    0.10 * sin(t * 0.08);

  float flareDifference = atan(
    sin(angle - flareAngle),
    cos(angle - flareAngle)
  );

  float flareAngularShape = exp(
    -flareDifference * flareDifference * 80.0
  );

  float flareRadialShape = exp(
    -pow((r - sphereRadius - 0.035) * 13.0, 2.0)
  );

  float flareStrength =
    flareCycle *
    flareAngularShape *
    flareRadialShape *
    (1.0 - inside);

  color +=
    vec3(1.0, 0.75, 0.22) *
    flareStrength * 0.55;

  alpha = clamp(
    alpha + flareStrength * 0.35,
    0.0,
    1.0
  );

  gl_FragColor = vec4(color, alpha);
}
`;

function makeShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || "Solar shader compilation failed");
  }

  return shader;
}

function createRenderer(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power"
  });

  if (!gl) return null;

  const vertex = makeShader(
    gl, gl.VERTEX_SHADER, vertexSource
  );

  const fragment = makeShader(
    gl, gl.FRAGMENT_SHADER, fragmentSource
  );

  const program = gl.createProgram();

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || "Solar program linking failed");
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]),
    gl.STATIC_DRAW
  );

  gl.useProgram(program);

  const position = gl.getAttribLocation(
    program, "aPosition"
  );

  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(
    position, 2, gl.FLOAT, false, 0, 0
  );

  const timeLocation = gl.getUniformLocation(
    program, "uTime"
  );

  const aspectLocation = gl.getUniformLocation(
    program, "uAspect"
  );

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(
      2, Math.round(rect.width * dpr)
    );
    const height = Math.max(
      2, Math.round(rect.height * dpr)
    );

    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {
      canvas.width = width;
      canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
  }

  function draw(time) {
    resize();

    gl.useProgram(program);
    gl.uniform1f(timeLocation, time);
    gl.uniform1f(
      aspectLocation,
      canvas.width / canvas.height
    );

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function dispose() {
    gl.disableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  }

  return { draw, dispose };
}

export default function SolarHeroSun() {
  const canvasRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let renderer;

    try {
      renderer = createRenderer(canvas);
    } catch (error) {
      console.error("Solar renderer:", error);
      setFallback(true);
      return;
    }

    if (!renderer) {
      setFallback(true);
      return;
    }

    let frame = 0;
    let visible = true;
    let running = true;
    let last = 0;
    let accumulated = 0;
    let previous = 0;

    const frameInterval = 1000 / 30;

    function loop(now) {
      if (!running) return;

      if (
        document.hidden ||
        !visible ||
        motion.matches
      ) {
        frame = 0;
        return;
      }

      if (!last || now - last >= frameInterval) {
        const dt = previous
          ? Math.min((now - previous) / 1000, 0.1)
          : 0;

        previous = now;
        accumulated += dt;

        renderer.draw(accumulated);
        last = now;
      }

      frame = requestAnimationFrame(loop);
    }

    function refresh() {
      cancelAnimationFrame(frame);
      frame = 0;

      if (!running) return;

      if (motion.matches) {
        renderer.draw(0);
      } else if (!document.hidden && visible) {
        previous = 0;
        frame = requestAnimationFrame(loop);
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        refresh();
      },
      { threshold: 0.01 }
    );

    observer.observe(canvas);
    document.addEventListener(
      "visibilitychange", refresh
    );

    if (motion.addEventListener) {
      motion.addEventListener("change", refresh);
    } else {
      motion.addListener(refresh);
    }

    const onContextLost = (event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setFallback(true);
    };

    canvas.addEventListener(
      "webglcontextlost",
      onContextLost
    );

    refresh();

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();

      document.removeEventListener(
        "visibilitychange", refresh
      );

      if (motion.removeEventListener) {
        motion.removeEventListener(
          "change", refresh
        );
      } else {
        motion.removeListener(refresh);
      }

      canvas.removeEventListener(
        "webglcontextlost",
        onContextLost
      );

      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="solar-hero"
      aria-hidden="true"
      role="presentation"
    >
      <div className="solar-hero-aura" />
      <div className="solar-hero-static" />
      <canvas
        ref={canvasRef}
        className={
          fallback
            ? "solar-hero-canvas is-unavailable"
            : "solar-hero-canvas"
        }
      />
    </div>
  );
}
