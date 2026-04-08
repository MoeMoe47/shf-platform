#!/usr/bin/env bash

echo "--------------------------------------"
echo "SHF Globe Cinematic Upgrade Installer"
echo "--------------------------------------"

echo "1. Creating space texture directory..."
mkdir -p public/space

echo "2. Downloading starfield texture..."
curl -L https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/starfield.jpg -o public/space/starfield.jpg

echo ""
echo "Starfield installed at:"
echo "public/space/starfield.jpg"
echo ""

echo "--------------------------------------"
echo "Add the following code to your Globe"
echo "--------------------------------------"

cat <<'CODE'

/* ---------- Globe Setup ---------- */

const globe = Globe()(mountRef.current)
  .globeImageUrl("/textures/earth-intelligence-8k.png")
  .backgroundImageUrl("/space/starfield.jpg")

/* ---------- Atmosphere ---------- */

.showAtmosphere(true)
.atmosphereColor("#8fc4ff")
.atmosphereAltitude(0.22)

/* ---------- Lighting ---------- */

const ambient = new THREE.AmbientLight(0x9ec9ff, 1.5)
scene.add(ambient)

const rim = new THREE.DirectionalLight(0x8fc4ff, 2)
rim.position.set(-300, 200, 400)
scene.add(rim)

CODE

echo ""
echo "--------------------------------------"
echo "Expected Result"
echo "--------------------------------------"
echo "✔ deep navy oceans"
echo "✔ steel blue continents"
echo "✔ glowing city networks"
echo "✔ thin geospatial grid"
echo "✔ cinematic lighting"
echo "✔ atmospheric rim glow"
echo "✔ starfield depth"
echo "✔ Palantir-style intelligence aesthetic"
echo ""
echo "Setup Complete"
