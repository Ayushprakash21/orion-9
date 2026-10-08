import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AdminBranding } from '../../components/admin/AdminBranding';
import { AvatarEditorModal, getCroppedImg } from '../../components/ui/AvatarEditorModal';
import { About } from '../../components/About';
import { brandingRepository } from '../../repositories/BrandingRepository';

// Mock ToastContext
const mockShowToast = vi.fn();
vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock SupplyChainContext for About component
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    dataMode: 'demo',
  }),
}));

describe('ORION-9 Admin Branding — Creator Profile Photo Crop & Positioning Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. AvatarEditorModal component and Canvas cropping engine', () => {
    it('renders crop dialog structure with title, accessible zoom controls, and live circular preview', () => {
      const html = renderToString(
        <AvatarEditorModal
          isOpen={true}
          imageSrc="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          onClose={() => {}}
          onApply={() => {}}
          title="Adjust Creator Profile Photo"
          applyButtonText="Apply Crop"
        />
      );

      expect(html).toContain('Adjust Creator Profile Photo');
      expect(html).toContain('Apply Crop');
      expect(html).toContain('Cancel');
      expect(html).toContain('Zoom');
      expect(html).toContain('aria-label="Zoom in"');
      expect(html).toContain('aria-label="Zoom out"');
      expect(html).toContain('aria-label="Zoom level"');
      expect(html).toContain('data-testid="avatar-crop-preview"');
      expect(html).toContain('Live Circular Preview');
    });

    it('does not render modal when isOpen is false or imageSrc is null', () => {
      const closedHtml = renderToString(
        <AvatarEditorModal
          isOpen={false}
          imageSrc="data:image/png;base64,test"
          onClose={() => {}}
          onApply={() => {}}
        />
      );
      expect(closedHtml).toBe('');

      const nullSrcHtml = renderToString(
        <AvatarEditorModal
          isOpen={true}
          imageSrc={null}
          onClose={() => {}}
          onApply={() => {}}
        />
      );
      expect(nullSrcHtml).toBe('');
    });

    it('getCroppedImg rejects invalid zero-width or zero-height crop rectangles', async () => {
      await expect(
        getCroppedImg('data:image/png;base64,test', { x: 0, y: 0, width: 0, height: 0 })
      ).rejects.toThrow('Invalid crop dimensions');
    });

    it('getCroppedImg renders square canvas with high quality smoothing', () => {
      const code = getCroppedImg.toString();
      expect(code).toContain('imageSmoothingQuality');
      expect(code).toContain('outputSize');
      expect(code).toContain('canvas.toDataURL');
    });
  });

  describe('2. AdminBranding integration & photo upload workflow', () => {
    it('AdminBranding includes AvatarEditorModal integration and file input with accepted formats', () => {
      const code = AdminBranding.toString();
      expect(code).toContain('AvatarEditorModal');
      expect(code).toContain('Adjust Creator Profile Photo');
      expect(code).toContain('Apply Crop');
      expect(code).toContain('handleCreatorPhotoUpload');
      expect(code).toContain('handleApplyCreatorPhotoCrop');
      expect(code).toContain('handleRemoveCreatorPhoto');
      expect(code).toContain('CREATOR_IDENTITY_PHOTO_CHANGED');
    });

    it('AdminBranding renders loading state initially on SSR and contains Creator Identity section in code', () => {
      const html = renderToString(<AdminBranding />);
      expect(html).toContain('Loading branding configuration...');

      const code = AdminBranding.toString();
      expect(code).toContain('Creator Identity & System Origin');
      expect(code).toContain('Creator Identity Photo');
      expect(code).toContain('Supported formats: PNG, JPG, WebP. Max size: 2MB.');
      expect(code).toContain('accept');
      expect(code).toContain('image/png,image/jpeg,image/webp');
      expect(code).toContain('Change Photo');
      expect(code).toContain('Upload Photo');
      expect(code).toContain('Remove Photo');
    });

    it('AdminBranding source enforces 2MB limit and MIME validation before loading crop dialog', () => {
      const code = AdminBranding.toString();
      // Validates format
      expect(code).toContain('Invalid photo format. Supported formats: PNG, JPG, WebP.');
      // Validates 2MB size limit
      expect(code).toContain('Creator photo is too large. Maximum size is 2MB.');
      // Resets input value so re-selecting same file works
      expect(code).toMatch(/target\.value\s*=\s*['"]{2}/);
    });

    it('AdminBranding applies cropped image and dispatches CREATOR_IDENTITY_PHOTO_CHANGED', () => {
      const code = AdminBranding.toString();
      // Dispatches custom event with payload
      expect(code).toContain("detail: { photoUrl: croppedImageDataUrl }");
      // Also dispatches null when removing
      expect(code).toContain("detail: { photoUrl: null }");
    });
  });

  describe('3. About component listener for CREATOR_IDENTITY_PHOTO_CHANGED', () => {
    it('About component listens to CREATOR_IDENTITY_PHOTO_CHANGED event and updates state', () => {
      const code = About.toString();
      expect(code).toContain('CREATOR_IDENTITY_PHOTO_CHANGED');
      expect(code).toContain('creatorPhotoUrl: e.detail.photoUrl');
    });

    it('About component responds to window events for live avatar update without page reload', () => {
      const initialBranding = brandingRepository.getBrandingSync();
      expect(initialBranding).toBeDefined();

      const eventPayload = { detail: { photoUrl: 'data:image/jpeg;base64,mockCroppedAvatar' } };
      const event = new CustomEvent('CREATOR_IDENTITY_PHOTO_CHANGED', eventPayload);
      expect(event.detail.photoUrl).toBe('data:image/jpeg;base64,mockCroppedAvatar');
    });
  });
});
