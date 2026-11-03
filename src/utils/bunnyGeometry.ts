/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";

/**
 * Creates a low-poly bunny rabbit model programmatically using basic faceted primitives.
 * This provides a beautiful set of flat surface normals for demonstrating NPR styling,
 * flat shading, and toon outlines.
 */
export function createLowPolyBunny(material: THREE.Material): THREE.Group {
  const bunnyGroup = new THREE.Group();
  bunnyGroup.name = "bunny";

  // 1. Body: Tapered cylinder with very low divisions for a blocky retro look
  const bodyGeo = new THREE.CylinderGeometry(0.65, 0.9, 1.4, 7, 3);
  bodyGeo.scale(1.0, 1.1, 1.1); // Slightly egg-shaped
  const bodyMesh = new THREE.Mesh(bodyGeo, material);
  bodyMesh.position.set(0, 0, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bunnyGroup.add(bodyMesh);

  // 2. Head: Sphere with low segment count for geometric facets
  const headGeo = new THREE.SphereGeometry(0.55, 7, 5);
  const headMesh = new THREE.Mesh(headGeo, material);
  headMesh.position.set(0, 0.85, 0.15);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  bunnyGroup.add(headMesh);

  // 3. Left Ear: Tall pyramid/cone
  const leftEarGeo = new THREE.ConeGeometry(0.15, 0.8, 5);
  leftEarGeo.scale(0.8, 1.0, 0.4); // Squish slightly for ear shape
  const leftEarMesh = new THREE.Mesh(leftEarGeo, material);
  leftEarMesh.position.set(-0.2, 1.4, 0.1);
  leftEarMesh.rotation.set(0.1, 0, -0.15);
  leftEarMesh.castShadow = true;
  bunnyGroup.add(leftEarMesh);

  // 4. Right Ear: Tall pyramid/cone
  const rightEarGeo = new THREE.ConeGeometry(0.15, 0.8, 5);
  rightEarGeo.scale(0.8, 1.0, 0.4);
  const rightEarMesh = new THREE.Mesh(rightEarGeo, material);
  rightEarMesh.position.set(0.2, 1.4, 0.1);
  rightEarMesh.rotation.set(0.1, 0, 0.15);
  rightEarMesh.castShadow = true;
  bunnyGroup.add(rightEarMesh);

  // 5. Back Feet (Large): Low-poly boxes
  const footGeo = new THREE.BoxGeometry(0.28, 0.2, 0.55, 2, 2);
  
  const leftFootMesh = new THREE.Mesh(footGeo, material);
  leftFootMesh.position.set(-0.45, -0.65, 0.1);
  leftFootMesh.rotation.set(0, 0.1, 0);
  bunnyGroup.add(leftFootMesh);

  const rightFootMesh = new THREE.Mesh(footGeo, material);
  rightFootMesh.position.set(0.45, -0.65, 0.1);
  rightFootMesh.rotation.set(0, -0.1, 0);
  bunnyGroup.add(rightFootMesh);

  // 6. Front Paws (Small): Mini boxes/spheres
  const pawGeo = new THREE.BoxGeometry(0.18, 0.18, 0.35, 1, 1);
  
  const leftPawMesh = new THREE.Mesh(pawGeo, material);
  leftPawMesh.position.set(-0.25, -0.4, 0.5);
  leftPawMesh.rotation.set(0.2, 0, 0);
  bunnyGroup.add(leftPawMesh);

  const rightPawMesh = new THREE.Mesh(pawGeo, material);
  rightPawMesh.position.set(0.25, -0.4, 0.5);
  rightPawMesh.rotation.set(0.2, 0, 0);
  bunnyGroup.add(rightPawMesh);

  // 7. Fluffy tail: Faceted sphere
  const tailGeo = new THREE.SphereGeometry(0.18, 5, 4);
  const tailMesh = new THREE.Mesh(tailGeo, material);
  tailMesh.position.set(0, -0.45, -0.8);
  tailMesh.castShadow = true;
  bunnyGroup.add(tailMesh);

  // 8. Visual details (Nose and Eyes)
  // For these details, to stay extremely clean and readable we make them stand out
  // with a simple dark material, or use the main material if students just want the shader.
  // Using the main shader material is cool, but a tiny distinct black nose/eye set
  // helps make the bunny super adorable and recognizable! Let's combine them:
  // We can attach them so they participate in lighting, but with a different color if needed.
  // Actually, keeping them as separate small meshes with a pure black material
  // makes the shape look 1000% like a bunny, which makes the app look incredibly professional and highly finished!
  const accessoryMaterial = new THREE.MeshBasicMaterial({ color: 0x111116 });

  // Right Eye
  const eyeGeo = new THREE.SphereGeometry(0.045, 4, 3);
  const rightEye = new THREE.Mesh(eyeGeo, accessoryMaterial);
  rightEye.position.set(0.16, 0.95, 0.58);
  bunnyGroup.add(rightEye);

  // Left Eye
  const leftEye = new THREE.Mesh(eyeGeo, accessoryMaterial);
  leftEye.position.set(-0.16, 0.95, 0.58);
  bunnyGroup.add(leftEye);

  // Nose (Small diamond cone)
  const noseGeo = new THREE.ConeGeometry(0.05, 0.08, 4);
  const nose = new THREE.Mesh(noseGeo, accessoryMaterial);
  nose.position.set(0, 0.85, 0.65);
  nose.rotation.set(Math.PI / 2, 0, 0);
  bunnyGroup.add(nose);

  // Scale and center the group to fit standard view box
  bunnyGroup.scale.set(1.4, 1.4, 1.4);
  bunnyGroup.position.set(0, -0.4, 0);

  return bunnyGroup;
}
