/**
 * ORION-9 SCM REFERENTIAL INTEGRITY & RELATIONSHIP ENGINE
 * Layer 7: Canonical SCM Data Authority
 *
 * Enforces cross-entity referential integrity, tenant boundary checks, active state requirements,
 * and foreign key consistency before and during persistence operations.
 */

import { scmCanonicalRegistry, ScmCanonicalEntityDefinition } from './ScmCanonicalRegistry';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';

export interface IntegrityViolation {
  field: string;
  foreignEntity: string;
  foreignField: string;
  referencedValue: any;
  violationType: 'MISSING_FOREIGN_KEY' | 'TARGET_NOT_FOUND' | 'TARGET_INACTIVE' | 'TENANT_MISMATCH' | 'ENVIRONMENT_MISMATCH';
  message: string;
}

export interface ReferentialIntegrityResult {
  isValid: boolean;
  entityName: string;
  entityId: string;
  tenantId: string;
  violations: IntegrityViolation[];
  verifiedAt: string;
}

export class ScmReferentialIntegrityEngine {
  private static instance: ScmReferentialIntegrityEngine;

  private constructor() {}

  public static getInstance(): ScmReferentialIntegrityEngine {
    if (!ScmReferentialIntegrityEngine.instance) {
      ScmReferentialIntegrityEngine.instance = new ScmReferentialIntegrityEngine();
    }
    return ScmReferentialIntegrityEngine.instance;
  }

  /**
   * Validates referential integrity for any SCM record against persisted data.
   */
  public async validateIntegrity(params: {
    entityName: string;
    record: Record<string, any>;
    tenantId: string;
    environment?: string;
  }): Promise<ReferentialIntegrityResult> {
    const { entityName, record, tenantId, environment = 'LIVE' } = params;
    const def = scmCanonicalRegistry.getEntity(entityName);
    const entityId = record[def?.primaryKey || 'id'] || record.id || 'UNKNOWN';
    const violations: IntegrityViolation[] = [];

    if (!def) {
      return {
        isValid: true,
        entityName,
        entityId,
        tenantId,
        violations: [],
        verifiedAt: new Date().toISOString(),
      };
    }

    // 1. Tenant match validation on record
    if (record.tenantId && record.tenantId !== tenantId) {
      violations.push({
        field: 'tenantId',
        foreignEntity: 'Tenant',
        foreignField: 'id',
        referencedValue: record.tenantId,
        violationType: 'TENANT_MISMATCH',
        message: `Record tenantId '${record.tenantId}' does not match context tenantId '${tenantId}'.`,
      });
    }

    // 2. Environment match validation if specified
    if (record.environment && record.environment !== environment) {
      violations.push({
        field: 'environment',
        foreignEntity: 'System',
        foreignField: 'environment',
        referencedValue: record.environment,
        violationType: 'ENVIRONMENT_MISMATCH',
        message: `Record environment '${record.environment}' does not match context environment '${environment}'.`,
      });
    }

    // 3. Inspect dependencies defined in the Canonical Registry
    for (const dep of def.dependencies) {
      if (dep.entity === 'Tenant') continue; // Tenant is verified via context

      const val = record[dep.field];
      if (!val) {
        if (dep.required) {
          violations.push({
            field: dep.field,
            foreignEntity: dep.entity,
            foreignField: dep.foreignField,
            referencedValue: undefined,
            violationType: 'MISSING_FOREIGN_KEY',
            message: `Required foreign reference '${dep.field}' -> ${dep.entity}.${dep.foreignField} is missing.`,
          });
        }
        continue;
      }

      const foreignDef = scmCanonicalRegistry.getEntity(dep.entity);
      if (!foreignDef) continue;

      // Attempt to look up the referenced entity
      const target = await scmPersistenceService.getRecord<any>(
        foreignDef.collectionPath,
        tenantId,
        String(val)
      );

      if (!target) {
        violations.push({
          field: dep.field,
          foreignEntity: dep.entity,
          foreignField: dep.foreignField,
          referencedValue: val,
          violationType: 'TARGET_NOT_FOUND',
          message: `Referenced ${dep.entity} [${dep.foreignField}='${val}'] was not found in tenant '${tenantId}'.`,
        });
      } else {
        // Verify target tenant isolation
        if (target.tenantId && target.tenantId !== tenantId) {
          violations.push({
            field: dep.field,
            foreignEntity: dep.entity,
            foreignField: dep.foreignField,
            referencedValue: val,
            violationType: 'TENANT_MISMATCH',
            message: `Cross-tenant reference violation: Referenced ${dep.entity} '${val}' belongs to tenant '${target.tenantId}'.`,
          });
        }

        // Verify active state requirement if applicable
        if (dep.activeOnly) {
          const status = (target.status || target.state || '').toUpperCase();
          const isActive = status === 'ACTIVE' || status === 'APPROVED' || status === 'CONFIRMED' || status === 'RELEASED';
          if (!isActive) {
            violations.push({
              field: dep.field,
              foreignEntity: dep.entity,
              foreignField: dep.foreignField,
              referencedValue: val,
              violationType: 'TARGET_INACTIVE',
              message: `Referenced ${dep.entity} '${val}' is currently ${status || 'INACTIVE'}, but must be ACTIVE/APPROVED.`,
            });
          }
        }
      }
    }

    return {
      isValid: violations.length === 0,
      entityName,
      entityId,
      tenantId,
      violations,
      verifiedAt: new Date().toISOString(),
    };
  }
}

export const scmReferentialIntegrityEngine = ScmReferentialIntegrityEngine.getInstance();
