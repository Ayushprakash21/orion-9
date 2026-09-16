const fs = require('fs');

let appStr = fs.readFileSync('src/App.tsx', 'utf8');

const importsToAdd = `
import { Inbound } from './components/Inbound';
import { Outbound } from './components/Outbound';
import { Predictions } from './components/Predictions';
import { Scenarios } from './components/Scenarios';
import { SyncMonitor } from './components/SyncMonitor';
import { DataQuality } from './components/DataQuality';
`;

const routesToAdd = `
            <Route path="inbound" element={<Inbound />} />
            <Route path="outbound" element={<Outbound />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="scenarios" element={<Scenarios />} />
            <Route path="sync" element={<SyncMonitor />} />
            <Route path="data-quality" element={<DataQuality />} />
`;

if (!appStr.includes('import { Inbound }')) {
    appStr = appStr.replace("import { Settings } from './components/Settings';", "import { Settings } from './components/Settings';\n" + importsToAdd);
    appStr = appStr.replace('<Route path="settings" element={<Settings />} />', '<Route path="settings" element={<Settings />} />\n' + routesToAdd);
    fs.writeFileSync('src/App.tsx', appStr);
}

