const fs = require('fs');

// Update App.tsx
let appStr = fs.readFileSync('src/App.tsx', 'utf8');
if (!appStr.includes('Integrations')) {
    appStr = appStr.replace("import { DataCenter } from './components/DataCenter';", "import { DataCenter } from './components/DataCenter';\nimport { Integrations } from './components/Integrations';");
    appStr = appStr.replace('<Route path="data" element={<DataCenter />} />', '<Route path="connect" element={<Integrations />} />\n            <Route path="data" element={<DataCenter />} />');
    fs.writeFileSync('src/App.tsx', appStr);
}

// Update Sidebar.tsx
let sidebarStr = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
if (!sidebarStr.includes('Integrations')) {
    sidebarStr = sidebarStr.replace("import {\n  LayoutDashboard,", "import {\n  LayoutDashboard,\n  Network,");
    sidebarStr = sidebarStr.replace("{ name: 'Data Center', path: '/data', icon: Database },", "{ name: 'Integrations', path: '/connect', icon: Network },\n  { name: 'Data Center', path: '/data', icon: Database },");
    fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarStr);
}

// Update Header.tsx
let headerStr = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
headerStr = headerStr.replace("'/data': 'DATA CORE',", "'/connect': 'ORION CONNECT',\n  '/data': 'DATA CORE',");
fs.writeFileSync('src/components/layout/Header.tsx', headerStr);

