/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * ObservabilityService: Structured Logging with PII Scrubbing, Metrics & Distributed Tracing
 */

import {
  StructuredLogRecord,
  LogLevel,
  MetricRecord,
  MetricType,
  TraceSpan,
} from './types';

// Sensitive patterns to scrub from all logs
const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
  /password\s*[:=]\s*["']?([^"'&\s]+)/gi,
  /secret\s*[:=]\s*["']?([^"'&\s]+)/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, // Email addresses
  /\b(?:\d[ -]*?){13,16}\b/g, // Credit card numbers
];

export class ObservabilityService {
  private static instance: ObservabilityService;
  private logs: StructuredLogRecord[] = [];
  private metrics: MetricRecord[] = [];
  private activeSpans: Map<string, TraceSpan> = new Map();
  private maxLogs: number = 200;

  private constructor() {}

  public static getInstance(): ObservabilityService {
    if (!ObservabilityService.instance) {
      ObservabilityService.instance = new ObservabilityService();
    }
    return ObservabilityService.instance;
  }

  /**
   * Redacts sensitive secrets and PII from string inputs.
   */
  public redactString(input: string): string {
    if (!input || typeof input !== 'string') return String(input || '');
    let result = input;
    for (const pattern of SENSITIVE_PATTERNS) {
      result = result.replace(pattern, (match) => {
        if (match.toLowerCase().startsWith('bearer ')) {
          return 'Bearer [REDACTED_TOKEN]';
        }
        if (match.includes('@')) {
          const parts = match.split('@');
          return `${parts[0].slice(0, 2)}***@${parts[1]}`;
        }
        return '[REDACTED_SECRET]';
      });
    }
    return result;
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(context)) {
      if (typeof val === 'string') {
        sanitized[key] = this.redactString(val);
      } else if (typeof val === 'object' && val !== null) {
        try {
          const json = JSON.stringify(val);
          sanitized[key] = JSON.parse(this.redactString(json));
        } catch {
          sanitized[key] = '[COMPLEX_OBJECT]';
        }
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  public log(
    level: LogLevel,
    message: string,
    options?: {
      tenantId?: string;
      context?: Record<string, any>;
      traceId?: string;
      spanId?: string;
      causationId?: string;
      correlationId?: string;
    }
  ): StructuredLogRecord {
    const redactedMessage = this.redactString(message);
    const sanitizedContext = this.sanitizeContext(options?.context);

    const record: StructuredLogRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message: redactedMessage,
      tenantId: options?.tenantId || 'GLOBAL',
      context: sanitizedContext,
      traceId: options?.traceId,
      spanId: options?.spanId,
      causationId: options?.causationId,
      correlationId: options?.correlationId,
      redacted: redactedMessage !== message,
    };

    this.logs.unshift(record);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return record;
  }

  public info(message: string, options?: Parameters<ObservabilityService['log']>[2]): StructuredLogRecord {
    return this.log('INFO', message, options);
  }

  public warn(message: string, options?: Parameters<ObservabilityService['log']>[2]): StructuredLogRecord {
    return this.log('WARN', message, options);
  }

  public error(message: string, options?: Parameters<ObservabilityService['log']>[2]): StructuredLogRecord {
    return this.log('ERROR', message, options);
  }

  public getRecentLogs(limit: number = 50, tenantId?: string): StructuredLogRecord[] {
    let result = this.logs;
    if (tenantId && tenantId !== 'GLOBAL') {
      result = result.filter(l => l.tenantId === tenantId || l.tenantId === 'GLOBAL');
    }
    return result.slice(0, limit);
  }

  // ============================================================================
  // Distributed Tracing
  // ============================================================================

  public startSpan(name: string, traceId?: string, parentSpanId?: string): TraceSpan {
    const currentTraceId = traceId || `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const spanId = `span-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const span: TraceSpan = {
      traceId: currentTraceId,
      spanId,
      parentSpanId,
      name,
      startTime: Date.now(),
      tags: {},
      events: [],
    };

    this.activeSpans.set(spanId, span);
    return span;
  }

  public endSpan(spanId: string): TraceSpan | undefined {
    const span = this.activeSpans.get(spanId);
    if (!span) return undefined;

    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    this.activeSpans.delete(spanId);
    return span;
  }

  // ============================================================================
  // Metrics
  // ============================================================================

  public recordMetric(
    name: string,
    type: MetricType,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    const record: MetricRecord = {
      name,
      type,
      value,
      tags,
      timestamp: new Date().toISOString(),
    };
    this.metrics.unshift(record);
    if (this.metrics.length > 500) {
      this.metrics.pop();
    }
  }

  public getMetrics(name?: string): MetricRecord[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }
}

export const observabilityService = ObservabilityService.getInstance();
