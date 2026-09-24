/**
 * ORION-9 FIRESTORE DATA SANITIZER & SCHEMA VALIDATOR
 * Guarantees zero undefined fields, rejects invalid non-serializable objects (React components,
 * DOM nodes, functions, Maps, Sets), and strictly enforces document contracts before Firestore persistence.
 */

export class FirestoreSanitizationError extends Error {
  constructor(message: string) {
    super(`[SCM-PERSISTENCE-ERROR] ${message}`);
    this.name = 'FirestoreSanitizationError';
  }
}

export class DesktopItemValidationError extends Error {
  constructor(message: string) {
    super(`[DESKTOP-ITEM-VALIDATION-ERROR] ${message}`);
    this.name = 'DesktopItemValidationError';
  }
}

/**
 * Check if a value is a plain JavaScript object.
 */
function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
}

/**
 * Check if a value is a React element or JSX object.
 */
function isReactElement(val: any): boolean {
  if (!val || typeof val !== 'object') return false;
  return (
    val.$$typeof !== undefined ||
    typeof val.type === 'function' ||
    (typeof val.type === 'object' && val.type !== null && val.type.$$typeof !== undefined)
  );
}

/**
 * Check if a value is a DOM node or window reference.
 */
function isDomNode(val: any): boolean {
  if (!val || typeof val !== 'object') return false;
  if (typeof Node !== 'undefined' && val instanceof Node) return true;
  if (typeof val.nodeType === 'number' && typeof val.nodeName === 'string') return true;
  if (typeof window !== 'undefined' && (val === window || val === document)) return true;
  return false;
}

/**
 * Authoritatively sanitizes any data payload for safe Cloud Firestore storage.
 * - Recursively removes any undefined properties
 * - Preserves null, false, 0, and empty strings
 * - Rejects non-serializable types: functions, symbols, React components, DOM nodes, Map, Set
 */
export function sanitizeFirestorePayload<T>(payload: T, path: string = 'root'): any {
  if (payload === undefined) {
    return undefined;
  }

  if (payload === null) {
    return null;
  }

  const valType = typeof payload;

  if (valType === 'string' || valType === 'number' || valType === 'boolean') {
    return payload;
  }

  if (valType === 'bigint' || valType === 'symbol' || valType === 'function') {
    throw new FirestoreSanitizationError(
      `Cannot persist non-serializable type (${valType}) at path "${path}" to Firestore.`
    );
  }

  if (isReactElement(payload)) {
    throw new FirestoreSanitizationError(
      `Cannot persist React element or component at path "${path}" to Firestore. Only serializable data contracts may be stored.`
    );
  }

  if (isDomNode(payload)) {
    throw new FirestoreSanitizationError(
      `Cannot persist DOM node or browser element at path "${path}" to Firestore.`
    );
  }

  if (payload instanceof Map || payload instanceof Set) {
    throw new FirestoreSanitizationError(
      `Cannot persist Map or Set instances at path "${path}" to Firestore. Use standard objects or arrays.`
    );
  }

  if (payload instanceof Date) {
    return payload.toISOString();
  }

  if (Array.isArray(payload)) {
    const sanitizedArray: any[] = [];
    for (let i = 0; i < payload.length; i++) {
      const sanitizedItem = sanitizeFirestorePayload(payload[i], `${path}[${i}]`);
      if (sanitizedItem !== undefined) {
        sanitizedArray.push(sanitizedItem);
      }
    }
    return sanitizedArray;
  }

  if (isPlainObject(payload)) {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) {
        // Strip undefined field
        continue;
      }
      const sanitizedVal = sanitizeFirestorePayload(value, `${path}.${key}`);
      if (sanitizedVal !== undefined) {
        sanitizedObj[key] = sanitizedVal;
      }
    }
    return sanitizedObj;
  }

  // Handle other object instances (e.g. Firebase Timestamp if present)
  if (typeof payload === 'object') {
    // Check if it's a Firestore Timestamp instance or similar
    if (typeof (payload as any).toMillis === 'function' || typeof (payload as any).toDate === 'function') {
      return payload;
    }
    throw new FirestoreSanitizationError(
      `Cannot persist custom class instance at path "${path}" to Firestore.`
    );
  }

  return payload;
}

/**
 * Validates DesktopItem / DesktopShortcut record contracts before persistence.
 */
export function validateDesktopItemRecord(item: any): void {
  if (!item || typeof item !== 'object') {
    throw new DesktopItemValidationError('DesktopItem must be a non-null object');
  }

  if (!item.id || typeof item.id !== 'string') {
    throw new DesktopItemValidationError('DesktopItem.id is required');
  }

  if (!item.name || typeof item.name !== 'string') {
    throw new DesktopItemValidationError('DesktopItem.name is required');
  }

  if (!item.tenantId || typeof item.tenantId !== 'string') {
    throw new DesktopItemValidationError('DesktopItem.tenantId is required');
  }

  if (!item.environment || (item.environment !== 'DEMO' && item.environment !== 'LIVE')) {
    throw new DesktopItemValidationError('DesktopItem.environment must be "DEMO" or "LIVE"');
  }

  if (!item.iconId || typeof item.iconId !== 'string') {
    throw new DesktopItemValidationError('DesktopItem.iconId is required');
  }

  if (typeof item.isDirectory !== 'boolean') {
    throw new DesktopItemValidationError('DesktopItem.isDirectory must be a boolean');
  }

  if (isReactElement(item.icon) || isReactElement(item.iconId)) {
    throw new DesktopItemValidationError(
      'DesktopItem must not contain React elements or component instances. Use a stable string iconId instead.'
    );
  }
}
