# Mobile Revenue Guard

> An enterprise engineering guide, agent guard, and deterministic audit harness to protect mobile app billing, eliminate Google Play 72-hour auto-refund leaks, lock down client-side entitlements, and stop rewarded ad exploits.

In-app purchases and mobile advertising are how indie developers and mobile studios keep the lights on. Yet when AI coding assistants touch monetization code, they consistently make expensive mistakes.

They follow basic tutorials that show how to make a test purchase in a sandbox, but ignore the messy reality of production billing: Google's 3-day acknowledge deadline, rooted device tampering, StoreKit 2 JWS cryptographic verification, and network dropouts during purchase restore.

**Mobile Revenue Guard** audits those exact failure modes before your release goes live on the App Store or Google Play.

---

## Architecture Overview

```
mobile-revenue-guard/
├── SKILL.md                                 # Orchestrator & multi-agent audit protocol
├── README.md                                # Public documentation & revenue protection guide
├── schemas/
│   └── billing-audit-schema.json            # Formal JSON Schema (draft-07) for monetization audits
├── references/
│   ├── GOOGLE-PLAY-BILLING.md               # 72h acknowledge deadline, RTDN & voided purchases
│   ├── APPLE-STOREKIT2.md                   # JWS verification, finishTransaction & server notifications
│   ├── ADMOB-REWARDED-SSV.md                # Server-Side Verification (SSV) & race condition defenses
│   └── STORAGE-AND-OFFLINE-TAMPERING.md     # Keystore/Keychain encryption & graceful offline caching
└── scripts/
    ├── validate-billing.cjs                 # Schema validator for billing audit reports
    └── validate-billing.test.cjs            # Unit test suite for validation harness
```

---

## The 6 Critical Mobile Revenue Invariants

```
[Invariant 1: Google Play 72h Acknowledge] ──> Eliminate auto-refund leaks
  │
[Invariant 2: Anti-Tamper Entitlement Storage] > Hardware Keystore / Keychain only
  │
[Invariant 3: StoreKit 2 JWS Verification] ────> Cryptographic signature check on Apple receipts
  │
[Invariant 4: Rewarded Ad Exploit Defense] ────> Server-Side Verification (SSV) + debounce
  │
[Invariant 5: Graceful Offline Resilience] ────> Network timeouts must not wipe paying users
  │
[Invariant 6: Lifetime Pass Ad-Free Bypass] ───> 100% suppression of all ad formats
```

---

## Quick Start & CLI Usage

### Validate a Mobile Billing Audit Report:
```bash
node scripts/validate-billing.cjs path/to/billing-audit.json
```

### Run the Validator Test Suite:
```bash
node scripts/validate-billing.test.cjs
```

---

## How to Install in Coding Assistants

### In Antigravity / Cursor / Claude Code
Copy this entire directory into your project's `.agents/skills/` folder:
```bash
mkdir -p .agents/skills
cp -r mobile-revenue-and-iap-guard .agents/skills/
```

Whenever you ask your coding assistant to touch purchases, subscriptions, or ads, instruct it:
> *"Audit your implementation against mobile-revenue-and-iap-guard before completing."*

---

## Supported Frameworks & Stores
- **Flutter**: `in_app_purchase`, `purchases_flutter` (RevenueCat), `google_mobile_ads`
- **Android Native**: Google Play Billing Library v6 & v7 (Kotlin/Java)
- **iOS Native**: StoreKit 1 & StoreKit 2 (Swift)
- **React Native**: `react-native-iap`

---

## License
MIT License. Free to use across commercial apps and open-source projects.
