/**
 * ORION-9 OS AUTHORITATIVE PRODUCT METADATA
 * Centralized product identity, versioning, release codename, and display labels.
 */

export const ORION_OS_METADATA = {
  product: 'ORION-9 OS',
  productName: 'ORION-9 OS',
  name: 'Orion-9',
  fullName: 'ORION-9 OS',
  version: '21.1',
  releaseCodename: 'PULSAR',
  codename: 'PULSAR',
  edition: 'PULSAR RELEASE',
  releaseTag: 'v21.1-pulsar',
  fullVersionName: 'ORION-9 OS 21.1 — PULSAR RELEASE',
  displayTitle: 'ORION-9 OS 21.1',
  displaySubtitle: 'PULSAR RELEASE',
  kernelVersion: 'v21.1-kernel-core',
  architecture: 'Cloudflare Edge + React 19 + Motion 12',
} as const;

export type OrionOsMetadata = typeof ORION_OS_METADATA;
