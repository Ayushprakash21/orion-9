const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

code = code.replace(
  /export function OrionLiveWallpaper\(\{ isShuttingDown \}: \{ isShuttingDown\?: boolean \}\) \{/,
  "export function OrionLiveWallpaper({ isShuttingDown }: { isShuttingDown?: boolean }) {\n  const shuttingDownRef = useRef(isShuttingDown);\n  useEffect(() => {\n    shuttingDownRef.current = isShuttingDown;\n  }, [isShuttingDown]);"
);

code = code.replace(
  /if \(isShuttingDown && !shutdownStartTime\) \{/g,
  "if (shuttingDownRef.current && !shutdownStartTime) {"
);

code = code.replace(
  /if \(elapsed < 3500 \|\| isShuttingDown\) return;/g,
  "if (elapsed < 3500 || shuttingDownRef.current) return;"
);

code = code.replace(
  /\}, \[isShuttingDown, branding\]\);/g,
  "}, []); // Removed dependencies so it doesn't remount"
);

// We need to fix branding dependency as well - using a ref for branding or just getting it directly since it doesn't change fast.
// But Branding is used outside the canvas in the React JSX, so it's fine if the component re-renders, but the canvas shouldn't re-mount.
// Wait, if branding changes, the component re-renders, but useEffect doesn't run if [] is empty. That's perfect.

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
