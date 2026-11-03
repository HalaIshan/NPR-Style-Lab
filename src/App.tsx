/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  Sparkles, Settings, Sun, Box, Brush
} from "lucide-react";
import { GeometryType, LabSettings, RenderingMode } from "./types";
import { SplitScreenCanvas } from "./components/SplitScreenCanvas";
import { ShapeStylePanel, ShaderSettingsPanel } from "./components/ControlPanel";

export default function App() {
  const [settings, setSettings] = useState<LabSettings>({
    renderingMode: RenderingMode.TOON,
    geometryType: GeometryType.CUBE,
    lightDirection: { x: 0.7, y: 0.7, z: 0.15 },
    lightIntensity: 1.5,
    ambientStrength: 0.2,
    toonLevels: 4,
    outlineThickness: 0.22,
    hatchingScale: 0.18,
    halftoneSize: 8,
    autoRotate: false,
    materialColor: "#06b6d4", // Stunning cyan pop initial preset
  });

  // Quick preset loader to let users jump straight into preconfigured styles
  const applyPreset = (mode: RenderingMode, autoRot = false) => {
    setSettings((prev) => ({
      ...prev,
      renderingMode: mode,
      autoRotate: autoRot,
      ...(mode === RenderingMode.OUTLINE ? { outlineThickness: 0.22 } : {}),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-blue-500/30 selection:text-white">
      {/* Top Banner & Title Header Area */}
      <header className="h-auto md:h-16 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between px-6 md:px-8 py-3 md:py-0 bg-slate-900 gap-3 md:gap-4 z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xs text-white shadow-sm">LAB</div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-100 flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span>NPR Shading Lab</span>
              <span className="text-slate-500 font-normal text-xs sm:text-sm mt-0.5 sm:mt-0">// Smooth Phong vs Toon NPR under the Same Light</span>
            </h1>
          </div>
        </div>

        {/* Active Engine Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono mr-1">
            <span className="text-green-500 animate-pulse">●</span>
            <span className="text-slate-400">ENGINE ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Simplified, Centered Educational Explanation Section */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 select-none w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 md:max-w-[100%]">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Smooth Phong Shading vs Toon NPR under the Same Light
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
              <strong>Lighting</strong> controls which faces of a 3D model are bright or dark based on the light source position.
              The <strong>shading/rendering style</strong> controls how that lighting is visually represented:
              <span className="text-blue-400 ml-1">Smooth Phong</span> shows continuous gradients with smooth highlights/shadows, while
              <span className="text-blue-400 ml-1">Toon NPR</span> simplifies that exact same lighting into clear, quantized bands and optional outlines.
              Interact with the light source and settings to compare both shading styles in real time!
            </p>
          </div>
        </div>
      </div>

      {/* Main Container - Dual-row grid layout for premium above-the-fold display */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-4 flex flex-col gap-4 overflow-y-auto">
        {/* Top Row: Left (split-screen 3D viewport) & Right (compact Shader & Scene Settings panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch select-none">
          {/* Left: Large split-screen viewport */}
          <div className="lg:col-span-8 h-[340px] lg:h-[430px] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative bg-slate-950 shrink-0 flex flex-col">
            {/* Top header decoration inside canvas */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 justify-center gap-1.5 flex pointer-events-none select-none z-10">
              <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 backdrop-blur-md text-[10px] font-mono font-medium tracking-wide text-slate-400 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>Left: Smooth Phong Shading • Right: Toon NPR Shading</span>
              </div>
            </div>
            
            {/* Main Three.js view renderer */}
            <div className="flex-1 w-full h-full relative">
              <SplitScreenCanvas settings={settings} onChange={setSettings} />
            </div>
          </div>

          {/* Right: Smaller compact "Shader & Scene Settings" panel */}
          <div className="lg:col-span-4 h-[340px] lg:h-[430px]">
            <ShaderSettingsPanel settings={settings} onChange={setSettings} />
          </div>
        </div>

        {/* Second Row: Shapes and Style Selector Panel */}
        <div className="w-full">
          <ShapeStylePanel settings={settings} onChange={setSettings} />
        </div>
      </main>
    </div>
  );
}
