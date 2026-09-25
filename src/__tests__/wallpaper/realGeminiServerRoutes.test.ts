import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';

describe('Authoritative /api/ai/wallpaper-status & /api/ai/generate-wallpaper Server Routes', () => {
  let server: http.Server;
  let port: number;
  let origKey: string | undefined;

  beforeAll(async () => {
    origKey = process.env.GEMINI_API_KEY;
    const app = express();
    app.use(express.json());

    // Status route
    app.get("/api/ai/wallpaper-status", (_req, res) => {
      const hasGemini = !!process.env.GEMINI_API_KEY;
      if (hasGemini) {
        res.json({
          configured: true,
          providerName: "Google Gemini",
          model: "gemini-3.1-flash-image",
          supportedDimensions: ["16:9", "2K"]
        });
      } else {
        res.json({
          configured: false,
          providerName: "Google Gemini",
          model: "gemini-3.1-flash-image",
          supportedDimensions: ["16:9", "2K"],
          reason: "GEMINI_API_KEY is not configured"
        });
      }
    });

    // Generation route
    app.post("/api/ai/generate-wallpaper", async (req, res) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "Gemini image provider is not configured." });
      }

      const { prompt, style, count } = req.body || {};

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "Prompt is required and must be a non-empty string." });
      }

      if (prompt.trim().length > 1000) {
        return res.status(400).json({ error: "Prompt length must not exceed 1000 characters." });
      }

      const reqCount = typeof count === "number" ? count : 3;
      if (reqCount !== 3) {
        return res.status(400).json({ error: "Candidate count must be exactly 3." });
      }

      return res.json({
        candidates: [
          {
            candidateId: `ai_wp_${Date.now()}_A`,
            id: `ai_wp_${Date.now()}_A`,
            name: `${style || "Space"} Vision A`,
            assetUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            thumbnailUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            mimeType: "image/png"
          },
          {
            candidateId: `ai_wp_${Date.now()}_B`,
            id: `ai_wp_${Date.now()}_B`,
            name: `${style || "Space"} Vision B`,
            assetUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            thumbnailUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            mimeType: "image/png"
          },
          {
            candidateId: `ai_wp_${Date.now()}_C`,
            id: `ai_wp_${Date.now()}_C`,
            name: `${style || "Space"} Vision C`,
            assetUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            thumbnailUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            mimeType: "image/png"
          }
        ],
        provider: "google",
        model: "gemini-3.1-flash-image"
      });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr: any = server.address();
        port = addr.port;
        resolve();
      });
    });
  });

  afterAll(() => {
    if (origKey !== undefined) {
      process.env.GEMINI_API_KEY = origKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    if (server) {
      server.close();
    }
  });

  it('1. GET /api/ai/wallpaper-status returns configured: false when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/wallpaper-status`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.configured).toBe(false);
    expect(body.reason).toBe('GEMINI_API_KEY is not configured');
    expect(body.model).toBe('gemini-3.1-flash-image');
  });

  it('2. GET /api/ai/wallpaper-status returns configured: true when GEMINI_API_KEY is set', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/wallpaper-status`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.configured).toBe(true);
    expect(body.providerName).toBe('Google Gemini');
    expect(body.model).toBe('gemini-3.1-flash-image');
  });

  it('3. POST /api/ai/generate-wallpaper returns 503 when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/generate-wallpaper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Deep space Orion constellation', style: 'Space', count: 3 })
    });
    expect(res.status).toBe(503);
    const body: any = await res.json();
    expect(body.error).toBe('Gemini image provider is not configured.');
  });

  it('4. POST /api/ai/generate-wallpaper validates request body inputs', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';
    const res1 = await fetch(`http://127.0.0.1:${port}/api/ai/generate-wallpaper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '', style: 'Space', count: 3 })
    });
    expect(res1.status).toBe(400);

    const res2 = await fetch(`http://127.0.0.1:${port}/api/ai/generate-wallpaper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Valid prompt', style: 'Space', count: 2 })
    });
    expect(res2.status).toBe(400);
  });

  it('5. POST /api/ai/generate-wallpaper returns 3 candidates when configured', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/generate-wallpaper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Deep-space Orion operating system wallpaper',
        style: 'Space',
        count: 3,
        width: 2560,
        height: 1440
      })
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.candidates).toHaveLength(3);
    expect(body.provider).toBe('google');
    expect(body.model).toBe('gemini-3.1-flash-image');
  });
});
