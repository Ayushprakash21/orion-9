import re

with open('src/os/components/OrionDesktop.tsx', 'r') as f:
    desktop = f.read()

# Add framer-motion AnimatePresence to OrionDesktop
desktop = desktop.replace(
    "import { OrionWindow } from './OrionWindow';",
    "import { OrionWindow } from './OrionWindow';\nimport { AnimatePresence } from 'motion/react';"
)

desktop = desktop.replace(
    "{currentWorkspaceWindows.map(win => (\n          <OrionWindow\n            key={win.id}\n            window={win}\n            isActive={win.id === activeAppId}\n          />\n        ))}",
    "<AnimatePresence>\n          {currentWorkspaceWindows.map(win => (\n            <OrionWindow\n              key={win.id}\n              window={win}\n              isActive={win.id === activeAppId}\n            />\n          ))}\n        </AnimatePresence>"
)

with open('src/os/components/OrionDesktop.tsx', 'w') as f:
    f.write(desktop)

with open('src/os/components/OrionWindow.tsx', 'r') as f:
    window = f.read()

window = window.replace(
    "import { cn } from '../../lib/utils';",
    "import { cn } from '../../lib/utils';\nimport { motion } from 'motion/react';"
)

window = window.replace(
    "<div\n      data-window-id={win.id}\n      onPointerDown={() => focusApplication(win.id)}\n      style={windowStyles}",
    """<motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ 
        opacity: isMinimized ? 0 : 1, 
        scale: isMinimized ? 0.75 : 1, 
        y: isMinimized ? 80 : 0 
      }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      data-window-id={win.id}
      onPointerDown={() => focusApplication(win.id)}
      style={windowStyles}"""
)

window = window.replace(
    '        "transition-[opacity,transform] duration-200 ease-out",\n        isMinimized && "opacity-0 pointer-events-none scale-75 translate-y-32",\n        !isMinimized && "opacity-100 scale-100 translate-y-0",',
    '        isMinimized && "pointer-events-none",'
)

window = window.replace(
    "</React.Fragment>;\n  }\n}\n",
    "</React.Fragment>;\n  }\n}\n"
)

# replace the closing tag of the main div
window_lines = window.split('\n')
for i in range(len(window_lines)-1, -1, -1):
    if window_lines[i].strip() == '</div>':
        window_lines[i] = window_lines[i].replace('</div>', '</motion.div>')
        break

with open('src/os/components/OrionWindow.tsx', 'w') as f:
    f.write('\n'.join(window_lines))

