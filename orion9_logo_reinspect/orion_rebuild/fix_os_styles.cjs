const fs = require('fs');
const path = require('path');

function replaceHardcoded(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-\[[^\]]+\]\s+to-\[[^\]]+\]/g, 'bg-os-bg');
  content = content.replace(/bg-\[\#05070D\]\/95/g, 'bg-os-surface/95');
  content = content.replace(/bg-\[\#0A0D14\]/g, 'bg-os-surface');
  content = content.replace(/bg-\[\#0F131C\]/g, 'bg-os-bg');
  content = content.replace(/bg-\[\#111214\]/g, 'bg-os-surface');
  content = content.replace(/bg-black\/40/g, 'bg-os-surface-active');
  content = content.replace(/bg-black\/50/g, 'bg-os-surface-active');
  content = content.replace(/bg-white\/10/g, 'bg-os-surface-active');
  content = content.replace(/bg-white\/5/g, 'bg-os-surface-hover');
  content = content.replace(/bg-white\/15/g, 'bg-os-surface-active');
  content = content.replace(/hover:bg-white\/10/g, 'hover:bg-os-surface-hover');
  content = content.replace(/hover:bg-white\/\[0\.06\]/g, 'hover:bg-os-surface-hover');
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-os-surface-hover');
  
  // Borders
  content = content.replace(/border-white\/\[0\.06\]/g, 'border-os-border');
  content = content.replace(/border-white\/10/g, 'border-os-border');
  content = content.replace(/border-black/g, 'border-os-border');
  
  // Text
  content = content.replace(/text-slate-400/g, 'text-os-text-muted');
  content = content.replace(/text-slate-300/g, 'text-os-text-secondary');
  content = content.replace(/text-slate-200/g, 'text-os-text-primary');
  content = content.replace(/text-white/g, 'text-os-text-primary');
  content = content.replace(/hover:text-white/g, 'hover:text-os-text-primary');
  content = content.replace(/text-\[\#00F2FE\]/g, 'text-os-accent');
  content = content.replace(/hover:text-\[\#00F2FE\]/g, 'hover:text-os-accent');
  
  // Accents
  content = content.replace(/bg-\[\#00F2FE\]/g, 'bg-os-accent');
  content = content.replace(/shadow-\[0_0_4px_\#00F2FE\]/g, 'shadow-md shadow-os-accent/20');
  
  fs.writeFileSync(filePath, content);
}

const targetDirs = [
  'src/os/components',
  'src/os/contextMenu',
  'src/components/layout'
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.tsx')) {
        replaceHardcoded(path.join(dir, file));
      }
    });
  }
});

console.log("Done");
