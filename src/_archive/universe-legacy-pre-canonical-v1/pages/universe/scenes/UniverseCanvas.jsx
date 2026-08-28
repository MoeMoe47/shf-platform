import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const STAR_COUNT = 820;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function CameraRig({ phase, selectedWorld, reducedMotion, onEnterComplete }) {
  const { camera } = useThree();
  const completedRef = useRef(false);
  const startRef = useRef(null);

  useEffect(() => {
    if (phase === "entering") {
      startRef.current = performance.now();
      completedRef.current = false;
    }
    if (phase === "arrival") {
      camera.position.set(0, 1.35, 6.8);
      camera.lookAt(0, 0.2, -2.2);
    }
    if (phase === "universe" && reducedMotion) {
      camera.position.set(0, 2.2, 8.4);
      camera.lookAt(0, 0.55, -4.2);
    }
  }, [camera, phase, reducedMotion]);

  useFrame(() => {
    if (phase === "entering") {
      const duration = reducedMotion ? 700 : 9000;
      const elapsed = performance.now() - (startRef.current || performance.now());
      const t = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(t);

      const curveX = Math.sin(eased * Math.PI) * 1.05;
      camera.position.set(
        THREE.MathUtils.lerp(0, curveX, 0.88),
        THREE.MathUtils.lerp(1.35, 2.25, eased),
        THREE.MathUtils.lerp(6.8, 8.4, eased)
      );
      camera.lookAt(THREE.MathUtils.lerp(0, 0.15, eased), THREE.MathUtils.lerp(0.15, 0.55, eased), -4.2);

      if (t >= 1 && !completedRef.current) {
        completedRef.current = true;
        onEnterComplete?.();
      }
    }

    if (phase === "departing" && selectedWorld) {
      const target = new THREE.Vector3(...selectedWorld.position);
      camera.position.lerp(new THREE.Vector3(target.x * 0.58, target.y + 0.55, target.z + 2.15), 0.035);
      camera.lookAt(target);
    }
  });

  return null;
}

function StarField({ phase, reducedMotion }) {
  const materialRef = useRef();
  const geometry = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const phases = new Float32Array(STAR_COUNT);
    const sizes = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i += 1) {
      const radius = 8 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.42) * 12;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = -7 - Math.sin(theta) * radius - Math.random() * 10;
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 1.4 + Math.random() * 2.8;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    buffer.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return buffer;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uDepth: { value: 0 },
        },
        vertexShader: `
          attribute float aPhase;
          attribute float aSize;
          uniform float uTime;
          uniform float uDepth;
          varying float vAlpha;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float flicker = 0.72 + 0.28 * sin(uTime * (0.42 + aPhase * 0.08) + aPhase);
            vAlpha = flicker * (0.34 + uDepth * 0.34);
            gl_PointSize = aSize * (280.0 / -mvPosition.z) * (1.0 + uDepth * 0.22);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          void main() {
            float distanceToCenter = length(gl_PointCoord - vec2(0.5));
            float alpha = smoothstep(0.5, 0.05, distanceToCenter) * vAlpha;
            gl_FragColor = vec4(0.82, 0.9, 1.0, alpha);
          }
        `,
      }),
    []
  );

  useEffect(() => {
    materialRef.current = material;
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (!materialRef.current || reducedMotion) return;
    materialRef.current.uniforms.uTime.value += delta;
    materialRef.current.uniforms.uDepth.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uDepth.value,
      phase === "arrival" ? 0 : 1,
      0.025
    );
  });

  return <points geometry={geometry} material={material} />;
}

function EarthHorizon({ phase, reducedMotion }) {
  const group = useRef();

  useFrame((_, delta) => {
    if (!group.current || reducedMotion) return;
    const settle = phase === "arrival" ? 0.018 : 0.065;
    group.current.rotation.y += delta * 0.018;
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, phase === "arrival" ? -2.8 : -8.4, settle);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, phase === "arrival" ? -2.15 : -3.85, settle);
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, phase === "arrival" ? 2.7 : 0.92, settle));
  });

  return (
    <group ref={group} position={[0, -2.15, -2.8]} scale={2.7}>
      <mesh rotation={[0.25, 0, 0]}>
        <sphereGeometry args={[1.55, 64, 32]} />
        <meshStandardMaterial color="#20385a" roughness={0.96} metalness={0.04} emissive="#071223" emissiveIntensity={0.4} />
      </mesh>
      <mesh rotation={[0.25, 0, 0]} scale={1.018}>
        <sphereGeometry args={[1.57, 64, 32]} />
        <meshBasicMaterial color="#7cc5ff" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function UniverseBeacon({ visible, reducedMotion }) {
  const ring = useRef();
  const core = useRef();

  useFrame((_, delta) => {
    if (ring.current && !reducedMotion) ring.current.rotation.z += delta * 0.12;
    if (core.current && !reducedMotion) core.current.rotation.y -= delta * 0.08;
  });

  return (
    <group position={[0, 0.35, -4.3]} scale={visible ? 1 : 0.01}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.32, 2]} />
        <meshStandardMaterial color="#f7dfad" emissive="#c88735" emissiveIntensity={0.38} roughness={0.4} metalness={0.18} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.006, 12, 120]} />
        <meshBasicMaterial color="#d89c45" transparent opacity={0.72} />
      </mesh>
      <mesh rotation={[Math.PI / 2.8, 0.25, 0]}>
        <torusGeometry args={[1.08, 0.004, 12, 120]} />
        <meshBasicMaterial color="#7fb8ff" transparent opacity={0.34} />
      </mesh>
      <pointLight color="#f5c878" intensity={1.2} distance={5.5} />
    </group>
  );
}

function ShootingStar({ enabled }) {
  const ref = useRef();
  const timeoutRef = useRef();
  const activeRef = useRef(false);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const schedule = () => {
      const delay = 12000 + Math.random() * 8000;
      timeoutRef.current = window.setTimeout(() => {
        if (document.visibilityState !== "hidden") {
          activeRef.current = true;
          progressRef.current = 0;
        }
        schedule();
      }, delay + 52000);
    };

    schedule();
    return () => window.clearTimeout(timeoutRef.current);
  }, [enabled]);

  useFrame((_, delta) => {
    if (!ref.current || !enabled) return;
    if (!activeRef.current) {
      ref.current.visible = false;
      return;
    }

    progressRef.current += delta / 1.65;
    const t = progressRef.current;
    ref.current.visible = true;
    ref.current.position.set(-5 + t * 10, 4.2 - t * 3.4, -5.8);
    ref.current.material.opacity = Math.sin(Math.min(1, t) * Math.PI) * 0.76;
    if (t >= 1) activeRef.current = false;
  });

  return (
    <mesh ref={ref} rotation={[0, 0, -0.48]} visible={false}>
      <planeGeometry args={[1.7, 0.018]} />
      <meshBasicMaterial color="#fff4ca" transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function World({ world, visible, focused, selected, reducedMotion, onFocus, onBlur, onSelect }) {
  const group = useRef();
  const ring = useRef();
  const targetScale = visible ? world.scale * (focused ? 1.12 : 1) : 0.01;

  useFrame((_, delta) => {
    if (!group.current) return;
    const speed = reducedMotion ? 0 : delta * 0.14;
    group.current.rotation.y += speed;
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.075);
    if (ring.current && !reducedMotion) ring.current.rotation.z += delta * (focused ? 0.42 : 0.14);
  });

  return (
    <group
      ref={group}
      position={world.position}
      onPointerEnter={(event) => {
        event.stopPropagation();
        onFocus?.(world.id);
      }}
      onPointerLeave={(event) => {
        event.stopPropagation();
        onBlur?.();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (world.destination.isNavigable) onSelect?.(world);
      }}
    >
      <mesh>
        <sphereGeometry args={[0.7, 48, 32]} />
        <meshStandardMaterial
          color={world.visual.primary}
          emissive={world.visual.secondary}
          emissiveIntensity={focused || selected ? 0.34 : 0.2}
          roughness={0.62}
          metalness={world.type === "infrastructure" ? 0.28 : 0.08}
        />
      </mesh>
      <mesh scale={1.035}>
        <sphereGeometry args={[0.704, 48, 32]} />
        <meshBasicMaterial color={world.visual.atmosphere} transparent opacity={focused || selected ? 0.13 : 0.07} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.94, focused || selected ? 0.012 : 0.006, 12, 120]} />
        <meshBasicMaterial color={world.visual.ring} transparent opacity={focused || selected ? 0.86 : 0.28} />
      </mesh>
      {visible ? (
        <Html className="universe-world-label-wrap" center distanceFactor={8} position={[0, 1.02, 0]}>
          <div className={`universe-world-label ${focused || selected ? "is-active" : ""}`}>
            <span>{world.shortName}</span>
            <strong>{world.type}</strong>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function UniverseScene(props) {
  const {
    phase,
    worlds,
    selectedWorldId,
    focusedWorldId,
    reducedMotion,
    onEnterComplete,
    onWorldFocus,
    onWorldBlur,
    onWorldSelect,
  } = props;
  const [visibleWorldIds, setVisibleWorldIds] = useState(() => (reducedMotion ? worlds.map((world) => world.id) : []));
  const selectedWorld = worlds.find((world) => world.id === selectedWorldId);
  const showUniverse = phase === "entering" || phase === "universe" || phase === "departing";

  useEffect(() => {
    if (phase !== "entering" && phase !== "universe" && phase !== "departing") return undefined;
    if (reducedMotion) {
      setVisibleWorldIds(worlds.map((world) => world.id));
      return undefined;
    }

    const timeouts = worlds.map((world) =>
      window.setTimeout(() => {
        setVisibleWorldIds((current) => (current.includes(world.id) ? current : [...current, world.id]));
      }, world.revealDelayMs)
    );
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
  }, [phase, reducedMotion, worlds]);

  return (
    <>
      <color attach="background" args={["#02050d"]} />
      <ambientLight intensity={0.26} />
      <directionalLight position={[4, 5, 5]} intensity={1.4} color="#d9ecff" />
      <StarField phase={phase} reducedMotion={reducedMotion} />
      <EarthHorizon phase={phase} reducedMotion={reducedMotion} />
      <UniverseBeacon visible={showUniverse} reducedMotion={reducedMotion} />
      <ShootingStar enabled={showUniverse && !reducedMotion} />
      {worlds.map((world) => (
        <World
          key={world.id}
          world={world}
          visible={visibleWorldIds.includes(world.id)}
          focused={focusedWorldId === world.id}
          selected={selectedWorldId === world.id}
          reducedMotion={reducedMotion}
          onFocus={onWorldFocus}
          onBlur={onWorldBlur}
          onSelect={onWorldSelect}
        />
      ))}
      <CameraRig phase={phase} selectedWorld={selectedWorld} reducedMotion={reducedMotion} onEnterComplete={onEnterComplete} />
    </>
  );
}

export default function UniverseCanvas(props) {
  return (
    <div className="universe-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 1.35, 6.8], fov: 46, near: 0.1, far: 80 }}
        dpr={[1, 1.65]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          try {
            gl.setClearColor("#02050d", 0);
          } catch (error) {
            props.onWebGLError?.(error);
          }
        }}
        onError={props.onWebGLError}
      >
        <UniverseScene {...props} />
      </Canvas>
    </div>
  );
}
