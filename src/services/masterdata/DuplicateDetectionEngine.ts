/**
 * ORION-9 MASTER DATA DUPLICATE DETECTION ENGINE
 * Layer 7: Data Fabric & Master Data Governance
 *
 * Implements a 2-tier deduplication pipeline:
 * Tier 1: Deterministic matching (Exact codes, Tax IDs, Source System IDs, Normalized Name+Country)
 * Tier 2: Probabilistic fuzzy matching (Levenshtein & Jaro-Winkler string similarity metrics)
 *
 * STRICT GOVERNANCE RULE:
 * Probabilistic matches NEVER trigger automatic merges. Potential duplicates enter
 * a governed review queue for human/stewardship adjudication.
 */

import { MasterDataEntityType } from '../../types';

export interface DuplicateCandidate {
  candidateId: string;
  sourceRecordId: string;
  targetRecordId: string;
  entityType: MasterDataEntityType;
  tenantId: string;
  matchType: 'EXACT_IDENTIFIER' | 'EXACT_TAX_ID' | 'EXACT_SOURCE_ID' | 'EXACT_NAME_COUNTRY' | 'FUZZY_NAME_SIMILARITY';
  matchTier?: 'TIER_1_EXACT' | 'TIER_2_PROBABILISTIC';
  similarityScore: number; // 0.00 to 1.00
  matchedField: string;
  reason: string;
  status: 'PENDING_REVIEW' | 'CONFIRMED_DUPLICATE' | 'FALSE_POSITIVE' | 'MERGED';
  reviewRequired?: boolean;
  autoMergeAllowed?: boolean;
  detectedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export class MasterDataDuplicateDetectionEngine {
  private static instance: MasterDataDuplicateDetectionEngine;

  private constructor() {}

  public static getInstance(): MasterDataDuplicateDetectionEngine {
    if (!MasterDataDuplicateDetectionEngine.instance) {
      MasterDataDuplicateDetectionEngine.instance = new MasterDataDuplicateDetectionEngine();
    }
    return MasterDataDuplicateDetectionEngine.instance;
  }

  /**
   * Scans a target candidate entity against an active corpus within the same tenant
   */
  public findDuplicates(
    entityType: MasterDataEntityType,
    target: Record<string, any>,
    corpus: Array<Record<string, any>>,
    options: {
      fuzzyThreshold?: number; // default 0.85
      includeSelf?: boolean;
    } = {}
  ): DuplicateCandidate[] {
    const candidates: DuplicateCandidate[] = [];
    const threshold = options.fuzzyThreshold ?? 0.85;
    const targetId = target.id || target.productId || target.supplierId || target.customerId || target.locationId;
    const tenantId = target.tenantId || 'DEFAULT_TENANT';

    if (!targetId) return candidates;

    for (const record of corpus) {
      const recordId = record.id || record.productId || record.supplierId || record.customerId || record.locationId;
      const recTenantId = record.tenantId || 'DEFAULT_TENANT';

      // Ignore self-comparison unless requested
      if (!options.includeSelf && recordId === targetId) continue;

      // Strict tenant isolation guard: Never match across different explicit tenants
      if (target.tenantId && record.tenantId && target.tenantId !== record.tenantId) continue;

      // 1. DETERMINISTIC CHECKS
      // 1a. Exact Business Code / ID collision
      const targetCode = (target.supplierCode || target.productCode || target.customerCode || target.locationCode || target.code || target.id || '').toUpperCase().trim();
      const recordCode = (record.supplierCode || record.productCode || record.customerCode || record.locationCode || record.code || record.id || '').toUpperCase().trim();

      if (targetCode && recordCode && targetCode === recordCode && (recordId !== targetId || options.includeSelf)) {
        candidates.push({
          candidateId: `DUP-${entityType}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          sourceRecordId: targetId,
          targetRecordId: recordId,
          entityType,
          tenantId,
          matchType: 'EXACT_IDENTIFIER',
          matchTier: 'TIER_1_EXACT',
          similarityScore: 1.0,
          matchedField: 'businessCode',
          reason: `Exact business code collision ('${targetCode}') with active record ${recordId}`,
          status: 'PENDING_REVIEW',
          reviewRequired: true,
          autoMergeAllowed: false,
          detectedAt: new Date().toISOString(),
        });
        continue;
      }

      // 1b. Exact Tax Identification Number match
      const targetTax = target.taxId || target.taxIdentifier || this.extractTaxIdentifier(target);
      const recordTax = record.taxId || record.taxIdentifier || this.extractTaxIdentifier(record);
      if (targetTax && recordTax && targetTax === recordTax) {
        candidates.push({
          candidateId: `DUP-${entityType}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          sourceRecordId: targetId,
          targetRecordId: recordId,
          entityType,
          tenantId,
          matchType: 'EXACT_TAX_ID',
          matchTier: 'TIER_1_EXACT',
          similarityScore: 1.0,
          matchedField: 'taxId',
          reason: `Exact tax registration ID match ('${targetTax}') with record ${recordId}`,
          status: 'PENDING_REVIEW',
          reviewRequired: true,
          autoMergeAllowed: false,
          detectedAt: new Date().toISOString(),
        });
        continue;
      }

      // 1c. Exact Source System + Source Record ID match
      if (
        target.sourceSystem &&
        record.sourceSystem &&
        target.sourceSystem === record.sourceSystem &&
        target.sourceRecordId &&
        record.sourceRecordId &&
        target.sourceRecordId === record.sourceRecordId
      ) {
        candidates.push({
          candidateId: `DUP-${entityType}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          sourceRecordId: targetId,
          targetRecordId: recordId,
          entityType,
          tenantId,
          matchType: 'EXACT_SOURCE_ID',
          matchTier: 'TIER_1_EXACT',
          similarityScore: 1.0,
          matchedField: 'sourceRecordId',
          reason: `Identical source record ID ('${target.sourceRecordId}') from source system '${target.sourceSystem}'`,
          status: 'PENDING_REVIEW',
          reviewRequired: true,
          autoMergeAllowed: false,
          detectedAt: new Date().toISOString(),
        });
        continue;
      }

      // 1d. Exact Normalized Name + Country match
      const targetName = (target.legalName || target.name || '').toLowerCase().trim();
      const recordName = (record.legalName || record.name || '').toLowerCase().trim();
      const targetCountry = (target.country || '').toUpperCase().trim();
      const recordCountry = (record.country || '').toUpperCase().trim();

      if (targetName && recordName && targetName === recordName && targetCountry && recordCountry && targetCountry === recordCountry) {
        candidates.push({
          candidateId: `DUP-${entityType}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          sourceRecordId: targetId,
          targetRecordId: recordId,
          entityType,
          tenantId,
          matchType: 'EXACT_NAME_COUNTRY',
          matchTier: 'TIER_1_EXACT',
          similarityScore: 0.98,
          matchedField: 'name+country',
          reason: `Identical entity name ('${targetName}') within country '${targetCountry}' with record ${recordId}`,
          status: 'PENDING_REVIEW',
          reviewRequired: true,
          autoMergeAllowed: false,
          detectedAt: new Date().toISOString(),
        });
        continue;
      }

      // 2. PROBABILISTIC (FUZZY) CHECKS
      if (targetName && recordName && targetName.length > 3 && recordName.length > 3) {
        const similarity = this.calculateJaroWinklerSimilarity(targetName, recordName);
        if (similarity >= threshold) {
          candidates.push({
            candidateId: `DUP-${entityType}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            sourceRecordId: targetId,
            targetRecordId: recordId,
            entityType,
            tenantId,
            matchType: 'FUZZY_NAME_SIMILARITY',
            matchTier: 'TIER_2_PROBABILISTIC',
            similarityScore: Math.round(similarity * 100) / 100,
            matchedField: 'name',
            reason: `Probabilistic name similarity (${Math.round(similarity * 100)}%) between '${targetName}' and '${recordName}'`,
            status: 'PENDING_REVIEW',
            reviewRequired: true,
            autoMergeAllowed: false,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }

    return candidates;
  }

  private extractTaxIdentifier(record: Record<string, any>): string | null {
    if (record.taxId && typeof record.taxId === 'string') return record.taxId.trim();
    if (Array.isArray(record.taxIdentifiers) && record.taxIdentifiers.length > 0) {
      const first = record.taxIdentifiers[0];
      return (first.vatNumber || first.ein || first.taxRegNo || '').trim() || null;
    }
    return null;
  }

  /**
   * Jaro-Winkler string similarity calculation (0.00 to 1.00)
   */
  public calculateJaroWinklerSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, s2.length);

      for (let j = start; j < end; j++) {
        if (s2Matches[j]) continue;
        if (s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;

    // Winkler prefix adjustment
    let prefix = 0;
    for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
  }
}

export const masterDataDuplicateDetectionEngine = MasterDataDuplicateDetectionEngine.getInstance();
