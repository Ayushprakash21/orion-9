import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';

const distDir = path.resolve(__dirname, '../../../dist/client');

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

describe('ORION-9 Avatar Crop UI — Real Browser-Level Layout, Mask & Interaction Integrity', () => {
  let server: http.Server;
  let serverPort: number;
  let browser: Browser;
  const testImgPath = path.resolve(__dirname, 'temp_test_avatar.png');

  beforeAll(async () => {
    // 1. Start ephemeral HTTP server serving dist/client
    server = http.createServer((req, res) => {
      let reqPath = (req.url || '/').split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(distDir, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexPath = path.join(distDir, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexPath).pipe(res);
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          serverPort = addr.port;
        }
        resolve();
      });
    });

    // 2. Launch Puppeteer headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // 3. Write a small 100x100 test PNG
    const samplePngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAPElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GIN/AACr2WdCQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImgPath, samplePngBuffer);
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.close();
    }
    if (fs.existsSync(testImgPath)) {
      try {
        fs.unlinkSync(testImgPath);
      } catch {}
    }
  });

  it('opens crop dialog, validates computed cropper layout, circular mask, zoom and mouse drag interactions', async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Seed admin auth and preferences
    await page.evaluateOnNewDocument(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion9_database_environment', 'DEMO');
        localStorage.setItem('orion_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
        localStorage.setItem('orion_system_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
        localStorage.setItem('orion-appearance-preferences', JSON.stringify({
          version: 1,
          themeId: 'graphite',
          appearanceMode: 'dark'
        }));
        localStorage.setItem('orion_auth_session', JSON.stringify({
          user: {
            id: 'local-admin',
            username: 'admin',
            fullName: 'Orion-9 Administrator',
            displayName: 'Admin',
            email: 'admin@orion.network',
            role: 'platform_admin',
            organizationId: 'ORION_PLATFORM',
            organizationName: 'ORION_PLATFORM',
            department: 'IT Administration'
          },
          organization: {
            id: 'ORION_PLATFORM',
            name: 'ORION_PLATFORM',
            status: 'active'
          },
          permissions: ['all'],
          environment: 'DEMO',
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }));
      } catch (e) {}
    });

    // 1. Navigate to /admin/branding
    await page.goto(`http://127.0.0.1:${serverPort}/admin/branding`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for Admin Branding content to mount
    await page.waitForFunction(
      () => document.body.innerText.includes('Creator Identity') || document.body.innerText.includes('Platform Branding'),
      { timeout: 10000 }
    );

    // 2. Select file for Creator Identity photo
    const fileInputs = await page.$$('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThanOrEqual(1);

    // Creator photo file input is the second file input on page
    const creatorFileInput = fileInputs.length > 1 ? fileInputs[1] : fileInputs[0];
    await creatorFileInput.uploadFile(testImgPath);

    // 3. Wait for real AvatarEditorModal dialog to mount and display
    const dialog = await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    expect(dialog).not.toBeNull();

    // 4. Inspect computed layout and styles of react-easy-crop workspace
    const metrics = await page.evaluate(() => {
      const container = document.querySelector('.reactEasyCrop_Container');
      const cropArea = document.querySelector('.reactEasyCrop_CropArea');
      const image = document.querySelector('.reactEasyCrop_Image');
      const preview = document.querySelector('[data-testid="avatar-crop-preview"]');

      const cStyle = container ? window.getComputedStyle(container) : null;
      const caStyle = cropArea ? window.getComputedStyle(cropArea) : null;
      const imgStyle = image ? window.getComputedStyle(image) : null;

      const cRect = container ? container.getBoundingClientRect() : null;
      const caRect = cropArea ? cropArea.getBoundingClientRect() : null;
      const iRect = image ? image.getBoundingClientRect() : null;

      return {
        container: container ? {
          position: cStyle?.position,
          display: cStyle?.display,
          width: cRect?.width,
          height: cRect?.height,
          x: cRect?.x,
          y: cRect?.y
        } : null,
        cropArea: cropArea ? {
          position: caStyle?.position,
          borderRadius: caStyle?.borderRadius,
          hasBoxShadow: !!caStyle?.boxShadow && caStyle?.boxShadow !== 'none',
          width: caRect?.width,
          height: caRect?.height
        } : null,
        image: image ? {
          hasTransform: !!imgStyle?.transform && imgStyle?.transform !== 'none',
          width: iRect?.width,
          height: iRect?.height
        } : null,
        preview: preview ? {
          width: preview.clientWidth,
          height: preview.clientHeight,
          hasImg: !!preview.querySelector('img')
        } : null
      };
    });

    // 5. Assertions on real rendered geometry
    expect(metrics.container).not.toBeNull();
    expect(metrics.container?.position).toBe('absolute');
    expect(metrics.container?.display).toBe('flex');
    expect(metrics.container?.width).toBeGreaterThanOrEqual(200);
    expect(metrics.container?.height).toBeGreaterThanOrEqual(200);

    // 6. Assertions on circular mask
    expect(metrics.cropArea).not.toBeNull();
    expect(metrics.cropArea?.position).toBe('absolute');
    expect(metrics.cropArea?.borderRadius).toBe('50%');
    expect(metrics.cropArea?.hasBoxShadow).toBe(true);
    expect(metrics.cropArea?.width).toBeGreaterThanOrEqual(50);
    expect(metrics.cropArea?.height).toBeGreaterThanOrEqual(50);

    // 7. Assertions on live circular preview
    expect(metrics.preview).not.toBeNull();
    expect(metrics.preview?.width).toBeGreaterThan(0);
    expect(metrics.preview?.height).toBeGreaterThan(0);
    expect(metrics.preview?.hasImg).toBe(true);

    // 8. Test Zoom Controls interaction
    const zoomSlider = await page.$('input[aria-label="Zoom level"]');
    const zoomInBtn = await page.$('button[aria-label="Zoom in"]');
    expect(zoomSlider).not.toBeNull();
    expect(zoomInBtn).not.toBeNull();

    const initialZoom = await page.evaluate(el => (el as HTMLInputElement).value, zoomSlider);
    await zoomInBtn!.click();
    await new Promise(r => setTimeout(r, 200));
    const zoomedInVal = await page.evaluate(el => (el as HTMLInputElement).value, zoomSlider);
    expect(Number(zoomedInVal)).toBeGreaterThan(Number(initialZoom));

    // 9. Test Mouse Drag Interaction
    const containerX = metrics.container!.x!;
    const containerY = metrics.container!.y!;
    const containerW = metrics.container!.width!;
    const containerH = metrics.container!.height!;
    const startX = containerX + containerW / 2;
    const startY = containerY + containerH / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 20, startY + 20, { steps: 5 });
    await page.mouse.up();

    // 10. Test Apply Crop and verify output
    const applyBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent && b.textContent.includes('Apply Crop'));
    });
    expect(applyBtn).not.toBeNull();
    await (applyBtn as any).click();

    // Wait for dialog to close
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 5000 });
    const dialogClosed = await page.$('[role="dialog"]');
    expect(dialogClosed).toBeNull();

    // 11. Verify creator photo avatar on Admin Branding updated with durable data URL
    const finalPhoto = await page.evaluate(() => {
      const img = document.querySelector('img[alt="Ayush Prakash"]');
      return img ? (img as HTMLImageElement).src : null;
    });
    expect(finalPhoto).not.toBeNull();
    expect(finalPhoto).toContain('data:image/');

    await page.close();
  }, 30000);
});
