import re

with open('src/os/WindowManagerContext.tsx', 'r') as f:
    content = f.read()

# Add reorderDock to WindowManagerContextState
content = content.replace(
    "dockPinnedApps: string[];",
    "dockPinnedApps: string[];\n  reorderDock: (newOrder: string[]) => void;"
)

# Add reorderDock to WindowManagerProvider
content = content.replace(
    "const unpinFromDock = useCallback((id: string) => {\n    setDockPinnedApps(prev => prev.filter(appId => appId !== id));\n  }, []);",
    "const unpinFromDock = useCallback((id: string) => {\n    setDockPinnedApps(prev => prev.filter(appId => appId !== id));\n  }, []);\n\n  const reorderDock = useCallback((newOrder: string[]) => {\n    setDockPinnedApps(newOrder);\n  }, []);"
)

# Add reorderDock to value exported
content = content.replace(
    "pinToDock,\n    unpinFromDock,\n",
    "pinToDock,\n    unpinFromDock,\n    reorderDock,\n"
)

with open('src/os/WindowManagerContext.tsx', 'w') as f:
    f.write(content)
