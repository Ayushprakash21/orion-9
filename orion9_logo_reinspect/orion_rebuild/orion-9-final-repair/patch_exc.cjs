const fs = require('fs');
let code = fs.readFileSync('src/components/Exceptions.tsx', 'utf8');
code = code.replace("import { Filter, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';", "import { Filter, AlertTriangle, ShieldAlert, Zap, Activity } from 'lucide-react';");
fs.writeFileSync('src/components/Exceptions.tsx', code);
