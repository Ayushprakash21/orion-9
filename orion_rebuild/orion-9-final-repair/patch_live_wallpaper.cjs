const fs = require('fs');

let content = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

// Inside useEffect, get isLightMode
content = content.replace(
  /const ctx = canvas\.getContext\('2d'\);/,
  "const ctx = canvas.getContext('2d');\n      const isLightMode = document.documentElement.classList.contains('light');"
);

// BG Gradient
content = content.replace(
  /bgGradient\.addColorStop\(0, 'rgba\(0, 242, 254, 0\.04\)'\);/,
  "bgGradient.addColorStop(0, isLightMode ? 'rgba(0, 160, 190, 0.02)' : 'rgba(0, 242, 254, 0.04)');"
);
content = content.replace(
  /bgGradient\.addColorStop\(0\.5, 'rgba\(0, 242, 254, 0\.01\)'\);/,
  "bgGradient.addColorStop(0.5, isLightMode ? 'rgba(0, 160, 190, 0.005)' : 'rgba(0, 242, 254, 0.01)');"
);

// Stroke Style
content = content.replace(
  /ctx\.strokeStyle = isIntel \? 'rgba\(139, 92, 246, 0\.15\)' : 'rgba\(0, 242, 254, 0\.1\)';/,
  "ctx.strokeStyle = isIntel ? (isLightMode ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.15)') : (isLightMode ? 'rgba(0, 160, 190, 0.08)' : 'rgba(0, 242, 254, 0.1)');"
);

// Node Colors
content = content.replace(
  /const baseColor = isIntel \? 'rgba\(139, 92, 246, 0\.8\)' : 'rgba\(0, 242, 254, 0\.8\)';/,
  "const baseColor = isIntel ? 'rgba(139, 92, 246, 0.8)' : (isLightMode ? 'rgba(0, 160, 190, 0.8)' : 'rgba(0, 242, 254, 0.8)');"
);
content = content.replace(
  /const pulseColor = isIntel \? 'rgba\(139, 92, 246, ' \+ \(pulse \* 0\.2\) \+ '\)' : 'rgba\(0, 242, 254, ' \+ \(pulse \* 0\.2\) \+ '\)';/,
  "const pulseColor = isIntel ? 'rgba(139, 92, 246, ' + (pulse * 0.2) + ')' : (isLightMode ? 'rgba(0, 160, 190, ' + (pulse * 0.2) + ')' : 'rgba(0, 242, 254, ' + (pulse * 0.2) + ')');"
);
content = content.replace(
  /ctx\.fillStyle = isIntel \? 'rgba\(167, 139, 250, 0\.8\)' : 'rgba\(148, 163, 184, 0\.9\)';/,
  "ctx.fillStyle = isIntel ? (isLightMode ? 'rgba(109, 40, 217, 0.8)' : 'rgba(167, 139, 250, 0.8)') : (isLightMode ? 'rgba(71, 85, 105, 0.9)' : 'rgba(148, 163, 184, 0.9)');"
);

// Spawn Particle Color
content = content.replace(
  /const color = isIntel \? 'rgba\(167, 139, 250, 0\.9\)' : 'rgba\(0, 242, 254, 0\.9\)';/,
  "const isLightModeParticle = document.documentElement.classList.contains('light');\n          const color = isIntel ? (isLightModeParticle ? 'rgba(109, 40, 217, 0.8)' : 'rgba(167, 139, 250, 0.9)') : (isLightModeParticle ? 'rgba(0, 160, 190, 0.8)' : 'rgba(0, 242, 254, 0.9)');"
);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', content);
