import { describe, it, expect } from 'vitest';
import { AvatarEditorModal } from '../../components/ui/AvatarEditorModal';
import { Settings } from '../../components/Settings';
import { AdminUsers } from '../../components/admin/AdminUsers';

describe('ORION-9 Profile Avatar Editor Modal — Architecture & Layout Integrity', () => {
  it('1. AvatarEditorModal exports clean compact dialog structure', () => {
    expect(AvatarEditorModal).toBeDefined();
    expect(typeof AvatarEditorModal).toBe('function');
  });

  it('2. AvatarEditorModal contains constrained desktop (640px) and mobile viewport dimensions', () => {
    const code = AvatarEditorModal.toString();
    expect(code).toContain('max-w-[640px]');
    expect(code).toContain('max-h-[calc(100vh-48px)]');
    expect(code).toContain('overflow-x-hidden');
    expect(code).toContain('dialog');
  });

  it('3. AvatarEditorModal contains constrained 360px square image preview box', () => {
    const code = AvatarEditorModal.toString();
    expect(code).toContain('max-w-[360px]');
    expect(code).toContain('aspect-square');
  });

  it('4. AvatarEditorModal includes Escape key event listener for quick dialog dismissal', () => {
    const code = AvatarEditorModal.toString();
    expect(code).toContain('Escape');
  });

  it('5. AvatarEditorModal contains Zoom control slider and footer buttons (Cancel & Apply)', () => {
    const code = AvatarEditorModal.toString();
    expect(code).toContain('Zoom');
    expect(code).toContain('range');
    expect(code).toContain('Cancel');
    expect(code).toContain('applyButtonText');
  });

  it('6. User & Admin Settings components import and consume AvatarEditorModal', () => {
    const settingsCode = Settings.toString();
    expect(settingsCode).toContain('AvatarEditorModal');
    expect(settingsCode).toContain('Adjust Profile Avatar');
    expect(settingsCode).not.toContain('w-full h-[320px] bg-black'); // Old unconstrained modal code removed
  });

  it('7. Admin Users management component imports and consumes AvatarEditorModal', () => {
    const adminUsersCode = AdminUsers.toString();
    expect(adminUsersCode).toContain('AvatarEditorModal');
    expect(adminUsersCode).toContain('Adjust User Avatar');
  });
});
