with open('src/os/WindowManagerContext.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for idx, line in enumerate(lines):
    if idx == 563:
        new_lines.append(line)
        new_lines.append("\n  const setWorkspace = useCallback((id: WorkspaceId) => {\n")
    else:
        new_lines.append(line)

with open('src/os/WindowManagerContext.tsx', 'w') as f:
    f.writelines(new_lines)
