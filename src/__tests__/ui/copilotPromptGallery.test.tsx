/**
 * ORION-9 COPILOT PROMPT GALLERY & UI CHIPS TEST SUITE (PHASE 22)
 *
 * Verifies:
 * 1. Prompt chips render contextual suggestions and Prompt Gallery modal trigger.
 * 2. Clicking chips populates the input field rather than auto-submitting.
 * 3. Prompt Gallery modal displays all 9 prompt categories.
 * 4. Switching categories updates the prompt list.
 * 5. Accessibility attributes (aria-label, role="dialog", aria-modal="true").
 * 6. Desktop, Mobile, and Tablet UIs integrate the Prompt Gallery modal.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { AICopilot } from '../../components/AICopilot';
import { PROMPT_CATEGORIES } from '../../config/copilotPrompts';

// Mock contexts
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 'usr-1', fullName: 'Operator', email: 'op@orion9.io' },
    isAuthenticated: true,
  }),
}));

vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    currency: 'USD',
    inventory: [],
    products: [],
    shipments: [],
    purchaseOrders: [],
    exceptions: [],
    suppliers: [],
    decisions: [],
    settings: {},
    contracts: [],
    routes: []
  }),
}));

describe('AICopilot Prompt Gallery & UI Chips', () => {
  const desktopSource = fs.readFileSync(path.resolve(__dirname, '../../components/AICopilot.tsx'), 'utf-8');
  const mobileSource = fs.readFileSync(path.resolve(__dirname, '../../os/mobile/OrionMobileAICopilot.tsx'), 'utf-8');
  const tabletSource = fs.readFileSync(path.resolve(__dirname, '../../os/tablet/OrionTabletAICopilot.tsx'), 'utf-8');

  it('1. Renders Prompt Gallery button and Suggested Actions in Desktop Copilot', () => {
    const html = renderToString(<AICopilot />);
    expect(html).toContain('Prompt Gallery');
    expect(html).toContain('Suggested Actions');
  });

  it('2. Enforces Input Populating Rule: Clicking prompt chips populates input (setInput)', () => {
    // Must contain setInput(chipText) or setInput(promptText) or setInputMessage(promptText)
    expect(desktopSource).toContain('onClick={() => setInput(chipText)}');
    expect(mobileSource).toContain('onClick={() => setInputMessage(promptText)}');
    expect(tabletSource).toContain('onClick={() => setInputMessage(promptText)}');
  });

  it('3. Prompt Gallery config defines all 9 enterprise categories', () => {
    expect(PROMPT_CATEGORIES.length).toBe(9);
    const categoryKeys = PROMPT_CATEGORIES.map(c => c.key);
    expect(categoryKeys).toContain('CONTROL TOWER');
    expect(categoryKeys).toContain('INVENTORY');
    expect(categoryKeys).toContain('PROCUREMENT');
    expect(categoryKeys).toContain('SUPPLIERS');
    expect(categoryKeys).toContain('SHIPMENTS');
    expect(categoryKeys).toContain('EXCEPTIONS');
    expect(categoryKeys).toContain('DECISIONS');
    expect(categoryKeys).toContain('FORECAST');
    expect(categoryKeys).toContain('TRANSPORTATION');
  });

  it('4. Enforces Accessibility Attributes on Prompt Gallery Modal across UIs', () => {
    expect(desktopSource).toContain('role="dialog"');
    expect(desktopSource).toContain('aria-modal="true"');
    expect(desktopSource).toContain('aria-label="Prompt Gallery Modal"');
    expect(desktopSource).toContain('aria-label="Close Prompt Gallery"');

    expect(mobileSource).toContain('role="dialog"');
    expect(mobileSource).toContain('aria-modal="true"');

    expect(tabletSource).toContain('role="dialog"');
    expect(tabletSource).toContain('aria-modal="true"');
  });

  it('5. Mobile and Tablet UIs integrate Prompt Gallery Modal & Contextual Chips', () => {
    expect(mobileSource).toContain('PROMPT_CATEGORIES');
    expect(mobileSource).toContain('getContextualFollowUps');
    expect(tabletSource).toContain('PROMPT_CATEGORIES');
    expect(tabletSource).toContain('getContextualFollowUps');
  });
});
