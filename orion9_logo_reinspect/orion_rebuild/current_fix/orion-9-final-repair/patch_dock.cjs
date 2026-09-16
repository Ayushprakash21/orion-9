const fs = require('fs');

let ctx = fs.readFileSync('src/os/WindowManagerContext.tsx', 'utf8');

// Replace state definition
const regexState = /const \[dockPinnedApps, setDockPinnedApps\] = useState<string\[\]>\(\(\) => \{[\s\S]*?\}\);/;
const newState = `
  const [dockPinnedAppsRecord, setDockPinnedAppsRecord] = useState<Record<WorkspaceId, string[]>>(() => {
    let saved: Record<WorkspaceId, string[]> | null = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('orion_dock_workspaces');
        if (raw) saved = JSON.parse(raw);
      } catch (e) {}
    }
    
    if (saved) return saved;
    
    const record = {} as Record<WorkspaceId, string[]>;
    WORKSPACES.forEach(ws => {
      record[ws.id] = ws.pinnedApps || [];
    });
    return record;
  });

  const dockPinnedApps = dockPinnedAppsRecord[activeWorkspaceId] || [];

  const setDockPinnedApps = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setDockPinnedAppsRecord(prev => {
      const current = prev[activeWorkspaceId] || [];
      const nextArr = typeof updater === 'function' ? updater(current) : updater;
      const next = { ...prev, [activeWorkspaceId]: nextArr };
      if (typeof window !== 'undefined') {
        localStorage.setItem('orion_dock_workspaces', JSON.stringify(next));
      }
      return next;
    });
  }, [activeWorkspaceId]);
`;

ctx = ctx.replace(regexState, newState);

// Also remove the old useEffect that saves orion_dock
const regexEffect = /useEffect\(\(\) => \{\n\s*localStorage\.setItem\('orion_dock', JSON\.stringify\(dockPinnedApps\)\);\n\s*\}, \[dockPinnedApps\]\);/;
ctx = ctx.replace(regexEffect, '');

fs.writeFileSync('src/os/WindowManagerContext.tsx', ctx);

let dock = fs.readFileSync('src/os/components/OrionDock.tsx', 'utf8');
dock = dock.replace(
  /const openAppIds = Object.keys\(windows\).filter\(id => windows\[id\]\?.state !== 'closed'\);/,
  "const openAppIds = Object.keys(windows).filter(id => windows[id]?.state !== 'closed' && windows[id]?.workspace === activeWorkspaceId);"
);
fs.writeFileSync('src/os/components/OrionDock.tsx', dock);
