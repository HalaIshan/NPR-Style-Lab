/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RenderingMode {
  PHONG = "phong",
  TOON = "toon",
  OUTLINE = "outline",
}

export enum GeometryType {
  CUBE = "cube",
  SPHERE = "sphere",
  TORUS = "torus",
  BUNNY = "bunny",
}

export interface LabSettings {
  renderingMode: RenderingMode;
  geometryType: GeometryType;
  lightDirection: { x: number; y: number; z: number };
  lightIntensity: number;
  ambientStrength: number;
  toonLevels: number;
  outlineThickness: number;
  hatchingScale: number;
  halftoneSize: number;
  autoRotate: boolean;
  materialColor: string;
}

export interface ShaderCodeExplanation {
  title: string;
  mathFormula: string;
  description: string;
  keyConcepts: string[];
}
