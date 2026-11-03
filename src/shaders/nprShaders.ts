/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Custom GLSL Vertex and Fragment shaders for our computer graphics NPR style lab.
 * These are completely written in plain GLSL and utilize Three.js uniforms.
 * Excellent for learning: lighting matrices, vectors, dot products, cosines,
 * quantization, and screen-space coordinate generation.
 */

export const vertexShaderCode = `
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  
  // Transform vertex position into model-view (camera) space
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
  // View position is vector from vertex to camera in view space
  vViewPosition = -mvPosition.xyz;
  
  // normalMatrix is the inverse transpose of the modelViewMatrix.
  // Transforming the normal vector keeps it perpendicular to the transformed surface!
  vNormal = normalize(normalMatrix * normal);
  
  // Calculate world coordinates for lighting/world effects
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  
  // Project to screen space
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const phongFragmentShaderCode = `
uniform vec3 uLightDirection; // Normalized view-space light direction
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  // Re-normalize interpolations
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDirection); // Points toward light
  vec3 V = normalize(vViewPosition);  // Points toward camera
  
  // 1. Ambient Lighting (constant indirect light)
  vec3 ambient = uAmbientColor * uDiffuseColor;
  
  // 2. Diffuse Lighting (Lambertian cosine law: N dot L)
  float dotNL = dot(N, L);
  float diffuseIntensity = max(dotNL, 0.0);
  vec3 diffuse = uDiffuseColor * diffuseIntensity * uLightColor;
  
  // 3. Specular Lighting (Phong reflection model)
  // Reflect light around surface normal: reflection = reflect(incident, normal)
  // L points to light, so -L is incident ray.
  vec3 R = reflect(-L, N);
  float dotRV = dot(R, V);
  
  float specularIntensity = 0.0;
  // Specular reflection only happens if the light is on the front side of the face
  if (dotNL > 0.0) {
    specularIntensity = pow(max(dotRV, 0.0), uShininess);
  }
  vec3 specular = uSpecularColor * specularIntensity * uLightColor;
  
  // Summing the three classic Phong terms
  vec3 finalColor = ambient + diffuse + specular;
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const toonFragmentShaderCode = `
uniform vec3 uLightDirection; // Normalized view-space light direction
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform float uToonLevels;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDirection);
  vec3 V = normalize(vViewPosition);
  
  // 1. Quantized diffuse lighting (discrete bands)
  float dotNL = dot(N, L);
  float diffuseIntensity = max(dotNL, 0.0);
  
  float levels = max(uToonLevels, 2.0);
  float toonDiffuse = floor(diffuseIntensity * levels) / (levels - 1.0);
  toonDiffuse = clamp(toonDiffuse, 0.0, 1.0);
  
  // Clean dark teal/navy shadow base tinted with the material's color
  vec3 baseShadow = vec3(0.01, 0.06, 0.16); 
  vec3 shadowColor = mix(baseShadow, uDiffuseColor * 0.15, 0.35);
  
  // Interpolated diffuse lighting between clear shadow and diffuse color
  vec3 diffuse = mix(shadowColor, uDiffuseColor, toonDiffuse) * uLightColor;
  
  // 2. Specular (sharp toon highlight shine)
  vec3 R = reflect(-L, N);
  float dotRV = dot(R, V);
  float specularIntensity = 0.0;
  if (dotNL > 0.0) {
    specularIntensity = pow(max(dotRV, 0.0), uShininess);
  }
  
  // Under Smooth Phong, highlights are continuous. 
  // For Toon, we step it sharply above 0.72 for a clean discrete highlight.
  float toonSpecular = step(0.72, specularIntensity);
  vec3 specular = vec3(1.0, 1.0, 1.0) * toonSpecular * uLightColor * 0.6;
  
  vec3 finalColor = diffuse + specular;
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const outlineFragmentShaderCode = `
uniform vec3 uLightDirection; // Normalized view-space light direction
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform float uToonLevels;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDirection);
  vec3 V = normalize(vViewPosition);
  
  // 1. Quantized diffuse lighting (discrete bands)
  float dotNL = dot(N, L);
  float diffuseIntensity = max(dotNL, 0.0);
  
  float levels = max(uToonLevels, 2.0);
  float toonDiffuse = floor(diffuseIntensity * levels) / (levels - 1.0);
  toonDiffuse = clamp(toonDiffuse, 0.0, 1.0);
  
  // Beautiful dark teal/navy shadow base tinted with the material's color
  vec3 baseShadow = vec3(0.01, 0.06, 0.16);
  vec3 shadowColor = mix(baseShadow, uDiffuseColor * 0.15, 0.35);
  
  // Interpolated diffuse lighting between shadow and diffuse color
  vec3 diffuse = mix(shadowColor, uDiffuseColor, toonDiffuse) * uLightColor;
  
  // 2. Specular (sharp toon specular)
  vec3 R = reflect(-L, N);
  float dotRV = dot(R, V);
  float specularIntensity = 0.0;
  if (dotNL > 0.0) {
    specularIntensity = pow(max(dotRV, 0.0), uShininess);
  }
  
  float toonSpecular = step(0.72, specularIntensity);
  vec3 specular = vec3(1.0, 1.0, 1.0) * toonSpecular * uLightColor * 0.6;
  
  vec3 finalColor = diffuse + specular;
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const hatchingFragmentShaderCode = `
uniform vec3 uLightDirection; // Normalized view-space light direction
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uLightColor;
uniform float uHatchingScale; // Custom pixel frequency grid scale

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDirection);
  
  // Average ambient + diffuse to get total surface luminance intensity
  float dotNL = dot(N, L);
  float diffuseIntensity = max(dotNL, 0.0);
  float intensity = 0.15 + diffuseIntensity; // Static ambient baseline + diffuse
  
  vec3 baseColor = uDiffuseColor;      // Colored sketchbook page
  vec3 inkColor = vec3(0.12, 0.12, 0.16); // Sketch ink color
  
  // Screen-space diagonals using screen pixels (gl_FragCoord)
  // coord1 is bottom-left to top-right diagonals, coord2 is bottom-right to top-left
  float coord1 = gl_FragCoord.x + gl_FragCoord.y;
  float coord2 = gl_FragCoord.x - gl_FragCoord.y;
  
  // Sine-waves create clean, equidistant parallel lines
  float hatch1 = sin(coord1 * uHatchingScale);
  float hatch2 = sin(coord2 * uHatchingScale);
  
  // By default, the paper is fully colored (unhatched)
  float stroke = 1.0;
  
  // Darkest Shadows: Dense cross-hatching (draw hatch1 and hatch2 lines)
  if (intensity < 0.22) {
    if (hatch1 > -0.25 || hatch2 > -0.25) {
      stroke = 0.0;
    }
  }
  // Medium Shadows: Normal cross-hatching
  else if (intensity < 0.45) {
    if (hatch1 > 0.25 || hatch2 > 0.25) {
      stroke = 0.0;
    }
  }
  // Soft Shadows: Single diagonal hatching
  else if (intensity < 0.68) {
    if (hatch1 > 0.55) {
      stroke = 0.0;
    }
  }
  // Midtones: Very fine faint lines
  else if (intensity < 0.85) {
    if (hatch1 > 0.88) {
      stroke = 0.0;
    }
  }
  
  // Mix ink line with paper colored base
  vec3 finalColor = mix(inkColor, baseColor, stroke);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const halftoneFragmentShaderCode = `
uniform vec3 uLightDirection; // Normalized view-space light direction
uniform vec2 uResolution;      // Canvas width/height
uniform vec3 uDiffuseColor;
uniform vec3 uLightColor;
uniform float uHalftoneSize;  // Pitch scale of dots in pixels

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDirection);
  
  // Total luminance
  float dotNL = dot(N, L);
  float diffuseIntensity = max(dotNL, 0.0);
  float intensity = 0.2 + diffuseIntensity; // Ambient + Diffuse
  
  // Current screen-space pixel position
  vec2 screenCoords = gl_FragCoord.xy;
  
  // Divide screen into a grid of squares of length uHalftoneSize
  vec2 cellCoords = mod(screenCoords, vec2(uHalftoneSize));
  vec2 cellCenter = vec2(uHalftoneSize / 2.0);
  
  // Pixels distance from center of its local halftone grid tile
  float dist = distance(cellCoords, cellCenter);
  
  // Darker areas -> larger target radius of black dots
  // Light areas -> smaller dot radius
  float maxRadius = uHalftoneSize * 0.68;
  
  // Invert the lighting: lower intensity gets larger dots
  float targetRadius = maxRadius * (1.1 - clamp(intensity, 0.0, 1.0));
  
  // Radial threshold step with smooth 1-pixel anti-aliasing to avoid jagged circles
  float dotFactor = smoothstep(targetRadius - 1.0, targetRadius + 1.0, dist);
  
  vec3 paperColor = uDiffuseColor;
  vec3 inkColor = vec3(0.06, 0.06, 0.09); // Dark navy comic ink
  
  vec3 finalColor = mix(inkColor, paperColor, dotFactor);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
