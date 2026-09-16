const fs = require('fs');

let content = fs.readFileSync('src/components/auth/AdminLogin.tsx', 'utf8');

content = content.replace(/bg-\[\#020712\]/g, 'bg-os-bg');
content = content.replace(/bg-\[\#08101E\]/g, 'bg-os-input-bg');
content = content.replace(/border-\[\#1B293E\]/g, 'border-os-border');
content = content.replace(/border-\[\#132238\]/g, 'border-os-border');
content = content.replace(/bg-\[\#00F2FE\]/g, 'bg-os-accent');
content = content.replace(/text-\[\#00F2FE\]/g, 'text-os-accent');
content = content.replace(/border-\[\#00F2FE\]\/30/g, 'border-os-accent/30');

fs.writeFileSync('src/components/auth/AdminLogin.tsx', content);
