# ORION-9 OS 21.1 — PULSAR RELEASE
## Enterprise Typography System Implementation Specification

**Document ID:** ORION-DOC-TYPO-002  
**Release:** ORION-9 OS 21.1 — PULSAR RELEASE  
**Status:** IMPLEMENTED & VERIFIED  
**Classification:** Core Operating Environment Architecture  
**Date:** November 12, 2026  

---

### 1. Executive Implementation Overview

The Orion-9 OS 21.1 typography architecture has been completely restored to production-grade commercial operating system standards. The implementation introduces an offline, self-hosted, air-gapped font asset pipeline using **Lato** (SIL Open Font License) as the primary UI, display, and navigation font, paired with **Roboto Mono** (Apache 2.0 License) for high-precision technical telemetry, financial figures, SKU identifiers, and terminal logs.

---

### 2. Local Font Asset Pipeline

All font files are permanently hosted as high-compression WOFF2 binaries directly within `public/fonts/`:

```
public/fonts/
├── lato/
│   ├── lato-latin-100-normal.woff2
│   ├── lato-latin-300-normal.woff2
│   ├── lato-latin-400-normal.woff2
│   ├── lato-latin-400-italic.woff2
│   ├── lato-latin-700-normal.woff2
│   ├── lato-latin-700-italic.woff2
│   └── lato-latin-900-normal.woff2
└── roboto-mono/
    ├── roboto-mono-latin-300-normal.woff2
    ├── roboto-mono-latin-400-normal.woff2
    ├── roboto-mono-latin-400-italic.woff2
    ├── roboto-mono-latin-500-normal.woff2
    ├── roboto-mono-latin-600-normal.woff2
    └── roboto-mono-latin-700-normal.woff2
```

**Key Asset Properties:**
- **Zero External CDNs:** Strict offline operation with 0 requests to `fonts.googleapis.com` or `fonts.gstatic.com`.
- **Preloading:** The most critical weights are preloaded in `index.html` via `<link rel="preload" as="font" type="font/woff2" crossorigin>`:
  - Lato Regular 400 (`lato-latin-400-normal.woff2`)
  - Lato Bold 700 (`lato-latin-700-normal.woff2`)
  - Roboto Mono Regular 400 (`roboto-mono-latin-400-normal.woff2`)
  - Roboto Mono Medium 500 (`roboto-mono-latin-500-normal.woff2`)

---

### 3. Font Stacks & CSS Architecture

#### A. Canonical Font Stacks

```typescript
export const ORION_ENTERPRISE_TYPOGRAPHY = {
  // Primary UI & Display Stack
  fontDisplay: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  fontBody: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  // High-Precision Technical & Monospace Stack
  fontMono: '"Roboto Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
};
```

#### B. CSS Variables & Scoped Classes (`src/design-system/typography/typography.css`)

```css
:root {
  --orion-font-family: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --orion-font-family-primary: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --orion-font-family-ui: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --orion-font-family-display: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --orion-font-family-mono: "Roboto Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
```

---

### 4. Controlled Typographic Scale

| Level | Size | Weight | Line Height | Tracking | Semantic Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display XL** | `40px` | `700` | `1.15` | `-0.02em` | Major system branding, hero titles |
| **Display L** | `32px` | `700` | `1.15` | `-0.015em` | System hero totals, KPI hero metrics |
| **Page Title** | `26px` | `700` | `1.25` | `-0.01em` | Active window titles, primary view headers |
| **Section Title** | `20px` | `600` | `1.25` | `-0.005em` | Drawer headers, module section cards |
| **Subsection** | `16px` | `600` | `1.25` | `0` | Modal sub-headers, widget section titles |
| **Body Large** | `16px` | `400` | `1.45` | `0` | Featured descriptive content, Copilot chat intro |
| **Body** | `14px` | `400` | `1.45` | `0` | Standard enterprise prose, form inputs |
| **Navigation** | `13px` | `500` | `1.30` | `0` | Top menu bar items, tab labels, dock hints |
| **Table Content** | `13px` | `400` | `1.40` | `0` | Data grid cells, list row content |
| **Metadata** | `12px` | `400` | `1.35` | `0` | Secondary descriptions, timestamps |
| **Technical Values** | `12px` | `400 / 500` | `1.35` | `0` | Monospace numbers, SKUs, hash IDs (`tabular-nums`) |
| **Caption** | `11px` | `400` | `1.35` | `0.015em` | Footnotes, badge subtext |
| **Micro** | `10px` | `600` | `1.20` | `0.05em` | System tags, status codes, pill labels (uppercase) |

---

### 5. Runtime Font Hydration Engine (`font-loader.ts`)

A dedicated font hydration and preloading service verifies font asset binding in `document.fonts`:

```typescript
export async function ensureOrionFontsLoaded(timeoutMs = 3000): Promise<FontLoadingStatus> {
  const fonts = document.fonts;
  await Promise.race([
    Promise.all([
      fonts.load('400 14px "Lato"'),
      fonts.load('700 14px "Lato"'),
      fonts.load('400 12px "Roboto Mono"'),
      fonts.load('600 12px "Roboto Mono"'),
    ]),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
  return {
    latoLoaded: fonts.check('400 14px "Lato"'),
    robotoMonoLoaded: fonts.check('400 12px "Roboto Mono"'),
    ready: true,
  };
}
```

The app boot cycle in `src/main.tsx` automatically calls `initOrionTypography()` prior to mounting, setting `data-fonts-ready="true"` on `<html>`.

---

### 6. Component-Level Typography Assignments

- **Top System Bar (`OrionSystemBar.tsx`):**
  - Font: `var(--orion-font-family-ui)` (`Lato`)
  - Weight: `500` (Navigation), tracking: normal, size: `13px`
- **Dynamic Island (`DynamicIslandCapsule.tsx` & `DynamicIslandExpanded.tsx`):**
  - System title: `Lato 700`, `11px`
  - Subtitle: `Lato 600`, `8.5px` uppercase
  - Status: `Lato 500`, `11px`
  - Track title & artist: `Lato 700 / 400`, `12px`
  - Battery & uptime telemetry: `Roboto Mono 500`, `10px`
- **Enterprise Control Tower (`OrionGoldenGateHeroCard.tsx`):**
  - Title: `Lato 700`, `11px` uppercase
  - Subtitle: `Lato 500`, `13px`
  - Metric Big Numbers: `Lato 700` with `Roboto Mono` tabular numerical values
  - Action buttons: `Lato 600`, `12px`
- **Orion Copilot Window:**
  - Window Chrome: `Lato 600`, `13px`
  - Assistant Messages: `Lato 400`, `14px` (line-height: `1.45`)
  - Action Chips: `Lato 500`, `12px`
  - Telemetry Footnote: `Lato 400`, `10px`
- **Data Tables & KPI Cards:**
  - Table Headers: `Lato 600`, `11px` uppercase
  - Table Cells: `Lato 400`, `13px`
  - Financial & Quantity Metrics: `Roboto Mono 500`, `12px` (`tabular-nums`)
