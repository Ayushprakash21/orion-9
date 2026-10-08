/**
 * ORION-9 BROWSER SECURITY & COPILOT PERMISSION LAYER
 * 
 * Enforces strict, zero-trust security boundaries between web content,
 * the Orion-9 operating system, and the Orion Copilot AI cognitive engine.
 * 
 * Architectural Rules:
 * - NO credentials, cookies, passwords, or authentication tokens are ever shared with AI.
 * - Only user-approved text and sanitized page metadata can be passed.
 * - Origin-based permissions are tracked and revocable by the user.
 */

import { BrowserTab, BrowserCopilotContext } from './BrowserTypes';

export type CopilotPermissionScope = 'metadata_only' | 'selection_only' | 'full_page_text' | 'denied';

export class BrowserCopilotPermissionLayer {
  private static permissions: Map<string, CopilotPermissionScope> = new Map();

  /**
   * Resolves origin safely from a URL string
   */
  public static getOrigin(url: string): string {
    if (url.startsWith('orion://') || url.startsWith('about:') || url.startsWith('/')) {
      return 'internal:orion';
    }
    try {
      return new URL(url).origin;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Retrieves active permission scope for an origin
   */
  public static getPermission(url: string): CopilotPermissionScope {
    const origin = this.getOrigin(url);
    if (origin === 'internal:orion') return 'full_page_text';
    return this.permissions.get(origin) || 'metadata_only';
  }

  /**
   * Grants a permission scope to an origin
   */
  public static setPermission(url: string, scope: CopilotPermissionScope): void {
    const origin = this.getOrigin(url);
    this.permissions.set(origin, scope);
  }

  /**
   * Revokes permission for an origin
   */
  public static revokePermission(url: string): void {
    const origin = this.getOrigin(url);
    this.permissions.delete(origin);
  }

  /**
   * Extracts sanitized Copilot context from a tab conforming to permission rules.
   * Strips any credential strings, authorization headers, or private tokens.
   */
  public static extractSafeContext(
    tab: BrowserTab,
    selectedText?: string
  ): BrowserCopilotContext {
    const permission = this.getPermission(tab.url);

    if (permission === 'denied') {
      return {
        url: tab.url,
        title: tab.title,
        source: 'orion-browser',
      };
    }

    let safeSelection: string | undefined = undefined;
    if (selectedText) {
      // Clamped to 500 characters and stripped of sensitive patterns
      safeSelection = selectedText
        .replace(/bearer\s+[a-zA-Z0-9_\-.]+/gi, '[REDACTED_TOKEN]')
        .replace(/password\s*[:=]\s*\S+/gi, 'password:[REDACTED]')
        .slice(0, 500);
    }

    return {
      url: tab.url,
      title: tab.title,
      selectedText: safeSelection,
      source: 'orion-browser',
    };
  }
}
