with open('src/os/WindowManagerContext.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for idx, line in enumerate(lines):
    if line.strip() == "reorderDock: (newOrder: string[]) => void;" and idx > 60:
        continue
    new_lines.append(line)

with open('src/os/WindowManagerContext.tsx', 'w') as f:
    f.writelines(new_lines)


with open('src/os/components/OrionApplicationLauncher.tsx', 'r') as f:
    content = f.read()
    
# Remove OrionApplication import
content = content.replace(", OrionApplication } from '../OrionApplicationRegistry'", "} from '../OrionApplicationRegistry'")
# Replace OrionApplication type with any
content = content.replace("app: OrionApplication;", "app: any;")

# Fix openContextMenu(e, [...]) -> openContextMenu({ x: e.clientX, y: e.clientY, targetType: 'dock', targetId: app.id, items: [...] })
content = content.replace(
    "openContextMenu(e, [\n",
    "openContextMenu({\n      x: e.clientX,\n      y: e.clientY,\n      targetType: 'dock',\n      targetId: app.id,\n      items: [\n"
)
content = content.replace("      }\n    ]);", "      }\n    ]});")

with open('src/os/components/OrionApplicationLauncher.tsx', 'w') as f:
    f.write(content)

with open('src/os/components/OrionDock.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "openContextMenu(e, items);",
    "openContextMenu({\n      x: e.clientX,\n      y: e.clientY - 120,\n      targetType: 'dock',\n      targetId: id,\n      items,\n    });"
)

content = content.replace(
    "openContextMenu(e, [\n      {\n        id: 'launch-all',",
    "openContextMenu({\n      x: e.clientX - 60,\n      y: e.clientY - 100,\n      targetType: 'dock',\n      targetId: 'launcher',\n      items: [\n      {\n        id: 'launch-all',"
)
content = content.replace("      },\n    ]);", "      },\n    ]});")

with open('src/os/components/OrionDock.tsx', 'w') as f:
    f.write(content)
