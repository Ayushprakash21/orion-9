const fs = require('fs');
let content = fs.readFileSync('src/store/ToastContext.tsx', 'utf8');
content = "import { useSupplyChain } from './SupplyChainContext';\nimport { playSound } from '../os/audio';\n" + content;
fs.writeFileSync('src/store/ToastContext.tsx', content);
