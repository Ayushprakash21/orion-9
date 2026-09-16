const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

code = code.replace(
  /const getColor = \(colorStr: string, alpha: number = 1\) => \{[\s\S]*?const isLightMode = document.documentElement.classList.contains\('light'\);[\s\S]*?switch\(colorStr\) \{[\s\S]*?case 'cyan': return isLightMode \? `rgba\(0, 160, 190, \$\{alpha\}\)` : `rgba\(0, 242, 254, \$\{alpha\}\)`;[\s\S]*?case 'blue': return isLightMode \? `rgba\(2, 132, 199, \$\{alpha\}\)` : `rgba\(56, 189, 248, \$\{alpha\}\)`;[\s\S]*?case 'violet': return isLightMode \? `rgba\(139, 92, 246, \$\{alpha\}\)` : `rgba\(167, 139, 250, \$\{alpha\}\)`;[\s\S]*?case 'amber': return isLightMode \? `rgba\(217, 119, 6, \$\{alpha\}\)` : `rgba\(251, 191, 36, \$\{alpha\}\)`;[\s\S]*?case 'white-cyan': return isLightMode \? `rgba\(14, 116, 144, \$\{alpha\}\)` : `rgba\(207, 250, 254, \$\{alpha\}\)`;[\s\S]*?default: return `rgba\(255, 255, 255, \$\{alpha\}\)`;[\s\S]*?\}[\s\S]*?\};/m,
  `const getColor = (colorStr: string, alpha: number = 1) => {
      const isLightMode = document.documentElement.classList.contains('light');
      const isTrueTone = document.documentElement.classList.contains('true-tone');
      
      switch(colorStr) {
        case 'cyan': return isLightMode ? (isTrueTone ? \`rgba(0, 140, 170, \${alpha})\` : \`rgba(0, 160, 190, \${alpha})\`) : (isTrueTone ? \`rgba(0, 220, 235, \${alpha})\` : \`rgba(0, 242, 254, \${alpha})\`);
        case 'blue': return isLightMode ? (isTrueTone ? \`rgba(2, 110, 170, \${alpha})\` : \`rgba(2, 132, 199, \${alpha})\`) : (isTrueTone ? \`rgba(40, 170, 230, \${alpha})\` : \`rgba(56, 189, 248, \${alpha})\`);
        case 'violet': return isLightMode ? (isTrueTone ? \`rgba(120, 80, 220, \${alpha})\` : \`rgba(139, 92, 246, \${alpha})\`) : (isTrueTone ? \`rgba(150, 120, 230, \${alpha})\` : \`rgba(167, 139, 250, \${alpha})\`);
        case 'amber': return isLightMode ? (isTrueTone ? \`rgba(190, 100, 5, \${alpha})\` : \`rgba(217, 119, 6, \${alpha})\`) : (isTrueTone ? \`rgba(230, 170, 30, \${alpha})\` : \`rgba(251, 191, 36, \${alpha})\`);
        case 'white-cyan': return isLightMode ? (isTrueTone ? \`rgba(10, 95, 120, \${alpha})\` : \`rgba(14, 116, 144, \${alpha})\`) : (isTrueTone ? \`rgba(180, 230, 235, \${alpha})\` : \`rgba(207, 250, 254, \${alpha})\`);
        default: return isTrueTone ? \`rgba(245, 240, 235, \${alpha})\` : \`rgba(255, 255, 255, \${alpha})\`;
      }
    };`
);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
