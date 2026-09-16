const fs = require('fs');

let windowCode = fs.readFileSync('src/os/components/OrionWindow.tsx', 'utf8');
windowCode = windowCode.replace(
  /export const OrionWindow: React\.FC<OrionWindowProps> = \({ window: win, isActive }\) => {/,
  'export const OrionWindow = React.forwardRef<HTMLDivElement, OrionWindowProps>(({ window: win, isActive }, ref) => {'
);
windowCode = windowCode.replace(
  /<motion\.div\n/,
  '<motion.div\n      ref={ref}\n'
);
// replace closing bracket of the component if needed. It usually is `};` at the end of the file.
windowCode = windowCode.replace(/};\s*$/, '});\n');
fs.writeFileSync('src/os/components/OrionWindow.tsx', windowCode);

