/**
 * ORION-9 EDI PARSER & VALIDATOR
 * Wave 3.2 EDI Integration Architecture
 *
 * Structural and business validation parser for ANSI X12 (850, 855, 856, 810, 820)
 * and UN/EDIFACT formats. Invalid messages enter FAILED_VALIDATION state and are pushed to DLQ.
 */

import { EDIMessageRecord, EDITransactionType, EDIFormat } from '../types';

export interface EDIValidationResult {
  isValid: boolean;
  errors: string[];
  parsedMessage?: EDIMessageRecord;
}

export class EDIParser {
  /**
   * Parses raw EDI string payload (X12 or EDIFACT) and performs structural & business validation
   */
  public static parseAndValidate(
    rawPayload: string,
    tenantId: string,
    correlationId: string
  ): EDIValidationResult {
    const errors: string[] = [];
    const trimmed = rawPayload.trim();

    if (!trimmed) {
      return { isValid: false, errors: ['EDI payload is empty or blank.'] };
    }

    const format: EDIFormat = trimmed.startsWith('ISA') ? 'X12' : trimmed.startsWith('UNA') || trimmed.startsWith('UNB') ? 'EDIFACT' : 'X12';

    let transactionType: EDITransactionType = '850';
    let controlNumber = `CTRL-${Date.now().toString(36)}`;
    let senderId = 'UNKNOWN_SENDER';
    let receiverId = 'ORION9_RECEIVER';

    if (format === 'X12') {
      const segments = trimmed.split('~').map(s => s.trim()).filter(Boolean);

      // Check ISA header
      const isaSegment = segments.find(s => s.startsWith('ISA*'));
      if (!isaSegment) {
        errors.push('Missing required ISA interchange header segment.');
      } else {
        const isaElements = isaSegment.split('*');
        if (isaElements.length < 14) {
          errors.push('Malformed ISA segment: insufficient elements.');
        } else {
          senderId = isaElements[6]?.trim() || senderId;
          receiverId = isaElements[8]?.trim() || receiverId;
          controlNumber = isaElements[13]?.trim() || controlNumber;
        }
      }

      // Check ST transaction set header
      const stSegment = segments.find(s => s.startsWith('ST*'));
      if (!stSegment) {
        errors.push('Missing required ST transaction set header segment.');
      } else {
        const stElements = stSegment.split('*');
        const txCode = stElements[1]?.trim();
        if (['850', '855', '856', '810', '820'].includes(txCode)) {
          transactionType = txCode as EDITransactionType;
        } else {
          errors.push(`Unsupported or invalid EDI transaction type: '${txCode}'`);
        }
      }

      // Check SE transaction set trailer
      const seSegment = segments.find(s => s.startsWith('SE*'));
      if (!seSegment) {
        errors.push('Missing required SE transaction set trailer segment.');
      }

      // Business validation checks per transaction type
      if (transactionType === '850') {
        const begSegment = segments.find(s => s.startsWith('BEG*'));
        if (!begSegment) {
          errors.push('EDI 850 Purchase Order missing required BEG (Beginning Segment for PO).');
        } else {
          const begElements = begSegment.split('*');
          if (!begElements[3]) {
            errors.push('EDI 850 BEG segment missing PO Number element.');
          }
        }
      } else if (transactionType === '856') {
        const bsnSegment = segments.find(s => s.startsWith('BSN*'));
        if (!bsnSegment) {
          errors.push('EDI 856 ASN missing required BSN (Beginning Segment for Ship Notice).');
        }
      } else if (transactionType === '810') {
        const bigSegment = segments.find(s => s.startsWith('BIG*'));
        if (!bigSegment) {
          errors.push('EDI 810 Invoice missing required BIG (Beginning Segment for Invoice).');
        }
      }
    } else {
      // EDIFACT check
      if (!trimmed.includes('UNH')) {
        errors.push('EDIFACT payload missing UNH message header.');
      }
      if (!trimmed.includes('UNT')) {
        errors.push('EDIFACT payload missing UNT message trailer.');
      }
    }

    const isValid = errors.length === 0;

    const messageRecord: EDIMessageRecord = {
      messageId: `edi-msg-${Date.now().toString(36)}`,
      tenantId,
      format,
      transactionType,
      controlNumber,
      senderId,
      receiverId,
      timestamp: new Date().toISOString(),
      rawPayload,
      correlationId,
      validationStatus: isValid ? 'VALID' : 'FAILED_VALIDATION',
      validationErrors: isValid ? undefined : errors,
    };

    return {
      isValid,
      errors,
      parsedMessage: messageRecord,
    };
  }
}
