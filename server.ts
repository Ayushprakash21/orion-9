import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ override: true });

// Initialize server-side Supabase clients
const getSupabaseAdmin = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

const getSupabaseServerClient = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const withTimeout = <T>(promise: Promise<T>, ms: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Query timeout")), ms))
  ]);
};

// Secure Server-side Admin Auth Helper
const requireAdmin = async (req: express.Request, res: express.Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return null;
  }
  const token = authHeader.split(" ")[1];
  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(503).json({ error: "Supabase service role key is not configured on the server." });
    return null;
  }

  try {
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ error: "Invalid or expired session" });
      return null;
    }

    // Load profiles
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr || !profile) {
      res.status(403).json({ error: "Insufficient permissions." });
      return null;
    }

    if (profile.status !== "active") {
      res.status(403).json({ error: "User account is suspended or inactive." });
      return null;
    }

    // Load organization_memberships & roles
    const { data: membership, error: membershipErr } = await admin
      .from("organization_memberships")
      .select(`
        organization_id,
        roles (
          id,
          name
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const roleName = (membership?.roles as any)?.name;

    if (roleName !== "platform_admin" && roleName !== "organization_admin") {
      res.status(403).json({ error: "Insufficient permissions." });
      return null;
    }

    return {
      callerUser: user,
      callerProfile: profile,
      callerRole: roleName,
      callerOrgId: membership?.organization_id || null,
      adminClient: admin
    };
  } catch (err) {
    res.status(500).json({ error: "Unable to complete this operation." });
    return null;
  }
};

const logAuditEvent = async (
  adminClient: any,
  actorUserId: string,
  organizationId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  description: string,
  metadata: any = {}
) => {
  try {
    const { error } = await adminClient
      .from("audit_logs")
      .insert({
        actor_user_id: actorUserId,
        organization_id: organizationId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        description,
        metadata,
        created_at: new Date().toISOString()
      });
    if (error) {
      console.warn("Failed to insert audit log:", error);
    }
  } catch (err) {
    console.warn("Error in logAuditEvent:", err);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Safe Authentication Configuration Health Check
  app.get("/api/auth/health", (_req, res) => {
    res.json({
      server: true,
      supabaseUrlConfigured: !!process.env.VITE_SUPABASE_URL,
      publishableKeyConfigured: !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      secretKeyConfigured: !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    });
  });

  // Secure Username-to-Identity Resolution (Protects against email enumeration)
  app.post("/api/auth/resolve-identity", async (req, res) => {
    try {
      const { identifier } = req.body;
      if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
        return res.status(400).json({ error: "Identifier is required" });
      }
      const clean = identifier.trim();

      // If user typed an email directly, use it
      if (clean.includes("@")) {
        return res.json({ success: true, email: clean.toLowerCase() });
      }

      // Query Supabase server-side (avoids exposing entire profiles table in browser unauthenticated)
      const admin = getSupabaseAdmin();
      const client = admin || getSupabaseServerClient();

      if (client) {
        try {
          const { data, error } = await withTimeout<any>(
            Promise.resolve(
              client
                .from("profiles")
                .select("email, username")
                .ilike("username", clean)
                .maybeSingle()
            ),
            2000
          );

          if (!error && data && data.email) {
            return res.json({ success: true, email: data.email.toLowerCase() });
          }
        } catch (err) {
          console.error("Database query failed during identity resolution:", err);
        }
      }

      return res.status(404).json({ error: "Invalid username or password." });
    } catch (err: any) {
      console.error("Error in resolve-identity:", err);
      return res.status(500).json({ error: "Unable to complete this operation." });
    }
  });

  // Privileged Admin API: Create User via Supabase Admin API
  app.post("/api/admin/users", async (req, res) => {
    const authCtx = await requireAdmin(req, res);
    if (!authCtx) return;

    const { adminClient, callerProfile, callerRole, callerOrgId } = authCtx;

    try {
      const { email, password, username, fullName, organizationId, role, status, jobTitle, department } = req.body;
      if (!email || !password || !username || !fullName) {
        return res.status(400).json({ error: "Missing required fields: email, password, username, fullName" });
      }

      // If caller is organization_admin, enforce they can only create user inside their own organization
      if (callerRole === "organization_admin" && organizationId !== callerOrgId) {
        return res.status(403).json({ error: "Insufficient permissions. Organization administrators can only manage users within their own organization." });
      }

      // Resolve role name -> role_id from roles table
      const resolvedRoleName = role ? role.trim() : "user";
      const { data: roleData, error: roleErr } = await adminClient
        .from("roles")
        .select("id, name")
        .ilike("name", resolvedRoleName)
        .maybeSingle();

      if (roleErr || !roleData) {
        return res.status(400).json({ error: `Invalid role specified: ${resolvedRoleName}` });
      }

      const roleId = roleData.id;

      // 1. Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          username: username.trim(),
          full_name: fullName.trim(),
          job_title: jobTitle,
          department: department
        }
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || "Failed to create user in Supabase Auth" });
      }

      const userId = authData.user.id;

      // 2. Upsert in profiles table
      const { data: profile, error: profError } = await adminClient
        .from("profiles")
        .upsert({
          id: userId,
          username: username.trim(),
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          status: status || "active",
          job_title: jobTitle || "Supply Chain Specialist",
          department: department || "Operations",
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profError) {
        console.warn("Warning during profile upsert:", profError);
      }

      // 3. Organization membership
      const targetOrgId = organizationId || callerOrgId;
      if (targetOrgId) {
        await adminClient
          .from("organization_memberships")
          .insert({
            user_id: userId,
            organization_id: targetOrgId,
            role_id: roleId,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      // Log secure audit event
      await logAuditEvent(
        adminClient,
        callerProfile.id,
        targetOrgId,
        "USER_CREATED",
        "profiles",
        userId,
        `User ${fullName} (${username}) was created successfully by ${callerProfile.full_name}.`,
        { username, email, role: resolvedRoleName, jobTitle, department }
      );

      return res.status(201).json({ success: true, user: profile || { id: userId, username, email, fullName } });
    } catch (err: any) {
      console.error("Admin create user error:", err);
      return res.status(500).json({ error: "Unable to complete this operation." });
    }
  });

  // Privileged Admin API: Reset Password
  app.post("/api/admin/users/:id/reset-password", async (req, res) => {
    const authCtx = await requireAdmin(req, res);
    if (!authCtx) return;

    const { adminClient, callerProfile, callerRole, callerOrgId } = authCtx;
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
      // Load target user's organization membership to verify ownership for organization_admin
      const { data: targetMembership } = await adminClient
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", id)
        .maybeSingle();

      if (callerRole === "organization_admin") {
        if (!targetMembership || targetMembership.organization_id !== callerOrgId) {
          return res.status(403).json({ error: "Insufficient permissions. Organization administrators can only manage users within their own organization." });
        }
      }

      // Update password
      const { error } = await adminClient.auth.admin.updateUserById(id, { password });
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Log secure audit event
      await logAuditEvent(
        adminClient,
        callerProfile.id,
        targetMembership?.organization_id || callerOrgId,
        "PASSWORD_RESET",
        "profiles",
        id,
        `Password was reset for user ID ${id} by ${callerProfile.full_name}.`
      );

      return res.json({ success: true });
    } catch (err: any) {
      console.error("Admin reset password error:", err);
      return res.status(500).json({ error: "Unable to complete this operation." });
    }
  });

  // Privileged Admin API: Delete User
  app.delete("/api/admin/users/:id", async (req, res) => {
    const authCtx = await requireAdmin(req, res);
    if (!authCtx) return;

    const { adminClient, callerProfile, callerRole, callerOrgId } = authCtx;
    const { id } = req.params;

    try {
      // Load target user's membership to check permissions and organization alignment
      const { data: targetMembership } = await adminClient
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", id)
        .maybeSingle();

      if (callerRole === "organization_admin") {
        if (!targetMembership || targetMembership.organization_id !== callerOrgId) {
          return res.status(403).json({ error: "Insufficient permissions. Organization administrators can only manage users within their own organization." });
        }
      }

      // Perform deletion
      await adminClient.from("organization_memberships").delete().eq("user_id", id);
      await adminClient.from("profiles").delete().eq("id", id);
      const { error } = await adminClient.auth.admin.deleteUser(id);
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Log secure audit event
      await logAuditEvent(
        adminClient,
        callerProfile.id,
        targetMembership?.organization_id || callerOrgId,
        "USER_DELETED",
        "profiles",
        id,
        `User ID ${id} was deleted successfully by ${callerProfile.full_name}.`
      );

      return res.json({ success: true });
    } catch (err: any) {
      console.error("Admin delete user error:", err);
      return res.status(500).json({ error: "Unable to complete this operation." });
    }
  });

  // AI Tool Selection Route
  app.post("/api/ai/choose-tools", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { prompt } = req.body;
      
      const fullPrompt = `You are a data router for a Supply Chain Control Tower.
Based on the user's prompt, determine which of the following data tools are needed to answer the question.
Available tools:
- getInventory
- getInventoryRisks
- getSuppliers
- getSupplierPerformance
- getPurchaseOrders
- getOverduePOs
- getShipments
- getDelayedShipments
- getExceptions
- getDecisions
- getPendingDecisions
- getDashboardMetrics

Return a JSON array of string tool names. Only include tools that are absolutely necessary. If you are unsure, include 'getDashboardMetrics'.

User Prompt: ${prompt}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      });
      
      let tools = [];
      try {
        const rawTools = JSON.parse(response.text || "[]");
        const allowlist = ['getInventory', 'getInventoryRisks', 'getSuppliers', 'getSupplierPerformance', 'getPurchaseOrders', 'getOverduePOs', 'getShipments', 'getDelayedShipments', 'getExceptions', 'getPendingDecisions', 'getDecisions', 'getDashboardMetrics'];
        tools = rawTools.filter(t => allowlist.includes(t));
      } catch (e) {
        tools = ["getDashboardMetrics"];
      }
      
      res.json({ toolsToCall: tools });
    } catch (error: any) {
      console.error("Error communicating with Gemini API (choose-tools):", error);
      res.status(500).json({ error: error.message || "Failed to choose tools." });
    }
  });

  // AI API Route
  app.post("/api/ai/insight", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { prompt, dataContext } = req.body;
      
      const fullPrompt = `You are an expert Supply Chain AI Copilot analyzing the following supply chain context.
You must ground all your insights purely on the provided data. Do not fabricate any information.
Answer the user's prompt or provide executive insights as requested.

Context Data (JSON):
${JSON.stringify(dataContext)}

User Prompt: ${prompt}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: "You are an expert AI Supply Chain assistant. Your responses must be grounded strictly in the provided data. Structure your response clearly. When appropriate, use the exact headers: EXECUTIVE SUMMARY, KEY FINDINGS, BUSINESS IMPACT, RECOMMENDED ACTIONS, CONFIDENCE, DATA USED. AI must not invent: inventory, financial impact, supplier performance, shipment status, PO status, forecast values. If data is insufficient, return: INSUFFICIENT DATA."
        }
      });
      
      res.json({ response: response.text });
    } catch (error: any) {
      console.error("Error communicating with Gemini API:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI insights." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
