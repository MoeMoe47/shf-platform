#!/usr/bin/env bash

echo "---------------------------------------"
echo "SHF Globe Orbit Layer Installer"
echo "---------------------------------------"

echo "Creating orbit texture directory..."
mkdir -p public/space

echo "Downloading orbit grid texture..."
curl -L https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/disc.png -o public/space/orbit-ring.png

echo ""
echo "Orbit ring installed at:"
echo "public/space/orbit-ring.png"
echo ""

echo "---------------------------------------"
echo "Add this code inside your Globe scene"
echo "---------------------------------------"

cat <<'CODE'

/* ---------- Satellite Orbit Ring ---------- */

const orbitGeometry = new THREE.RingGeometry(105, 106, 128)

const orbitMaterial = new THREE.MeshBasicMaterial({
  color: 0x8fc4ff,
  transparent: true,
  opacity: 0.18,
  side: THREE.DoubleSide
})

const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial)

orbitRing.rotation.x = Math.PI / 2
orbitRing.position.y = 0

scene.add(orbitRing)

/* slow rotation */

function animateOrbit() {
  orbitRing.rotation.z += 0.0008
  requestAnimationFrame(animateOrbit)
}

animateOrbit()

CODE

echo ""
echo "---------------------------------------"
echo "Expected Result"
echo "---------------------------------------"
echo "✔ glowing atmospheric rim"
echo "✔ starfield background"
echo "✔ subtle satellite orbit ring"
echo "✔ cinematic intelligence globe"
echo ""
echo "Installation Complete"
