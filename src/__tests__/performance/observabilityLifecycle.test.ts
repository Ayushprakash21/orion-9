import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Observability Component Lifecycle & FPS Decoupling', () => {
  it('does NOT include fps in useEffect dependency array to prevent remount loop', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/Observability.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // Should NOT have }, [fps])
    expect(content).not.toMatch(/\},\s*\[fps\]\);/);

    // Should use empty dependency array for stable lifecycle
    expect(content).toMatch(/\},\s*\[\]\);/);

    // Should use fpsRef for decoupled state tracking
    expect(content).toContain('fpsRef');
  });
});
