const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add Action type if not imported
if (!content.includes('Action,')) {
  content = content.replace(/import \{ ([^}]+) \} from '\.\.\/types';/, (match, p1) => {
     return `import { ${p1}, Action } from '../types';`;
  });
}

// Add actions state
if (!content.includes('actions: Action[]')) {
  content = content.replace(/exceptions: Exception\[\];/g, "exceptions: Exception[];\n  actions: Action[];");
  
  // Add generateActions to context
  content = content.replace(/setSettings: \(s: any\) => void;/g, "setSettings: (s: any) => void;\n  executeAction: (actionId: string) => void;\n  cancelAction: (actionId: string) => void;");
  
  const stateRegex = /const \[exceptions, setExceptions\] = useState<Exception\[\]>\(\[\]\);/;
  content = content.replace(stateRegex, "const [exceptions, setExceptions] = useState<Exception[]>([]);\n  const [actions, setActions] = useState<Action[]>([]);");
  
  // Also pass actions and executeAction and cancelAction to provider value
  content = content.replace(/exceptions,[\s\n]+settings,/g, "exceptions,\n    actions,\n    executeAction,\n    cancelAction,\n    settings,");
}

fs.writeFileSync(file, content);
console.log("SupplyChainContext updated for actions");
