const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const opacity = \(100 - brightness\) \/ 100;\s*document\.documentElement\.style\.setProperty\('--os-brightness-overlay', opacity\.toString\(\)\);/,
  "const opacity = (100 - brightness) / 100;\n    document.documentElement.style.setProperty('--os-brightness-overlay', opacity.toString());\n    \n    if (settings?.reducedMotion) {\n      document.documentElement.classList.add('reduced-motion');\n    } else {\n      document.documentElement.classList.remove('reduced-motion');\n    }"
);

fs.writeFileSync('src/App.tsx', content);
