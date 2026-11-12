# ORION-9 OS 21.1 — PULSAR RELEASE
# Proprietary Enterprise Design System Specification

**Design System Codename:** Orion Enterprise Architecture System (OEAS)  
**Release:** PULSAR  
**Version:** 21.1  
**Category:** Enterprise Operating Environment  
**Date:** November 12, 2026  

---

## 1. Principles & Design Philosophy

The Orion-9 Design System is engineered to convey **engineering maturity, operational precision, institutional trust, and high data density**. It repudiates the generic tropes of AI-generated consumer SaaS ("AI Slop") in favor of structural clarity inspired by premier industrial benchmarks (Linear, Bloomberg Terminal, Datadog, SAP S/4HANA, and Siemens).

### Core Tenants:
1. **Architectural Precision:** Every pixel, border, and surface has an unambiguous structural or informational purpose.
2. **Technical Minimalism:** Form follows function. Elimination of decorative gradients, floating glowing orbs, and emoji navigation.
3. **High Information Density:** Dense, readable tabular grids, monospace figures for numerical metrics, and compact, unbloated vertical rhythm.
4. **Purposeful Contrast & Surface Layers:** Deep layered neutrals rather than wallpaper bleed-through. Solid obsidian backings guarantee WCAG AA readability.
5. **Integrated System Intelligence:** AI is presented as an ambient operating system capability (deterministic forecasting, anomaly detection, autonomous reconciliation) rather than a gimmicky chatbot wrapped with marketing fluff.

---

## 2. Directory Architecture (`src/design-system/`)

```
src/design-system/
├── tokens/
│   ├── colors.ts          # Semantic Dark & Light mode color tokens
│   ├── typography.ts      # Optical hierarchy & monospace tabular font stacks
│   ├── radii.ts           # Hierarchical corner radii (3px - 16px)
│   ├── spacing.ts         # Consistent 4px-base spatial scale
│   ├── shadows.ts         # Restrained technical elevations
│   └── index.ts           # Token registry aggregation
├── components/
│   ├── EnterpriseTable.tsx      # High-density data grid with sorting, search, & pagination
│   ├── EnterpriseMetric.tsx     # KPI container with trend, unit, & provenance tracking
│   ├── EnterprisePanel.tsx      # Structural container with toolbar & action slots
│   ├── EnterpriseBadge.tsx      # 3px status badges (nominal, warning, critical, forecast)
│   ├── EnterpriseButton.tsx     # Keyboard-accessible, state-complete action controls
│   └── EnterpriseInput.tsx      # Crisp technical input, search, and filter bars
└── index.ts               # Master canonical export
```

---

## 3. Token Definitions

### 3.1 Color Palette & Modes

#### Dark Mode (Deep Graphite & Obsidian)
- **Canvas Base:** `#0B0D10` (Primary OS desktop & workspace canvas)
- **Panel Surface:** `#161B22` (Structured application panels & cards)
- **Elevated Surface:** `#21262D` (Drawers, dropdowns, and modals)
- **Hairline Borders:** `#30363D` (Subtle boundary definition; no glowing neon)
- **Typography:** Primary `#F0F6FC`, Secondary `#C9D1D9`, Muted `#8B949E`
- **Technical Accent:** `#38BDF8` (Technical Orion Cyan)

#### Light Mode (Professional Off-White & Technical Grey)
- **Canvas Base:** `#EAEEF2` (Clean workspace foundation)
- **Panel Surface:** `#FFFFFF` (High-contrast content panels)
- **Borders:** `#D0D7DE` (Subtle crisp boundary lines)
- **Typography:** Primary `#1F2328`, Secondary `#57606A`, Muted `#6E7781`
- **Technical Accent:** `#0969DA` (Enterprise Cobalt)

#### Semantic Telemetry States
- **Nominal / Success:** `#2EA043` (Dark) / `#1A7F37` (Light)
- **Advisory / Warning:** `#D29922` (Dark) / `#9A6700` (Light)
- **Critical Exception:** `#DA3633` (Dark) / `#CF222E` (Light)
- **Telemetry / Info:** `#58A6FF` (Dark) / `#0969DA` (Light)

---

### 3.2 Typographic Scale

- **Display Numbers:** 32px (`font-mono`, bold)
- **Window Titles:** 20px (`font-sans`, semibold)
- **Section Headers:** 16px (`font-sans`, medium)
- **Panel Headers & Subtitles:** 14px (`font-sans`, medium)
- **Table Headers & Metric Labels:** 11px (`font-sans`, uppercase, tracking-wider)
- **Standard Body & Grid Records:** 12px (`font-sans` & `font-mono`)
- **Metadata, Timestamps & Codes:** 10px (`font-mono`)

---

### 3.3 Corner Radii Hierarchy

To eliminate consumer-style "bubble card" aesthetics, corner radii follow strict hierarchy:
- `xs` (3px): Micro chips, status tags, table cell badges.
- `sm` (5px): Action buttons, inputs, dropdown selectors.
- `md` (8px): Inner cards, data panels, table containers.
- `lg` (10px): Section drawers, primary modals.
- `xl` (12px): Desktop window frames and top-anchored Dynamic Island.
- `full` (9999px): Reserved strictly for circular avatar crops and status indicator dots.

---

## 4. Enterprise Component Standards

### 4.1 Enterprise Table (`EnterpriseTable.tsx`)
- Resizable, sortable column headers with visual directional chevrons.
- Integrated search bar filtering across all text columns without round-trip latency.
- Pagination controls with current page / total records readout.
- Sticky headers preserving orientation during long record lists.
- Clickable row triggers with accessible focus states.

### 4.2 Enterprise Metric (`EnterpriseMetric.tsx`)
- Monospace numerical values guaranteeing zero horizontal jitter during real-time streaming updates.
- Explicit Provenance Tagging: Distinguishes `Actual`, `Forecast`, `Simulated`, `Estimated`, and `Unavailable` per Directive Rule 10.
- Trend delta indicators with directional arrows and period labels.
