const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Remove hardcoded dark/gray block backgrounds in headers
code = code.replace(/bg-black\/40/g, 'bg-os-surface-secondary');

// Remove heavy shadows on panels
code = code.replace(/shadow-\[0_0_20px_rgba\(0,0,0,0\.5\)\]/g, 'shadow-sm');

// Remove hardcoded dark inputs and shadows
code = code.replace(/bg-black\/20/g, 'bg-os-input-bg');
code = code.replace(/shadow-\[0_0_10px_rgba\(0,0,0,0\.5\)\]/g, 'shadow-sm');

// Fix border radius for cards (user requested 10-12px, let's use rounded-xl or rounded-lg)
// Currently they use rounded-sm
code = code.replace(/className="bg-os-surface rounded-sm shadow-sm border border-os-border backdrop-blur-sm"/g, 'className="bg-os-surface rounded-xl shadow-sm border border-os-border backdrop-blur-sm overflow-hidden"');
code = code.replace(/className="bg-os-surface border border-os-border shadow-sm"/g, 'className="bg-os-surface rounded-xl border border-os-border shadow-sm overflow-hidden"');

// Fix table/dropdown styling if there are issues
// User said: "border: #D7DBD8" for inputs, "border-radius: 7-8px" for inputs.
// The CSS variables have --os-border-strong for inputs maybe?
// But Tailwind's focus:border-os-border or border-os-border might be used.
// Let's replace focus:border-os-border with focus:border-os-surface-hover or similar?
// "focus: subtle Orion accent border/ring" -> focus:border-os-border is fine if border is defined well.

fs.writeFileSync('src/components/Settings.tsx', code);
