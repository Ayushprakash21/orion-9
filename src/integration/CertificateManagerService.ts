/**
 * ORION-9 PART 4 TRACK 8: INTEGRATION & REAL-WORLD CONNECTIVITY
 * Certificate & Mutual TLS Governance Service
 *
 * Tracks digital certificates (AS2, SFTP, HTTPS/TLS), monitors upcoming expirations (30-day window),
 * enforces rotation workflows, and emits telemetry signals to Control Tower.
 */

import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { db, loadData, saveData } from '../data/db';

export type CertificateType = 'X509_TLS' | 'AS2_SIGNING' | 'AS2_ENCRYPTION' | 'SFTP_SSH_KEY';
export type CertificateStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED' | 'INVALID';

export interface CertificateRecord {
  certificateId: string;
  tenantId: string;
  connectorId?: string;
  partnerId?: string;
  name: string;
  type: CertificateType;
  issuer: string;
  subject: string;
  fingerprintSHA256: string;
  serialNumber: string;
  status: CertificateStatus;
  validFrom: string;
  validTo: string;
  keySizeBits: number;
  createdAt: string;
  updatedAt: string;
}

export class CertificateManagerService {
  private static instance: CertificateManagerService;
  private certificates: Map<string, CertificateRecord> = new Map();

  private constructor() {
    this.seedDefaultCertificates();
    this.hydrate();
  }

  public static getInstance(): CertificateManagerService {
    if (!CertificateManagerService.instance) {
      CertificateManagerService.instance = new CertificateManagerService();
    }
    return CertificateManagerService.instance;
  }

  private seedDefaultCertificates(): void {
    const tenantId = 'org-tenant-a';
    const now = Date.now();
    const day = 86400000;

    const certs: CertificateRecord[] = [
      {
        certificateId: 'cert-as2-signing-01',
        tenantId,
        partnerId: 'partner-acme-corp',
        name: 'ACME Corp AS2 Primary Signing Certificate',
        type: 'AS2_SIGNING',
        issuer: 'CN=DigiCert Global Root G2, O=DigiCert Inc, C=US',
        subject: 'CN=as2.acmecorp.com, O=ACME Corp, C=US',
        fingerprintSHA256: '9A:3E:7F:4B:12:88:CC:D1:4E:9F:8B:7C:6D:5A:4E:3F:21:10:09:08:07:06:05:04:03:02:01:00',
        serialNumber: '0987654321ABCDEF',
        status: 'VALID',
        validFrom: new Date(now - 180 * day).toISOString(),
        validTo: new Date(now + 180 * day).toISOString(),
        keySizeBits: 2048,
        createdAt: new Date(now - 180 * day).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        certificateId: 'cert-sftp-expiring-02',
        tenantId,
        connectorId: 'conn-file-sftp-01',
        name: 'Logistics SFTP Host Verification Key',
        type: 'SFTP_SSH_KEY',
        issuer: 'CN=Internal CA, O=Orion Systems',
        subject: 'CN=sftp.partner.orion9.internal',
        fingerprintSHA256: '8B:2A:4C:1E:55:99:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF',
        serialNumber: '1122334455667788',
        status: 'EXPIRING_SOON',
        validFrom: new Date(now - 345 * day).toISOString(),
        validTo: new Date(now + 15 * day).toISOString(), // Expiring in 15 days
        keySizeBits: 4096,
        createdAt: new Date(now - 345 * day).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    certs.forEach((c) => this.certificates.set(c.certificateId, c));
  }

  private async hydrate(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<CertificateRecord>(db.certificates);
        if (stored && stored.length > 0) {
          stored.forEach((c) => this.certificates.set(c.certificateId, c));
        }
      }
    } catch (e) {
      console.warn('[CertificateManagerService] Hydration warning:', e);
    }
  }

  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await saveData(db.certificates, Array.from(this.certificates.values()));
    } catch (e) {
      console.warn('[CertificateManagerService] Persistence warning:', e);
    }
  }

  /**
   * Registers or updates a digital certificate record
   */
  public registerCertificate(params: {
    tenantId: string;
    name: string;
    type: CertificateType;
    issuer: string;
    subject: string;
    fingerprintSHA256: string;
    validFrom: string;
    validTo: string;
    keySizeBits?: number;
    connectorId?: string;
    partnerId?: string;
    actor: string;
  }): CertificateRecord {
    const certificateId = `cert-${params.type.toLowerCase().substring(0, 4)}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const expiryMs = new Date(params.validTo).getTime() - Date.now();
    const daysUntilExpiry = Math.floor(expiryMs / (1000 * 60 * 60 * 24));

    let status: CertificateStatus = 'VALID';
    if (daysUntilExpiry <= 0) {
      status = 'EXPIRED';
    } else if (daysUntilExpiry <= 30) {
      status = 'EXPIRING_SOON';
    }

    const cert: CertificateRecord = {
      certificateId,
      tenantId: params.tenantId,
      connectorId: params.connectorId,
      partnerId: params.partnerId,
      name: params.name,
      type: params.type,
      issuer: params.issuer,
      subject: params.subject,
      fingerprintSHA256: params.fingerprintSHA256,
      serialNumber: Date.now().toString(16).toUpperCase(),
      status,
      validFrom: params.validFrom,
      validTo: params.validTo,
      keySizeBits: params.keySizeBits || 2048,
      createdAt: now,
      updatedAt: now,
    };

    this.certificates.set(certificateId, cert);
    this.persist();

    kernelAuditEngine.record({
      action: 'REGISTER_CERTIFICATE',
      actor: { id: params.actor, type: 'USER', name: params.actor },
      entityId: certificateId,
      entityType: 'INTEGRATION_CERTIFICATE',
      classification: 'CONFIDENTIAL',
      details: { tenantId: params.tenantId, name: params.name, status }
    });

    return cert;
  }

  /**
   * Evaluates all certificates for upcoming expiration (30-day window) and emits Control Tower signals
   */
  public scanExpiringCertificates(tenantId: string): CertificateRecord[] {
    const nowMs = Date.now();
    const dayMs = 86400000;
    const alertWindowMs = 30 * dayMs;
    const expiringOrExpired: CertificateRecord[] = [];

    this.certificates.forEach((cert) => {
      if (cert.tenantId !== tenantId) return;

      const expiryMs = new Date(cert.validTo).getTime();
      const timeRemainingMs = expiryMs - nowMs;

      if (timeRemainingMs <= 0 && cert.status !== 'EXPIRED') {
        cert.status = 'EXPIRED';
        cert.updatedAt = new Date().toISOString();
        expiringOrExpired.push(cert);

        kernelEventBus.publish('orion:certificate:expired', {
          certificateId: cert.certificateId,
          tenantId: cert.tenantId,
          name: cert.name,
          validTo: cert.validTo,
        }, { actor: { id: 'CertificateMonitor', type: 'SYSTEM', name: 'Certificate Monitor' } });

      } else if (timeRemainingMs > 0 && timeRemainingMs <= alertWindowMs && cert.status !== 'EXPIRING_SOON') {
        cert.status = 'EXPIRING_SOON';
        cert.updatedAt = new Date().toISOString();
        expiringOrExpired.push(cert);

        kernelEventBus.publish('orion:certificate:expiring', {
          certificateId: cert.certificateId,
          tenantId: cert.tenantId,
          name: cert.name,
          validTo: cert.validTo,
          daysRemaining: Math.floor(timeRemainingMs / dayMs),
        }, { actor: { id: 'CertificateMonitor', type: 'SYSTEM', name: 'Certificate Monitor' } });
      }
    });

    if (expiringOrExpired.length > 0) {
      this.persist();
    }

    return Array.from(this.certificates.values()).filter(
      (c) => c.tenantId === tenantId && (c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED')
    );
  }

  /**
   * Retrieves all certificates for a tenant
   */
  public listCertificates(tenantId: string): CertificateRecord[] {
    return Array.from(this.certificates.values()).filter((c) => c.tenantId === tenantId);
  }
}

export const certificateManagerService = CertificateManagerService.getInstance();
