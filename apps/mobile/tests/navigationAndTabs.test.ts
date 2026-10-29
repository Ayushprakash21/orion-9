import { Colors, Spacing, BorderRadius, Typography } from '../src/theme';

describe('Orion-9 Design System & Mobile Tokens', () => {
  it('enforces enterprise dark palette foundations', () => {
    expect(Colors.background).toBe('#070a10');
    expect(Colors.surfacePrimary).toBe('#0d131f');
    expect(Colors.surfaceSecondary).toBe('#131b2a');
    expect(Colors.cyan[500]).toBe('#06b6d4');
  });

  it('defines high-contrast status and severity semantics', () => {
    expect(Colors.status.critical.text).toBe('#f87171');
    expect(Colors.status.critical.solid).toBe('#ef4444');
    expect(Colors.status.high.text).toBe('#fbbf24');
    expect(Colors.status.success.text).toBe('#34d399');
  });

  it('provides accessible spacing scales and touch target layout', () => {
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(12);
    expect(Spacing.base).toBe(16);
    expect(BorderRadius.round).toBe(9999);
  });

  it('provides comprehensive typography presets', () => {
    expect(Typography.titleLarge.fontSize).toBe(22);
    expect(Typography.titleMedium.fontSize).toBe(18);
    expect(Typography.bodyMedium.fontSize).toBe(14);
    expect(Typography.labelSmall.fontSize).toBe(11);
  });
});
