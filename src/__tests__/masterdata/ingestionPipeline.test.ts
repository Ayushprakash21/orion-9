import { describe, it, expect } from 'vitest';
import { masterDataIngestionPipeline } from '../../services/masterdata/MasterDataIngestionPipeline';

describe('MasterDataIngestionPipeline', () => {
  it('executes 11-stage batch ingestion pipeline and produces an auditable report', async () => {
    const rawBatch = [
      {
        rawId: 'BATCH-ROW-1',
        sourceSystemType: 'SAP' as const,
        payload: {
          id: 'INGEST-SKU-1',
          name: 'Precision Bearing 608ZZ',
          category: 'BEARINGS',
          unitCost: 4.5,
          sellingPrice: 9.0,
          uom: 'pcs',
          country: 'Germany',
        },
      },
      {
        rawId: 'BATCH-ROW-2',
        sourceSystemType: 'ORACLE' as const,
        payload: {
          id: 'INGEST-SKU-2',
          name: 'Linear Rail MGN12',
          category: 'MOTION',
          unitCost: 22.0,
          sellingPrice: 45.0,
          uom: 'EA',
          country: 'USA',
        },
      },
    ];

    const report = await masterDataIngestionPipeline.executeBatch({
      batchId: 'BATCH-TEST-001',
      entityType: 'PRODUCT',
      tenantId: 'TENANT-ALPHA',
      records: rawBatch,
      actor: 'Batch ETL Agent',
    });

    expect(report.batchId).toBe('BATCH-TEST-001');
    expect(report.totalProcessed).toBe(2);
    expect(report.successCount).toBe(2);
    expect(report.errorCount).toBe(0);
    expect(report.stagesCompleted.length).toBe(11);
    expect(report.stagesCompleted).toContain('NORMALIZE');
    expect(report.stagesCompleted).toContain('VALIDATE');
    expect(report.stagesCompleted).toContain('DEDUPLICATE');
    expect(report.stagesCompleted).toContain('QUALITY SCORE');
    expect(report.stagesCompleted).toContain('PERSIST');
    expect(report.stagesCompleted).toContain('AUDIT');
  });

  it('routes records with blocking schema defects to review queue', async () => {
    const invalidBatch = [
      {
        rawId: 'BAD-ROW-1',
        sourceSystemType: 'MANUAL' as const,
        payload: {
          // Missing required id, name
          unitCost: -100,
        },
      },
    ];

    const report = await masterDataIngestionPipeline.executeBatch({
      batchId: 'BATCH-TEST-DEFECT',
      entityType: 'PRODUCT',
      tenantId: 'TENANT-ALPHA',
      records: invalidBatch,
      actor: 'Batch ETL Agent',
    });

    expect(report.totalProcessed).toBe(1);
    expect(report.reviewRequiredCount).toBe(1);
    expect(report.recordResults[0].actionTaken).toBe('REVIEW_REQUIRED');
  });
});
