const fs = require('fs');
const path = require('path');

function replaceHardcoded(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-\[\#[0-9a-fA-F]{6}\]\/9[0-9]/g, 'bg-os-surface/95');
  content = content.replace(/bg-\[\#05070D\]/g, 'bg-os-surface');
  content = content.replace(/bg-\[\#0A0D14\]/g, 'bg-os-bg');
  content = content.replace(/bg-\[\#02050A\]/g, 'bg-os-bg');
  content = content.replace(/bg-\[\#020305\]/g, 'bg-os-bg');
  content = content.replace(/bg-\[\#020408\]/g, 'bg-os-surface');
  content = content.replace(/bg-\[\#020306\]/g, 'bg-os-bg');
  content = content.replace(/bg-\[\#07090F\]\/[0-9]{2}/g, 'bg-os-surface/95');
  content = content.replace(/bg-\[\#111214\]/g, 'bg-os-surface');
  content = content.replace(/bg-\[\#0F172A\]/g, 'bg-os-surface');

  content = content.replace(/backgroundColor:\s*'#[0-9a-fA-F]+'/g, "backgroundColor: 'var(--os-surface)'");
  content = content.replace(/border:\s*'1px solid #[0-9a-fA-F]+'/g, "border: '1px solid var(--os-border)'");
  
  // text colors
  content = content.replace(/text-slate-100/g, 'text-os-text-primary');
  content = content.replace(/text-slate-200/g, 'text-os-text-primary');
  content = content.replace(/text-slate-300/g, 'text-os-text-secondary');
  content = content.replace(/text-slate-400/g, 'text-os-text-muted');
  
  // special border
  content = content.replace(/border-white\/20/g, 'border-os-border');
  content = content.replace(/border-white\/10/g, 'border-os-border');
  content = content.replace(/border-\[\#333\]/g, 'border-os-border');
  content = content.replace(/border-\[\#171C26\]/g, 'border-os-border');
  
  fs.writeFileSync(filePath, content);
}

function processDir(dir) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        processDir(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        replaceHardcoded(fullPath);
      }
    });
  }
}

processDir('src/os');
processDir('src/components');

console.log("Done");
