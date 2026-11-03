/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCcw } from "lucide-react";
import { GeometryType, LabSettings, RenderingMode } from "../types";
import { createLowPolyBunny } from "../utils/bunnyGeometry";
import {
  outlineFragmentShaderCode,
  phongFragmentShaderCode,
  toonFragmentShaderCode,
  vertexShaderCode,
} from "../shaders/nprShaders";

interface SplitScreenCanvasProps {
  settings: LabSettings;
  onChange?: (settings: LabSettings) => void;
}

export const SplitScreenCanvas: React.FC<SplitScreenCanvasProps> = ({ settings, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Save references for dynamic runtime updates in render loop/useEffect
  const stateRef = useRef(settings);
  stateRef.current = settings;

  // Refs for tracking camera and controls for resetting view
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Refs for scene components to allow dynamic updates
  const sceneLeftRef = useRef<THREE.Scene | null>(null);
  const sceneRightRef = useRef<THREE.Scene | null>(null);
  const objectLeftRef = useRef<THREE.Object3D | null>(null);
  const objectRightRef = useRef<THREE.Object3D | null>(null);
  const lightArrowLeftRef = useRef<THREE.ArrowHelper | null>(null);
  const lightArrowRightRef = useRef<THREE.ArrowHelper | null>(null);

  // Materials refs
  const matsRef = useRef<{
    phong: THREE.ShaderMaterial;
    toon: THREE.ShaderMaterial;
    outline: THREE.ShaderMaterial;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Setup Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Setup Camera
    // Note: aspect ratio is calculated for half of the screen width since it's split
    const camera = new THREE.PerspectiveCamera(45, (width / 2) / height, 0.1, 100);
    camera.position.set(0, 0.2, 9.5);
    cameraRef.current = camera;

    // 3. Setup OrbitControls (synchronously controls both viewports using a single camera)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 2;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 4. Create Scenes
    const sceneLeft = new THREE.Scene();
    sceneLeft.background = new THREE.Color(0x0b1120); // Deep minimalist slate
    sceneLeftRef.current = sceneLeft;

    const sceneRight = new THREE.Scene();
    sceneRight.background = new THREE.Color(0x070c18); // Slightly darker slate for difference
    sceneRightRef.current = sceneRight;

    // 5. Add Floor Grids to both scenes
    const gridLeft = new THREE.GridHelper(10, 20, 0x3b82f6, 0x1e293b);
    gridLeft.position.y = -1.2;
    sceneLeft.add(gridLeft);

    const gridRight = new THREE.GridHelper(10, 20, 0x60a5fa, 0x1e293b);
    gridRight.position.y = -1.2;
    sceneRight.add(gridRight);

    // 6. Define Custom Shader Materials with individual uniform registers
    // We instantiate two copies of each material parameter structure to avoid cross-pipeline pollution.
    const createShaderUniforms = () => ({
      uLightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uAmbientColor: { value: new THREE.Color(0x0f172a) },
      uDiffuseColor: { value: new THREE.Color(0x60a5fa) },
      uSpecularColor: { value: new THREE.Color(0xffffff) },
      uShininess: { value: 32.0 },
      uToonLevels: { value: 3.0 },
      uOutlineThickness: { value: 0.22 },
      uHatchingScale: { value: 0.22 },
      uHalftoneSize: { value: 8.0 },
      uResolution: { value: new THREE.Vector2(width / 2, height) },
    });

    const leftUniforms = createShaderUniforms();
    const rightUniforms = createShaderUniforms();

    const phongMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderCode,
      fragmentShader: phongFragmentShaderCode,
      uniforms: leftUniforms,
    });

    const toonMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderCode,
      fragmentShader: toonFragmentShaderCode,
      uniforms: rightUniforms,
    });

    const outlineMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderCode,
      fragmentShader: outlineFragmentShaderCode,
      uniforms: rightUniforms,
    });

    matsRef.current = {
      phong: phongMaterial,
      toon: toonMaterial,
      outline: outlineMaterial,
    };

    // 7. Light Helpers (Arrows showing exactly where incoming light rays originate)
    const arrowDir = new THREE.Vector3(1, 1, 1).normalize();
    const arrowOrigin = arrowDir.clone().multiplyScalar(2.2);
    const arrowDirection = arrowDir.clone().negate().normalize();
    
    // Left arrow
    const arrowLeft = new THREE.ArrowHelper(arrowDirection, arrowOrigin, 1.2, 0x3b82f6, 0.25, 0.15);
    sceneLeft.add(arrowLeft);
    lightArrowLeftRef.current = arrowLeft;

    // Right arrow
    const arrowRight = new THREE.ArrowHelper(arrowDirection, arrowOrigin, 1.2, 0x60a5fa, 0.25, 0.15);
    sceneRight.add(arrowRight);
    lightArrowRightRef.current = arrowRight;

    // 8. Reusable Geometry Definitions
    const geometries = {
      cube: new THREE.BoxGeometry(1.15, 1.15, 1.15),
      sphere: new THREE.SphereGeometry(0.85, 48, 48),
      torus: new THREE.TorusGeometry(0.62, 0.21, 24, 64),
    };

    // Active object tracking
    let activeGeoType = stateRef.current.geometryType;
    let activeNprMode = stateRef.current.renderingMode;

    const buildAndAddObjects = (geoType: GeometryType, nprMode: RenderingMode) => {
      // Clean previous meshes
      if (objectLeftRef.current) {
        sceneLeft.remove(objectLeftRef.current);
        objectLeftRef.current = null;
      }
      if (objectRightRef.current) {
        sceneRight.remove(objectRightRef.current);
        objectRightRef.current = null;
      }

      // Determine active target material
      let rightMaterial: THREE.Material = toonMaterial;
      if (nprMode === RenderingMode.TOON) rightMaterial = toonMaterial;
      else if (nprMode === RenderingMode.OUTLINE) rightMaterial = outlineMaterial;

      let leftMesh: THREE.Object3D;
      let rightMesh: THREE.Object3D;

      if (geoType === GeometryType.BUNNY) {
        // Bunny is a complex programmatic low-poly group
        leftMesh = createLowPolyBunny(phongMaterial);
        rightMesh = createLowPolyBunny(rightMaterial);
        leftMesh.scale.set(0.72, 0.72, 0.72);
        rightMesh.scale.set(0.72, 0.72, 0.72);
      } else {
        // Sphere, Torus, or Cube are single meshes
        const geo = geometries[geoType as keyof typeof geometries];
        leftMesh = new THREE.Mesh(geo, phongMaterial);
        rightMesh = new THREE.Mesh(geo, rightMaterial);
        
        // Give meshes a small default vertical shift to seat them nicely over the grid
        leftMesh.position.set(0, 0, 0);
        rightMesh.position.set(0, 0, 0);

        if (geoType === GeometryType.CUBE) {
          leftMesh.rotation.set(0.35, 0.6, 0);
          rightMesh.rotation.set(0.35, 0.6, 0);
        }
      }

      // Add clean dark navy/black outlines around the cube and other models
      if (nprMode === RenderingMode.OUTLINE) {
        if (geoType === GeometryType.CUBE) {
          const edges = new THREE.EdgesGeometry(geometries.cube);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x020714 })
          );
          rightMesh.add(line);
        } else if (geoType === GeometryType.BUNNY) {
          rightMesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const edges = new THREE.EdgesGeometry(child.geometry, 15);
              const line = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({ color: 0x020714 })
              );
              child.add(line);
            }
          });
        } else {
          const threshold = geoType === GeometryType.SPHERE ? 15 : 12;
          const edges = new THREE.EdgesGeometry(geometries[geoType as keyof typeof geometries], threshold);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x020714 })
          );
          rightMesh.add(line);
        }
      }

      sceneLeft.add(leftMesh);
      sceneRight.add(rightMesh);

      objectLeftRef.current = leftMesh;
      objectRightRef.current = rightMesh;
    };

    // Initial setup
    buildAndAddObjects(activeGeoType, activeNprMode);

    // 9. Resize Observer Handler
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const w = entry.contentRect.width || containerRef.current?.clientWidth || width;
      const h = entry.contentRect.height || containerRef.current?.clientHeight || height;

      renderer.setSize(w, h);
      camera.aspect = (w / 2) / h;
      
      // Dynamic fov adjust based on vertical ratio ensuring horizontal sizing on narrow screens
      const minAspect = (w / 2) / h;
      if (minAspect < 1.0) {
        camera.fov = 45 / Math.max(minAspect, 0.5);
      } else {
        camera.fov = 45;
      }
      camera.updateProjectionMatrix();

      // Update resolution uniforms in pixels (essential for screen-space hatch & halftone calculations)
      leftUniforms.uResolution.value.set(w / 2, h);
      rightUniforms.uResolution.value.set(w / 2, h);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial resolution pass
    leftUniforms.uResolution.value.set(width / 2, height);
    rightUniforms.uResolution.value.set(width / 2, height);

    // 10. Animation and Shader Loop
    let lastTime = 0;
    let animationId: number;

    const animate = (time: number) => {
      animationId = requestAnimationFrame(animate);
      const delta = (time - lastTime) * 0.001;
      lastTime = time;

      const currentSettings = stateRef.current;

      // Check if user changed the GEOMETRY type or NPR shader modes
      if (currentSettings.geometryType !== activeGeoType || currentSettings.renderingMode !== activeNprMode) {
        activeGeoType = currentSettings.geometryType;
        activeNprMode = currentSettings.renderingMode;
        buildAndAddObjects(activeGeoType, activeNprMode);
      }

      // Smooth Auto-Rotation
      if (currentSettings.autoRotate) {
        if (objectLeftRef.current) objectLeftRef.current.rotation.y += 0.5 * delta;
        if (objectRightRef.current) objectRightRef.current.rotation.y += 0.5 * delta;
      }

      // Calculate Light Direction vectors (converted to view space for proper shader coordinate math)
      const worldLightDir = new THREE.Vector3(
        currentSettings.lightDirection.x,
        currentSettings.lightDirection.y,
        currentSettings.lightDirection.z
      ).normalize();

      // Update 3D Light helper Arrows in scenes
      // Source arrow originates opposite to the direction the light is pointing, looking down towards (0,0,0)
      const arrowDirection = worldLightDir.clone().negate().normalize();
      const originPosition = worldLightDir.clone().normalize().multiplyScalar(2.2);
      
      if (lightArrowLeftRef.current) {
        lightArrowLeftRef.current.setDirection(arrowDirection);
        lightArrowLeftRef.current.position.copy(originPosition);
      }
      if (lightArrowRightRef.current) {
        lightArrowRightRef.current.setDirection(arrowDirection);
        lightArrowRightRef.current.position.copy(originPosition);
      }

      // Convert world space light direction into Camera View Space!
      // This ensures lighting updates beautifully as the camera orbits!
      const viewLightDir = worldLightDir.clone().transformDirection(camera.matrixWorldInverse);

      // Bind uniforms dynamically across left/right materials
      const applyUniforms = (mat: THREE.ShaderMaterial, isLeft: boolean) => {
        mat.uniforms.uLightDirection.value.copy(viewLightDir);
        mat.uniforms.uLightColor.value.set("#ffffff").multiplyScalar(currentSettings.lightIntensity);
        mat.uniforms.uAmbientColor.value.set("#ffffff").multiplyScalar(currentSettings.ambientStrength);
        
        mat.uniforms.uDiffuseColor.value.set("#60a5fa"); // Consistent Light Blue across both viewports for clear comparison
        
        mat.uniforms.uSpecularColor.value.set("#ffffff");
        mat.uniforms.uShininess.value = 32.0;

        // Custom properties for specific NPR shader styles
        mat.uniforms.uToonLevels.value = 4.0; // Perfect 4-band quantized shading levels for beautiful educational look
        mat.uniforms.uOutlineThickness.value = currentSettings.outlineThickness;
        mat.uniforms.uHatchingScale.value = currentSettings.hatchingScale;
        mat.uniforms.uHalftoneSize.value = currentSettings.halftoneSize;
      };

      // Feed Left Material
      applyUniforms(phongMaterial, true);

      // Feed Right Material
      let activeRightMat = toonMaterial;
      if (activeNprMode === RenderingMode.TOON) activeRightMat = toonMaterial;
      else if (activeNprMode === RenderingMode.OUTLINE) activeRightMat = outlineMaterial;
      
      applyUniforms(activeRightMat, false);

      // Update camera controls
      controls.update();

      // Render Viewports!
      const w = containerRef.current?.clientWidth || width;
      const h = containerRef.current?.clientHeight || height;
      const halfW = w / 2;

      // Draw LEFT VP: Smooth Phong (Continuous shading)
      renderer.setViewport(0, 0, halfW, h);
      renderer.setScissor(0, 0, halfW, h);
      renderer.setScissorTest(true);
      renderer.render(sceneLeft, camera);

      // Draw RIGHT VP: Selected Non-Photorealistic shader logic
      renderer.setViewport(halfW, 0, halfW, h);
      renderer.setScissor(halfW, 0, halfW, h);
      renderer.setScissorTest(true);
      renderer.render(sceneRight, camera);
    };

    animationId = requestAnimationFrame(animate);

    // 11. Clean disposal to protect WebGL performance
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      
      // Dispose of static geometric assets
      geometries.cube.dispose();
      geometries.sphere.dispose();
      geometries.torus.dispose();

      // Dispose of procedural materials
      phongMaterial.dispose();
      toonMaterial.dispose();
      outlineMaterial.dispose();
    };
  }, []);

  const resetCameraView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0.2, 9.5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleNprChange = (mode: RenderingMode) => {
    if (onChange) {
      onChange({
        ...settings,
        renderingMode: mode,
      });
    }
  };

  return (
    <div id="graphics-container" ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing bg-slate-950">
      <canvas id="split-canvas" ref={canvasRef} className="w-full h-full block" />
      
      {/* Visual divider overlay separating Left and Right split frames */}
      <div 
        id="viewport-divider"
        className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500/40 pointer-events-none flex flex-col justify-between items-center py-6 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
      >
        <span className="text-[10px] tracking-widest font-mono text-blue-400 bg-slate-950 px-2.5 py-1 border border-blue-500/20 rounded-full select-none shadow-md backdrop-blur-md -translate-x-1/2">
          COMPARE
        </span>
        <div className="w-4 h-4 rounded-full border border-blue-500/40 bg-blue-600/25 flex items-center justify-center -translate-x-1/2 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        </div>
        <span className="text-[10px] tracking-widest font-mono text-blue-400 bg-slate-950 px-2.5 py-1 border border-blue-500/20 rounded-full select-none shadow-md backdrop-blur-md -translate-x-1/2">
          LAB SPACE
        </span>
      </div>

      {/* Side Viewport Labels */}
      <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg select-none pointer-events-none max-w-[220px]">
        <p className="text-xs font-mono text-slate-500">LEFT VIEWPORT</p>
        <h4 className="text-xs font-bold text-slate-100 font-sans tracking-tight">Smooth Phong Shading</h4>
        <div className="mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-[9px] font-mono text-blue-400">Continuous lighting gradients with smooth highlights and shadows</span>
        </div>
      </div>

      {/* Interactive Right Viewport Shading Control */}
      <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-800 backdrop-blur-md p-3 rounded-xl text-right select-none shadow-xl z-20 flex flex-col items-end gap-2 max-w-[220px]">
        <div className="flex flex-col items-end">
          <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>RIGHT VIEWPORT</span>
          </p>
          <h4 className="text-[11px] font-bold text-slate-100 font-sans tracking-tight mt-0.5">
            Toon NPR Shading
          </h4>
          <p className="text-[9px] text-slate-400 mt-0.5 leading-tight font-sans">
            Quantized toon bands, with an optional outline
          </p>
        </div>

        {/* Shading Toggle Options */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800/80 w-full">
          <button
            onClick={() => handleNprChange(RenderingMode.TOON)}
            className={`flex-1 py-1 px-1.5 rounded text-[9.5px] font-bold transition-all cursor-pointer text-center leading-none ${
              settings.renderingMode === RenderingMode.TOON
                ? "bg-blue-600 text-white shadow font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Toon Bands
          </button>
          <button
            onClick={() => handleNprChange(RenderingMode.OUTLINE)}
            className={`flex-1 py-1 px-1.5 rounded text-[9.5px] font-bold transition-all cursor-pointer text-center leading-none ${
              settings.renderingMode === RenderingMode.OUTLINE
                ? "bg-blue-600 text-white shadow font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            + Outlines
          </button>
        </div>

        <div className="flex items-center gap-1 mt-0.5 justify-end w-full">
          <span className="text-[8.5px] font-mono text-blue-400 uppercase tracking-widest font-semibold text-[8px]">
            {settings.renderingMode === RenderingMode.TOON ? "4-band quantized" : "ink silhouette borders"}
          </span>
        </div>
      </div>

      {/* Orbit Helper Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-md px-4 py-1.5 rounded-full text-center">
        <span className="text-[11px] text-slate-400 font-sans tracking-wide">
          🖱️ Click and drag on canvas to <strong className="text-blue-400 font-medium">rotate camera</strong> • Scroll to <strong className="text-blue-400 font-medium">zoom</strong>
        </span>
      </div>

      {/* Reset Camera View Control */}
      <button
        id="reset-view-btn"
        onClick={resetCameraView}
        className="absolute bottom-4 right-4 bg-slate-900/95 hover:bg-slate-800/95 border border-slate-800 hover:border-blue-500/50 backdrop-blur-md text-xs font-medium text-slate-200 hover:text-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer z-20 transition-all select-none"
      >
        <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
        <span>Reset View</span>
      </button>
    </div>
  );
};
