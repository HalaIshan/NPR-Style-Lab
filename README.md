# NPR Shading Lab – Phong vs. Toon Shading

An interactive WebGL demo that renders the same 3D model twice, side by side and under the same light: **smooth Phong shading** on the left, and **toon (cel) shading** – a style of non-photorealistic rendering (NPR) – on the right.

**[▶ Try the live demo](https://npr-style-lab.ai.studio)**

Made for the **Computer Graphics** course at the University of Haifa (2026) and shared with the class on the course Discord – one of several contributions applying course material, alongside my own Blender experiments with metaballs and materials. This demo was built with Google AI Studio.

## Features

**Two shading styles, one scene**
- **Phong shading:** continuous lighting with smooth highlights and shadows
- **Toon shading:** lighting quantized into flat color bands, with a sharp specular highlight
- Optional **outlines** around the model
- Both viewports share the same model, light, and camera, so the comparison stays fair

**Interactive controls**
- Move the light on the X, Y, and Z axes, pick one of 8 direction presets, or let it auto-rotate
- Adjust light intensity and ambient strength
- Switch between a cube, sphere, torus, and bunny
- Drag to rotate the camera and scroll to zoom

## How It Works

Both styles use the same lighting inputs – the surface normal, the light direction, and the view direction. The difference is in the fragment shader: Phong uses the diffuse and specular values as they are, while the toon shader rounds the diffuse value down into a fixed number of bands (`floor(diffuse * levels)`) and turns the specular highlight on or off with a threshold (`step`). This is what gives toon shading its flat, cartoon-like look.

The shaders are written in **GLSL** and live in [`src/shaders/nprShaders.ts`](src/shaders/nprShaders.ts).

## Running Locally

Requires Node.js.

    npm install
    npm run dev

Then open `http://localhost:3000`.

## Tech Stack

React · TypeScript · Three.js · GLSL shaders · Vite · Tailwind CSS

---

Developed by **Hala Ishan** · Computer Graphics, University of Haifa
