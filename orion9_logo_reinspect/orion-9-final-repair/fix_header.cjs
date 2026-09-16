const fs = require('fs');
let headerStr = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

headerStr = headerStr.replace(
  "'/settings': 'SYSTEM PARAMS',",
  "'/settings': 'SYSTEM PARAMS',\n  '/inbound': 'INBOUND COMMAND',\n  '/outbound': 'OUTBOUND COMMAND',\n  '/predictions': 'PREDICTIVE INTELLIGENCE',\n  '/scenarios': 'SCENARIO ENGINE',\n  '/data-quality': 'DATA QUALITY',\n  '/sync': 'SYNC MONITOR',"
);

headerStr = headerStr.replace(
  "'/': 'TELEMETRY DASHBOARD',",
  "'/': 'COMMAND CENTER',"
);

// Add Global command bar style for Ask Orion
headerStr = headerStr.replace(
  'placeholder="QUERY DATABASE..."',
  'placeholder="ASK ORION ABOUT INVENTORY, SUPPLIERS, RISKS OR ACTIONS..."'
);

fs.writeFileSync('src/components/layout/Header.tsx', headerStr);
