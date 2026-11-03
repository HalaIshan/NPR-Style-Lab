/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { 
  Sun, Box, Settings, Brush 
} from "lucide-react";
import { GeometryType, LabSettings, RenderingMode } from "../types";

// --- 1. SHAPE & STYLE PANEL (Second Row Controls) ---
interface ShapeStylePanelProps {
  settings: LabSettings;
  onChange: (settings: LabSettings) => void;
}

export const ShapeStylePanel: React.FC<ShapeStylePanelProps> = ({ settings, onChange }) => {
  const handleUpdate = <K extends keyof LabSettings>(key: K, value: LabSettings[K]) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 w-full select-none font-sans">
      
      {/* Section 1: Shape Selector */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-center shadow-lg">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Select 3D Model Shape</span>
          </label>
          <p className="text-[9px] text-slate-400 font-sans leading-snug pb-0.5">
            Changes both viewports together so the comparison stays fair.
          </p>
          <div className="grid grid-cols-4 gap-1 inner-shadow p-0.5 bg-slate-950 rounded-lg">
            {Object.values(GeometryType).map((type) => (
              <button
                key={type}
                id={`shape-btn-${type}`}
                onClick={() => handleUpdate("geometryType", type)}
                className={`py-1 px-1 text-[9.5px] font-semibold rounded transition-all cursor-pointer ${
                  settings.geometryType === type
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type === GeometryType.CUBE && "Cube"}
                {type === GeometryType.SPHERE && "Sphere"}
                {type === GeometryType.TORUS && "Torus"}
                {type === GeometryType.BUNNY && "Bunny"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Educational Comparison Guide */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-center shadow-lg">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Brush className="w-3.5 h-3.5 text-blue-400" />
              <span>A Shading Style Comparison</span>
            </span>
            <span className="text-[8px] px-1 py-0.5 border border-slate-800 text-slate-400 font-bold rounded font-mono">
              EDUCATIONAL GUIDE
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
              <p className="text-[10px] font-bold text-slate-300 font-mono uppercase tracking-wide">// LEFT: Smooth Phong Shading</p>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-normal">
                Continuous lighting gradients with smooth highlights and shadows. Uses smooth shading to create continuous highlights and shadows.
              </p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
              <p className="text-[10px] font-bold text-blue-400 font-mono uppercase tracking-wide">// RIGHT: Toon NPR Shading</p>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-normal">
                Quantized toon bands with an optional outline. Simplifies continuous lighting into clear, toon-style cel bands.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// --- 2. COMPACT SHADER & SCENE SETTINGS PANEL (Beside Viewport) ---
interface ShaderSettingsPanelProps {
  settings: LabSettings;
  onChange: (settings: LabSettings) => void;
}

export const ShaderSettingsPanel: React.FC<ShaderSettingsPanelProps> = ({ settings, onChange }) => {
  const squarePadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const presets = [
    { name: "Top Left", x: -0.6, y: 0.6, z: 0.5 },
    { name: "Top Right", x: 0.6, y: 0.6, z: 0.5 },
    { name: "Front Left", x: -0.6, y: 0.2, z: 0.7 },
    { name: "Front Right", x: 0.6, y: 0.2, z: 0.7 },
    { name: "Left", x: -1.0, y: 0.0, z: 0.0 },
    { name: "Right", x: 1.0, y: 0.0, z: 0.0 },
    { name: "Above", x: 0.0, y: 1.0, z: 0.0 },
    { name: "Back", x: 0.0, y: 0.2, z: -1.0 },
  ];

  const handleUpdate = <K extends keyof LabSettings>(key: K, value: LabSettings[K]) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  // Convert current world vector (x, y, z) to 2D square pad proportions
  const { x: lx, y: ly, z: lz } = settings.lightDirection;

  // X goes from -1 (Left) to 1 (Right). Map X to 0% to 100%
  const dotX = ((lx + 1) / 2) * 100;
  // Y goes from -1 (Down) to 1 (Up). Map Y=1 (Up) to 0% and Y=-1 (Down) to 100%
  const dotY = ((1 - ly) / 2) * 100;

  // Interactive Drag handler inside the square
  const updateLightFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!squarePadRef.current) return;
    const rect = squarePadRef.current.getBoundingClientRect();
    
    // Proportional ratio within the bounding box
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Map px (0..1) to X (-1..1) and py (0..1) to Y (1..-1)
    const newX = parseFloat((px * 2 - 1).toFixed(2));
    const newY = parseFloat((1 - py * 2).toFixed(2));

    handleUpdate("lightDirection", {
      ...settings.lightDirection,
      x: newX,
      y: newY,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateLightFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateLightFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Check if current direction matches a preset closely
  const isPresetActive = (p: typeof presets[0]) => {
    const threshold = 0.2;
    const dx = lx - p.x;
    const dy = ly - p.y;
    const dz = lz - p.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < threshold;
  };

  // Convert current coordinates into a clear human-readable direction label
  const getDirectionLabel = (x: number, y: number, z: number): string => {
    let horizontal = "Center";
    if (x < -0.3) horizontal = "Left";
    else if (x > 0.3) horizontal = "Right";

    let vertical = "Horizon-Level";
    if (y > 0.3) vertical = "Upper";
    else if (y < -0.3) vertical = "Lower";

    let depth = "Middle Depth";
    if (z > 0.3) depth = "Front";
    else if (z < -0.3) depth = "Back";

    return `${horizontal} / ${vertical} / ${depth}`;
  };

  return (
    <div id="shader-scene-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-lg h-full select-none font-sans overflow-hidden">
      
      <div className="space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Header */}
        <div className="border-b border-slate-800 pb-1.5 shrink-0">
          <label className="text-[11px] font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>3. Light & Environment</span>
          </label>
          <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
            Adjust the light and immediately compare how both shading styles react.
          </p>
        </div>

        {/* Improved Light direction coordinates area */}
        <div className="space-y-2 flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Light Position</span>
            </span>
            <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/10 rounded px-1.5 py-0.5 uppercase tracking-wide">
              Interactive
            </span>
          </div>

          <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 space-y-2 flex-1 flex flex-col justify-between min-h-0">
            
            {/* Draggable Square Control Pad */}
            <div className="flex items-center gap-3 justify-center py-1">
              <div
                ref={squarePadRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative w-28 h-28 bg-slate-950 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-slate-700 shadow-inner flex items-center justify-center select-none overflow-hidden shrink-0"
                style={{ touchAction: "none" }}
              >
                {/* Axes Crosshairs splitting into four quadrants */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] border-l border-dashed border-slate-850 pointer-events-none" />
                <div className="absolute left-0 right-0 top-1/2 h-[1px] border-t border-dashed border-slate-850 pointer-events-none" />

                <span className="absolute top-1 text-[6.5px] font-mono font-bold text-slate-600 uppercase tracking-widest pointer-events-none">
                  Up (+Y)
                </span>
                <span className="absolute bottom-1 text-[6.5px] font-mono font-bold text-slate-600 uppercase tracking-widest pointer-events-none">
                  Down (-Y)
                </span>
                <span className="absolute left-1 text-[6.5px] font-mono font-bold text-slate-600 uppercase tracking-widest pointer-events-none">
                  Left (-X)
                </span>
                <span className="absolute right-1 text-[6.5px] font-mono font-bold text-slate-600 uppercase tracking-widest pointer-events-none">
                  Right (+X)
                </span>

                {/* Custom indicator representation of our Sun / Light source handle */}
                <div
                  className="absolute w-5 h-5 rounded bg-amber-500 border border-amber-300 flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.8)] pointer-events-none"
                  style={{
                    left: `${dotX}%`,
                    top: `${dotY}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Sun className="w-3 h-3 text-slate-950 stroke-[2.5]" />
                </div>
              </div>

              {/* Informative Educational Readout Labels - Side layout to make vertical length super compact */}
              <div className="flex-1 space-y-1.5 self-center">
                <div className="text-[10px] font-semibold text-slate-200 bg-slate-900 border border-slate-800/80 rounded p-1.5 leading-snug">
                  <div className="text-amber-500 font-mono text-[8px] uppercase tracking-wider">Inbound Angle:</div>
                  <div className="text-white font-sans text-[10.5px] font-bold leading-tight truncate">{getDirectionLabel(lx, ly, lz)}</div>
                  <div className="text-[7.5px] font-mono text-slate-500 mt-0.5">
                    X={lx.toFixed(2)}, Y={ly.toFixed(2)}, Z={lz.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded border border-slate-800/50 h-[28px] shrink-0">
                  <span className="text-[8.5px] font-mono uppercase text-slate-400 font-semibold text-[8px]">Auto-Rotate</span>
                  <button
                    id="toggle-rotation-btn"
                    onClick={() => handleUpdate("autoRotate", !settings.autoRotate)}
                    className={`w-7 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${
                      settings.autoRotate ? "bg-blue-600" : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white shadow transform transition-transform ${
                        settings.autoRotate ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Front / Back Depth Slider */}
            <div className="space-y-1 bg-slate-900/30 p-1.5 rounded-md border border-slate-850">
              <div className="flex justify-between text-[8px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                <span>Depth (Z-Axis)</span>
                <span className="text-amber-500 font-extrabold">{lz > 0.3 ? "Front" : lz < -0.3 ? "Back" : "Mid-Depth"} ({lz.toFixed(2)})</span>
              </div>
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[7px] font-mono font-semibold text-slate-500 uppercase">Back (-Z)</span>
                <input
                  type="range"
                  id="depth-slider-z"
                  min="-1.0"
                  max="1.0"
                  step="0.01"
                  value={lz}
                  onChange={(e) => {
                    const zVal = parseFloat(e.target.value);
                    handleUpdate("lightDirection", { ...settings.lightDirection, z: zVal });
                  }}
                  className="w-full h-1.5 rounded bg-slate-900 accent-amber-500 cursor-pointer appearance-none"
                />
                <span className="text-[7px] font-mono font-semibold text-slate-500 uppercase">Front (+Z)</span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Direction Presets</span>
              <div className="grid grid-cols-4 gap-1">
                {presets.map((preset) => {
                  const active = isPresetActive(preset);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      id={`preset-btn-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleUpdate("lightDirection", { x: preset.x, y: preset.y, z: preset.z })}
                      className={`py-1 text-[8px] font-bold rounded text-center transition-all cursor-pointer border leading-none ${
                        active
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm"
                          : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Sliders Block */}
      <div className="space-y-1.5 border-t border-slate-800/60 pt-2 shrink-0">
        
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10px] font-medium text-slate-300 font-mono">
            <span>Light Intensity</span>
            <span className="text-blue-400 font-semibold">{settings.lightIntensity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            id="slider-light-intensity"
            min="0.5"
            max="3.0"
            step="0.1"
            value={settings.lightIntensity}
            onChange={(e) => handleUpdate("lightIntensity", parseFloat(e.target.value))}
            className="w-full h-1 rounded bg-slate-950 accent-blue-500 cursor-pointer appearance-none"
          />
        </div>

        <div className="space-y-0.5">
          <div className="flex justify-between text-[10px] font-medium text-slate-300 font-mono">
            <span>Ambient Strength</span>
            <span className="text-blue-400 font-semibold">{settings.ambientStrength.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            id="slider-ambient-strength"
            min="0.0"
            max="0.80"
            step="0.05"
            value={settings.ambientStrength}
            onChange={(e) => handleUpdate("ambientStrength", parseFloat(e.target.value))}
            className="w-full h-1 rounded bg-slate-950 accent-blue-500 cursor-pointer appearance-none"
          />
        </div>

      </div>

    </div>
  );
};
