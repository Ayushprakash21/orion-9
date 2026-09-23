/**
 * ORION-9 PART 4 — TRACK 13: PRODUCT / PLATFORM MATURITY
 * Unit & Integration Test Suite: Subsystem Maturity, Core Business Journeys, UX Consistency & Debt Audit
 */

import { describe, it, expect } from 'vitest';
import { productPlatformMaturityService } from '../../operations/ProductPlatformMaturityService';

describe('Part 4 Track 13: Product / Platform Maturity Suite', () => {
  // --------------------------------------------------------------------------
  // 1. Subsystem Catalog Categorization Matrix
  // --------------------------------------------------------------------------
  describe('Subsystem Catalog Categorization Matrix', () => {
    it('classifies exactly 17 enterprise subsystems across 5 navigation categories', () => {
      const catalog = productPlatformMaturityService.getSubsystemCatalog();
      expect(catalog.length).toBe(17);

      const categories = new Set(catalog.map(s => s.category));
      expect(categories.has('OPERATE')).toBe(true);
      expect(categories.has('INTELLIGENCE')).toBe(true);
      expect(categories.has('CONTROL')).toBe(true);
      expect(categories.has('ANALYTICS')).toBe(true);
      expect(categories.has('PLATFORM')).toBe(true);
    });

    it('verifies all 17 subsystems are at MATURE level with complete UI state handling', () => {
      const catalog = productPlatformMaturityService.getSubsystemCatalog();
      for (const sub of catalog) {
        expect(sub.maturityLevel).toBe('MATURE');
        expect(sub.hasLoadingState).toBe(true);
        expect(sub.hasEmptyState).toBe(true);
        expect(sub.hasErrorState).toBe(true);
        expect(sub.hasRealData).toBe(true);
        expect(sub.isTenantIsolated).toBe(true);
        expect(sub.isKernelGoverned).toBe(true);
        expect(sub.verifiedInTesting).toBe(true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. End-to-End Business Journey Verification
  // --------------------------------------------------------------------------
  describe('End-to-End Business Journey Verification', () => {
    it('verifies all 4 core supply chain business journeys', () => {
      const { allPassing, journeys } = productPlatformMaturityService.verifyBusinessJourneys();
      expect(allPassing).toBe(true);
      expect(journeys.length).toBe(4);

      const ids = journeys.map(j => j.journeyId);
      expect(ids).toContain('JOURNEY-01');
      expect(ids).toContain('JOURNEY-02');
      expect(ids).toContain('JOURNEY-03');
      expect(ids).toContain('JOURNEY-04');

      for (const journey of journeys) {
        expect(journey.overallStatus).toBe('VERIFIED_PASSING');
        expect(journey.steps.length).toBeGreaterThan(0);
        for (const step of journey.steps) {
          expect(step.status).toBe('VERIFIED_PASSING');
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. UX Consistency & System State Matrix
  // --------------------------------------------------------------------------
  describe('UX Consistency & System State Matrix', () => {
    it('audits UX consistency and confirms zero fake metrics', () => {
      const matrix = productPlatformMaturityService.auditUXConsistency();
      expect(matrix.navigationConsistent).toBe(true);
      expect(matrix.typographyConsistent).toBe(true);
      expect(matrix.responsiveBehaviorVerified).toBe(true);
      expect(matrix.accessibilityBaselineVerified).toBe(true);
      expect(matrix.loadingStatesStandardized).toBe(true);
      expect(matrix.emptyStatesStandardized).toBe(true);
      expect(matrix.errorStatesStandardized).toBe(true);
      expect(matrix.zeroFakeMetrics).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Product Debt Register & Zero P0 Audit
  // --------------------------------------------------------------------------
  describe('Product Debt Register & Zero P0 Audit', () => {
    it('confirms zero open P0 or P1 debt items in register', () => {
      const debt = productPlatformMaturityService.getProductDebtRegister();
      const openP0 = debt.filter(d => d.severity === 'P0' && (d.status === 'OPEN' || d.status === 'IN_PROGRESS'));
      const openP1 = debt.filter(d => d.severity === 'P1' && (d.status === 'OPEN' || d.status === 'IN_PROGRESS'));

      expect(openP0.length).toBe(0);
      expect(openP1.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Platform Maturity Executive Summary
  // --------------------------------------------------------------------------
  describe('Platform Maturity Executive Summary', () => {
    it('returns 100% MATURE platform summary', () => {
      const summary = productPlatformMaturityService.getPlatformMaturitySummary();
      expect(summary.overallMaturityScore).toBe(100);
      expect(summary.overallMaturityLevel).toBe('MATURE');
      expect(summary.totalSubsystems).toBe(17);
      expect(summary.verifiedBusinessJourneysCount).toBe(4);
      expect(summary.openP0DebtCount).toBe(0);
      expect(summary.openP1DebtCount).toBe(0);
      expect(summary.uxConsistencyScore).toBe(100);
    });
  });
});
