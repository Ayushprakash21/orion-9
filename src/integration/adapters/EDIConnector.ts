/**
 * ORION-9 EDI CONNECTOR RUNTIME
 * Wave 3.2 B2B EDI Connector
 *
 * Implements X12 / EDIFACT message ingestion, parser validation, canonical mapping, and Kernel dispatch.
 */

import { BaseConnectorRuntime } from '../ConnectorRuntime';
import { EDIParser } from './EDIParser';
import { EDIAdapter } from './EDIAdapter';
import { ConnectorRecord, ConnectorCapabilities } from '../types';
import { integrationDLQ } from '../IntegrationDLQ';

export class EDIConnector extends BaseConnectorRuntime {
  constructor(record: ConnectorRecord) {
    super(record);
  }

  public getCapabilities(): ConnectorCapabilities {
    return {
      supportsInbound: true,
      supportsOutbound: true,
      supportsRealtime: false,
      supportsBatch: true,
      specificCapabilities: ['EDI_X12_850', 'EDI_X12_855', 'EDI_X12_856', 'EDI_X12_810', 'EDI_X12_820'],
    };
  }

  protected async executeSend(rawEdiPayload: any, correlationId: string): Promise<any> {
    const payloadStr = typeof rawEdiPayload === 'string' ? rawEdiPayload : JSON.stringify(rawEdiPayload);

    // 1. Structural & Business Validation
    const valResult = EDIParser.parseAndValidate(payloadStr, this.tenantId, correlationId);

    if (!valResult.isValid || !valResult.parsedMessage) {
      // Push invalid EDI message to DLQ
      await integrationDLQ.enqueueMessage({
        tenantId: this.tenantId,
        connectorId: this.connectorId,
        entityType: 'EDI_MESSAGE',
        payloadReference: { rawPayload: payloadStr, validationErrors: valResult.errors },
        errorCode: 'EDI_SYNTAX_VALIDATION_FAILED',
        errorMessage: valResult.errors.join(' | '),
      });

      throw this.createError(
        'NON_RETRYABLE',
        'EDI_VALIDATION_FAILED',
        `EDI message syntax/validation failed: ${valResult.errors.join('; ')}`,
        correlationId
      );
    }

    const msg = valResult.parsedMessage;
    let canonicalEntity: any;

    if (msg.transactionType === '850') {
      canonicalEntity = EDIAdapter.toCanonicalPurchaseOrder(msg);
    } else if (msg.transactionType === '856') {
      canonicalEntity = EDIAdapter.toCanonicalASN(msg);
    } else if (msg.transactionType === '810') {
      canonicalEntity = EDIAdapter.toCanonicalInvoice(msg);
    } else {
      canonicalEntity = { rawEdi: msg };
    }

    return {
      success: true,
      connectorId: this.connectorId,
      correlationId,
      messageId: msg.messageId,
      transactionType: msg.transactionType,
      controlNumber: msg.controlNumber,
      canonicalEntity,
    };
  }

  protected async executeReceive(params: Record<string, any> | undefined, correlationId: string): Promise<any> {
    if (this.environment === 'SANDBOX') {
      const sample850 = `ISA*00*          *00*          *ZZ*PARTNERSUPPLIER*ZZ*ORION9HUB      *260921*1200*U*00401*000000850*0*P*>~\nST*850*0001~\nBEG*00*SA*PO-EDI-850-99*20260921~\nSE*3*0001~\nGE*1*850~\nIEA*1*000000850~`;
      const val = EDIParser.parseAndValidate(sample850, this.tenantId, correlationId);
      if (val.parsedMessage) {
        return [EDIAdapter.toCanonicalPurchaseOrder(val.parsedMessage)];
      }
    }
    return [];
  }
}
