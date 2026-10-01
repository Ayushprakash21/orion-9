import { test, expect } from '@playwright/test';

test('Execute Phase 2 Real Browser Diagnostics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion9_database_environment', 'DEMO');
      localStorage.setItem('orion_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
      localStorage.setItem('orion_system_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
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

  await page.goto('/');

  // Wait for desktop canvas
  const canvas = page.locator('[data-desktop-canvas="true"]');
  await expect(canvas).toBeVisible({ timeout: 10000 });

  // 1. Locate [data-desktop-canvas="true"] and print rect & ancestors
  const canvasDiag = await page.evaluate(() => {
    const el = document.querySelector('[data-desktop-canvas="true"]');
    if (!el) return { error: 'canvas not found' };
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);

    // Collect ancestor chain with stacking context details
    const ancestors: any[] = [];
    let cur: Element | null = el.parentElement;
    while (cur) {
      const cs = window.getComputedStyle(cur);
      ancestors.push({
        tag: cur.tagName,
        id: cur.id,
        className: cur.className,
        position: cs.position,
        zIndex: cs.zIndex,
        overflow: cs.overflow,
        pointerEvents: cs.pointerEvents,
        transform: cs.transform,
        clipPath: cs.clipPath,
        isolation: cs.isolation,
        contain: cs.contain
      });
      cur = cur.parentElement;
    }

    // Inspect widgets in DOM
    const widgetEls = Array.from(document.querySelectorAll('[data-desktop-canvas="true"] > div')).filter(
      d => !d.hasAttribute('data-shortcut-id')
    );
    const widgetsInfo = widgetEls.map(w => {
      const r = w.getBoundingClientRect();
      const cs = window.getComputedStyle(w);
      return {
        className: w.className,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom },
        styleLeft: (w as HTMLElement).style.left,
        styleTop: (w as HTMLElement).style.top,
        zIndex: cs.zIndex,
        visibility: cs.visibility,
        display: cs.display,
        opacity: cs.opacity
      };
    });

    return {
      canvasRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      canvasComputed: {
        position: computed.position,
        zIndex: computed.zIndex,
        overflow: computed.overflow,
        pointerEvents: computed.pointerEvents,
      },
      ancestors,
      widgetsCount: widgetEls.length,
      widgetsInfo
    };
  });

  console.log('--- 1. DESKTOP CANVAS & STACKING CONTEXT DIAGNOSTICS ---');
  console.log(JSON.stringify(canvasDiag, null, 2));

  // Right-click desktop canvas to open context menu
  await canvas.click({ button: 'right', position: { x: 400, y: 300 } });

  // 2. Locate [data-testid="desktop-context-menu"]
  const menuLocator = page.locator('[data-testid="desktop-context-menu"]');
  await expect(menuLocator).toBeVisible({ timeout: 5000 });

  const menuDiag = await page.evaluate(() => {
    const menu = document.querySelector('[data-testid="desktop-context-menu"]');
    const widgetsBtn = document.querySelector('[data-action="widgets"]');
    if (!menu || !widgetsBtn) return { error: 'menu or widgetsBtn not found' };

    const mRect = menu.getBoundingClientRect();
    const wRect = widgetsBtn.getBoundingClientRect();
    const centerX = wRect.left + wRect.width / 2;
    const centerY = wRect.top + wRect.height / 2;

    const topEl = document.elementFromPoint(centerX, centerY);
    const allEls = document.elementsFromPoint(centerX, centerY).slice(0, 10);

    const ancestorChain: string[] = [];
    let cur = topEl;
    while (cur) {
      ancestorChain.push(`${cur.tagName}#${cur.id || ''}.${cur.className || ''}`);
      cur = cur.parentElement;
    }

    return {
      menuRect: { x: mRect.x, y: mRect.y, width: mRect.width, height: mRect.height },
      widgetsBtnRect: { x: wRect.x, y: wRect.y, width: wRect.width, height: wRect.height },
      center: { centerX, centerY },
      elementFromPoint: topEl ? {
        tagName: topEl.tagName,
        id: topEl.id,
        className: topEl.className,
        dataTestid: topEl.getAttribute('data-testid'),
        dataAction: topEl.getAttribute('data-action'),
        ancestorChain
      } : null,
      elementsFromPoint: allEls.map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        dataTestid: el.getAttribute('data-testid'),
        dataAction: el.getAttribute('data-action')
      }))
    };
  });

  console.log('--- 2-6. CONTEXT MENU & HIT TESTING DIAGNOSTICS ---');
  console.log(JSON.stringify(menuDiag, null, 2));

  // 7. Click the actual Widgets button
  const widgetsBtn = page.locator('[data-action="widgets"]');
  await widgetsBtn.click();

  // Verify: desktop-context-menu closes
  await expect(menuLocator).not.toBeVisible({ timeout: 3000 });

  // 8-10. Inspect Widget Gallery Modal
  const galleryDiag = await page.evaluate(() => {
    // Find gallery root
    const modal = document.querySelector('[data-testid="widget-gallery"]') || 
      Array.from(document.querySelectorAll('div')).find(d => d.textContent?.includes('Orion Widget Gallery'));
    if (!modal) return { error: 'gallery not found in DOM' };

    const rect = modal.getBoundingClientRect();
    const cs = window.getComputedStyle(modal);

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topEl = document.elementFromPoint(centerX, centerY);
    const allEls = document.elementsFromPoint(centerX, centerY).slice(0, 5);

    return {
      selector: modal.tagName + (modal.id ? '#' + modal.id : '') + '.' + modal.className.substring(0, 30),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      computed: {
        position: cs.position,
        zIndex: cs.zIndex,
        pointerEvents: cs.pointerEvents,
        visibility: cs.visibility,
        display: cs.display,
        opacity: cs.opacity
      },
      topElementAtCenter: topEl ? {
        tagName: topEl.tagName,
        className: topEl.className,
        text: topEl.textContent?.slice(0, 40)
      } : null,
      elementsAtCenter: allEls.map(el => ({
        tagName: el.tagName,
        className: el.className
      }))
    };
  });

  console.log('--- 8-10. WIDGET GALLERY DIAGNOSTICS ---');
  console.log(JSON.stringify(galleryDiag, null, 2));
});
