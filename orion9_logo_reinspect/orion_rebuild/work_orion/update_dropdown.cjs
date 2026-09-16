const fs = require('fs');
let code = fs.readFileSync('src/components/ui/SearchableDropdown.tsx', 'utf8');

// We want to ensure it stays within the viewport.
// If it's near the right edge, we might need to adjust 'left' or 'right'

// Let's replace the updatePosition logic:

const newUpdatePosition = `
  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      const dropdownHeight = 300; // estimated max height
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      let left = rect.left;
      const minWidth = viewportWidth < 640 ? viewportWidth - 32 : Math.max(rect.width, 300);
      
      // Prevent horizontal overflow
      if (left + minWidth > viewportWidth - 16) {
        left = viewportWidth - minWidth - 16;
      }
      
      setDropdownPosition({
        top: openUpward ? rect.top - 8 : rect.bottom + 4,
        left: Math.max(16, left),
        width: viewportWidth < 640 ? viewportWidth - 32 : Math.max(rect.width, 300),
        openUpward
      });
    }
  };
`;

code = code.replace(/const updatePosition = \(\) => \{[\s\S]*?  \};\n/m, newUpdatePosition);

fs.writeFileSync('src/components/ui/SearchableDropdown.tsx', code);
