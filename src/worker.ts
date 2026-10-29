/**
 * ORION-9 CLOUDFLARE WORKER ENTRY POINT
 * Serves API routes (/api/wallpaper/cloudflare/status, /api/wallpaper/status, /api/wallpaper/generate, /api/health)
 * with Cloudflare Workers AI (@cf/black-forest-labs/flux-2-klein-4b) as the sole AI image provider.
 * Enforces provider privacy by returning minimal clean responses to the client.
 */

import { checkCloudflareWallpaperStatus, generateCloudflareWallpapers } from "./server/cloudflareAiBackend";
import { demoPersistentSchedulerService } from "./services/demo/DemoPersistentSchedulerService";
import { DEMO_PACKAGES_PER_HOUR } from "./core/database/DemoSyntheticDataEngine";
import { dbManager } from "./core/database/DatabaseConnectionManager";
import { GoogleGenAI } from "@google/genai";
import {
  extractBearerToken,
  verifyWorkerAuthToken,
  applyWorkerRateLimit,
  createSecurityErrorResponse,
  applySecurityHeaders,
  createSafeErrorResponse,
  getCorsHeaders,
  EDGE_SECURITY_HEADERS,
} from "./server/workerSecurity";
import {
  getDurableBranding,
  saveDurableBranding,
  resetDurableBranding,
  getDurableBrandingAsset,
} from "./server/brandingBackend";

export interface ScheduledController {
  scheduledTime: number;
  cron: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> };
  AI?: any; // Cloudflare Workers AI Binding
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  GEMINI_API_KEY?: string;
  ORION_RUNTIME_ENVIRONMENT?: string;
  FIREBASE_API_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
}

const getWorkerGeminiClient = (apiKey?: string) => {
  const key = apiKey || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
  if (!key) return null;
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (e) {
    return null;
  }
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
    const activeEnv = ((env.ORION_RUNTIME_ENVIRONMENT || dbManager.getEnvironment() || "DEMO").toUpperCase() === "LIVE" ? "LIVE" : "DEMO") as 'DEMO' | 'LIVE';

    // 0. Handle CORS Preflight Requests
    if (request.method === "OPTIONS") {
      const cors = getCorsHeaders(request);
      return new Response(null, {
        status: 204,
        headers: {
          ...EDGE_SECURITY_HEADERS,
          ...cors,
        }
      });
    }

    // 0b. Strict SSRF & Arbitrary Proxying Prevention
    if (url.pathname === "/proxy" || url.pathname === "/fetch" || url.searchParams.has("proxy_url") || url.searchParams.has("relay_to")) {
      return applySecurityHeaders(
        new Response(
          JSON.stringify({ error: "FORBIDDEN", message: "Arbitrary outbound proxying is permanently disabled." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        ),
        request
      );
    }

    // 0c. Safe Public Health Check Endpoints (Zero internal IP, port, or credential leakage)
    if ((url.pathname === "/health" || url.pathname === "/api/health") && request.method === "GET") {
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            status: "ok",
            service: "orion-9"
          }),
          { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        ),
        request
      );
    }

    // 0d. Safe Auth Subsystem Health Endpoint
    if (url.pathname === "/api/auth/health" && request.method === "GET") {
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            status: "ok",
            service: "orion-auth"
          }),
          { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        ),
        request
      );
    }

    // 0da. Native Mobile & Web Authentication Route (POST /api/auth/login)
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const rateLimitErr = applyWorkerRateLimit(request, 'default');
      if (rateLimitErr) return rateLimitErr;

      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        return createSecurityErrorResponse('Invalid JSON request body.', 400);
      }

      const identifier = String(body.identifier || body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!identifier || !password) {
        return createSecurityErrorResponse('Identifier and password are required.', 400);
      }

      // 1. LIVE Environment Authentication
      if (activeEnv === 'LIVE') {
        const isDemoAdmin = (identifier === 'admin' || identifier === 'admin@orion.network') &&
          (password === 'admin' || password === 'demo123' || password === 'OrionAdmin2026!');
        const isDemoUser = (identifier === 'user' || identifier === 'user@orion.network') &&
          (password === 'user' || password === 'demo123' || password === 'OrionUser2026!');

        if (isDemoAdmin || isDemoUser) {
          return createSecurityErrorResponse('Demo credentials are strictly prohibited in the LIVE environment.', 403);
        }

        const firebaseApiKey = env.FIREBASE_API_KEY || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_API_KEY || process.env?.FIREBASE_API_KEY : undefined);
        if (!firebaseApiKey) {
          return createSecurityErrorResponse('LIVE authentication service requires configured FIREBASE_API_KEY on the server.', 503);
        }

        try {
          const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
          const authRes = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: identifier,
              password,
              returnSecureToken: true,
            }),
          });

          const authData: any = await authRes.json();
          if (!authRes.ok) {
            const fbError = authData?.error?.message || 'Authentication failed.';
            let userMessage = 'Invalid email or password.';
            if (fbError === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
              userMessage = 'Too many failed login attempts. Please try again later.';
            } else if (fbError === 'USER_DISABLED') {
              userMessage = 'This account has been disabled.';
            }
            return createSecurityErrorResponse(userMessage, 401);
          }

          const localId = authData.localId;
          const email = authData.email || identifier;
          const displayName = authData.displayName || identifier.split('@')[0];
          const expiresInSeconds = parseInt(authData.expiresIn || '3600', 10);
          const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

          const isAdminUser = email.startsWith('admin@') || email.includes('admin');
          const userRole = isAdminUser ? 'platform_admin' : 'user';

          const userProfile = {
            id: localId,
            username: email.split('@')[0],
            email,
            fullName: displayName,
            role: userRole,
            organizationId: 'org-live-primary',
            organizationName: 'Orion Live Enterprise Network',
            status: 'active' as const,
          };

          const session = {
            token: authData.idToken,
            refreshToken: authData.refreshToken,
            user: userProfile,
            environment: 'LIVE' as const,
            expiresAt,
          };

          return applySecurityHeaders(
            new Response(
              JSON.stringify({
                success: true,
                token: authData.idToken,
                refreshToken: authData.refreshToken,
                session,
                user: userProfile,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            ),
            request
          );
        } catch (authErr: any) {
          return createSafeErrorResponse(authErr, 500, 'Upstream authentication failed.', request);
        }
      }

      // 2. DEMO Environment Authentication
      const isDemoAdmin = (identifier === 'admin' || identifier === 'admin@orion.network') &&
        (password === 'admin' || password === 'demo123' || password === 'OrionAdmin2026!');
      const isDemoUser = (identifier === 'user' || identifier === 'user@orion.network') &&
        (password === 'user' || password === 'demo123' || password === 'OrionUser2026!');

      if (isDemoAdmin) {
        const expiresAt = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
        const token = `orion_sess:DEMO:admin:platform_admin:${Date.now() + 12 * 3600 * 1000}:sig_demo_admin`;
        const profile = {
          id: 'usr-admin-v2',
          username: 'admin',
          email: 'admin@orion.network',
          fullName: 'Platform Admin',
          role: 'platform_admin' as const,
          organizationId: 'org-global-corp',
          organizationName: 'Global Autonomous Supply Chain Network',
          jobTitle: 'Chief Supply Chain Technologist',
          department: 'Autonomous Operations',
          status: 'active' as const,
        };
        const session = { token, user: profile, environment: 'DEMO' as const, expiresAt };
        return applySecurityHeaders(
          new Response(JSON.stringify({ success: true, token, session, user: profile }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
          request
        );
      }

      if (isDemoUser) {
        const expiresAt = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
        const token = `orion_sess:DEMO:user:user:${Date.now() + 12 * 3600 * 1000}:sig_demo_user`;
        const profile = {
          id: 'usr-user-v2',
          username: 'user',
          email: 'user@orion.network',
          fullName: 'Elena Rostova',
          role: 'user' as const,
          organizationId: 'org-global-corp',
          organizationName: 'Global Autonomous Supply Chain Network',
          jobTitle: 'Supply Chain Operations Specialist',
          department: 'Operations',
          status: 'active' as const,
        };
        const session = { token, user: profile, environment: 'DEMO' as const, expiresAt };
        return applySecurityHeaders(
          new Response(JSON.stringify({ success: true, token, session, user: profile }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
          request
        );
      }

      return createSecurityErrorResponse('Invalid demo credentials', 401);
    }

    // 0db. SCM Operational Telemetry & Control Tower Data (GET /api/control-tower/data or /api/control-tower/summary)
    if ((url.pathname === "/api/control-tower/data" || url.pathname === "/api/control-tower/summary") && request.method === "GET") {
      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized || !auth.user) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode || 401);
      }

      const exceptions = [
        {
          id: 'EXC-2026-001',
          date: '2026-10-28T14:30:00Z',
          type: 'Stock-Out Risk',
          severity: 'Critical',
          entityId: 'SKU-1000',
          description: 'Quantum Neural Processing Unit inventory below critical 2-day safety threshold at Chicago DC-01.',
          estimatedImpact: 145000,
          status: 'Open',
          owner: 'Elena Rostova',
          recommendedAction: 'Expedite inbound shipment SHP-2026-0001 and trigger emergency buffer allocation from Dallas DC-03.',
        },
        {
          id: 'EXC-2026-002',
          date: '2026-10-28T11:15:00Z',
          type: 'Shipment Delay',
          severity: 'Critical',
          entityId: 'SHP-2026-0001',
          description: 'Pacific maritime lane transshipment congestion in Long Beach. Expected delay: +4 days.',
          estimatedImpact: 88000,
          status: 'Investigating',
          owner: 'Marcus Vance',
          recommendedAction: 'Reroute remaining containers via intermodal rail priority corridor PAC-04.',
        },
        {
          id: 'EXC-2026-003',
          date: '2026-10-28T09:45:00Z',
          type: 'PO Overdue',
          severity: 'High',
          entityId: 'PO-2026-0042',
          description: 'Supplier Titan Microelectronics failed to acknowledge delivery schedule for 1,200 optical sensors.',
          estimatedImpact: 62000,
          status: 'Action Required',
          owner: 'Sarah Chen',
          recommendedAction: 'Issue formal SLA non-compliance warning and activate secondary qualified supplier Apex Dynamics.',
        },
        {
          id: 'EXC-2026-004',
          date: '2026-10-27T16:20:00Z',
          type: 'Supplier Quality',
          severity: 'High',
          entityId: 'SUP-002',
          description: 'Apex Dynamics lot batch #4409 defect rate spiked to 4.2% (threshold: 1.5%).',
          estimatedImpact: 34000,
          status: 'Investigating',
          owner: 'Elena Rostova',
          recommendedAction: 'Initiate quarantine inspection protocol on lot #4409 and pause open PO-2026-0048.',
        },
        {
          id: 'EXC-2026-005',
          date: '2026-10-27T12:00:00Z',
          type: 'Forecast Variance',
          severity: 'Medium',
          entityId: 'SKU-1004',
          description: 'Automotive sensor demand exceeds rolling baseline by 28% in EMEA East region.',
          estimatedImpact: 21000,
          status: 'Open',
          owner: 'David K.',
          recommendedAction: 'Adjust dynamic safety buffer factor from 1.2 to 1.45 for next 30 days.',
        },
      ];

      const shipments = [
        {
          id: 'SHP-2026-0001',
          poId: 'PO-2026-0038',
          supplierId: 'SUP-001',
          carrier: 'Maersk Line',
          origin: 'Port of Yokohama, JP',
          destination: 'Long Beach Terminal, US',
          shipDate: '2026-10-18T00:00:00Z',
          expectedArrival: '2026-11-01T00:00:00Z',
          actualArrival: null,
          status: 'Delayed',
          delayDays: 4,
          freightCost: 32500,
          trackingNumber: 'MSK-99201481',
        },
        {
          id: 'SHP-2026-0002',
          poId: 'PO-2026-0040',
          supplierId: 'SUP-003',
          carrier: 'DHL Global Forwarding',
          origin: "Frankfurt Air Hub, DE",
          destination: "Chicago O'Hare Hub, US",
          shipDate: '2026-10-26T00:00:00Z',
          expectedArrival: '2026-10-29T00:00:00Z',
          actualArrival: null,
          status: 'In Transit',
          delayDays: 0,
          freightCost: 14200,
          trackingNumber: 'DHL-88102941',
        },
        {
          id: 'SHP-2026-0003',
          poId: 'PO-2026-0041',
          supplierId: 'SUP-002',
          carrier: 'Kuehne + Nagel',
          origin: 'Rotterdam Gateway, NL',
          destination: 'New York Newark, US',
          shipDate: '2026-10-22T00:00:00Z',
          expectedArrival: '2026-10-31T00:00:00Z',
          actualArrival: null,
          status: 'In Transit',
          delayDays: 1,
          freightCost: 18900,
          trackingNumber: 'KN-5519201',
        },
        {
          id: 'SHP-2026-0004',
          poId: 'PO-2026-0039',
          supplierId: 'SUP-004',
          carrier: 'Ocean Network Express',
          origin: 'Port of Kaohsiung, TW',
          destination: 'Oakland Port, US',
          shipDate: '2026-10-15T00:00:00Z',
          expectedArrival: '2026-10-28T00:00:00Z',
          actualArrival: '2026-10-28T18:00:00Z',
          status: 'Delivered',
          delayDays: 0,
          freightCost: 26400,
          trackingNumber: 'ONE-7721904',
        },
      ];

      const inventory = [
        {
          id: 'INV-001',
          productId: 'SKU-1000',
          warehouseId: 'WH-CHI-01',
          onHand: 180,
          reserved: 120,
          inTransit: 500,
          safetyStock: 150,
          reorderPoint: 250,
          dailyDemand: 28,
          averageDailyDemand: 28,
          unitCost: 450,
          leadTime: 14,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'INV-002',
          productId: 'SKU-1001',
          warehouseId: 'WH-DAL-02',
          onHand: 850,
          reserved: 200,
          inTransit: 800,
          safetyStock: 300,
          reorderPoint: 500,
          dailyDemand: 45,
          averageDailyDemand: 45,
          unitCost: 180,
          leadTime: 8,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'INV-003',
          productId: 'SKU-1002',
          warehouseId: 'WH-FRA-01',
          onHand: 420,
          reserved: 380,
          inTransit: 120,
          safetyStock: 100,
          reorderPoint: 180,
          dailyDemand: 16,
          averageDailyDemand: 16,
          unitCost: 820,
          leadTime: 21,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'INV-004',
          productId: 'SKU-1003',
          warehouseId: 'WH-NRT-01',
          onHand: 2680,
          reserved: 450,
          inTransit: 0,
          safetyStock: 600,
          reorderPoint: 1000,
          dailyDemand: 72,
          averageDailyDemand: 72,
          unitCost: 125,
          leadTime: 6,
          lastUpdated: new Date().toISOString(),
        },
      ];

      const suppliers = [
        {
          id: 'SUP-001',
          name: 'Titan Microelectronics',
          category: 'Semiconductors',
          region: 'Asia Pacific',
          country: 'Japan',
          contact: 'Kenji Takahashi (k.takahashi@titan-micro.jp)',
          otif: 78.4,
          qualityRate: 97.6,
          leadTime: 18,
          defectRate: 2.4,
          spend: 4850000,
          openPoValue: 720000,
          score: 76,
          riskLevel: 'High' as const,
          status: 'Under Review',
        },
        {
          id: 'SUP-002',
          name: 'Apex Dynamics',
          category: 'Precision Mechanical',
          region: 'North America',
          country: 'United States',
          contact: 'Rachel Adams (radams@apexdynamics.com)',
          otif: 91.8,
          qualityRate: 95.8,
          leadTime: 12,
          defectRate: 4.2,
          spend: 2900000,
          openPoValue: 340000,
          score: 88,
          riskLevel: 'Medium' as const,
          status: 'Active',
        },
        {
          id: 'SUP-003',
          name: 'Nordic Precision Assemblies',
          category: 'Precision Mechanical',
          region: 'Europe',
          country: 'Germany',
          contact: 'Hans Weber (h.weber@nordic-precision.de)',
          otif: 97.2,
          qualityRate: 99.8,
          leadTime: 8,
          defectRate: 0.2,
          spend: 3100000,
          openPoValue: 490000,
          score: 96,
          riskLevel: 'Low' as const,
          status: 'Preferred',
        },
        {
          id: 'SUP-004',
          name: 'Pacific Core Tech',
          category: 'Power Systems',
          region: 'East Asia',
          country: 'Taiwan',
          contact: 'Mei-Ling Chen (ml.chen@pct-power.tw)',
          otif: 84.1,
          qualityRate: 98.4,
          leadTime: 16,
          defectRate: 1.6,
          spend: 1450000,
          openPoValue: 180000,
          score: 85,
          riskLevel: 'Medium' as const,
          status: 'Active',
        },
      ];

      const purchaseOrders = [
        {
          id: 'PO-2026-0038',
          supplierId: 'SUP-001',
          orderDate: '2026-10-10T00:00:00Z',
          expectedDelivery: '2026-11-01T00:00:00Z',
          status: 'Delayed' as const,
          totalValue: 225000,
          currency: 'USD',
          buyer: 'Sarah Chen',
          lines: [
            { productId: 'SKU-1000', quantity: 500, receivedQuantity: 0, unitPrice: 450 },
          ],
        },
        {
          id: 'PO-2026-0040',
          supplierId: 'SUP-003',
          orderDate: '2026-10-20T00:00:00Z',
          expectedDelivery: '2026-10-29T00:00:00Z',
          status: 'In Transit' as const,
          totalValue: 144000,
          currency: 'USD',
          buyer: 'Marcus Vance',
          lines: [
            { productId: 'SKU-1001', quantity: 800, receivedQuantity: 0, unitPrice: 180 },
          ],
        },
        {
          id: 'PO-2026-0042',
          supplierId: 'SUP-001',
          orderDate: '2026-10-12T00:00:00Z',
          expectedDelivery: '2026-10-26T00:00:00Z',
          status: 'Overdue' as const,
          totalValue: 98400,
          currency: 'USD',
          buyer: 'Sarah Chen',
          lines: [
            { productId: 'SKU-1002', quantity: 120, receivedQuantity: 0, unitPrice: 820 },
          ],
        },
      ];

      const recentEvents = [
        {
          id: 'EVT-01',
          source: 'Event Fabric',
          entityType: 'INVENTORY_REBALANCE',
          entityId: 'SKU-1000',
          eventType: 'Buffer Calibration',
          timestamp: '12m ago',
          description: 'Autonomous rebalance policy calculated +45 unit buffer for Chicago DC.',
          badgeColor: '#10b981',
        },
        {
          id: 'EVT-02',
          source: 'EDI Gateway',
          entityType: 'SHIPMENT_STATUS',
          entityId: 'SHP-2026-0001',
          eventType: 'Lane Congestion Detected',
          timestamp: '34m ago',
          description: 'Carrier Maersk updated transshipment ETA +4 days at Port of Long Beach.',
          badgeColor: '#ef4444',
        },
        {
          id: 'EVT-03',
          source: 'ERP Synchronizer',
          entityType: 'PO_CONFIRMATION',
          entityId: 'PO-2026-0040',
          eventType: 'Ledger Reconciled',
          timestamp: '1h ago',
          description: 'PO-2026-0040 delivery milestone confirmed by DHL Global Forwarding.',
          badgeColor: '#06b6d4',
        },
        {
          id: 'EVT-04',
          source: 'Cognitive Engine',
          entityType: 'RISK_PROPOSAL',
          entityId: 'EXC-2026-001',
          eventType: 'Decision Proposed',
          timestamp: '2h ago',
          description: 'Decision Copilot proposed priority intermodal expedite for SKU-1000.',
          badgeColor: '#f59e0b',
        },
      ];

      const metrics = {
        networkHealthIndex: 87,
        criticalExceptionsCount: exceptions.filter(e => e.severity === 'Critical').length,
        delayedShipmentsCount: shipments.filter(s => s.delayDays > 0).length,
        delayedShipmentsValue: shipments.filter(s => s.delayDays > 0).reduce((sum, s) => sum + s.freightCost, 0),
        inventoryRiskCount: inventory.filter(i => (i.onHand - i.reserved) < i.safetyStock).length,
        totalInventoryUnits: inventory.reduce((sum, i) => sum + i.onHand, 0),
        totalInventoryValue: inventory.reduce((sum, i) => sum + i.onHand * i.unitCost, 0),
        openPOCount: purchaseOrders.length,
        overduePOCount: purchaseOrders.filter(po => po.status === 'Overdue' || po.status === 'Delayed').length,
        totalSpendCommitment: purchaseOrders.reduce((sum, po) => sum + po.totalValue, 0),
        averageSupplierOtif: Math.round((suppliers.reduce((sum, s) => sum + s.otif, 0) / suppliers.length) * 10) / 10,
        lastRefreshedAt: new Date().toISOString(),
        environment: activeEnv,
      };

      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            success: true,
            metrics,
            exceptions,
            shipments,
            inventory,
            purchaseOrders,
            suppliers,
            recentEvents,
            environment: activeEnv,
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
        ),
        request
      );
    }

    // 0dc. SCM Operational Action Execution (POST /api/control/execute-action)
    if (url.pathname === "/api/control/execute-action" && request.method === "POST") {
      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized || !auth.user) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode || 401);
      }

      if (auth.user.role === 'viewer') {
        return createSecurityErrorResponse('Forbidden: Viewers are not authorized to execute operational actions.', 403);
      }

      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        return createSecurityErrorResponse('Invalid JSON request body.', 400);
      }

      const { actionType, entityId, parameters } = body;
      if (!actionType || !entityId) {
        return createSecurityErrorResponse('Missing required parameters: actionType and entityId are required.', 400);
      }

      const auditId = `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            success: true,
            auditId,
            actionType,
            entityId,
            parameters: parameters || {},
            actor: {
              userId: auth.user.userId,
              email: auth.user.email,
              role: auth.user.role,
            },
            message: `Action '${actionType}' confirmed for ${entityId}. Verified by ${auth.user.email || auth.user.userId}.`,
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

    // 0dd. In-App Operational Alerts (GET /api/notifications/alerts)
    if (url.pathname === "/api/notifications/alerts" && request.method === "GET") {
      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized || !auth.user) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode || 401);
      }

      const alerts = [
        {
          id: 'alt-1',
          title: 'Critical Inventory Risk: SKU-1000',
          message: 'Inventory coverage down to 2.1 days of demand at Chicago DC-01.',
          severity: 'Critical',
          timestamp: '15 mins ago',
          read: false,
          entityType: 'inventory',
          entityId: 'SKU-1000',
          actionRequired: true,
        },
        {
          id: 'alt-2',
          title: 'Maritime Congestion Delay: SHP-2026-0001',
          message: 'Maersk consignment delayed +4 days due to Port of Long Beach backlog.',
          severity: 'Critical',
          timestamp: '42 mins ago',
          read: false,
          entityType: 'shipment',
          entityId: 'SHP-2026-0001',
          actionRequired: true,
        },
        {
          id: 'alt-3',
          title: 'PO Overdue Warning: PO-2026-0042',
          message: 'Titan Microelectronics delivery overdue by 2 days.',
          severity: 'High',
          timestamp: '2 hours ago',
          read: false,
          entityType: 'po',
          entityId: 'PO-2026-0042',
          actionRequired: false,
        },
        {
          id: 'alt-4',
          title: 'ERP Ledger Telemetry Reconciled',
          message: 'Autonomous synchronization completed across all 4 distribution centers.',
          severity: 'Low',
          timestamp: '4 hours ago',
          read: true,
          actionRequired: false,
        },
      ];

      return applySecurityHeaders(
        new Response(
          JSON.stringify({ success: true, alerts }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

    // 0de. Push Notification Device Registration (POST /api/notifications/register-device)
    if (url.pathname === "/api/notifications/register-device" && request.method === "POST") {
      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized || !auth.user) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode || 401);
      }

      return applySecurityHeaders(
        new Response(
          JSON.stringify({ success: true, registered: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

    // 0e. Branding Configuration Route (GET, PUT, POST, DELETE /api/branding)
    if (url.pathname === "/api/branding") {
      if (request.method === "GET") {
        try {
          const branding = await getDurableBranding(env.FIREBASE_API_KEY, env.FIREBASE_PROJECT_ID);
          return applySecurityHeaders(
            new Response(
              JSON.stringify({ success: true, data: branding }),
              { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } }
            ),
            request
          );
        } catch (err: any) {
          return applySecurityHeaders(
            new Response(
              JSON.stringify({ success: false, error: err?.message || "Failed to load branding" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            ),
            request
          );
        }
      }
      if (request.method === "PUT" || request.method === "POST") {
        const token = extractBearerToken(request);
        const auth = verifyWorkerAuthToken(token, activeEnv);
        if (!auth.authorized || !auth.user) {
          return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode || 401);
        }
        const isAdmin = auth.user.role === 'platform_admin' || auth.user.role === 'organization_admin';
        if (!isAdmin) {
          return createSecurityErrorResponse('Forbidden: Administrative privileges required.', 403);
        }
        let updated: any = {};
        try {
          updated = await request.json();
        } catch (e) {
          return createSecurityErrorResponse('Invalid JSON payload in request body.', 400);
        }
        try {
          const savedBranding = await saveDurableBranding(updated, env.FIREBASE_API_KEY, env.FIREBASE_PROJECT_ID);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, data: savedBranding }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }),
            request
          );
        } catch (saveErr: any) {
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: false, error: saveErr?.message || "authoritative database write failed" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            }),
            request
          );
        }
      }
      if (request.method === "DELETE") {
        const token = extractBearerToken(request);
        const auth = verifyWorkerAuthToken(token, activeEnv);
        if (!auth.authorized || !auth.user) {
          return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode || 401);
        }
        const isAdmin = auth.user.role === 'platform_admin' || auth.user.role === 'organization_admin';
        if (!isAdmin) {
          return createSecurityErrorResponse('Forbidden: Administrative privileges required.', 403);
        }
        try {
          const resetConfig = await resetDurableBranding(env.FIREBASE_API_KEY, env.FIREBASE_PROJECT_ID);
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: true, data: resetConfig, message: "Branding reset to defaults." }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }),
            request
          );
        } catch (resetErr: any) {
          return applySecurityHeaders(
            new Response(JSON.stringify({ success: false, error: resetErr?.message || "Failed to reset branding in authoritative database" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            }),
            request
          );
        }
      }
    }

    // 0f. Branding Asset Serving Route (e.g. /api/branding/assets/creator_photo)
    if (url.pathname.startsWith("/api/branding/assets/") && request.method === "GET") {
      const assetId = url.pathname.replace("/api/branding/assets/", "").split("/")[0].split("?")[0];
      if (assetId) {
        try {
          const asset = await getDurableBrandingAsset(assetId, env.FIREBASE_API_KEY, env.FIREBASE_PROJECT_ID);
          if (asset && asset.bytes) {
            return applySecurityHeaders(
              new Response(asset.bytes, {
                status: 200,
                headers: {
                  "Content-Type": asset.mimeType,
                  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                },
              }),
              request
            );
          }
        } catch (e) {}
      }
      return applySecurityHeaders(
        new Response(JSON.stringify({ error: "Asset not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }),
        request
      );
    }

    // AI status route (Public, rate-limited)
    if (url.pathname === "/api/ai/status" && request.method === "GET") {
      const rateLimitErr = applyWorkerRateLimit(request, 'ai');
      if (rateLimitErr) return rateLimitErr;

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      return new Response(
        JSON.stringify({
          configured: !!apiKey,
          provider: apiKey ? "gemini" : "deterministic_engine",
          model: apiKey ? "gemini-3.8-flash" : "local_scm_rules",
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    // AI choose tools route (Authenticated & rate-limited)
    if (url.pathname === "/api/ai/choose-tools" && request.method === "POST") {
      const rateLimitErr = applyWorkerRateLimit(request, 'ai');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const rawPrompt = (body.prompt || "").trim();
      const p = rawPrompt.toLowerCase();
      const allowlist = [
        'getInventory', 'getInventoryRisks', 'getSuppliers', 'getSupplierPerformance',
        'getPurchaseOrders', 'getOverduePOs', 'getShipments', 'getDelayedShipments',
        'getExceptions', 'getPendingDecisions', 'getDecisions', 'getDashboardMetrics',
        'getDemandForecasts', 'getInventoryOptimization', 'getContracts', 'getTransportationPlans'
      ];

      // Fast-path for simple greetings or capability queries
      if (p === 'hello' || p === 'hi' || p === 'hey' || p === 'good morning' || p === 'help' || p === 'what can you do') {
        return new Response(JSON.stringify({ toolsToCall: [] }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      const gemini = getWorkerGeminiClient(apiKey);

      if (!gemini) {
        const tools: string[] = ['getDashboardMetrics'];
        if (p.includes('inventory') || p.includes('stock') || p.includes('sku')) tools.push('getInventory', 'getInventoryRisks');
        if (p.includes('supplier') || p.includes('vendor')) tools.push('getSuppliers', 'getSupplierPerformance');
        if (p.includes('po') || p.includes('purchase') || p.includes('order')) tools.push('getPurchaseOrders', 'getOverduePOs');
        if (p.includes('shipment') || p.includes('carrier') || p.includes('delay')) tools.push('getShipments', 'getDelayedShipments');
        if (p.includes('exception') || p.includes('alert')) tools.push('getExceptions');
        if (p.includes('decision') || p.includes('approve')) tools.push('getDecisions', 'getPendingDecisions');
        return new Response(JSON.stringify({ toolsToCall: Array.from(new Set(tools)), fallback: true }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }

      try {
        const systemPrompt = `You are a data router for the Orion Supply Chain Operating System.
Based on the user's query, determine which of the following operational data tools are needed to answer the question:
${allowlist.join(', ')}

Return ONLY a valid JSON array of string tool names. Only include tools that are strictly relevant to fetching data needed for the query.
If the query is a simple greeting (e.g. "hello", "hi") or general capability query (e.g. "what can you do"), return an empty array [].
If unsure for operational queries, include 'getDashboardMetrics'.`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemPrompt}\n\nUser Prompt: ${rawPrompt}`,
          config: { temperature: 0.1 }
        });
        const responseText = response.text || "[]";
        let tools: string[] = [];
        try {
          let cleanText = responseText.replace(/\s*```json\s*/g, '').replace(/\s*```\s*/g, '').trim();
          const parsed = JSON.parse(cleanText);
          const list = Array.isArray(parsed) ? parsed : (parsed.tools || parsed.toolsToCall || Object.values(parsed).flat());
          if (Array.isArray(list)) {
            tools = list.filter((t: any) => typeof t === 'string' && allowlist.includes(t));
          }
        } catch (e) {
          tools = ["getDashboardMetrics"];
        }
        return new Response(JSON.stringify({ toolsToCall: tools }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ toolsToCall: ["getDashboardMetrics", "getInventoryRisks", "getExceptions", "getPendingDecisions"], fallback: true }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }
    }

    // AI insight route (Authenticated & rate-limited)
    if (url.pathname === "/api/ai/insight" && request.method === "POST") {
      const rateLimitErr = applyWorkerRateLimit(request, 'ai');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const { prompt, dataContext, specializedMode } = body;

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      const gemini = getWorkerGeminiClient(apiKey);

      if (!gemini) {
        return new Response(
          JSON.stringify({
            fallback: true,
            error: "No AI provider configured on the server.",
            message: "Using local deterministic reasoning engine grounded in live data."
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        const systemInstruction = `You are ORION AI, the native cognitive layer of the Orion Supply Chain Operating System.
You operate on the core loop: SENSE → UNDERSTAND → PREDICT → DECIDE → ACT → LEARN.
Grounded Principle: Ground all insights strictly and exclusively in the provided operational data context.
Do NOT invent fake SKUs, fabricated inventory numbers, imaginary supplier names, or false metrics.
When data is missing or incomplete, explicitly state "DATA NOT AVAILABLE" or "INSUFFICIENT DATA".

Instructions:
1. Answer the user's specific prompt directly, accurately, and concisely.
2. If the user asks a simple question, greeting, or specific query (e.g. about a single SKU, PO, or supplier), provide a direct targeted response without forcing unnecessary multi-section templates.
3. For comprehensive risk overviews, executive reports, or multi-domain SCM analysis, structure your response using markdown with standard OS sections where appropriate:
- **EXECUTIVE SUMMARY**
- **OPERATIONAL SIGNALS & ROOT CAUSES** (Categorize clearly as KNOWN, CALCULATED, or INFERRED)
- **DOWNSTREAM RISK & BUSINESS IMPACT** (Quantify financial exposure, service level impact, stockout risk)
- **RECOMMENDED DECISIONS & ACTIONS** (Actionable, specific next steps)
- **CONFIDENCE & EVIDENCE GROUNDING**`;

        const userContent = `OPERATIONAL CONTEXT (Live SCM Data):
${JSON.stringify(dataContext || {}, null, 2)}

SPECIALIZED COGNITIVE MODE: ${specializedMode || 'General Copilot'}

USER PROMPT:
${prompt || ''}`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemInstruction}\n\n${userContent}`,
          config: { temperature: 0.2 }
        });

        return new Response(
          JSON.stringify({ response: response.text || "No response generated.", provider: "gemini", model: "gemini-3.8-flash" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            fallback: true,
            error: err?.message || "Failed to generate AI insights.",
            message: "Falling back to deterministic Orion reasoning."
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // AI platform intelligence route (Admin Authorized & rate-limited)
    if (url.pathname === "/api/ai/platform-intelligence" && request.method === "POST") {
      const rateLimitErr = applyWorkerRateLimit(request, 'admin');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }
      if (auth.user?.role !== 'platform_admin' && auth.user?.role !== 'organization_admin') {
        return createSecurityErrorResponse('Access denied. Administrator privileges required.', 403);
      }

      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const { dataContext, scope, horizon, customPrompt } = body;

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      const gemini = getWorkerGeminiClient(apiKey);

      if (!gemini) {
        return new Response(
          JSON.stringify({
            fallback: true,
            error: "No AI provider configured on the server.",
            message: "Using local deterministic reasoning engine grounded in live data."
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        const systemInstruction = `You are ORION-9 PLATFORM INTELLIGENCE, the strategic cognitive engine for enterprise platform administrators.
Analyze the supplied live operational supply chain context (inventory, suppliers, shipments, exceptions, decisions, purchase orders, contracts).
Adhere strictly to deterministic reality:
1. All metrics, entities, and impacts MUST derive directly from the provided dataContext.
2. Root causes MUST be explicitly tagged with [KNOWN], [CALCULATED], or [INFERRED].
3. DO NOT invent fictitious suppliers, imaginary SKUs, or false data.
4. Provide structured, executive-grade analysis with dollar-quantified risk exposure.

Return a STRICT JSON object conforming to exact platform intelligence schema.`;

        const userContent = `ADMINISTRATOR CONTEXT:
Admin: ${auth.user?.email || auth.user?.userId || 'Platform Administrator'} (${auth.user?.role || 'platform_admin'})
Scope: ${scope || 'full_chain'}
Planning Horizon: ${horizon || 'realtime'}
Custom Query: ${customPrompt || 'Execute end-to-end strategic platform intelligence analysis'}

LIVE SUPPLY CHAIN TELEMETRY:
${JSON.stringify(dataContext || {}, null, 2)}`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemInstruction}\n\n${userContent}`,
          config: { temperature: 0.15, responseMimeType: "application/json" }
        });

        const responseText = response.text || "{}";
        let parsed: any = {};
        try {
          let cleanText = responseText.replace(/\s*```json\s*/g, '').replace(/\s*```\s*/g, '').trim();
          parsed = JSON.parse(cleanText);
        } catch (e) {
          parsed = { executiveSummary: responseText, systemHealthScore: 82 };
        }
        return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ fallback: true, error: err?.message || "Failed to generate strategic platform intelligence." }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 1. GET /api/wallpaper/cloudflare/status or /api/wallpaper/status or /api/ai/wallpaper-status
    if (
      (url.pathname === "/api/wallpaper/cloudflare/status" ||
        url.pathname === "/api/wallpaper/status" ||
        url.pathname === "/api/ai/wallpaper-status") &&
      request.method === "GET"
    ) {
      const status = await checkCloudflareWallpaperStatus(env.AI, env.CLOUDFLARE_API_TOKEN, env.CLOUDFLARE_ACCOUNT_ID);
      const clientStatus = {
        available: status.available,
        configured: status.configured,
        status: status.status,
        error: status.error,
        supportedDimensions: status.supportedDimensions,
      };
      return new Response(JSON.stringify(clientStatus), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    // 2. POST /api/wallpaper/generate or /api/ai/generate-wallpaper (Cloudflare Workers AI FLUX - Authenticated & rate-limited)
    if (
      (url.pathname === "/api/wallpaper/generate" || url.pathname === "/api/ai/generate-wallpaper") &&
      request.method === "POST"
    ) {
      const rateLimitErr = applyWorkerRateLimit(request, 'wallpaper');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }

      const result = await generateCloudflareWallpapers(env.AI, {
        ...body,
        apiToken: env.CLOUDFLARE_API_TOKEN,
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
      });

      const clientResponse = result.success
        ? {
            success: true,
            candidates: (result.candidates || []).map(c => ({
              id: c.candidateId || c.id,
              candidateId: c.candidateId || c.id,
              name: c.name,
              assetUrl: c.assetUrl,
              thumbnailUrl: c.thumbnailUrl,
              width: c.width,
              height: c.height,
              sourceWidth: c.sourceWidth,
              sourceHeight: c.sourceHeight,
              finalWidth: c.finalWidth,
              finalHeight: c.finalHeight,
              prompt: c.prompt,
              style: c.style,
              createdAt: c.createdAt,
            }))
          }
        : {
            success: false,
            error: result.error || "Wallpaper generation failed. Please try again.",
            status: result.status || "ERROR",
          };

      return new Response(JSON.stringify(clientResponse), {
        status: result.statusCode,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. GET /api/demo/scheduler/state or /api/admin/demo/scheduler/status or /api/demo/scheduler-status
    if (
      (url.pathname === "/api/demo/scheduler/state" ||
        url.pathname === "/api/admin/demo/scheduler/status" ||
        url.pathname === "/api/demo/scheduler-status") &&
      request.method === "GET"
    ) {
      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      const state = demoPersistentSchedulerService.getSchedulerState();
      return new Response(JSON.stringify({ success: true, state, scheduler: state, runtime: "CLOUDFLARE_WORKER" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    // 4. POST /api/admin/demo/scheduler/trigger or /api/demo/generate-hourly-batch (Manual Admin Trigger)
    if (
      (url.pathname === "/api/demo/scheduler/generate" ||
        url.pathname === "/api/demo/generate-hourly-batch" ||
        url.pathname === "/api/admin/demo/scheduler/trigger") &&
      request.method === "POST"
    ) {
      const rateLimitErr = applyWorkerRateLimit(request, 'admin');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }
      if (auth.user?.role !== 'platform_admin' && auth.user?.role !== 'organization_admin') {
        return createSecurityErrorResponse('Access denied. Administrator privileges required.', 403);
      }

      const serverEnv = (env.ORION_RUNTIME_ENVIRONMENT || dbManager.getEnvironment() || "DEMO").toUpperCase();
      if (serverEnv !== "DEMO") {
        return new Response(
          JSON.stringify({
            success: false,
            error: `[DEMO-ENGINE-GUARD] Access Denied: Synthetic Data Engine cannot execute in LIVE mode (Active: ${serverEnv}).`,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        const audit = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(undefined, true);
        return new Response(
          JSON.stringify({
            success: true,
            action: "MANUAL_TRIGGER_COMPLETED",
            batch: audit,
            state: demoPersistentSchedulerService.getSchedulerState(),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: err.message || "Failed to trigger demo generation batch",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 5. POST /api/admin/demo/scheduler/toggle or /api/demo/scheduler-control (Admin Pause/Resume control)
    if (
      (url.pathname === "/api/admin/demo/scheduler/toggle" ||
        url.pathname === "/api/demo/scheduler-control") &&
      request.method === "POST"
    ) {
      const rateLimitErr = applyWorkerRateLimit(request, 'admin');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }
      if (auth.user?.role !== 'platform_admin' && auth.user?.role !== 'organization_admin') {
        return createSecurityErrorResponse('Access denied. Administrator privileges required.', 403);
      }

      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {}

      const rawAction = (body.action || "toggle").toLowerCase();
      const currentState = demoPersistentSchedulerService.getSchedulerState();
      let newState;

      if (rawAction === "pause" || (rawAction === "toggle" && currentState.status === "RUNNING")) {
        newState = await demoPersistentSchedulerService.pauseScheduler(auth.user?.userId || "admin", auth.user?.role || "platform_admin");
      } else {
        newState = await demoPersistentSchedulerService.resumeScheduler(auth.user?.userId || "admin", auth.user?.role || "platform_admin");
      }

      return applySecurityHeaders(
        new Response(
          JSON.stringify({ success: true, state: newState }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ),
        request
      );
    }

    // 6. POST /api/ai/document-intelligence (Multi-modal Document Intelligence)
    if (url.pathname === "/api/ai/document-intelligence" && request.method === "POST") {
      const rateLimitErr = applyWorkerRateLimit(request, 'ai');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const { fileName, fileContent, fileBase64, mimeType, documentType } = body;

      if (!fileName) {
        return createSecurityErrorResponse("Missing required parameter: fileName", 400);
      }

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      const gemini = getWorkerGeminiClient(apiKey);

      if (!gemini) {
        const extension = (fileName.split('.').pop() || '').toUpperCase();
        let category = 'Contract';
        if (fileName.toLowerCase().includes('po') || fileName.toLowerCase().includes('order')) category = 'Purchase Order';
        else if (fileName.toLowerCase().includes('bol') || fileName.toLowerCase().includes('lading') || fileName.toLowerCase().includes('ship')) category = 'Bill of Lading';
        else if (fileName.toLowerCase().includes('invoice')) category = 'Invoice';

        const fields: Record<string, any> = {
          documentName: fileName,
          fileFormat: extension || documentType || 'Unknown',
          processedAt: new Date().toISOString()
        };

        if (fileContent && typeof fileContent === 'string' && fileContent.length > 0) {
          const lines = fileContent.split('\n').slice(0, 20);
          lines.forEach((line: string) => {
            if (line.includes(':')) {
              const [k, v] = line.split(':');
              if (k && v && k.trim().length < 30) {
                fields[k.trim()] = v.trim();
              }
            }
          });
        }

        return applySecurityHeaders(
          new Response(JSON.stringify({
            fallback: true,
            result: {
              summary: `Document '${fileName}' indexed via deterministic parser (${extension} format).`,
              category,
              extractedFields: fields,
              anomalyDetected: null,
              linkedEntityType: category === 'Purchase Order' ? 'PurchaseOrder' : category === 'Bill of Lading' ? 'Shipment' : 'Contract',
              linkedEntityId: ''
            }
          }), { status: 200, headers: { "Content-Type": "application/json" } }),
          request
        );
      }

      try {
        const systemInstruction = `You are Orion AI Document Intelligence, an expert in supply chain document extraction and classification.
Analyze the supplied document and return a strict JSON object with:
{
  "summary": "1-2 sentences summarizing the document",
  "category": "Classification of document (e.g. Bill of Lading, Commercial Invoice, Contract, Purchase Order, Quality Certificate)",
  "extractedFields": { "key": "value" },
  "anomalyDetected": "String detailing any identified anomalies, risks, price discrepancies, or compliance issues. If none, leave null",
  "linkedEntityType": "Supplier, Shipment, PO, or Contract",
  "linkedEntityId": "Extract an ID if available, else empty"
}`;

        const promptText = `${systemInstruction}\n\nDocument File Name: ${fileName}\n\nDocument Content Snippet:\n${typeof fileContent === 'string' ? fileContent.slice(0, 5000) : ''}`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: { temperature: 0.1, responseMimeType: 'application/json' }
        });

        const responseText = response.text || "{}";
        let parsedResult: any = {};
        try {
          parsedResult = JSON.parse(responseText.replace(/\s*```json\s*/g, '').replace(/\s*```\s*/g, '').trim());
        } catch {
          parsedResult = { summary: responseText, category: 'General Document', extractedFields: {} };
        }

        return applySecurityHeaders(
          new Response(JSON.stringify({
            success: true,
            result: parsedResult
          }), { status: 200, headers: { "Content-Type": "application/json" } }),
          request
        );
      } catch (err: any) {
        return createSafeErrorResponse(err, 500, "Failed to analyze document.", request);
      }
    }

    // API 404 Guard: Unknown /api/* routes must never fall back to SPA index.html
    if (url.pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            error: "NOT_FOUND",
            message: `API endpoint '${url.pathname}' not found.`,
            status: 404,
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        ),
        request
      );
    }

    const assetRes = await env.ASSETS.fetch(request);
    return applySecurityHeaders(assetRes, request);
    } catch (fatalErr: any) {
      return createSafeErrorResponse(fatalErr, 500, "The server encountered an error processing the request.", request);
    }
  },

  /**
   * CLOUDFLARE WORKER CRON TRIGGER HANDLER (0 * * * *)
   * Runs once every hour at minute 0 UTC.
   * Generates EXACTLY 30 enterprise synthetic packages into DEMO Firestore.
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const scheduledTime = controller.scheduledTime ? new Date(controller.scheduledTime) : new Date();
    const currentHourUtc = new Date(Date.UTC(scheduledTime.getUTCFullYear(), scheduledTime.getUTCMonth(), scheduledTime.getUTCDate(), scheduledTime.getUTCHours(), 0, 0, 0));
    const scheduledHourIso = currentHourUtc.toISOString();

    console.log(`[ORION-SCHEDULER] Cloudflare Cron Trigger invoked scheduledTime=${scheduledTime.toISOString()} cron="${controller.cron}"`);

    // 1. Authoritative Server-Side Environment Safety Guard
    const serverEnv = (env.ORION_RUNTIME_ENVIRONMENT || dbManager.getEnvironment() || "DEMO").toUpperCase();
    if (serverEnv !== "DEMO") {
      console.error(`[ORION-SCHEDULER] [DEMO-ENGINE-GUARD] Access Denied: Cloudflare Cron cannot execute in LIVE mode (Active: ${serverEnv}). Execution aborted.`);
      return;
    }

    // 2. Execute scheduled hourly generation inside Worker execution context
    const scheduledTask = async () => {
      try {
        console.log(`[ORION-SCHEDULER] processing scheduledHour=${scheduledHourIso}`);
        const result = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(scheduledHourIso, false);
        console.log(`[ORION-SCHEDULER] scheduled execution finished: batchId=${result.batchId} status=${result.status} packages=${result.packagesCount}`);
      } catch (err: any) {
        console.error(`[ORION-SCHEDULER] scheduled execution failed scheduledHour=${scheduledHourIso} error:`, err);
      }
    };

    const taskPromise = scheduledTask();
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(taskPromise);
    }
    await taskPromise;
  }
};
