# Orion-9 Mobile Control Center

Production-ready, dedicated native companion application for **Orion-9**, the AI-powered Autonomous Supply Chain Operating System.

Targets **Android** (`tech.orion9.mobile`) and **iOS** (`tech.orion9.mobile`) from a single, high-performance TypeScript/React Native codebase.

---

## 1. Architectural Highlights

- **Framework**: React Native 0.76.7 with Expo SDK 52 and Hermes engine.
- **Routing & Navigation**: Expo Router v4 (file-based navigation with native stack and 5-destination bottom tab bar).
- **Design System**: Distinct enterprise dark mode (`#070a10` deep charcoal, `#0d131f` midnight slate, `#06b6d4` restrained cyan accents, high-contrast semantic severity tokens).
- **Security & Keychains**: `expo-secure-store` device keychain persistence with strict session invalidation and zero committed secrets.
- **Cognitive Copilot**: Grounded Decision Intelligence integration with tagged evidence provenance (`[KNOWN]`, `[CALCULATED]`, `[INFERRED]`) and strict operator confirmation before consequential operational commits.
- **Dual Operating Modes**:
  - **DEMO Mode**: Zero external dependencies. Instant deterministic offline simulation with realistic multi-tier SCM telemetry (exceptions, maritime delays, inventory stockouts, supplier scorecards).
  - **LIVE Mode**: Strictly connects to authenticated Orion-9 cloud APIs with JWT authorization and rejects demo credentials.

---

## 2. Directory Structure

```text
apps/mobile/
├── android/                 # Fully prebuilt native Android project (Gradle, Manifest, keystore)
├── app/                     # Expo Router navigation routes
│   ├── _layout.tsx          # Root provider stack (SafeArea, Auth, Data, Alerts)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx        # Enterprise login with DEMO/LIVE toggle and quick roles
│   ├── (tabs)/
│   │   ├── _layout.tsx      # 5-destination bottom navigation bar with active badges
│   │   ├── index.tsx        # Home Dashboard (Network Health Index, Hotspots, Event Stream)
│   │   ├── control.tsx      # Control Tower (Exceptions, Shipments, Inventory, Suppliers, POs)
│   │   ├── ai.tsx           # Orion AI Copilot (Conversation, Evidence Chips, Action Commit)
│   │   ├── alerts.tsx       # Incident Alert Center with severity filtering
│   │   └── apps.tsx         # Enterprise module catalog & Profile
│   ├── details/
│   │   └── [type]/[id].tsx  # Unified record drill-down & consequential action execution
│   └── settings/
│       └── notifications.tsx# Push & alert channel preferences
├── assets/                  # Brand assets (Adaptive icons, splash screen, notification icons)
├── src/
│   ├── components/          # Reusable design system primitives (Badge, Card, Button, Header, Modal)
│   ├── features/            # Domain feature slices (Home, Control Tower, AI, Alerts, Inventory, etc.)
│   ├── services/            # Client services (API client with timeouts, Auth, Push Notifications)
│   ├── storage/             # Secure storage wrapper around expo-secure-store
│   ├── theme/               # Semantic color tokens, typography scales, spacing, shadows
│   ├── types/               # Full TypeScript contracts for SCM domain
│   └── utils/               # Formatters (currency, numbers, percentages, dates)
├── tests/                   # Jest + React Native test suites (27 unit & integration tests)
├── app.json                 # Expo application configuration & plugins
├── eas.json                 # EAS build profiles (preview APK, production AAB/IPA)
├── jest.config.js           # Test runner configuration
├── package.json             # Isolated dependency manifest
└── tsconfig.json            # Strict TypeScript configuration
```

---

## 3. Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
cd apps/mobile
npm install
```

### Running in Development
```bash
# Start Metro bundler with Expo Router
npm start

# Run on Android emulator or connected device
npm run android

# Run on iOS simulator (macOS required)
npm run ios
```

---

## 4. Testing & Verification

The test suite covers application initialization, authentication, offline persistence, AI grounding, and supply chain telemetry calculations.

```bash
# Run all unit and integration tests
npm test

# Run TypeScript compilation check
npm run typecheck

# Verify Android Hermes bytecode bundle export
npx expo export -p android

# Verify iOS Hermes bytecode bundle export
npx expo export -p ios
```

---

## 5. Native Builds & Distribution

### Android

#### A. Build via EAS Cloud (Recommended — generates installable `.apk`)
```bash
# Login to Expo Application Services
npx eas login

# Generate direct installable preview APK
npx eas build -p android --profile preview

# Generate Google Play Store Android App Bundle (.aab)
npx eas build -p android --profile production
```

#### B. Local Gradle Build (Requires Android SDK & `ANDROID_HOME`)
```bash
cd apps/mobile/android

# Build Debug APK
./gradlew assembleDebug

# Output artifact location:
# apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### iOS

#### A. Build via EAS Cloud (Generates TestFlight or Ad-Hoc IPA)
```bash
# Configure signing credentials
npx eas credentials

# Build iOS Preview IPA
npx eas build -p ios --profile preview

# Build iOS Production Archive
npx eas build -p ios --profile production
```

#### B. Local Xcode Build (Requires macOS, Xcode, and CocoaPods)
```bash
# Generate native iOS project files (macOS only)
npx expo prebuild -p ios

# Install CocoaPods
cd ios && pod install

# Open in Xcode
open Orion9Mobile.xcworkspace
```

---

## 6. Authentication Profiles

### Demo Environment (`DEMO`)
- **Admin**: Username `admin`, Password `demo123` (or `admin` / `OrionAdmin2026!`)
  - Identity: Platform Administrator (Full system privileges)
- **Operator**: Username `user`, Password `demo123` (or `user` / `OrionUser2026!`)
  - Identity: Elena Rostova (Operational mitigation & rebalance authority)

### Live Environment (`LIVE`)
- Connects to `EXPO_PUBLIC_ORION_API_URL` (default: `https://api.orion9.tech`).
- Rejects all demo credentials by design.
- Uses bearer token authentication stored in encrypted keychain.

---

## 7. Security Standards

- Zero private API keys or model secrets committed to mobile bundle.
- Consequential operational actions (e.g., shipment rerouting, buffer calibrations) require explicit operator confirmation modal with audited entity IDs.
- Sensitive credentials stored strictly using OS keychain hardware encryption via `expo-secure-store`.
