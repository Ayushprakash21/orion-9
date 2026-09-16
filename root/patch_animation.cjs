const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

// Insert startTime
code = code.replace(
  /let time = 0;/g,
  `let time = 0;\n    const startTime = Date.now();`
);

// Spawn packet control
code = code.replace(
  /const spawnPacket = \(\) => \{/g,
  `const spawnPacket = () => {\n      const elapsed = Date.now() - startTime;\n      if (elapsed < 3500) return; // Wait until phase 4`
);

// Globe fade-in
code = code.replace(
  /\/\/ 3\. EARTH \/ GLOBE \/ WORLD MODEL\n      const gX/g,
  `// 3. EARTH / GLOBE / WORLD MODEL
      const elapsed = Date.now() - startTime;
      const globeAlpha = Math.min(1, Math.max(0, (elapsed - 2000) / 2000));
      ctx.globalAlpha = globeAlpha;
      const gX`
);
code = code.replace(
  /\/\/ Orbital Rings/g,
  `ctx.globalAlpha = 1;\n\n      // Orbital Rings`
);

// Orbits fade-in
code = code.replace(
  /const drawOrbit = \(rx: number, ry: number, angle: number, opacity: number\) => \{/g,
  `const orbitAlpha = Math.min(1, Math.max(0, (elapsed - 1000) / 1500));
      const drawOrbit = (rx: number, ry: number, angle: number, opacity: number) => {
        ctx.globalAlpha = orbitAlpha;`
);

code = code.replace(
  /ctx\.stroke\(\);\n      \};/g,
  `ctx.stroke();\n        ctx.globalAlpha = 1;\n      };`
);

// Paths fade-in
code = code.replace(
  /\/\/ 4\. PATHS\n      PATHS\.forEach\(path => \{/g,
  `// 4. PATHS
      const pathAlpha = Math.min(1, Math.max(0, (elapsed - 2500) / 1500));
      ctx.globalAlpha = pathAlpha;
      PATHS.forEach(path => {`
);
code = code.replace(
  /\/\/ 5\. PACKETS/g,
  `ctx.globalAlpha = 1;\n\n      // 5. PACKETS`
);

// Nodes fade-in
code = code.replace(
  /\/\/ 6\. NODES\n      NODES\.forEach\(n => \{/g,
  `// 6. NODES
      const nodeAlpha = Math.min(1, Math.max(0, (elapsed - 3000) / 1000));
      ctx.globalAlpha = nodeAlpha;
      NODES.forEach(n => {`
);
code = code.replace(
  /\/\/ 7\. BRANDING/g,
  `ctx.globalAlpha = 1;\n\n      // 7. BRANDING`
);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
