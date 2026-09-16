const fs = require('fs');
let code = fs.readFileSync('src/os/WindowManagerContext.tsx', 'utf8');

const targetStr = `  const [dockPinnedAppsRecord, setDockPinnedAppsRecord] = useState<Record<WorkspaceId, string[]>>(() => {`;
const activeWorkspaceStr = `  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId>('operations');`;

// Remove the original activeWorkspaceId declaration
code = code.replace(activeWorkspaceStr, '');

// Insert it right before dockPinnedAppsRecord
code = code.replace(targetStr, activeWorkspaceStr + '\n\n' + targetStr);

fs.writeFileSync('src/os/WindowManagerContext.tsx', code);
